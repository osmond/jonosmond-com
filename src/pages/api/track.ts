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

function isBot(ua: string): boolean {
  return /bot|crawl|slurp|spider|facebookexternalhit|whatsapp|telegram|wget|curl|python|java\/|go-http|axios|node-fetch|vercel|lighthouse|pagespeed|chrome-lighthouse|headless|phantom|selenium|puppeteer|playwright|prerender|scanner|checker|monitor|ping|health/i.test(ua);
}

function parseUA(ua: string): { browser: string; os: string; device: string } {
  // Device — mobile check before tablet
  let device = 'Desktop';
  if (/iphone|ipod|android(?=.*mobile)|windows phone/i.test(ua)) device = 'Mobile';
  else if (/ipad|android|tablet/i.test(ua)) device = 'Tablet';

  // OS
  let os = 'Other';
  if      (/iphone|ipad|ipod/i.test(ua))   os = 'iOS';
  else if (/android/i.test(ua))             os = 'Android';
  else if (/macintosh|mac os x/i.test(ua))  os = 'macOS';
  else if (/windows nt/i.test(ua))          os = 'Windows';
  else if (/linux/i.test(ua))               os = 'Linux';

  // Browser — order matters: Edge/Opera before Chrome, Chrome before Safari
  let browser = 'Other';
  if      (/edg\//i.test(ua))               browser = 'Edge';
  else if (/opr\/|opera/i.test(ua))         browser = 'Opera';
  else if (/chrome\/(?!.*chromium)/i.test(ua)) browser = 'Chrome';
  else if (/firefox\//i.test(ua))           browser = 'Firefox';
  else if (/safari\//i.test(ua))            browser = 'Safari';

  return { browser, os, device };
}

export const POST: APIRoute = async ({ request }) => {
  const restUrl = import.meta.env.UPSTASH_REDIS_REST_URL;
  const restToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !restToken) {
    return new Response(null, { status: 204 });
  }

  // UA parsing + bot filtering — do this before any Redis writes
  const ua = request.headers.get('user-agent') ?? '';
  if (isBot(ua)) return new Response(null, { status: 204 });

  let page = '/';
  let rawReferrer = '';
  let colorScheme = 'Unknown';
  let viewport = 'Unknown';
  let isNew = false;
  let isEntry = true;
  let language = 'Unknown';
  let utmSource = '';
  let utmMedium = '';
  let utmCampaign = '';
  try {
    const body = await request.json() as {
      page?: unknown; referrer?: unknown; colorScheme?: unknown; viewport?: unknown;
      isNew?: unknown; isEntry?: unknown; language?: unknown;
      utmSource?: unknown; utmMedium?: unknown; utmCampaign?: unknown;
    };
    if (typeof body.page        === 'string') page        = new URL(body.page, 'http://x').pathname.slice(0, 200);
    if (typeof body.referrer    === 'string') rawReferrer = body.referrer.trim().slice(0, 500);
    if (typeof body.colorScheme === 'string') colorScheme = body.colorScheme;
    if (typeof body.viewport    === 'string') viewport    = body.viewport;
    if (typeof body.isNew       === 'boolean') isNew      = body.isNew;
    if (typeof body.isEntry     === 'boolean') isEntry    = body.isEntry;
    if (typeof body.language    === 'string') language    = body.language.slice(0, 20);
    if (typeof body.utmSource   === 'string') utmSource   = body.utmSource.slice(0, 100);
    if (typeof body.utmMedium   === 'string') utmMedium   = body.utmMedium.slice(0, 100);
    if (typeof body.utmCampaign === 'string') utmCampaign = body.utmCampaign.slice(0, 100);
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
    } catch { /* ignore */ }
  }

  // Vercel geo headers
  const country  = request.headers.get('x-vercel-ip-country')  ?? 'XX';
  const rawCity  = request.headers.get('x-vercel-ip-city')      ?? '';
  const timezone = request.headers.get('x-vercel-ip-timezone')  ?? 'Unknown';
  const city     = rawCity ? decodeURIComponent(rawCity).slice(0, 100) : 'Unknown';

  // UA parsing (ua already fetched above for bot check)
  const { browser, os, device } = parseUA(ua);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hour  = now.getUTCHours(); // 0-23

  // Hash the visitor's IP for privacy — never store the raw IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const visitorHash = await hashIp(ip, restToken.slice(0, 16));

  const returnType = isNew ? 'New' : 'Returning';

  // Normalise language to primary subtag (e.g. "en-US" → "en")
  const lang = language.split('-')[0]?.toLowerCase() ?? 'unknown';

  // Recent-events record (no PII — no IP, no full UA)
  const recentEvent = JSON.stringify({
    ts: now.toISOString(),
    page,
    country,
    referrer,
    device,
  });

  const pipeline: (string | number)[][] = [
    ['INCR',    'pv:total'],
    ['INCR',    `pv:day:${today}`],
    ['HINCRBY', 'pv:hourly',   String(hour), 1],
    ['ZINCRBY', 'pages',        1, page],
    ['ZINCRBY', 'referrers',    1, referrer],
    ['ZINCRBY', 'countries',    1, country],
    ['ZINCRBY', 'cities',       1, city],
    ['ZINCRBY', 'browsers',     1, browser],
    ['ZINCRBY', 'os',           1, os],
    ['ZINCRBY', 'devices',      1, device],
    ['ZINCRBY', 'timezones',    1, timezone],
    ['ZINCRBY', 'colorSchemes', 1, colorScheme],
    ['ZINCRBY', 'viewports',    1, viewport],
    ['ZINCRBY', 'visitor_type', 1, returnType],
    ['ZINCRBY', 'languages',    1, lang],
    // Session tracking for bounce rate approximation
    ...(isEntry
      ? [['INCR', 'sessions_total']]
      : [['INCR', 'sessions_engaged']]) as (string | number)[][],
    ['SADD',    `visitors:day:${today}`, visitorHash],
    ['EXPIRE',  `pv:day:${today}`,       7_776_000],
    ['EXPIRE',  `visitors:day:${today}`, 7_776_000],
    // Recent events feed (capped at 50)
    ['LPUSH',  'recent_events', recentEvent],
    ['LTRIM',  'recent_events', 0, 49],
  ];

  if (isEntry) {
    pipeline.push(['ZINCRBY', 'entry_pages', 1, page]);
  }
  if (utmSource)   pipeline.push(['ZINCRBY', 'utm_source',   1, utmSource]);
  if (utmMedium)   pipeline.push(['ZINCRBY', 'utm_medium',   1, utmMedium]);
  if (utmCampaign) pipeline.push(['ZINCRBY', 'utm_campaign', 1, utmCampaign]);

  await fetch(`${restUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${restToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pipeline),
  });

  return new Response(null, { status: 204 });
};


