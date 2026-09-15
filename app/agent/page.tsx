import { getCurrentUser } from '@/lib/services/auth';
import { getAgentByUserId, getAgentRegionStats } from '@/lib/services/agent';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader, Card, StatCard } from '@/components';

export const dynamic = 'force-dynamic';

export default async function AgentDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'agent') {
    redirect('/login');
  }

  const agent = await getAgentByUserId(user.id);
  if (!agent) {
    return (
      <div className="p-8 text-center">
        <h2>حساب الوكيل غير مرتبط بمنطقة حالياً</h2>
        <p className="text-gray-500">يرجى مراجعة إدارة المنصة لربط حسابك بمنطقتك الجغرافية.</p>
      </div>
    );
  }

  const stats = await getAgentRegionStats(agent.region_id);

  const navItems = [
    {
      href: '/agent',
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
      href: '/agent/orders',
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
      href: '/agent/drivers',
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
      href: '/agent/payments',
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
    {
      href: '/agent/profile',
      label: 'المنطقة',
      labelEn: 'Region',
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
          title={`وكالة منطقة ${agent.region.name_ar || agent.region.name}`}
          titleEn="Regional Agent Hub"
          subtitle={`مرحباً بك يا ${agent.user.full_name}`}
        />
      }
      navItems={navItems}
    >
      <div className="max-w-md mx-auto py-2 space-y-4">
        {/* Pending Payments Alert */}
        {stats.pendingPaymentsCount > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between animate-fade-in">
            <div>
              <h4 className="font-bold text-xs text-amber-800 dark:text-amber-300">
                لديك {stats.pendingPaymentsCount} إشعار سداد عمولات للمراجعة 💳
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                إجمالي المبالغ المعلقة: {stats.totalPendingPaymentsAmount} ج.م
              </p>
            </div>
            <Link href="/agent/payments" className="btn btn-primary btn-sm shrink-0">
              مراجعة الآن
            </Link>
          </div>
        )}

        {/* Region Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="إجمالي الطيارين"
            labelEn="Total Drivers"
            value={stats.totalDrivers}
            color="primary"
          />
          <StatCard
            label="طيارين متصلين الآن"
            labelEn="Online Now"
            value={stats.onlineDrivers}
            color="success"
          />
          <StatCard
            label="طلبات جارية"
            labelEn="Active Orders"
            value={stats.activeOrders}
            color="warning"
          />
          <StatCard
            label="طلبات مكتملة"
            labelEn="Delivered"
            value={stats.deliveredOrders}
            color="info"
          />
        </div>

        {/* Quick Access Menu */}
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            إدارة عمليات المنطقة ⚡
          </h3>

          <Link
            href="/agent/drivers"
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 no-underline hover:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              <span>🛵</span>
              <span>متابعة حالة الطيارين ({stats.onlineDrivers} متاح)</span>
            </div>
            <span>←</span>
          </Link>

          <Link
            href="/agent/orders"
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 no-underline hover:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              <span>📦</span>
              <span>طلبات التوصيل الحالية بالمنطقة</span>
            </div>
            <span>←</span>
          </Link>

          <Link
            href="/agent/payments"
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 no-underline hover:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              <span>💳</span>
              <span>تأكيد سداد العمولات والتحويلات</span>
            </div>
            <span className="badge badge-warning">{stats.pendingPaymentsCount}</span>
          </Link>

          <Link
            href="/agent/profile"
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 no-underline hover:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              <span>⚙️</span>
              <span>إعدادات التواصل للمنطقة (واتساب/إنستجرام)</span>
            </div>
            <span>←</span>
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}
