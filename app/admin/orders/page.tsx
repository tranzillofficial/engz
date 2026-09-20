import { getCurrentUser } from '@/lib/services/auth';
import { getAdminOrders } from '@/lib/services/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader, OrderStatusBadge, EmptyState } from '@/components';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/login');

  const params = await searchParams;
  const currentStatus = params.status || '';
  const currentSearch = params.search || '';

  let orders = await getAdminOrders({
    status: (params.status as any) || undefined,
    search: currentSearch || undefined,
  });

  if (params.from || params.to) {
    const from = params.from ? new Date(params.from + 'T00:00:00') : null;
    const to = params.to ? new Date(params.to + 'T23:59:59') : null;
    orders = orders.filter((o: any) => {
      const d = new Date(o.created_at);
      return (!from || d >= from) && (!to || d <= to);
    });
  }

  const statuses = [
    { value: '', label: 'الكل' },
    { value: 'pending', label: 'معلقة' },
    { value: 'accepted', label: 'مقبولة' },
    { value: 'in_progress', label: 'قيد التنفيذ' },
    { value: 'delivered', label: 'مكتملة' },
    { value: 'cancelled', label: 'ملغاة' },
  ];

  return (
    <AppShell
      header={
        <PageHeader
          title="إدارة الطلبات"
          titleEn="Orders Control"
          subtitle={`إجمالي المعروض: ${orders.length} طلب`}
          backHref="/admin"
        />
      }
    >
      <div className="max-w-4xl mx-auto py-2 sm:py-4 space-y-4 font-sans">
        {/* Filters Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          {/* Quick status pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {statuses.map((s) => {
              const active = currentStatus === s.value;
              return (
                <Link
                  key={s.value}
                  href={`/admin/orders?status=${s.value}${currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ''}`}
                  className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#FA3802] text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-50 hover:text-[#FA3802]'
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>

          {/* Search and Date Form */}
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
            <input type="hidden" name="status" value={currentStatus} />
            <div className="sm:col-span-5 relative">
              <input
                name="search"
                defaultValue={currentSearch}
                placeholder="بحث برقم الطلب، اسم العميل أو الهاتف..."
                className="w-full h-11 px-3.5 pr-9 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30 focus:border-[#FA3802] transition-all"
              />
              <span className="absolute right-3 top-3 text-slate-400 text-sm">🔍</span>
            </div>

            <div className="sm:col-span-3">
              <input
                name="from"
                type="date"
                defaultValue={params.from || ''}
                title="من تاريخ"
                className="w-full h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30 transition-all"
              />
            </div>

            <div className="sm:col-span-3">
              <input
                name="to"
                type="date"
                defaultValue={params.to || ''}
                title="إلى تاريخ"
                className="w-full h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30 transition-all"
              />
            </div>

            <div className="sm:col-span-1 flex gap-1">
              <button
                type="submit"
                className="w-full h-11 rounded-2xl bg-[#FA3802] text-white font-black text-xs hover:bg-[#e03102] transition-colors flex items-center justify-center shadow-xs"
                title="تطبيق الفلتر"
              >
                تصفية
              </button>
            </div>
          </form>
        </div>

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order: any) => {
              const shortId = order.id ? order.id.slice(0, 8) : '00000000';
              const createdDate = new Date(order.created_at).toLocaleString('ar-EG', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3.5"
                >
                  {/* Top Bar of Card */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-[#FA3802] font-black text-xs flex items-center justify-center">
                        #{shortId}
                      </span>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {order.customer?.full_name || 'عميل إنجز'}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {createdDate}
                        </p>
                      </div>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Body Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">عنوان التسليم:</span>
                      <p className="text-slate-700 dark:text-slate-200 font-semibold line-clamp-1">
                        📍 {order.dropoff_address || 'لم يتم التحديد'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">الطيار:</span>
                        <p className="text-slate-700 dark:text-slate-200 font-bold">
                          🛵 {order.driver?.user?.full_name || 'بانتظار القبول'}
                        </p>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-slate-400 block">رسوم التوصيل:</span>
                        <span className="text-sm font-black text-[#FA3802]">
                          {order.delivery_fee} ج.م
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items Preview */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {order.order_items.slice(0, 4).map((item: any, idx: number) => (
                        <span
                          key={item.id || idx}
                          className="px-2.5 py-1 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 text-[#FA3802] text-[11px] font-bold"
                        >
                          {item.quantity ? `${item.quantity}× ` : ''}
                          {item.description}
                        </span>
                      ))}
                      {order.order_items.length > 4 && (
                        <span className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                          +{order.order_items.length - 4} أصناف أخرى
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:bg-[#FA3802] dark:hover:bg-[#FA3802] dark:hover:text-white transition-all shadow-xs"
                    >
                      <span>فتح التفاصيل والمحادثة</span>
                      <span>💬</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="لا توجد طلبات"
            description="لا توجد طلبات مطابقة لمعايير البحث الحالية."
          />
        )}
      </div>
    </AppShell>
  );
}