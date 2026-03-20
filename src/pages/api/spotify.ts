export const prerender = false;

import type { APIRoute } from 'astro';

interface SpotifyTokenResponse {
  access_token: string;
}

interface SpotifyImage {
  url: string;
}

interface SpotifyArtist {
  name: string;
}

interface SpotifyAlbum {
  images: SpotifyImage[];
  external_urls: { spotify: string };
}

interface SpotifyTrack {
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: { spotify: string };
  duration_ms: number;
}

interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  item: SpotifyTrack;
  progress_ms: number;
}

interface SpotifyRecentlyPlayed {
  items: Array<{ track: SpotifyTrack }>;
}

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Spotify token error: ${res.status}`);
  }

  const data = (await res.json()) as SpotifyTokenResponse;
  return data.access_token;
}

function buildResponse(track: SpotifyTrack, isPlaying: boolean, progressMs = 0) {
  return {
    isPlaying,
    track: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    albumArt: track.album.images[0]?.url ?? '',
    url: track.external_urls.spotify,
    albumUrl: track.album.external_urls?.spotify ?? track.external_urls.spotify,
    progressMs,
    durationMs: track.duration_ms ?? 0,
  };
}

export const GET: APIRoute = async () => {
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID?.trim();
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN?.trim();

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return new Response(JSON.stringify({ error: 'Spotify not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const token = await getAccessToken(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN);

    // Try currently playing first
    const nowRes = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (nowRes.status === 200) {
      const nowData = (await nowRes.json()) as SpotifyCurrentlyPlaying;
      if (nowData?.item) {
        return new Response(
          JSON.stringify(buildResponse(nowData.item, nowData.is_playing, nowData.progress_ms)),
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
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/spotify]', message);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
