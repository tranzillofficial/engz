import { getCurrentUser } from '@/lib/services/auth';
import { getDriverByUserId } from '@/lib/services/drivers';
import { getAvailableOrdersForDriver } from '@/lib/services/matching';
import { redirect } from 'next/navigation';
import { AppShell, PageHeader } from '@/components';
import { DriverHeader } from '@/components/driver/DriverHeader';
import { AvailableOrdersList } from '@/components/driver/AvailableOrdersList';

export const dynamic = 'force-dynamic';

export default async function DriverDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    redirect('/login');
  }

  const driver = await getDriverByUserId(user.id);
  if (!driver) {
    redirect('/login');
  }

  const availableOrders = await getAvailableOrdersForDriver(driver.id);

  const navItems = [
    {
      href: '/driver',
      label: 'الرئيسية',
      labelEn: 'Dashboard',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      href: '/driver/orders',
      label: 'رحلاتي',
      labelEn: 'My Trips',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      href: '/driver/wallet',
      label: 'المحفظة',
      labelEn: 'Wallet',
      badge: driver.commission_balance > 0 ? `${driver.commission_balance} ج` : undefined,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      ),
    },
    {
      href: '/driver/profile',
      label: 'حسابي',
      labelEn: 'Profile',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ];

  return (
    <AppShell
      header={
        <PageHeader
          title="لوحة تحكم الطيار"
          titleEn="Driver Dashboard"
          subtitle={`كابتن ${driver.user.full_name}`}
          showLogo={true}
        />
      }
      navItems={navItems}
    >
      <div className="max-w-md mx-auto py-2">
        <DriverHeader driver={driver} />
        <AvailableOrdersList
          orders={availableOrders}
          isDriverBlocked={driver.is_blocked}
          isDriverOnline={driver.status === 'online'}
        />
      </div>
    </AppShell>
  );
}
