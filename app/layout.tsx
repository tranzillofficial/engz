import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import PushNotificationRegistrar from '@/components/pwa/PushNotificationRegistrar';
import PwaInstallNudge from '@/components/pwa/PwaInstallNudge';
import { ToastProvider } from '@/components';

export const metadata: Metadata = {
  title: 'ENgz — منصة توصيل لكل حاجة',
  description: 'اطلب أي حاجة من أي مكان. فاكهة، خبز، سوبر ماركت — طلب واحد وسائق يوصلك.',
  keywords: ['توصيل', 'delivery', 'طلبات', 'مصر', 'ENgz'],
  authors: [{ name: 'ENgz' }],
  applicationName: 'ENgz',
  appleWebApp: {
    capable: true,
    title: 'ENgz',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/assets/images/engz-logo.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/assets/images/engz-logo.svg',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'ENgz — منصة توصيل لكل حاجة',
    description: 'اطلب أي حاجة من أي مكان. طلب واحد وسائق يوصلك.',
    type: 'website',
    images: ['/assets/images/engz-logo.svg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#FA3802',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const INSTALL_PROMPT_CAPTURE = `
(function(){
  try {
    window.__engzInstallPrompt = null;
    var path = window.location.pathname;
    var role = 'customer';
    if (path.indexOf('/driver') === 0) role = 'driver';
    else if (path.indexOf('/agent') === 0) role = 'agent';
    else if (path.indexOf('/admin') === 0) role = 'admin';

    var link = document.querySelector('link#engz-role-manifest');
    if (!link) {
      link = document.createElement('link');
      link.id = 'engz-role-manifest';
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = '/manifest-' + role + '.webmanifest';

    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      window.__engzInstallPrompt = e;
      window.dispatchEvent(new Event('engz:installprompt'));
    });

    window.addEventListener('appinstalled', function() {
      window.__engzInstallPrompt = null;
    });
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_CAPTURE }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorkerRegister />
        <PushNotificationRegistrar />
        <PwaInstallNudge />
      </body>
    </html>
  );
}
