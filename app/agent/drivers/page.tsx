import { getCurrentUser } from '@/lib/services/auth';
import { getAgentByUserId, getAgentDrivers } from '@/lib/services/agent';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader, Card, DriverStatusBadge, EmptyState } from '@/components';

export const dynamic = 'force-dynamic';

interface AgentDriversPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AgentDriversPage({ searchParams }: AgentDriversPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'agent') {
    redirect('/login');
  }

  const agent = await getAgentByUserId(user.id);
  if (!agent) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status;

  const drivers = await getAgentDrivers(agent.region_id, statusFilter);

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
          title={`طياري منطقة ${agent.region.name_ar || agent.region.name}`}
          titleEn="Regional Drivers"
          subtitle={`إجمالي المسجلين: ${drivers.length}`}
          backHref="/agent"
        />
      }
      navItems={navItems}
    >
      <div className="max-w-md mx-auto py-2">
        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
          <Link
            href="/agent/drivers"
            className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-outline'}`}
          >
            الكل
          </Link>
          <Link
            href="/agent/drivers?status=online"
            className={`btn btn-sm ${statusFilter === 'online' ? 'btn-primary' : 'btn-outline'}`}
          >
            متصل الآن
          </Link>
          <Link
            href="/agent/drivers?status=blocked"
            className={`btn btn-sm ${statusFilter === 'blocked' ? 'btn-primary' : 'btn-outline'}`}
          >
            محظور للعمولات
          </Link>
        </div>

        {drivers.length === 0 ? (
          <EmptyState
            title="لا يوجد طيارين مسجلين"
            description="الطيارين التابعين لمنطقتك سيظهرون هنا مع تفاصيل رصيد العمولات وحالة التواجد."
          />
        ) : (
          <div className="space-y-3">
            {drivers.map((driver) => (
              <Card key={driver.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                      {driver.user.full_name?.charAt(0) || 'ك'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {driver.user.full_name}
                      </h4>
                      <div className="text-xs text-gray-500">
                        {driver.user.phone ? (
                          <a href={`tel:${driver.user.phone}`} className="text-indigo-600 underline">
                            📞 {driver.user.phone}
                          </a>
                        ) : (
                          driver.user.email
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <DriverStatusBadge status={driver.status} />
                    {driver.is_blocked && (
                      <span className="badge badge-danger text-[10px]">محظور</span>
                    )}
                  </div>
                </div>

                {/* Balance & Orders Info */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-400 block text-[11px]">العمولات المستحقة:</span>
                    <span className={`font-black ${driver.commission_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {driver.commission_balance} ج.م
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-400 block text-[11px]">الطلبات المنفذة:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {driver.total_completed_orders} طلب
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
