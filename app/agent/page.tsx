import { getCurrentUser } from '@/lib/services/auth';
import {
  getAgentByUserId,
  getAgentRegionStats,
  getAgentPayoutSummary,
} from '@/lib/services/agent';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader, Card, StatCard } from '@/components';
import { PwaRoleInstallCard } from '@/components/pwa/PwaRoleInstallCard';

export const dynamic = 'force-dynamic';

export default async function AgentDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'agent') redirect('/login');

  const agent = await getAgentByUserId(user.id);
  if (!agent) {
    return (
      <div className="p-8 text-center font-sans">
        <h2>حساب الوكيل غير مرتبط بمنطقة</h2>
      </div>
    );
  }

  const stats = await getAgentRegionStats(agent.region_id);
  const payout = await getAgentPayoutSummary(agent.id);
  const balance = Number((agent as any).commission_balance || 0);

  const nav = [
    { href: '/agent', label: 'الرئيسية', labelEn: 'Overview', icon: '▦' },
    { href: '/agent/orders', label: 'الطلبات', labelEn: 'Orders', icon: '📦' },
    { href: '/agent/drivers', label: 'الطيارين', labelEn: 'Drivers', icon: '🛵' },
    { href: '/agent/drivers/new', label: 'إضافة طيار', labelEn: 'New Driver', icon: '➕' },
    { href: '/agent/profile', label: 'حسابي', labelEn: 'Account', icon: '👤' },
  ];

  return (
    <AppShell
      header={
        <PageHeader
          title={`وكالة منطقة ${agent.region?.name_ar || agent.region?.name}`}
          titleEn="Regional Agent Hub"
          subtitle={`مرحباً يا ${agent.user?.full_name}`}
        />
      }
      navItems={nav}
    >
      <div className="max-w-3xl mx-auto py-3 space-y-4 font-sans">
        {/* PWA Install Card for Agent */}
        <PwaRoleInstallCard role="agent" />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="إجمالي الطيارين"
            labelEn="Drivers"
            value={stats.totalDrivers}
            color="primary"
          />
          <StatCard
            label="طيارين متصلين"
            labelEn="Online"
            value={stats.onlineDrivers}
            color="success"
          />
          <StatCard
            label="طلبات جارية"
            labelEn="Active"
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

        {/* Quick Management Links */}
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-black">إدارة المنطقة</h3>
          <Link
            href="/agent/drivers"
            className="flex justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold hover:bg-orange-50 transition-colors"
          >
            <span>متابعة الطيارين</span>
            <span>←</span>
          </Link>
          <Link
            href="/agent/drivers/new"
            className="flex justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
          >
            <span>إضافة طيار تابع للوكالة ➕</span>
            <span>←</span>
          </Link>
          <Link
            href="/agent/orders"
            className="flex justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold hover:bg-orange-50 transition-colors"
          >
            <span>طلبات المنطقة الحالية</span>
            <span>←</span>
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}
