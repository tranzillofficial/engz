import { getCurrentUser } from '@/lib/services/auth';
import { getAdminOrders } from '@/lib/services/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader, OrderStatusBadge, EmptyState } from '@/components';
import type { OrderStatus } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

interface AdminOrdersPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}

export default async function EngzAdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status as OrderStatus | undefined;
  const searchQuery = resolvedParams.search || '';

  const orders = await getAdminOrders({
    status: statusFilter,
    search: searchQuery,
  });

  return (
    <AppShell
      header={
        <PageHeader
          title="سجل وإدارة كل الطلبات"
          titleEn="All System Orders Log"
          subtitle={`إجمالي الطلبات المعروضة: ${orders.length}`}
          backHref="/engzadmin"
        />
      }
    >
      <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 space-y-4 font-sans">
        
        {/* Search Bar */}
        <form method="GET" action="/engzadmin/orders" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex gap-2">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <div className="relative flex-1">
            <input
              name="search"
              defaultValue={searchQuery}
              placeholder="ابحث برقم هاتف العميل (مثال: 010...)، اسم العميل، أو كود الطلب..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/25 focus:border-[#FA3802]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#FA3802] text-white text-xs font-bold hover:bg-[#e03102] transition-colors shrink-0"
          >
            بحث
          </button>
          {searchQuery && (
            <Link
              href={`/engzadmin/orders${statusFilter ? `?status=${statusFilter}` : ''}`}
              className="px-3 py-2.5 rounded-xl bg-gray-100 text-slate-600 text-xs font-bold hover:bg-gray-200 transition-colors flex items-center shrink-0"
            >
              مسح
            </Link>
          )}
        </form>

        {/* Status Filters Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href={`/engzadmin/orders${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              !statusFilter
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
            }`}
          >
            الكل
          </Link>
          <Link
            href={`/engzadmin/orders?status=pending${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
            }`}
          >
            ⏳ معلقة
          </Link>
          <Link
            href={`/engzadmin/orders?status=in_progress${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'in_progress'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
            }`}
          >
            🛵 جارية
          </Link>
          <Link
            href={`/engzadmin/orders?status=delivered${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'delivered'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
            }`}
          >
            ✅ مكتملة
          </Link>
          <Link
            href={`/engzadmin/orders?status=cancelled${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'cancelled'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
            }`}
          >
            ❌ ملغاة
          </Link>
        </div>

        {/* Orders Listing */}
        {orders.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات مطابقة"
            description={searchQuery ? `لم يتم العثور على طلبات مطابقة للبحث "${searchQuery}"` : 'لا توجد طلبات مسجلة في النظام.'}
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow space-y-3"
              >
                {/* Header Row: ID, Time, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(order.created_at).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Customer & Driver Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Customer Card */}
                  <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-100/80 space-y-1">
                    <p className="text-[11px] font-bold text-orange-600">بيانات العميل:</p>
                    <p className="font-extrabold text-slate-900">{order.customer?.full_name || 'عميل سريع'}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-bold text-slate-700 dir-ltr">{order.customer?.phone}</span>
                      <Link
                        href={`/engzadmin/orders?search=${encodeURIComponent(order.customer?.phone || '')}`}
                        className="text-[10px] font-bold text-[#FA3802] hover:underline"
                        title="البحث عن جميع طلبات هذا الرقم"
                      >
                        كل طلبات الرقم ›
                      </Link>
                    </div>
                  </div>

                  {/* Driver Card */}
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                    <p className="text-[11px] font-bold text-slate-400">الطيار المفوّض:</p>
                    <p className="font-bold text-slate-800">
                      {order.driver?.user?.full_name || '⏳ بانتظار قبول طيار'}
                    </p>
                    {order.driver?.user?.phone && (
                      <p className="text-slate-600 dir-ltr">{order.driver.user.phone}</p>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1 text-slate-700">
                  <div className="flex items-start gap-1.5">
                    <span className="text-slate-400 shrink-0 font-bold">📍 التسليم إلى:</span>
                    <span className="font-bold text-slate-900">{order.dropoff_address}</span>
                  </div>
                </div>

                {/* Order Items Summary */}
                {order.order_items && order.order_items.length > 0 && (
                  <div className="text-xs pt-1">
                    <p className="text-[11px] font-bold text-slate-400 mb-1.5">
                      الأصناف ({order.order_items.length} صنف):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {order.order_items.map((item: any, idx: number) => (
                        <span
                          key={item.id || idx}
                          className="px-2.5 py-1 rounded-xl bg-gray-100 text-slate-800 text-[11px] font-medium border border-gray-200"
                        >
                          {item.description} <strong className="text-[#FA3802]">×{item.quantity}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Action Row */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs font-extrabold text-slate-900">
                    رسوم التوصيل: <span className="text-[#FA3802] font-black text-sm">{order.delivery_fee} ج.م</span>
                  </span>

                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all"
                  >
                    <span>تفاصيل الطلب والشات</span>
                    <span className="rotate-180">←</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
