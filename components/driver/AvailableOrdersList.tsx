'use client';

import { useTransition, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { acceptOrderAction } from '@/lib/actions/drivers';
import { createClient } from '@/lib/supabase/client';
import { Button, Alert } from '@/components';

interface AvailableOrdersListProps {
  orders: any[];
  isDriverBlocked: boolean;
  isDriverOnline: boolean;
  isDriverBusy: boolean;
}

// Synthesizes a pleasant double-chime notification sound using Web Audio API
function playOrderAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(659.25, now, 0.25); // E5
    playTone(880, now + 0.15, 0.4); // A5
    playTone(1046.5, now + 0.3, 0.6); // C6
  } catch {}
}

export function AvailableOrdersList({
  orders,
  isDriverBlocked,
  isDriverOnline,
  isDriverBusy,
}: AvailableOrdersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newOrderBadge, setNewOrderBadge] = useState(false);
  const prevCountRef = useRef(orders.length);

  // Realtime subscription for incoming orders
  useEffect(() => {
    if (!isDriverOnline || isDriverBusy || isDriverBlocked) return;

    const supabase = createClient();
    const channel = supabase
      .channel('driver-available-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          // Play sound and refresh when order is created or updated
          playOrderAlertSound();
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          setNewOrderBadge(true);
          router.refresh();
          setTimeout(() => setNewOrderBadge(false), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDriverOnline, isDriverBusy, isDriverBlocked, router]);

  // Audio trigger if orders list grew
  useEffect(() => {
    if (orders.length > prevCountRef.current && isDriverOnline) {
      playOrderAlertSound();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    prevCountRef.current = orders.length;
  }, [orders.length, isDriverOnline]);

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
      <div className="p-6 text-center bg-amber-50 dark:bg-amber-950/30 rounded-3xl border border-amber-200 dark:border-amber-900/50">
        <span className="text-3xl block mb-2">🚴</span>
        <h3 className="font-black text-sm text-amber-900 dark:text-amber-200">أنت في رحلة حالياً</h3>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
          أكمل الرحلة الحالية أولاً لاستقبال طلب جديد.
        </p>
      </div>
    );
  }

  if (!isDriverOnline) {
    return (
      <div className="p-7 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <span className="text-3xl block mb-2">🌙</span>
        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">أنت غير متصل</h3>
        <p className="text-xs text-slate-500 mt-1">فعّل وضع الاتصال (Online) بالأعلى لاستقبال الطلبات القريبة فوراً.</p>
      </div>
    );
  }

  if (isDriverBlocked) {
    return (
      <div className="p-7 text-center bg-rose-50 dark:bg-rose-950/30 rounded-3xl border border-rose-200 dark:border-rose-900/50">
        <span className="text-3xl block mb-2">🚫</span>
        <h3 className="font-black text-sm text-rose-900 dark:text-rose-200">استقبال الطلبات متوقف</h3>
        <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
          سدد مستحقات العمولات من المحفظة لإعادة تفعيل حسابك فوراً.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans">
      {errorMsg && <Alert type="error">{errorMsg}</Alert>}

      {newOrderBadge && (
        <div className="p-3 bg-emerald-500 text-white rounded-2xl text-xs font-black flex items-center justify-between animate-bounce shadow-md">
          <span>🔔 وصلك إشعار بطلب جديد الآن!</span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">تحديث فوري</span>
        </div>
      )}

      <div className="flex items-end justify-between px-1">
        <div>
          <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>طلبات متاحة قريبة</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h3>
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
          <p className="text-xs text-slate-500 mt-1">
            أبقِ حسابك متصلاً وسيصلك إشعار فوري صوتي فور طلب أي عميل قريب.
          </p>
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
                    <span className="text-[10px] font-black text-slate-400">
                      طلب #{order.order_number || order.id.slice(0, 8)}
                    </span>
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

                {/* Detailed Items List */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span>🛒</span>
                      <span>الأصناف المطلوبة ({order.order_items?.length || 0}):</span>
                    </span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-black">
                      طلبات حرة
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {order.order_items && order.order_items.length > 0 ? (
                      order.order_items.map((it: any, idx: number) => (
                        <div
                          key={it.id || idx}
                          className="flex items-start gap-2 text-xs bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800"
                        >
                          <span className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-950/40 text-[#FA3802] text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {it.quantity && it.quantity > 1 ? (
                                <b className="text-[#FA3802] ml-1">({it.quantity}×)</b>
                              ) : null}
                              {it.description}
                            </span>
                            {it.notes && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                ملاحظة: {it.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {order.customer_notes || 'تفاصيل الأصناف مسجلة في تفاصيل الرحلة'}
                      </p>
                    )}
                  </div>
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
