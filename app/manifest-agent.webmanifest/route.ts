export async function GET() {
  return Response.json(
    {
      id: '/agent-app',
      name: 'إنجز وكيل | ENgz Agent',
      short_name: 'ENgz Agent',
      description: 'لوحة إدارة ومتابعة وكلاء المناطق في إنجز',
      start_url: '/agent',
      scope: '/agent',
      display: 'standalone',
      theme_color: '#059669',
      background_color: '#064E3B',
      icons: [
        {
          src: '/api/pwa-icon/agent',
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