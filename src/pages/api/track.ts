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
  let rawReferrer = '';
  try {
    const body = await request.json() as { page?: unknown; referrer?: unknown };
    if (typeof body.page === 'string') {
      page = new URL(body.page, 'http://x').pathname.slice(0, 200);
    }
    if (typeof body.referrer === 'string') {
      rawReferrer = body.referrer.trim().slice(0, 500);
    }
  } catch {
    // use defaults
  }

  // Normalize referrer to a hostname or "Direct"
  let referrer = 'Direct';
  if (rawReferrer) {
    try {
      const ref = new URL(rawReferrer);
      if (!ref.hostname.endsWith('jonosmond.com')) {
        referrer = ref.hostname.replace(/^www\./, '');
      }
    } catch {
      // ignore invalid URLs
    }
  }

  // Country from Vercel edge header (ISO 3166-1 alpha-2 or "XX")
  const country = request.headers.get('x-vercel-ip-country') ?? 'XX';

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
      ['ZINCRBY', 'pages', 1, page],
      ['ZINCRBY', 'referrers', 1, referrer],
      ['ZINCRBY', 'countries', 1, country],
      ['SADD', `visitors:day:${today}`, visitorHash],
      ['EXPIRE', `pv:day:${today}`, 7_776_000],
      ['EXPIRE', `visitors:day:${today}`, 7_776_000],
    ]),
  });

  return new Response(null, { status: 204 });
};
