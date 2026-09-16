import { getCurrentUser } from '@/lib/services/auth';
import { getDriverByUserId, getDriverActiveOrderId } from '@/lib/services/drivers';
import { getAvailableOrdersForDriver } from '@/lib/services/matching';
import { redirect } from 'next/navigation';
import { AppShell, PageHeader } from '@/components';
import { DriverHeader } from '@/components/driver/DriverHeader';
import { AvailableOrdersList } from '@/components/driver/AvailableOrdersList';

export const dynamic = 'force-dynamic';

export default async function DriverDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') redirect('/login');
  const driver = await getDriverByUserId(user.id);
  if (!driver) redirect('/login');

  const isBusy = driver.status === 'busy';
  const [availableOrders, activeOrderId] = await Promise.all([
    isBusy ? Promise.resolve([]) : getAvailableOrdersForDriver(driver.id),
    isBusy ? getDriverActiveOrderId(driver.id) : Promise.resolve(null),
  ]);

  const navItems = [
    { href: '/driver', label: 'الرئيسية', labelEn: 'Dashboard', icon: <span aria-hidden>▦</span> },
    { href: '/driver/orders', label: 'رحلاتي', labelEn: 'My Trips', icon: <span aria-hidden>◷</span> },
    { href: '/driver/wallet', label: 'المحفظة', labelEn: 'Wallet', badge: driver.commission_balance > 0 ? `${driver.commission_balance} ج` : undefined, icon: <span aria-hidden>▣</span> },
    { href: '/driver/profile', label: 'حسابي', labelEn: 'Profile', icon: <span aria-hidden>◉</span> },
  ];

  return (
    <AppShell header={<PageHeader title="لوحة تحكم الطيار" titleEn="Driver Dashboard" subtitle={`كابتن ${driver.user.full_name}`} showLogo={true} />} navItems={navItems}>
      <div className="max-w-2xl mx-auto py-2 sm:py-4 px-1 sm:px-0 space-y-3 font-sans">
        <DriverHeader driver={driver} activeOrderId={activeOrderId} />
        <AvailableOrdersList orders={availableOrders} isDriverBlocked={driver.is_blocked} isDriverOnline={driver.status === 'online'} isDriverBusy={isBusy} />
      </div>
    </AppShell>
  );
}
