'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatusByDriverAction } from '@/lib/actions/drivers';
import { AppShell, PageHeader, Card, OrderStatusBadge, Button, Alert } from '@/components';
import Link from 'next/link';
import { ChatPanel } from '@/components/chat/ChatPanel';

interface DriverOrderExecutionClientProps {
  order: any;
  driverId: string;
}

export function DriverOrderExecutionClient({ order, driverId }: DriverOrderExecutionClientProps) {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStatusChange = (nextStatus: 'in_progress' | 'delivered') => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateOrderStatusByDriverAction(order.id, nextStatus);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setCurrentStatus(nextStatus);
      }
    });
  };

  return (
    <AppShell
      header={
        <PageHeader
          title={`تنفيذ طلب #${order.id.slice(0, 8)}`}
          titleEn="Trip Execution"
          backHref="/driver/orders"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 space-y-4">
        {errorMsg && <Alert type="error">{errorMsg}</Alert>}

        {/* Current status alert */}
        <Card className="p-4 bg-gradient-to-r from-gray-900 to-indigo-950 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">حالة الرحلة الحالية:</span>
            <OrderStatusBadge status={currentStatus} />
          </div>

          <div className="text-center py-2">
            {currentStatus === 'accepted' && (
              <p className="text-sm font-semibold text-amber-300">
                🚀 توجه إلى مكان الاستلام لشراء واستلام الأصناف!
              </p>
            )}
            {currentStatus === 'in_progress' && (
              <p className="text-sm font-semibold text-emerald-300">
                🚴 الأصناف معك الآن، توجه إلى عنوان العميل لتسليمها!
              </p>
            )}
            {currentStatus === 'delivered' && (
              <p className="text-sm font-semibold text-emerald-400">
                🎉 تم تسليم الطلب وإضافة العمولة المستحقة إلى محفظتك بنجاح!
              </p>
            )}
          </div>
        </Card>

        {/* Customer Contact */}
        <Card className="p-4">
          <h3 className="text-xs font-bold text-gray-400 mb-2">بيانات العميل 👤</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-gray-100">
                {order.customer?.full_name}
              </div>
              <div className="text-xs text-gray-500">
                {order.customer?.phone ? (
                  <a href={`tel:${order.customer.phone}`} className="text-indigo-600 underline font-semibold">
                    📞 {order.customer.phone}
                  </a>
                ) : (
                  'لا يوجد رقم مسجل'
                )}
              </div>
            </div>
            {order.customer?.phone && (
              <a
                href={`https://wa.me/2${order.customer.phone.replace(/^0+/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline text-emerald-600 border-emerald-300"
              >
                واتساب 💬
              </a>
            )}
          </div>
        </Card>

        {/* Order Items to buy */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
            الأصناف المطلوب شراؤها ({order.order_items?.length || 0}) 🛒
          </h3>
          <div className="space-y-2">
            {order.order_items?.map((item: any, idx: number) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg text-xs flex items-start justify-between"
              >
                <div>
                  <div className="font-bold text-gray-900 dark:text-gray-100">
                    {idx + 1}. {item.description}
                  </div>
                  {item.notes && (
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      ملاحظة: {item.notes}
                    </p>
                  )}
                </div>
                <span className="font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded">
                  {item.quantity}x
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Route Details */}
        <Card className="p-4 space-y-2 text-xs">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            العناوين ومسار التوصيل 📍
          </h3>

          <div className="flex items-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">الاستلام من:</span>
              <p className="text-gray-600 dark:text-gray-400 mt-0.5">{order.pickup_address}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">التسليم إلى:</span>
              <p className="text-gray-600 dark:text-gray-400 mt-0.5">{order.dropoff_address}</p>
            </div>
          </div>

          {order.customer_notes && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-lg mt-2 text-[11px]">
              <span className="font-bold">ملاحظات العميل: </span>
              {order.customer_notes}
            </div>
          )}
          {/* Google Maps Deep Links for Navigation */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${order.pickup_lat},${order.pickup_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-800 text-center text-xs font-bold transition-colors"
            >
              ملاحة الاستلام 🗺️
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${order.dropoff_lat},${order.dropoff_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FA3802] text-center text-xs font-bold transition-colors"
            >
              ملاحة التسليم 🗺️
            </a>
          </div>
        </Card>

        {/* Delivery Fee */}
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block">قيمة رسوم التوصيل المحصلة</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {order.delivery_fee} جنيه
            </span>
          </div>
          <span className="text-xs text-gray-400">تحصيل نقدي عند التسليم</span>
        </Card>

        {/* Transition Action Buttons */}
        <div className="pt-2 pb-6 space-y-2">
          {currentStatus === 'accepted' && (
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-lg"
              disabled={isPending}
              onClick={() => handleStatusChange('in_progress')}
            >
              {isPending ? 'جاري التحديث...' : 'تم الاستلام والشراء ← بدء التوصيل 📦'}
            </Button>
          )}

          {currentStatus === 'in_progress' && (
            <Button
              type="button"
              variant="success"
              size="lg"
              className="w-full font-bold shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isPending}
              onClick={() => handleStatusChange('delivered')}
            >
              {isPending ? 'جاري تأكيد التسليم...' : 'تم تسليم الطلب وتحصيل الحساب بنجاح ✅'}
            </Button>
          )}

          {currentStatus === 'delivered' && (
            <Link href="/driver/orders" className="btn btn-outline btn-md w-full block text-center">
              العودة لقائمة الرحلات
            </Link>
          )}
        </div>

        {/* Real-Time Chat with Customer (with location request & view) */}
        <ChatPanel
          orderId={order.id}
          currentUserId={driverId}
          isEnabled={currentStatus === 'accepted' || currentStatus === 'in_progress'}
        />
      </div>
    </AppShell>
  );
}
