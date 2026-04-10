export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const restUrl   = import.meta.env.UPSTASH_REDIS_REST_URL   as string;
  const restToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN as string;

  if (!restUrl || !restToken) {
    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
  }

  const res = await fetch(`${restUrl}/lrange/recent_events/0/19`, {
    headers: { Authorization: `Bearer ${restToken}` },
  });

  const json = await res.json() as { result?: string[] };
  const raw = json.result ?? [];

  const events = raw.map(str => {
    try { return JSON.parse(str) as Record<string, string>; }
    catch { return null; }
  }).filter(Boolean);

  return new Response(JSON.stringify(events), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
