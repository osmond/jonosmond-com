export const prerender = false;

import type { APIRoute } from 'astro';

// Known bots — same list as track.ts
function isBot(ua: string): boolean {
  return /bot|crawl|slurp|spider|facebookexternalhit|whatsapp|telegram|wget|curl|python|java\/|go-http|axios|node-fetch|vercel|lighthouse|pagespeed|chrome-lighthouse|headless|phantom|selenium|puppeteer|playwright|prerender|scanner|checker|monitor|ping|health/i.test(ua);
}

export const POST: APIRoute = async ({ request }) => {
  const restUrl   = import.meta.env.UPSTASH_REDIS_REST_URL   as string;
  const restToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN as string;

  if (!restUrl || !restToken) return new Response(null, { status: 204 });

  const ua = request.headers.get('user-agent') ?? '';
  if (isBot(ua)) return new Response(null, { status: 204 });

  let type = '';
  let value = '';
  let page = '/';
  try {
    const body = await request.json() as { type?: unknown; value?: unknown; page?: unknown };
    if (typeof body.type  === 'string') type  = body.type.slice(0, 50);
    if (typeof body.value === 'string') value = body.value.slice(0, 200);
    if (typeof body.page  === 'string') page  = new URL(body.page, 'http://x').pathname.slice(0, 200);
  } catch {
    return new Response(null, { status: 204 });
  }

  if (type === 'scroll') {
    // value = "25", "50", "75", "100"
    const pct = parseInt(value, 10);
    if (![25, 50, 75, 100].includes(pct)) return new Response(null, { status: 204 });
    await fetch(`${restUrl}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${restToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['ZINCRBY', 'scroll_depth', 1, String(pct)],
      ]),
    });
  } else if (type === 'click') {
    // value = hostname of clicked outbound link
    if (!value) return new Response(null, { status: 204 });
    await fetch(`${restUrl}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${restToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['ZINCRBY', 'outbound_clicks', 1, value],
      ]),
    });
  }

  return new Response(null, { status: 204 });
};
