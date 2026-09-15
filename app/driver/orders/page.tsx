import { getCurrentUser } from '@/lib/services/auth';
import { getDriverByUserId, getDriverOrders } from '@/lib/services/drivers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader, Card, OrderStatusBadge, EmptyState } from '@/components';
import type { OrderStatus } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

interface DriverOrdersPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function DriverOrdersPage({ searchParams }: DriverOrdersPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    redirect('/login');
  }

  const driver = await getDriverByUserId(user.id);
  if (!driver) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status as OrderStatus | undefined;

  const orders = await getDriverOrders(driver.id, statusFilter);

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
          title="رحلاتي وطلباتي"
          titleEn="My Assigned Trips"
          subtitle={`إجمالي المنفذ: ${driver.total_completed_orders} طلب`}
        />
      }
      navItems={navItems}
    >
      <div className="max-w-md mx-auto py-2">
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
          <Link
            href="/driver/orders"
            className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-outline'}`}
          >
            الكل
          </Link>
          <Link
            href="/driver/orders?status=accepted"
            className={`btn btn-sm ${statusFilter === 'accepted' ? 'btn-primary' : 'btn-outline'}`}
          >
            قيد الاستلام
          </Link>
          <Link
            href="/driver/orders?status=in_progress"
            className={`btn btn-sm ${statusFilter === 'in_progress' ? 'btn-primary' : 'btn-outline'}`}
          >
            جاري التوصيل
          </Link>
          <Link
            href="/driver/orders?status=delivered"
            className={`btn btn-sm ${statusFilter === 'delivered' ? 'btn-primary' : 'btn-outline'}`}
          >
            مكتمل
          </Link>
        </div>

        {/* Orders list */}
        {orders.length === 0 ? (
          <EmptyState
            title="لا توجد رحلات مسجلة"
            description="الطلبات التي تقبلها وتنفذها ستظهر هنا مع سجل كامل."
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/driver/orders/${order.id}`}
                className="no-underline text-inherit block"
              >
                <Card clickable className="p-4 transition-all">
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

                  {/* Items summary */}
                  <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-lg my-2 text-xs text-gray-700 dark:text-gray-300">
                    <div className="font-semibold mb-0.5">الأصناف:</div>
                    <div className="truncate">
                      {order.order_items?.map((it) => `${it.quantity}x ${it.description}`).join(' • ')}
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{order.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <span className="truncate">{order.dropoff_address}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                    <span className="text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                      {order.delivery_fee} جنيه
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
