import { getCurrentUser } from '@/lib/services/auth';
import { getCustomerOrders } from '@/lib/services/orders';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader, Card, OrderStatusBadge, EmptyState, Button } from '@/components';
import type { OrderStatus } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'customer') {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status as OrderStatus | undefined;
  const page = parseInt(resolvedParams.page || '1', 10);

  const { orders } = await getCustomerOrders(user.id, {
    status: statusFilter,
    page,
    limit: 10,
  });

  const navItems = [
    {
      href: '/orders',
      label: 'طلباتي',
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
      href: '/orders/new',
      label: 'طلب جديد',
      labelEn: 'New Order',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
    },
    {
      href: '/profile',
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
          title="طلباتي"
          titleEn="My Orders"
          subtitle={`أهلاً بك، ${user.full_name}`}
          showLogo={true}
          action={
            <Link href="/orders/new" className="btn btn-primary btn-sm" id="header-new-order-btn">
              <span>+ طلب جديد</span>
            </Link>
          }
        />
      }
      navItems={navItems}
    >
      <div className="max-w-md mx-auto py-2">
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
          <Link
            href="/orders"
            className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-outline'}`}
          >
            الكل
          </Link>
          <Link
            href="/orders?status=pending"
            className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          >
            قيد الانتظار
          </Link>
          <Link
            href="/orders?status=accepted"
            className={`btn btn-sm ${statusFilter === 'accepted' ? 'btn-primary' : 'btn-outline'}`}
          >
            تم القبول
          </Link>
          <Link
            href="/orders?status=in_progress"
            className={`btn btn-sm ${statusFilter === 'in_progress' ? 'btn-primary' : 'btn-outline'}`}
          >
            جاري التوصيل
          </Link>
          <Link
            href="/orders?status=delivered"
            className={`btn btn-sm ${statusFilter === 'delivered' ? 'btn-primary' : 'btn-outline'}`}
          >
            مكتمل
          </Link>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات حالياً"
            description="ابدأ واطلب أي حاجة محتاجها من أي مكان، والطيار هيوصلها لحد عندك!"
            action={
              <Link href="/orders/new" className="btn btn-primary btn-md">
                إنشاء طلبك الأول 🚀
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="no-underline text-inherit block"
              >
                <Card clickable className="p-4 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-800 dark:text-gray-100">
                        طلب #{order.id.slice(0, 8)}
                      </span>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Items summary */}
                  <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-lg my-2.5 text-xs text-gray-700 dark:text-gray-300">
                    <div className="font-semibold mb-1 text-gray-900 dark:text-gray-200">
                      الأصناف ({order.order_items?.length || 0}):
                    </div>
                    <div className="truncate">
                      {order.order_items?.map((item) => `${item.quantity}x ${item.description}`).join(' • ') || 'لا توجد أصناف'}
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-medium text-gray-500 dark:text-gray-400">من:</span>
                      <span className="truncate">{order.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <span className="font-medium text-gray-500 dark:text-gray-400">إلى:</span>
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
                    <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
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
