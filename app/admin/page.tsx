import { getCurrentUser } from '@/lib/services/auth';
import { getAdminSystemStats } from '@/lib/services/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader, Card, StatCard } from '@/components';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const stats = await getAdminSystemStats();

  const navItems = [
    {
      href: '/admin',
      label: 'الرئيسية',
      labelEn: 'Overview',
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
      href: '/admin/orders',
      label: 'الطلبات',
      labelEn: 'Orders',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
    },
    {
      href: '/admin/drivers',
      label: 'الطيارين',
      labelEn: 'Drivers',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4"/>
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
        </svg>
      ),
    },
    {
      href: '/admin/pricing',
      label: 'التسعير',
      labelEn: 'Pricing',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      href: '/admin/payments',
      label: 'المدفوعات',
      labelEn: 'Payments',
      badge: stats.pendingPaymentsCount > 0 ? stats.pendingPaymentsCount : undefined,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      ),
    },
  ];

  return (
    <AppShell
      header={
        <PageHeader
          title="لوحة الإدارة المركزية"
          titleEn="Engz Super Admin"
          subtitle={`مرحباً بك يا ${user.full_name || 'مدير المنصة'}`}
          showLogo={true}
        />
      }
      navItems={navItems}
    >
      <div className="max-w-md mx-auto py-2 space-y-4 font-sans">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="إجمالي الطلبات"
            labelEn="Total Orders"
            value={stats.totalOrders}
            color="primary"
          />
          <StatCard
            label="الطيارين المتصلين"
            labelEn="Online Drivers"
            value={`${stats.onlineDrivers} / ${stats.totalDrivers}`}
            color="success"
          />
          <StatCard
            label="عمولات محصلة"
            labelEn="Collected"
            value={`${stats.totalCommissionsCollected} ج`}
            color="info"
          />
          <StatCard
            label="عمولات غير مسددة"
            labelEn="Unpaid Debt"
            value={`${stats.unpaidCommissionsTotal} ج`}
            color="warning"
          />
        </div>

        {/* Pending review notification */}
        {stats.pendingPaymentsCount > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <h4 className="font-bold text-xs text-amber-800 dark:text-amber-300">
                يوجد {stats.pendingPaymentsCount} إشعار تحويل عمولات في انتظار التأكيد
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                راجع الإشعارات لتأكيد الاستلام وخصم الرصيد تلقائياً.
              </p>
            </div>
            <Link href="/admin/payments" className="btn btn-primary btn-sm shrink-0 font-bold">
              مراجعة
            </Link>
          </div>
        )}

        {/* Management Sections Grid */}
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <span>🛠️</span>
            <span>لوحات التحكم والإعدادات</span>
          </h3>

          <Link
            href="/admin/orders"
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 no-underline hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>📦</span>
              <span>إدارة وتتبع كل الطلبات ({stats.totalOrders})</span>
            </div>
            <span className="text-slate-400">←</span>
          </Link>

          <Link
            href="/admin/drivers"
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 no-underline hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>🛵</span>
              <span>إدارة الطيارين ومتابعة الحظر ({stats.totalDrivers})</span>
            </div>
            <span className="text-slate-400">←</span>
          </Link>

          <Link
            href="/admin/customers"
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 no-underline hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span>العملاء المسجلين ({stats.totalCustomers})</span>
            </div>
            <span className="text-slate-400">←</span>
          </Link>

          <Link
            href="/admin/pricing"
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 no-underline hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>💰</span>
              <span>محرك التسعير وشرائح المسافة ونصف القطر</span>
            </div>
            <span className="text-slate-400">←</span>
          </Link>

          <Link
            href="/admin/commissions"
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 no-underline hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>💸</span>
              <span>شرائح العمولات ونسب المنصة</span>
            </div>
            <span className="text-slate-400">←</span>
          </Link>

          <Link
            href="/admin/regions"
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 no-underline hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>🗺️</span>
              <span>المناطق والوكلاء المعتمدين ({stats.totalRegions})</span>
            </div>
            <span className="text-slate-400">←</span>
          </Link>

          <Link
            href="/admin/payments"
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 no-underline hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>💳</span>
              <span>سجل التحويلات وتأكيد المدفوعات</span>
            </div>
            <div className="flex items-center gap-2">
              {stats.pendingPaymentsCount > 0 && (
                <span className="badge badge-primary">{stats.pendingPaymentsCount} معلق</span>
              )}
              <span className="text-slate-400">←</span>
            </div>
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}
