import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import PushNotificationRegistrar from '@/components/pwa/PushNotificationRegistrar';
import PwaInstallNudge from '@/components/pwa/PwaInstallNudge';
import { ToastProvider } from '@/components';
import { PWA_ROLES } from '@/lib/pwa/roles';

const customer = PWA_ROLES.customer;

export const metadata: Metadata = {
  title: 'ENgz — منصة توصيل لكل حاجة',
  description: 'اطلب أي حاجة من أي مكان. فاكهة، خبز، سوبر ماركت — طلب واحد وسائق يوصلك.',
  keywords: ['توصيل', 'delivery', 'طلبات', 'مصر', 'ENgz'],
  authors: [{ name: 'ENgz' }],
  applicationName: customer.shortName,
  // The customer manifest is served by app/manifest.ts at /manifest.webmanifest
  // and linked automatically. /driver, /agent, /admin and /engzadmin override it
  // from their own layouts, so each interface installs as its own app.
  appleWebApp: {
    capable: true,
    title: customer.shortName,
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/assets/images/engz-logo.svg', type: 'image/svg+xml' },
      { url: `${customer.iconDir}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${customer.iconDir}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/assets/images/engz-logo.svg',
    apple: [{ url: `${customer.iconDir}/apple-touch-180.png`, sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'ENgz — منصة توصيل لكل حاجة',
    description: 'اطلب أي حاجة من أي مكان. طلب واحد وسائق يوصلك.',
    type: 'website',
    images: ['/assets/images/engz-logo.svg'],
  },
};

export const viewport: Viewport = {
  themeColor: customer.themeColor,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * Chrome fires `beforeinstallprompt` while the page is still loading — long
 * before React hydrates — and the event is lost unless something holds on to it.
 * This captures it in the document head and re-announces it so the install
 * buttons can trigger the real native install dialog on demand.
 *
 * The manifest link itself is NOT touched here: Next.js renders exactly one
 * <link rel="manifest"> per route from the segment metadata, and a second link
 * would make the browser ignore the role manifest entirely.
 */
const INSTALL_PROMPT_CAPTURE = `
(function(){
  try {
    window.__engzInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      window.__engzInstallPrompt = e;
      window.dispatchEvent(new Event('engz:installprompt'));
    });
    window.addEventListener('appinstalled', function() {
      window.__engzInstallPrompt = null;
    });
  } catch (e) {}
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
