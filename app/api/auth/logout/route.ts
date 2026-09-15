import { logoutAction } from '@/lib/actions/auth';

/**
 * POST /api/auth/logout
 * Can be called from a form action (server component) or fetch.
 */
export async function POST() {
  await logoutAction();
}
