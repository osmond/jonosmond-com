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
  let metric = '';
  let rating = '';
  try {
    const body = await request.json() as {
      type?: unknown; value?: unknown; page?: unknown;
      metric?: unknown; rating?: unknown;
    };
    if (typeof body.type   === 'string') type   = body.type.slice(0, 50);
    if (typeof body.value  === 'string') value  = body.value.slice(0, 200);
    if (typeof body.page   === 'string') page   = new URL(body.page, 'http://x').pathname.slice(0, 200);
    if (typeof body.metric === 'string') metric = body.metric.slice(0, 20);
    if (typeof body.rating === 'string') rating = body.rating.slice(0, 30);
  } catch {
    return new Response(null, { status: 204 });
  }

  const pipeline: (string | number)[][] = [];

  if (type === 'scroll') {
    // value = "25", "50", "75", "100"
    const pct = parseInt(value, 10);
    if (![25, 50, 75, 100].includes(pct)) return new Response(null, { status: 204 });
    pipeline.push(['ZINCRBY', 'scroll_depth', 1, String(pct)]);
    // Also track per-page scroll depth
    pipeline.push(['ZINCRBY', `page_scroll:${page.slice(0, 150)}`, 1, String(pct)]);
  } else if (type === 'click') {
    // value = hostname of clicked outbound link
    if (!value) return new Response(null, { status: 204 });
    pipeline.push(['ZINCRBY', 'outbound_clicks', 1, value]);
  } else if (type === 'duration') {
    // value = seconds spent on page (integer string), capped at 1800 (30 min)
    const secs = Math.min(parseInt(value, 10), 1800);
    if (isNaN(secs) || secs < 1) return new Response(null, { status: 204 });
    // Buckets: <10s, 10-29s, 30-59s, 1-2m, 2-5m, 5m+
    let bucket = '';
    if      (secs < 10)  bucket = '<10s';
    else if (secs < 30)  bucket = '10-29s';
    else if (secs < 60)  bucket = '30-59s';
    else if (secs < 120) bucket = '1-2m';
    else if (secs < 300) bucket = '2-5m';
    else                 bucket = '5m+';
    pipeline.push(
      ['ZINCRBY', 'time_on_page',    1, bucket],
      ['INCRBY',  'time_total_secs', secs],
      ['INCR',    'time_total_sessions'],
    );
  } else if (type === 'exit') {
    // Track which pages visitors exit from
    if (!page) return new Response(null, { status: 204 });
    pipeline.push(['ZINCRBY', 'exit_pages', 1, page]);
  } else if (type === 'vitals') {
    // Core Web Vitals: metric = LCP|CLS|INP, rating = good|needs-improvement|poor
    const allowedMetrics = ['LCP', 'CLS', 'INP'];
    const allowedRatings = ['good', 'needs-improvement', 'poor'];
    if (!allowedMetrics.includes(metric) || !allowedRatings.includes(rating))
      return new Response(null, { status: 204 });
    pipeline.push(['HINCRBY', `cwv:${metric}`, rating, 1]);
  } else {
    return new Response(null, { status: 204 });
  }

  await fetch(`${restUrl}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${restToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(pipeline),
  });

  return new Response(null, { status: 204 });
};
