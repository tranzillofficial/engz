import { buildRoleManifest } from '@/lib/pwa/roles';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(buildRoleManifest('agent'), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
