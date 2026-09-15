'use client';

import { useTransition, useState } from 'react';
import { acceptOrderAction } from '@/lib/actions/drivers';
import { Card, Button, Alert } from '@/components';
import Link from 'next/link';

interface AvailableOrdersListProps {
  orders: any[];
  isDriverBlocked: boolean;
  isDriverOnline: boolean;
}

export function AvailableOrdersList({
  orders,
  isDriverBlocked,
  isDriverOnline,
}: AvailableOrdersListProps) {
  const [isPending, startTransition] = useTransition();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAccept = (orderId: string) => {
    setErrorMsg(null);
    setAcceptingId(orderId);

    startTransition(async () => {
      const res = await acceptOrderAction(orderId);
      if (res?.error) {
        setErrorMsg(res.error);
        setAcceptingId(null);
      }
    });
  };

  if (!isDriverOnline) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        <span className="text-3xl block mb-2">😴</span>
        <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">أنت حالياً غير متصل</h3>
        <p className="text-xs text-gray-500 mt-1">
          قم بالضغط على &quot;ابدأ العمل Online&quot; بالأعلى لظهور الطلبات القريبة منك وقبولها فوراً.
        </p>
      </div>
    );
  }

  if (isDriverBlocked) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800">
        <span className="text-3xl block mb-2">🚫</span>
        <h3 className="font-bold text-sm text-red-800 dark:text-red-300">تم إيقاف استقبال الطلبات</h3>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          حسابك موقوف لتجاوز حد العمولات. سدد مستحقاتك لاستئناف استقبال وتوصيل الطلبات.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMsg && <Alert type="error">{errorMsg}</Alert>}

      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
          <span>الطلبات المتاحة للتوصيل</span>
          <span className="badge badge-primary">{orders.length}</span>
        </h3>
        <span className="text-xs text-gray-400">تحديث لحظي</span>
      </div>

      {orders.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/40 rounded-2xl">
          <span className="text-3xl block mb-2">🔍</span>
          <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">لا توجد طلبات جديدة حالياً</h3>
          <p className="text-xs text-gray-500 mt-1">
            أول ما عميل يعمل طلب جديد في نطاقك هيظهرلك هنا فوراً!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isThisPending = isPending && acceptingId === order.id;

            return (
              <Card key={order.id} className="p-4 border-2 border-indigo-50 dark:border-gray-800 hover:border-indigo-300 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-gray-400">طلب #{order.id.slice(0, 8)}</span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                      {order.customer?.full_name || 'عميل إنجز'}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {order.delivery_fee} ج.م
                    </span>
                    {order.distanceToPickupKm !== undefined && (
                      <span className="block text-[11px] text-gray-400">
                        يبعد عنك: {order.distanceToPickupKm.toFixed(1)} كم
                      </span>
                    )}
                  </div>
                </div>

                {/* Items Summary */}
                <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-lg text-xs mb-3 space-y-1">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">الأصناف:</div>
                  <div className="text-gray-600 dark:text-gray-400 line-clamp-2">
                    {order.order_items?.map((it: any) => `${it.quantity}x ${it.description}`).join(' • ') || 'أصناف متنوعة'}
                  </div>
                </div>

                {/* Locations */}
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-medium text-gray-500">استلام:</span>
                    <span className="truncate">{order.pickup_address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <span className="font-medium text-gray-500">تسليم:</span>
                    <span className="truncate">{order.dropoff_address}</span>
                  </div>
                </div>

                {/* Action button */}
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full font-bold shadow-md"
                  onClick={() => handleAccept(order.id)}
                  disabled={isThisPending || isPending}
                >
                  {isThisPending ? 'جاري القبول والحجز...' : 'قبول وتنفيذ الطلب 🚴'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
