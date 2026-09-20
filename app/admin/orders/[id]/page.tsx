import { getCurrentUser } from '@/lib/services/auth';
import { getAdminOrderDetailSafe } from '@/lib/services/admin-order-detail';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader, Card, OrderStatusBadge } from '@/components';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/login');

  const { id } = await params;
  const detail = await getAdminOrderDetailSafe(id);

  if (!detail || !detail.order) {
    notFound();
  }

  const { order, messages, customerPreviousOrders } = detail;
  const shortId = order.id ? order.id.slice(0, 8) : '00000000';

  return (
    <AppShell
      header={
        <PageHeader
          title={`تفاصيل الطلب #${shortId}`}
          titleEn="Order Review & History"
          subtitle={`قيمة التوصيل: ${order.delivery_fee} ج.م`}
          backHref="/admin/orders"
        />
      }
    >
      <div className="max-w-4xl mx-auto py-2 sm:py-4 space-y-4 font-sans">
        {/* Status Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-[#FA3802] font-black text-sm flex items-center justify-center">
              #{shortId}
            </span>
            <div>
              <p className="text-[11px] font-bold text-slate-400">حالة الطلب الحالية</p>
              <div className="mt-1">
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          </div>

          <div className="text-left">
            <span className="text-[11px] font-bold text-slate-400 block">معرف الطلب الكامل (UUID)</span>
            <code className="text-xs bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 font-mono select-all inline-block mt-1">
              {order.id}
            </code>
          </div>
        </div>

        {/* Customer & Driver Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>👤</span>
                <span>بيانات العميل</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">عميل</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 font-medium">الاسم:</span>
                <b className="text-slate-800 dark:text-slate-200">{order.customer?.full_name || 'عميل إنجز'}</b>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 font-medium">رقم الهاتف:</span>
                <b className="text-slate-800 dark:text-slate-200 dir-ltr">{order.customer?.phone || 'غير مسجل'}</b>
              </div>
              {order.customer?.email && (
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 font-medium">البريد:</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-[200px]">{order.customer.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Driver Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>🛵</span>
                <span>الطيار المسؤول</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">
                {order.driver ? 'تم القبول' : 'قيد الانتظار'}
              </span>
            </div>

            {order.driver ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 font-medium">اسم الطيار:</span>
                  <b className="text-slate-800 dark:text-slate-200">{order.driver.user?.full_name || 'طيار إنجز'}</b>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 font-medium">رقم الهاتف:</span>
                  <b className="text-slate-800 dark:text-slate-200 dir-ltr">{order.driver.user?.phone || 'غير مسجل'}</b>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400 font-medium">رصيد عمولات الطيار:</span>
                  <b className="text-[#FA3802]">{order.driver.commission_balance || 0} ج.م</b>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-400 space-y-1">
                <p className="text-lg">⏳</p>
                <p className="font-bold">لم يقم أي طيار بقبول الطلب حتى الآن</p>
              </div>
            )}
          </div>
        </div>

        {/* Address and Items Details */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>📦</span>
            <span>تفاصيل التوصيل والطلبات</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {order.pickup_address && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">مكان الاستلام:</span>
                <p className="text-slate-800 dark:text-slate-200 font-semibold">{order.pickup_address}</p>
              </div>
            )}
            <div className="p-3 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 space-y-1">
              <span className="text-[10px] font-bold text-[#FA3802] block">مكان التسليم (العميل):</span>
              <p className="text-slate-800 dark:text-slate-200 font-bold">{order.dropoff_address || 'لم يحدد'}</p>
            </div>
          </div>

          {order.customer_notes && (
            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200">
              <b className="block mb-0.5">ملاحظات العميل:</b>
              <p>{order.customer_notes}</p>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-500 block">الأصناف المطلوبة ({order.order_items?.length || 0}):</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(order.order_items || []).map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.description}</span>
                  {item.quantity ? (
                    <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-[#FA3802] font-black text-[11px]">
                      × {item.quantity}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat History Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>💬</span>
              <span>سجل محادثة الطلب</span>
            </h2>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {messages.length} رسائل
            </span>
          </div>

          {messages.length > 0 ? (
            <div className="space-y-2.5 max-h-96 overflow-y-auto p-1 scrollbar-thin">
              {messages.map((m: any) => {
                const isCustomer = m.sender?.role === 'customer';
                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                      isCustomer
                        ? 'bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100/50'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <b className="text-slate-800 dark:text-slate-200">
                        {m.sender?.full_name || 'مستخدم'} {m.sender?.role ? `(${m.sender.role})` : ''}
                      </b>
                      <span className="text-[10px] text-slate-400">
                        {m.created_at ? new Date(m.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {m.message_text || m.content}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-400">
              لا توجد رسائل مسجلة في محادثة هذا الطلب حتى الآن.
            </div>
          )}
        </div>

        {/* Customer Previous Orders */}
        {customerPreviousOrders.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>🕒</span>
              <span>طلبات العميل السابقة ({customerPreviousOrders.length})</span>
            </h2>

            <div className="space-y-2">
              {customerPreviousOrders.map((prevOrder: any) => (
                <Link
                  key={prevOrder.id}
                  href={`/admin/orders/${prevOrder.id}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors text-xs font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#FA3802] font-black">#{prevOrder.id.slice(0, 8)}</span>
                    <span className="text-slate-500 truncate max-w-[200px]">{prevOrder.dropoff_address || 'توصيل'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700 dark:text-slate-300">{prevOrder.delivery_fee} ج.م</span>
                    <span className="text-slate-400">←</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
