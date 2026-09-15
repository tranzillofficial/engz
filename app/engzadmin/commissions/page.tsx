import { getCurrentUser } from '@/lib/services/auth';
import { getAdminCommissionTiers } from '@/lib/services/admin';
import { redirect } from 'next/navigation';
import { AdminCommissionsClient } from '@/components/admin/AdminCommissionsClient';

export const dynamic = 'force-dynamic';

export default async function AdminCommissionsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const tiers = await getAdminCommissionTiers();

  return <AdminCommissionsClient tiers={tiers} />;
}

