export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const restUrl   = import.meta.env.UPSTASH_REDIS_REST_URL   as string;
  const restToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN as string;

  if (!restUrl || !restToken) {
    return new Response(JSON.stringify({ pvToday: 0, uvToday: 0, topPages: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  const pipeline = [
    ['GET',      `pv:day:${today}`],
    ['SCARD',    `visitors:day:${today}`],
    ['ZREVRANGE','pages', '0', '4', 'WITHSCORES'],
  ];

  const res = await fetch(`${restUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${restToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pipeline),
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ pvToday: 0, uvToday: 0, topPages: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  type PipeResult = Array<{ result: unknown }>;
  const data = (await res.json()) as PipeResult;

  const pvToday = Number(data[0]?.result ?? 0);
  const uvToday = Number(data[1]?.result ?? 0);

  // ZREVRANGE WITHSCORES returns [page, score, page, score, ...]
  const raw = data[2]?.result as string[] ?? [];
  const topPages: Array<{ page: string; count: number }> = [];
  for (let i = 0; i < raw.length - 1; i += 2) {
    topPages.push({ page: raw[i], count: Number(raw[i + 1]) });
  }

  return new Response(JSON.stringify({ pvToday, uvToday, topPages }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
