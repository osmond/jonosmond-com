export const prerender = false;

import type { APIRoute } from 'astro';

const MAX_NAME    = 60;
const MAX_MSG     = 1000;
const RATE_TTL    = 300; // 5 min between comments per IP
const MAX_STORED  = 100;
const FETCH_MAX   = 50;
// Post IDs are kebab-case slugs from the content collection
const POST_RE     = /^[a-z0-9][a-z0-9-]*$/i;

interface Comment {
  name:    string;
  message: string;
  date:    string;
}

async function redisPipeline(
  url: string,
  token: string,
  cmds: (string | number)[][],
): Promise<Array<{ result: unknown }>> {
  const res = await fetch(`${url}/pipeline`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(cmds),
  });
  return res.json();
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// GET /api/comments?post=slug
// ---------------------------------------------------------------------------
export const GET: APIRoute = async ({ url }) => {
  const restUrl   = import.meta.env.UPSTASH_REDIS_REST_URL;
  const restToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

  const post = url.searchParams.get('post')?.trim() ?? '';
  if (!POST_RE.test(post)) return json({ comments: [] });
  if (!restUrl || !restToken) return json({ comments: [] });

  const results = await redisPipeline(restUrl, restToken, [
    ['LRANGE', `comments:${post}`, 0, FETCH_MAX - 1],
  ]);

  const raw = Array.isArray(results[0]?.result) ? (results[0].result as string[]) : [];
  const comments: Comment[] = raw.flatMap(r => {
    try { return [JSON.parse(r) as Comment]; } catch { return []; }
  });

  return new Response(JSON.stringify({ comments }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};

// ---------------------------------------------------------------------------
// POST /api/comments  body: { post, name, message, website }
// ---------------------------------------------------------------------------
export const POST: APIRoute = async ({ request }) => {
  const restUrl   = import.meta.env.UPSTASH_REDIS_REST_URL;
  const restToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN;
  if (!restUrl || !restToken) return json({ error: 'Comments unavailable' }, 503);

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: 'Invalid request' }, 400); }

  // Honeypot — silent discard
  if (body.website) return new Response(null, { status: 204 });

  const post    = String(body.post    ?? '').trim();
  const name    = String(body.name    ?? '').trim().slice(0, MAX_NAME);
  const message = String(body.message ?? '').trim().slice(0, MAX_MSG);

  if (!POST_RE.test(post))   return json({ error: 'Invalid post' }, 400);
  if (!name || !message)     return json({ error: 'Name and message are required.' }, 400);

  // Rate limit by IP — one comment per IP per RATE_TTL seconds
  const ip = (request.headers.get('x-forwarded-for') ?? '')
    .split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
  const rlKey = `rl:comment:${ip}`;

  const rlResult = await redisPipeline(restUrl, restToken, [
    ['SET', rlKey, '1', 'NX', 'EX', RATE_TTL],
  ]);
  if (rlResult[0]?.result === null) {
    return json({ error: 'Too many comments. Try again in a few minutes.' }, 429);
  }

  const entry = JSON.stringify({ name, message, date: new Date().toISOString() } satisfies Comment);
  await redisPipeline(restUrl, restToken, [
    ['LPUSH', `comments:${post}`, entry],
    ['LTRIM', `comments:${post}`, 0, MAX_STORED - 1],
  ]);

  return json({ ok: true }, 201);
};
