import { getCurrentUser } from '@/lib/services/auth';
import { getAdminOrderDetail } from '@/lib/services/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader, Card, OrderStatusBadge } from '@/components';

export const dynamic = 'force-dynamic';

interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const { id: orderId } = await params;
  const detail = await getAdminOrderDetail(orderId);

  if (!detail || !detail.order) {
    notFound();
  }

  const { order, messages, customerPreviousOrders } = detail;

  return (
    <AppShell
      header={
        <PageHeader
          title={`تفاصيل الطلب #${order.id.slice(0, 8)}`}
          titleEn="Order Review & Chat History"
          subtitle={`تاريخ الطلب: ${new Date(order.created_at).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}`}
          backHref="/admin/orders"
        />
      }
    >
      <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 space-y-5 font-sans">
        
        {/* Order Status & Key Overview */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400">حالة الطلب الحالية</span>
            <div className="mt-1 flex items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <span className="text-xs text-slate-500">
                كود الطلب الكامل: <code className="bg-gray-100 px-2 py-0.5 rounded text-[11px] select-all">{order.id}</code>
              </span>
            </div>
          </div>

          <div className="text-left">
            <span className="text-xs font-bold text-slate-400">رسوم التوصيل</span>
            <p className="text-2xl font-black text-[#FA3802] mt-0.5">
              {order.delivery_fee} <span className="text-xs font-bold text-slate-600">جنيه مصري</span>
            </p>
          </div>
        </div>

        {/* Customer & Driver Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Customer Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>👤</span>
                <span>بيانات العميل</span>
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-[#FA3802] font-bold">
                طلب سريع
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-slate-500 font-medium">الاسم:</span>
                <span className="font-bold text-slate-900">{order.customer?.full_name || 'عميل إنجز'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-slate-500 font-medium">رقم الهاتف:</span>
                <span className="font-extrabold text-slate-900 dir-ltr text-sm">{order.customer?.phone}</span>
              </div>
              {order.customer?.phone && (
                <div className="pt-2">
                  <Link
                    href={`/admin/orders?search=${encodeURIComponent(order.customer.phone)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FA3802] hover:underline"
                  >
                    <span>🔍 استعراض كافة طلبات هذا الرقم ({customerPreviousOrders.length + 1} طلب)</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Driver Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>🛵</span>
                <span>بيانات الطيار المسؤول</span>
              </h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${order.driver ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {order.driver ? 'تم القبول' : 'قيد الانتظار'}
              </span>
            </div>

            {order.driver ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-slate-500 font-medium">اسم الطيار:</span>
                  <span className="font-bold text-slate-900">{order.driver.user?.full_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-slate-500 font-medium">رقم الهاتف:</span>
                  <span className="font-bold text-slate-900 dir-ltr">{order.driver.user?.phone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">رصيد عمولة الطيار:</span>
                  <span className="font-bold text-slate-800">{order.driver.commission_balance} ج.م</span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                لم يقبل أي طيار هذا الطلب حتى الآن
              </div>
            )}
          </div>
        </div>

        {/* Delivery Address & Notes */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <span>📍</span>
            <span>عنوان التوصيل</span>
          </h2>

          <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 text-xs space-y-2">
            <p className="font-bold text-slate-900 text-sm">{order.dropoff_address}</p>
            {order.dropoff_lat && order.dropoff_lng && (
              <p className="text-slate-500 flex items-center gap-2">
                <span>الإحداثيات: {order.dropoff_lat}, {order.dropoff_lng}</span>
                <a
                  href={`https://maps.google.com/?q=${order.dropoff_lat},${order.dropoff_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FA3802] font-bold underline"
                >
                  فتح في خرائط Google ↗
                </a>
              </p>
            )}
          </div>

          {order.customer_notes && (
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
              <span className="font-bold text-slate-700 block mb-1">ملاحظات العميل للطيار:</span>
              <p className="text-slate-600">{order.customer_notes}</p>
            </div>
          )}
        </div>

        {/* Order Items Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <span>🛒</span>
            <span>قائمة الأصناف المطلوبة ({order.order_items?.length || 0} صنف)</span>
          </h2>

          <div className="space-y-2">
            {order.order_items?.map((item: any, idx: number) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FA3802] font-black text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">{item.description}</span>
                    {item.notes && <p className="text-[11px] text-slate-400 mt-0.5">{item.notes}</p>}
                  </div>
                </div>
                <span className="font-black text-[#FA3802] bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
                  ×{item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 48-Hour Chat Log Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>💬</span>
                <span>سجل المحادثة بين العميل والطيار</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تظل المحادثة متاحة للمراجعة لمدة 48 ساعة من تاريخ إنشائها
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-slate-700 font-bold">
              {messages.length} رسالة
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              لا توجد رسائل مسجلة في شات هذا الطلب حتى الآن.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto p-2 bg-gray-50/50 rounded-2xl border border-gray-100">
              {messages.map((msg: any) => {
                const isCustomer = msg.sender?.role === 'customer' || msg.sender_id === order.customer_id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-500">
                        {isCustomer ? '👤 العميل' : '🛵 الطيار'}: {msg.sender?.full_name || 'مستخدم'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.created_at).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl max-w-sm text-xs font-medium ${
                        isCustomer
                          ? 'bg-white border border-gray-200 text-slate-800 rounded-tr-none shadow-2xs'
                          : 'bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white rounded-tl-none shadow-xs'
                      }`}
                    >
                      {msg.message_text}
                      {msg.image_url && (
                        <div className="mt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.image_url}
                            alt="صورة مرفقة"
                            className="max-h-48 rounded-xl object-contain border border-black/10"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer Previous Orders History */}
        {customerPreviousOrders.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <span>📋</span>
              <span>طلبات سابقة أخرى لنفس رقم هذا العميل ({customerPreviousOrders.length} طلب)</span>
            </h2>

            <div className="space-y-2">
              {customerPreviousOrders.map((prev: any) => (
                <Link
                  key={prev.id}
                  href={`/admin/orders/${prev.id}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-orange-50/50 border border-gray-100 transition-colors text-xs group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 group-hover:text-[#FA3802]">#{prev.id.slice(0, 8)}</span>
                    <span className="text-slate-400">
                      {new Date(prev.created_at).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 font-bold">{prev.delivery_fee} ج.م</span>
                    <OrderStatusBadge status={prev.status} />
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
