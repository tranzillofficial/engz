import { getCurrentUser } from '@/lib/services/auth';
import { getAdminRegions, getAdminAgents } from '@/lib/services/admin';
import { redirect } from 'next/navigation';
import { AdminRegionsClient } from '@/components/admin/AdminRegionsClient';

export const dynamic = 'force-dynamic';

export default async function AdminRegionsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const regions = await getAdminRegions();
  const agents = await getAdminAgents();

  return <AdminRegionsClient regions={regions} agents={agents} />;
}
