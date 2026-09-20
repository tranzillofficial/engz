'use client';

import { useTransition, useState } from 'react';
import { acceptOrderAction } from '@/lib/actions/drivers';
import { Card, Button, Alert } from '@/components';

interface AvailableOrdersListProps {
  orders: any[];
  isDriverBlocked: boolean;
  isDriverOnline: boolean;
  isDriverBusy: boolean;
}

export function AvailableOrdersList({
  orders,
  isDriverBlocked,
  isDriverOnline,
  isDriverBusy,
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

  if (!isDriverOnline && isDriverBusy) {
    return (
      <div className="p-6 text-center bg-amber-50 rounded-3xl border border-amber-200">
        <span className="text-3xl block mb-2">🚴</span>
        <h3 className="font-black text-sm text-amber-900">أنت في رحلة حالياً</h3>
        <p className="text-xs text-amber-700 mt-1">أكمل الرحلة الحالية أولاً لاستقبال طلب جديد.</p>
      </div>
    );
  }

  if (!isDriverOnline) {
    return (
      <div className="p-7 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <span className="text-3xl block mb-2">🌙</span>
        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">أنت غير متصل</h3>
        <p className="text-xs text-slate-500 mt-1">فعّل وضع الاتصال (Online) لاستقبال الطلبات القريبة.</p>
      </div>
    );
  }

  if (isDriverBlocked) {
    return (
      <div className="p-7 text-center bg-rose-50 rounded-3xl border border-rose-200">
        <span className="text-3xl block mb-2">🚫</span>
        <h3 className="font-black text-sm text-rose-900">استقبال الطلبات متوقف</h3>
        <p className="text-xs text-rose-700 mt-1">سدد مستحقات العمولات من المحفظة لإعادة تفعيل حسابك فوراً.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans">
      {errorMsg && <Alert type="error">{errorMsg}</Alert>}
      <div className="flex items-end justify-between px-1">
        <div>
          <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">طلبات متاحة قريبة</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">اختر الطلب المناسب وابدأ التوصيل فوراً</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/30 text-[#FA3802] border border-orange-100 dark:border-orange-900/50 text-[11px] font-black">
          {orders.length} متاح
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-3xl block mb-2">🔎</span>
          <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">لا توجد طلبات متاحة حالياً</h3>
          <p className="text-xs text-slate-500 mt-1">أبقِ حسابك متصلاً وستصلك الطلبات فور تسجيل العملاء.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const busy = isPending && acceptingId === order.id;
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-slate-400">طلب #{order.id.slice(0, 8)}</span>
                    <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                      {order.customer?.full_name || 'عميل إنجز'}
                    </h4>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-lg font-black text-[#FA3802]">
                      {order.delivery_fee} <span className="text-xs font-bold text-slate-500">ج.م</span>
                    </span>
                    {order.distanceToPickupKm !== undefined && (
                      <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                        يبعد {order.distanceToPickupKm.toFixed(1)} كم
                      </span>
                    )}
                  </div>
                </div>

                {/* Items preview */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400">محتويات الطلب</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-5">
                    {order.order_items?.map((it: any) => `${it.quantity ? `${it.quantity}× ` : ''}${it.description}`).join(' • ') || 'أصناف متنوعة'}
                  </p>
                </div>

                {/* Delivery destination */}
                <div className="p-3 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100/60 dark:border-orange-900/30 flex items-start gap-2.5 text-xs">
                  <span className="text-base mt-0.5">📍</span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#FA3802] block">عنوان التوصيل</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                      {order.dropoff_address}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full font-black shadow-md shadow-orange-500/15"
                  onClick={() => handleAccept(order.id)}
                  disabled={busy || isPending}
                >
                  {busy ? 'جاري قبول الطلب...' : 'قبول الطلب والبدء 🚴'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
