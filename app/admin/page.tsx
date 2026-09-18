import { getCurrentUser } from '@/lib/services/auth';
import { getAdminSystemStats } from '@/lib/services/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader, Card, StatCard } from '@/components';

export const dynamic = 'force-dynamic';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/login');

  const stats = await getAdminSystemStats();

  const navItems = [
    { href: '/admin', label: 'الرئيسية', labelEn: 'Overview', icon: <span aria-hidden>▦</span> },
    { href: '/admin/orders', label: 'الطلبات', labelEn: 'Orders', icon: <span aria-hidden>▣</span> },
    { href: '/admin/drivers', label: 'الطيارين', labelEn: 'Drivers', icon: <span aria-hidden>◉</span> },
    { href: '/admin/driver-verifications', label: 'اعتماد الطيارين', labelEn: 'Verification', icon: <span aria-hidden>✓</span> },
    { href: '/admin/regions', label: 'الوكلاء والمناطق', labelEn: 'Agents & Regions', icon: <span aria-hidden>⌖</span> },
    { href: '/admin/pricing', label: 'التسعير', labelEn: 'Pricing', icon: <span aria-hidden>ج</span> },
    { href: '/admin/payments', label: 'السداد', labelEn: 'Payments', badge: stats.pendingPaymentsCount > 0 ? stats.pendingPaymentsCount : undefined, icon: <span aria-hidden>▤</span> },
    { href: '/admin/notifications', label: 'الإشعارات', labelEn: 'Notifications', icon: <span aria-hidden>◌</span> },
  ];

  const quickActions = [
    { href: '/admin/orders', icon: '📦', title: 'إدارة الطلبات', text: 'تابع الطلبات والحالات والطيارين' },
    { href: '/admin/drivers', icon: '🛵', title: 'الطيارين', text: `${stats.totalDrivers} طيار مسجل` },
    { href: '/admin/regions', icon: '🗺️', title: 'المناطق والوكلاء', text: `${stats.totalRegions} منطقة • ${stats.totalAgents} وكيل نشط` },
    { href: '/admin/payments', icon: '💳', title: 'مراجعة المدفوعات', text: stats.pendingPaymentsCount ? `${stats.pendingPaymentsCount} إشعار يحتاج مراجعة` : 'لا توجد إشعارات معلقة' },
    { href: '/admin/customers', icon: '👥', title: 'العملاء', text: `${stats.totalCustomers} عميل مسجل` },
    { href: '/admin/pricing', icon: '⚙️', title: 'إعدادات التسعير', text: 'رسوم التوصيل وشرائح المسافة' },
  ];

  return (
    <AppShell
      header={<PageHeader title="لوحة الإدارة المركزية" titleEn="Engz Super Admin" subtitle={`مرحباً بك يا ${user.full_name || 'مدير المنصة'}`} showLogo={true} />}
      navItems={navItems}
    >
      <div className="max-w-6xl mx-auto py-3 sm:py-5 space-y-5 font-sans">
        <section className="rounded-3xl border border-orange-100 bg-gradient-to-l from-[#FFF4ED] via-white to-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-black text-[#FA3802] uppercase tracking-wide">ENgz Operations</p>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">مركز التشغيل والمتابعة</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">نظرة سريعة على الطلبات، الطيارين، الوكلاء والمدفوعات.</p>
            </div>
            <Link href="/admin/orders" className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#FA3802] text-white text-xs font-extrabold hover:bg-[#e03102] transition-colors shadow-sm ${focusRing}`}>
              فتح إدارة الطلبات ←
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="إجمالي الطلبات" labelEn="Total Orders" value={stats.totalOrders} color="primary" />
          <StatCard label="الطيارين المتصلين" labelEn="Online Drivers" value={`${stats.onlineDrivers} / ${stats.totalDrivers}`} color="success" />
          <StatCard label="العملاء" labelEn="Customers" value={stats.totalCustomers} color="info" />
          <StatCard label="الوكلاء النشطين" labelEn="Active Agents" value={stats.totalAgents} color="warning" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-sm font-black text-slate-900">صحة التشغيل المالية</h2><p className="text-[11px] text-slate-500 mt-0.5">ملخص أرصدة العمولات والمدفوعات</p></div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">Live</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4"><p className="text-[11px] text-slate-500">عمولات محصلة</p><p className="text-xl font-black text-slate-900 mt-1">{stats.totalCommissionsCollected} <span className="text-xs">ج</span></p></div>
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4"><p className="text-[11px] text-amber-700">عمولات غير مسددة</p><p className="text-xl font-black text-slate-900 mt-1">{stats.unpaidCommissionsTotal} <span className="text-xs">ج</span></p></div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-black text-slate-900">مؤشرات المنصة</h2>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between"><span className="text-slate-500">المناطق النشطة</span><b className="text-slate-900">{stats.totalRegions}</b></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">الطيارين المتاحين</span><b className="text-emerald-600">{stats.onlineDrivers}</b></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">إجمالي الطيارين</span><b className="text-slate-900">{stats.totalDrivers}</b></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">طلبات النظام</span><b className="text-slate-900">{stats.totalOrders}</b></div>
            </div>
          </Card>
        </section>

        {stats.pendingPaymentsCount > 0 && (
          <section className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div><h3 className="font-black text-sm text-amber-900">{stats.pendingPaymentsCount} إشعار تحويل عمولات يحتاج مراجعة</h3><p className="text-[11px] text-amber-700 mt-1">راجع الإشعارات لتأكيد الاستلام وتحديث رصيد الطيار.</p></div>
            <Link href="/admin/payments" className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#FA3802] text-white text-xs font-extrabold hover:bg-[#e03102] transition-colors ${focusRing}`}>مراجعة المدفوعات</Link>
          </section>
        )}

        <section>
          <div className="flex items-end justify-between mb-3"><div><h2 className="text-base font-black text-slate-900">الوصول السريع</h2><p className="text-[11px] text-slate-500 mt-0.5">أهم أدوات الإدارة في مكان واحد</p></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {quickActions.map((item) => (
              <Link key={item.href} href={item.href} className={`group bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-orange-200 transition-all ${focusRing}`}>
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">{item.icon}</span>
                  <div className="min-w-0"><h3 className="text-sm font-extrabold text-slate-900">{item.title}</h3><p className="text-[11px] text-slate-500 mt-1 leading-5">{item.text}</p></div>
                  <span className="text-slate-300 group-hover:text-[#FA3802] transition-colors mr-auto">←</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-black text-slate-900 mb-3">الإدارة المتقدمة</h2>
          <div className="flex flex-wrap gap-2">
            {[
              ['/admin/commissions', 'شرائح العمولات'],
              ['/admin/pricing', 'محرك التسعير'],
              ['/admin/regions', 'المناطق والوكلاء'],
              ['/admin/customers', 'العملاء'],
            ].map(([href, label]) => <Link key={href} href={href} className={`px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-[#FA3802] hover:border-orange-100 transition-colors ${focusRing}`}>{label}</Link>)}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
