import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  const { role } = await params;

  let bg = '#FA3802';
  let title = 'ENgz';
  let subtitle = 'توصيل';
  let symbol = '⚡';

  if (role === 'admin') {
    bg = '#0F172A';
    title = 'Admin';
    subtitle = 'إدارة';
    symbol = '🛡️';
  } else if (role === 'agent') {
    bg = '#059669';
    title = 'Agent';
    subtitle = 'وكالة';
    symbol = '🗺️';
  } else if (role === 'driver') {
    bg = '#D97706';
    title = 'Driver';
    subtitle = 'كابتن';
    symbol = '🛵';
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="${bg === '#0F172A' ? '#1E293B' : bg === '#059669' ? '#047857' : bg === '#D97706' ? '#B45309' : '#DC2626'}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-opacity="0.35"/>
    </filter>
  </defs>
  
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)" />
  
  <circle cx="256" cy="210" r="130" fill="white" fill-opacity="0.15" />
  
  <text x="256" y="245" font-size="110" text-anchor="middle" dominant-baseline="middle" filter="url(#shadow)">
    ${symbol}
  </text>
  
  <text x="256" y="385" font-size="46" font-family="system-ui, -apple-system, sans-serif" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">
    ${title}
  </text>
  
  <text x="256" y="440" font-size="28" font-family="system-ui, -apple-system, sans-serif" font-weight="700" fill="#FFFFFF" fill-opacity="0.85" text-anchor="middle">
    ${subtitle}
  </text>
</svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
