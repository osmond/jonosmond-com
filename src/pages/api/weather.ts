export const prerender = false;

import type { APIRoute } from 'astro';

// WMO weather interpretation codes → human-readable description
function codeToDescription(code: number): string {
  if (code === 0)                 return 'Clear sky';
  if (code <= 2)                  return 'Mostly clear';
  if (code === 3)                 return 'Overcast';
  if (code <= 48)                 return 'Foggy';
  if (code <= 55)                 return 'Drizzle';
  if (code <= 65)                 return 'Rain';
  if (code <= 75)                 return 'Snow';
  if (code === 77)                return 'Snow grains';
  if (code <= 82)                 return 'Rain showers';
  if (code <= 86)                 return 'Snow showers';
  if (code === 95)                return 'Thunderstorm';
  if (code <= 99)                 return 'Thunderstorm';
  return 'Unknown';
}

// WMO code → icon name (rendered as SVG inline in the page)
function codeToIcon(code: number): string {
  if (code === 0)                 return 'sun';
  if (code <= 2)                  return 'partly-cloudy';
  if (code === 3)                 return 'cloudy';
  if (code <= 48)                 return 'fog';
  if (code <= 65)                 return 'rain';
  if (code <= 77)                 return 'snow';
  if (code <= 82)                 return 'rain';
  if (code <= 86)                 return 'snow';
  return 'storm';
}

interface OpenMeteoResponse {
  current: {
    temperature_2m:  number;
    weather_code:    number;
    wind_speed_10m:  number;
  };
}

export const GET: APIRoute = async () => {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=44.9778&longitude=-93.2650' +
      '&current=temperature_2m,weather_code,wind_speed_10m' +
      '&temperature_unit=fahrenheit&wind_speed_unit=mph',
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);

    const data = (await res.json()) as OpenMeteoResponse;
    const { temperature_2m, weather_code, wind_speed_10m } = data.current;

    return new Response(
      JSON.stringify({
        temp:        Math.round(temperature_2m),
        code:        weather_code,
        wind:        Math.round(wind_speed_10m),
        description: codeToDescription(weather_code),
        icon:        codeToIcon(weather_code),
      }),
      {
        headers: {
          'Content-Type':  'application/json',
          'Cache-Control': 'max-age=600',
        },
      },
    );
  } catch {
    return new Response(JSON.stringify(null), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
