import { getCurrentUser } from '@/lib/services/auth';
import { getDriverByUserId } from '@/lib/services/drivers';
import { redirect } from 'next/navigation';
import { AppShell, PageHeader, Card, Button } from '@/components';
import { logoutAction } from '@/lib/actions/auth';
import { ChangePasswordForm } from '@/components/driver/ChangePasswordForm';

export const dynamic = 'force-dynamic';

export default async function DriverProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    redirect('/login');
  }

  const driver = await getDriverByUserId(user.id);
  if (!driver) {
    redirect('/login');
  }

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
          title="الملف الشخصي للطيار"
          titleEn="Driver Profile"
          backHref="/driver"
        />
      }
      navItems={navItems}
    >
      <div className="max-w-md mx-auto py-2 space-y-4">
        {/* Profile Info */}
        <Card className="p-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white text-xl font-bold flex items-center justify-center mx-auto mb-2 shadow-md">
            🛵
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {driver.user.full_name}
          </h2>
          <p className="text-xs text-gray-500">{driver.user.email}</p>
          <div className="mt-2 flex justify-center gap-2">
            <span className="badge badge-primary">طيار معتمد</span>
            <span className={`badge ${driver.is_blocked ? 'badge-danger' : 'badge-success'}`}>
              {driver.is_blocked ? 'محظور' : 'نشط'}
            </span>
          </div>
        </Card>

        {/* Driver Stats */}
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            إحصائيات الأداء 📊
          </h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <span className="text-xs text-gray-500 block mb-1">الطلبات المكتملة</span>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {driver.total_completed_orders}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <span className="text-xs text-gray-500 block mb-1">العمولات المستحقة</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                {driver.commission_balance} ج.م
              </span>
            </div>
          </div>
        </Card>

        {/* Contact Agent / Region */}
        <Card className="p-4 space-y-2 text-xs">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
            المنطقة ووكيل المتابعة 🏢
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold">المنطقة التابع لها: </span>
            {driver.region?.name_ar || driver.region?.name || 'غير محددة'}
          </p>
          {driver.region?.whatsapp && (
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-semibold">واتساب الوكيل: </span>
              <a href={`https://wa.me/${driver.region.whatsapp}`} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                {driver.region.whatsapp}
              </a>
            </p>
          )}
        </Card>

        {/* Change Password Form */}
        <ChangePasswordForm />

        {/* Logout */}
        <form action={logoutAction} className="pt-2">
          <Button
            type="submit"
            variant="outline"
            size="md"
            className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            تسجيل الخروج 🚪
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
