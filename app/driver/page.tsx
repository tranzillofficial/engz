import { getCurrentUser } from '@/lib/services/auth';
import {
  getDriverByUserId,
  getDriverActiveOrderId,
} from '@/lib/services/drivers';
import { getAvailableOrdersForDriver } from '@/lib/services/matching';
import { redirect } from 'next/navigation';
import { AppShell, PageHeader } from '@/components';
import { DriverHeader } from '@/components/driver/DriverHeader';
import { AvailableOrdersList } from '@/components/driver/AvailableOrdersList';
import { PwaRoleInstallCard } from '@/components/pwa/PwaRoleInstallCard';

export const dynamic = 'force-dynamic';

export default async function DriverPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') redirect('/login');

  const driver = await getDriverByUserId(user.id);
  if (!driver) redirect('/login');
  if (!driver.is_active || driver.verification_complete === false) {
    redirect('/driver/verify');
  }

  const busy = driver.status === 'busy';
  const [orders, active] = await Promise.all([
    busy ? Promise.resolve([]) : getAvailableOrdersForDriver(driver.id),
    busy ? getDriverActiveOrderId(driver.id) : Promise.resolve(null),
  ]);

  const nav = [
    { href: '/driver', label: 'المتاحة', labelEn: 'Available', icon: '⚡' },
    { href: '/driver/orders', label: 'طلباتي', labelEn: 'My Orders', icon: '📦' },
    {
      href: '/driver/wallet',
      label: 'المحفظة',
      labelEn: 'Wallet',
      badge: driver.commission_balance > 0 ? `${driver.commission_balance} ج` : undefined,
      icon: '💳',
    },
    { href: '/driver/profile', label: 'حسابي', labelEn: 'Profile', icon: '👤' },
  ];

  return (
    <AppShell
      header={
        <PageHeader
          title="لوحة تحكم الكابتن"
          titleEn="Driver Control"
          subtitle={driver.region?.name_ar || driver.region?.name || 'منطقة غير محددة'}
          showLogo
        />
      }
      navItems={nav}
    >
      <div className="max-w-2xl mx-auto py-2 space-y-4 font-sans">
        {/* PWA Install Card for Driver */}
        <PwaRoleInstallCard role="driver" />

        <DriverHeader driver={driver} activeOrderId={active} />
        <AvailableOrdersList
          orders={orders}
          isDriverBlocked={driver.is_blocked}
          isDriverOnline={driver.status === 'online'}
          isDriverBusy={busy}
        />
      </div>
    </AppShell>
  );
}