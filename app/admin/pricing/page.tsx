import { getCurrentUser } from '@/lib/services/auth';
import { getAdminPricingConfig } from '@/lib/services/admin';
import { redirect } from 'next/navigation';
import { AdminPricingClient } from '@/components/admin/AdminPricingClient';

export const dynamic = 'force-dynamic';

export default async function AdminPricingPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const { settings } = await getAdminPricingConfig();

  return <AdminPricingClient settings={settings} />;
}
