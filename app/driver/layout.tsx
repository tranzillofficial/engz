import type { Metadata, Viewport } from 'next';
import { PWA_ROLES, manifestPathFor } from '@/lib/pwa/roles';

/**
 * Binds every page under /driver to the "driver" installable app: its own
 * manifest, its own icons and its own theme colour, so installing from here
 * puts a distinct app on the home screen instead of the customer one.
 */
const cfg = PWA_ROLES.driver;

export const metadata: Metadata = {
  title: cfg.name,
  description: cfg.description,
  applicationName: cfg.shortName,
  manifest: manifestPathFor('driver'),
  appleWebApp: {
    capable: true,
    title: cfg.shortName,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: `${cfg.iconDir}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${cfg.iconDir}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: `${cfg.iconDir}/apple-touch-180.png`, sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: cfg.themeColor,
};

export default function DriverAppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
