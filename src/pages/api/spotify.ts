export const prerender = false;

import type { APIRoute } from 'astro';

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
} = import.meta.env;

interface SpotifyTokenResponse {
  access_token: string;
}

interface SpotifyImage {
  url: string;
}

interface SpotifyArtist {
  name: string;
}

interface SpotifyTrack {
  name: string;
  artists: SpotifyArtist[];
  album: { images: SpotifyImage[] };
  external_urls: { spotify: string };
}

interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  item: SpotifyTrack;
}

interface SpotifyRecentlyPlayed {
  items: Array<{ track: SpotifyTrack }>;
}

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!res.ok) {
    throw new Error(`Spotify token error: ${res.status}`);
  }

  const data = (await res.json()) as SpotifyTokenResponse;
  return data.access_token;
}

function buildResponse(track: SpotifyTrack, isPlaying: boolean) {
  return {
    isPlaying,
    track: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    albumArt: track.album.images[0]?.url ?? '',
    url: track.external_urls.spotify,
  };
}

export const GET: APIRoute = async () => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return new Response(JSON.stringify({ error: 'Spotify not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const token = await getAccessToken();

    // Try currently playing first
    const nowRes = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (nowRes.status === 200) {
      const nowData = (await nowRes.json()) as SpotifyCurrentlyPlaying;
      if (nowData?.item) {
        return new Response(
          JSON.stringify(buildResponse(nowData.item, nowData.is_playing)),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
            },
          }
        );
      }
    }

    // Fall back to recently played
    const recentRes = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=1',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!recentRes.ok) {
      throw new Error(`Spotify recent error: ${recentRes.status}`);
    }

    const recentData = (await recentRes.json()) as SpotifyRecentlyPlayed;
    const track = recentData.items?.[0]?.track;

    if (!track) {
      return new Response(JSON.stringify({ error: 'No track data' }), {
        status: 204,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(buildResponse(track, false)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[/api/spotify]', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
