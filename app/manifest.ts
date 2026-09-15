import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Engz — منصة التوصيل الذكية',
    short_name: 'Engz',
    description: 'كل طلباتك نوصلها لك. اطلب أي حاجة من أي مكان.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#FA3802',
    icons: [
      {
        src: '/assets/images/engz-logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
