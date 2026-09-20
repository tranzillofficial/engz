import { buildRoleManifest, manifestPathFor } from '@/lib/pwa/roles';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const url = new URL(manifestPathFor('agent'), new URL(request.url).origin).toString();
  return Response.json(buildRoleManifest('agent', url), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
