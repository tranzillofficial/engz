import { getCurrentUser } from '@/lib/services/auth';
import { getAgentByUserId, getAgentOrders } from '@/lib/services/agent';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader, Card, OrderStatusBadge, EmptyState } from '@/components';
import type { OrderStatus } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

interface AgentOrdersPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AgentOrdersPage({ searchParams }: AgentOrdersPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'agent') {
    redirect('/login');
  }

  const agent = await getAgentByUserId(user.id);
  if (!agent) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status as OrderStatus | undefined;

  const orders = await getAgentOrders(agent.region_id, statusFilter);

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
          title={`طلبات منطقة ${agent.region.name_ar || agent.region.name}`}
          titleEn="Regional Orders"
          backHref="/agent"
        />
      }
      navItems={navItems}
    >
      <div className="max-w-md mx-auto py-2">
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
          <Link
            href="/agent/orders"
            className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-outline'}`}
          >
            الكل
          </Link>
          <Link
            href="/agent/orders?status=pending"
            className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          >
            قيد الانتظار
          </Link>
          <Link
            href="/agent/orders?status=in_progress"
            className={`btn btn-sm ${statusFilter === 'in_progress' ? 'btn-primary' : 'btn-outline'}`}
          >
            جاري التوصيل
          </Link>
          <Link
            href="/agent/orders?status=delivered"
            className={`btn btn-sm ${statusFilter === 'delivered' ? 'btn-primary' : 'btn-outline'}`}
          >
            مكتمل
          </Link>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات مسجلة بالمنطقة"
            description="جميع طلبات التوصيل المنشأة داخل نطاق منطقتك ستظهر هنا."
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                      طلب #{order.id.slice(0, 8)}
                    </span>
                    <div className="text-xs text-gray-500">
                      العميل: {order.customer?.full_name || 'عميل'}
                    </div>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Driver info if assigned */}
                {order.driver ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 mb-2">
                    الطيار المسؤول: <strong>{order.driver.user?.full_name}</strong>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg text-xs text-amber-800 dark:text-amber-300 mb-2">
                    في انتظار قبول طيار
                  </div>
                )}

                {/* Items */}
                <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-lg my-2 text-xs text-gray-700 dark:text-gray-300">
                  <div className="font-semibold mb-0.5">الأصناف:</div>
                  <div className="truncate">
                    {order.order_items?.map((it: any) => `${it.quantity}x ${it.description}`).join(' • ')}
                  </div>
                </div>

                {/* Locations */}
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <div className="truncate">من: {order.pickup_address}</div>
                  <div className="truncate">إلى: {order.dropoff_address}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <span className="text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('ar-EG', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    رسوم: {order.delivery_fee} ج.م
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
