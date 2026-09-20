export async function GET() {
  return Response.json(
    {
      id: '/admin-app',
      name: 'إنجز أدمن | ENgz Admin',
      short_name: 'ENgz Admin',
      description: 'لوحة التحكم المركزية لمنصة إنجز',
      start_url: '/admin',
      scope: '/admin',
      display: 'standalone',
      theme_color: '#0F172A',
      background_color: '#0F172A',
      icons: [
        {
          src: '/api/pwa-icon/admin',
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