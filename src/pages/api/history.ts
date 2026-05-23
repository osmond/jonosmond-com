export const prerender = false;

import type { APIRoute } from 'astro';

interface RedisLrangeResult {
  result: string[];
}

export const GET: APIRoute = async () => {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return new Response(JSON.stringify({ history: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(`${url}/lrange/spotify:history/0/9`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Redis error: ${res.status}`);

    const data = (await res.json()) as RedisLrangeResult;
    const history = (data.result ?? []).map(item => {
      try { return JSON.parse(item); } catch { return null; }
    }).filter(Boolean);

    return new Response(JSON.stringify({ history }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ history: [], error: String(err) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
