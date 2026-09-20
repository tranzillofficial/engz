export async function GET() {
  return Response.json(
    {
      id: '/driver-app',
      name: 'إنجز كابتن | ENgz Driver',
      short_name: 'ENgz Driver',
      description: 'تطبيق طيارين وكباتن التوصيل لمنصة إنجز',
      start_url: '/driver',
      scope: '/driver',
      display: 'standalone',
      theme_color: '#D97706',
      background_color: '#78350F',
      icons: [
        {
          src: '/api/pwa-icon/driver',
          sizes: '192x192 512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } }
  );
}