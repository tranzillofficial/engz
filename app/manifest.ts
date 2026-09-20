import type { MetadataRoute } from 'next';
import { buildRoleManifest } from '@/lib/pwa/roles';

/**
 * Default manifest served at /manifest.webmanifest and linked automatically by
 * Next.js on every route that does not override `metadata.manifest`.
 *
 * That default is the customer app; /driver, /agent and /admin each override it
 * from their own layout so the browser sees exactly one manifest per page and
 * installs a different app for each interface.
 */
export default function manifest(): MetadataRoute.Manifest {
  // Served at /manifest.webmanifest — advertise that same URL back.
  return buildRoleManifest('customer', '/manifest.webmanifest') as unknown as MetadataRoute.Manifest;
}
