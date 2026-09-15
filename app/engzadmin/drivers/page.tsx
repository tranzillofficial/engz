import { getCurrentUser } from '@/lib/services/auth';
import { getAdminDrivers } from '@/lib/services/admin';
import { getAdminDriverApplications } from '@/lib/actions/driver-applications';
import { redirect } from 'next/navigation';
import { AdminDriversClient } from '@/components/admin/AdminDriversClient';

export const dynamic = 'force-dynamic';

export default async function AdminDriversPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const [drivers, applications] = await Promise.all([
    getAdminDrivers(),
    getAdminDriverApplications(),
  ]);

  return <AdminDriversClient drivers={drivers} applications={applications} />;
}


