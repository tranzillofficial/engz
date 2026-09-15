import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Engz — منصة التوصيل الذكية',
    short_name: 'Engz',
    description: 'كل طلباتك نوصلها لك. اطلب أي حاجة من أي مكان.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'ar',
    dir: 'rtl',
    background_color: '#FFFFFF',
    theme_color: '#FA3802',
    categories: ['shopping', 'food', 'travel'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/assets/images/engz-logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    shortcuts: [
      {
        name: 'اطلب الآن',
        short_name: 'طلب جديد',
        url: '/orders/new',
      },
      {
        name: 'طلباتي',
        short_name: 'طلباتي',
        url: '/orders',
      },
    ],
  };
}
