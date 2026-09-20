export async function GET() {
  return Response.json(
    {
      id: '/customer-app',
      name: 'إنجز | تطبيق طلب وتوصيل أي حاجة',
      short_name: 'ENgz Delivery',
      description: 'أسرع خدمة توصيل فوري لأي طلب في مصر',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: '#FA3802',
      background_color: '#FA3802',
      icons: [
        {
          src: '/api/pwa-icon/customer',
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