export const prerender = false;

import type { APIRoute } from 'astro';

async function hashIp(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(ip + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

export const POST: APIRoute = async ({ request }) => {
  const restUrl = import.meta.env.UPSTASH_REDIS_REST_URL;
  const restToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

  // Silently succeed if not configured (dev / missing env vars)
  if (!restUrl || !restToken) {
    return new Response(null, { status: 204 });
  }

  let page = '/';
  try {
    const body = await request.json() as { page?: unknown };
    if (typeof body.page === 'string') {
      // Normalize to just the pathname, capped at 200 chars
      page = new URL(body.page, 'http://x').pathname.slice(0, 200);
    }
  } catch {
    // Default to '/' if parsing fails
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Hash the visitor's IP for privacy — never store the raw IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const visitorHash = await hashIp(ip, restToken.slice(0, 16));

  // Fire-and-forget pipeline: increment all counters in one round-trip
  await fetch(`${restUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${restToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', 'pv:total'],
      ['INCR', `pv:day:${today}`],
      ['ZINCRBY', 'pages', '1', page],
      ['SADD', `visitors:day:${today}`, visitorHash],
      ['EXPIRE', `pv:day:${today}`, 7_776_000],       // 90 days TTL
      ['EXPIRE', `visitors:day:${today}`, 7_776_000], // 90 days TTL
    ]),
  });

  return new Response(null, { status: 204 });
};
