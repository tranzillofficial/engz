'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppShell, PageHeader, OrderStatusBadge, Button } from '@/components';
import { cancelOrderAction } from '@/lib/actions/orders';
import { ChatPanel } from '@/components/chat/ChatPanel';
import DeliveryRatingCard from '@/components/orders/DeliveryRatingCard';
import GuestAccountConversionCard from '@/components/orders/GuestAccountConversionCard';

interface CustomerOrderTrackerClientProps {
  initialOrder: any;
  user: any;
  isGuestAuthorized: boolean;
  guestPhone?: string;
  mapsApiKey?: string;
}

function playCelebrationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(523.25, now, 0.2); // C5
    playTone(659.25, now + 0.15, 0.2); // E5
    playTone(783.99, now + 0.3, 0.2); // G5
    playTone(1046.5, now + 0.45, 0.5); // C6
  } catch {}
}

function formatOrderNumber(n: number | null | undefined) {
  if (!n) return null;
  return `#${String(n).padStart(5, '0')}`;
}

export function CustomerOrderTrackerClient({
  initialOrder,
  user,
  isGuestAuthorized,
  guestPhone,
  mapsApiKey,
}: CustomerOrderTrackerClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [isCancelling, startCancelTransition] = useTransition();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [statusAlert, setStatusAlert] = useState<string | null>(null);

  // Realtime Supabase subscription for instant live tracking
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-tracker-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        async (payload) => {
          const updated = payload.new as any;
          setOrder((prev: any) => ({
            ...prev,
            status: updated.status,
            driver_id: updated.driver_id,
            delivered_at: updated.delivered_at,
            cancelled_at: updated.cancelled_at,
          }));

          // If driver accepted
          if (updated.status === 'accepted' && order.status === 'pending') {
            playCelebrationSound();
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);
            setStatusAlert('🎉 تم قبول طلبك! الطيار في طريقه إليك الآن');
          } else if (updated.status === 'in_progress') {
            setStatusAlert('📦 الطيار اشترى الأصناف وهو في الطريق إلى عنوانك');
          } else if (updated.status === 'delivered') {
            playCelebrationSound();
            setStatusAlert('✅ تم تسليم الطلب بنجاح');
          }

          // Fetch fresh server data including driver details
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, order.status, router]);

  // Sync if initialOrder changes via server revalidation
  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  const handleCancel = () => {
    if (order.status !== 'pending') {
      setCancelError('لا يمكن إلغاء الطلب بعد قبوله وبدء تنفيذه من قبل الطيار');
      return;
    }

    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;

    setCancelError(null);
    startCancelTransition(async () => {
      const res = await cancelOrderAction(order.id, 'إلغاء من قبل العميل');
      if (res?.error) {
        setCancelError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  const isChatEnabled =
    order.status === 'accepted' || order.status === 'in_progress' || order.status === 'delivered';
  const isChatReadOnly = order.status === 'delivered';
  const currentChatUserId = user ? user.id : order.customer_id;

  const hasDropoffCoords =
    order.dropoff_lat &&
    order.dropoff_lng &&
    Math.abs(order.dropoff_lat) > 0.001 &&
    Math.abs(order.dropoff_lng) > 0.001;

  const mapsEmbedUrl =
    hasDropoffCoords && mapsApiKey
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${order.dropoff_lat},${order.dropoff_lng}&zoom=15`
      : hasDropoffCoords
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${order.dropoff_lng - 0.005},${order.dropoff_lat - 0.005},${order.dropoff_lng + 0.005},${order.dropoff_lat + 0.005}&layer=mapnik&marker=${order.dropoff_lat},${order.dropoff_lng}`
      : null;

  const orderNumDisplay = formatOrderNumber(order.order_number);

  return (
    <AppShell
      header={
        <PageHeader
          title={orderNumDisplay ? `متابعة الطلب ${orderNumDisplay}` : `طلب #${order.id.slice(0, 8)}`}
          titleEn="Live Delivery Radar"
          backHref="/"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 sm:py-4 space-y-4 pb-28 font-sans">
        {/* Live Notification Banner */}
        {statusAlert && (
          <div className="p-3.5 bg-emerald-500 text-white rounded-2xl text-xs font-black flex items-center justify-between animate-bounce shadow-md">
            <span>{statusAlert}</span>
            <button
              onClick={() => setStatusAlert(null)}
              className="text-white/80 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {cancelError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold">
            ⚠️ {cancelError}
          </div>
        )}

        {/* 1. TOP RADAR / ORDER STATUS CARD */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-[#FA3802] font-black text-sm flex items-center justify-center">
                #{order.id.slice(0, 8)}
              </span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">حالة الطلب</span>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {orderNumDisplay || `#${order.id.slice(0, 8)}`}
                </p>
              </div>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Radar Animation / Status Message */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-center space-y-2">
            {order.status === 'pending' && (
              <div className="space-y-2">
                <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-orange-400/20 animate-ping" />
                  <div className="w-10 h-10 rounded-full bg-[#FA3802] text-white flex items-center justify-center text-lg shadow-md">
                    📡
                  </div>
                </div>
                <p className="text-xs font-black text-[#FA3802]">
                  رادار البحث نشط — جاري مطابقة أقرب طيار متاح في منطقتك
                </p>
                <p className="text-[11px] text-slate-500">
                  تم إرسال إشعار فوري لجميع الطيارين القريبين للتأكيد والاستلام.
                </p>
              </div>
            )}

            {order.status === 'accepted' && (
              <div className="space-y-1">
                <span className="text-3xl block animate-bounce">🚴</span>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  تم قبول طلبك بنجاح! الطيار في طريقه الآن لبدء التنفيذ.
                </p>
              </div>
            )}

            {order.status === 'in_progress' && (
              <div className="space-y-1">
                <span className="text-3xl block">📦</span>
                <p className="text-xs font-black text-blue-600 dark:text-blue-400">
                  الطلب قيد التوصيل — الطيار متوجه لعنوانك الآن.
                </p>
              </div>
            )}

            {order.status === 'delivered' && (
              <div className="space-y-1">
                <span className="text-3xl block">✅</span>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  تم تسليم الطلب بنجاح! شكراً لاستخدامك إنجز.
                </p>
              </div>
            )}

            {order.status === 'cancelled' && (
              <div className="space-y-1">
                <span className="text-3xl block">❌</span>
                <p className="text-xs font-black text-rose-600">تم إلغاء هذا الطلب.</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. DRIVER INFO (If Assigned) */}
        {order.driver && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950 p-5 shadow-sm space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400">الطيار المسؤول عن رحلتك</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                طيار معتمد ✓
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-lg font-black">
                  🛵
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {order.driver.user?.full_name || 'كابتن إنجز'}
                  </h4>
                  <p className="text-[11px] text-slate-400">كابتن التوصيل</p>
                </div>
              </div>

              {order.driver.user?.phone ? (
                <a
                  href={`tel:${order.driver.user.phone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <span>اتصال</span>
                  <span>📞</span>
                </a>
              ) : null}
            </div>
          </div>
        )}

        {/* 3. ORDER ITEMS SUMMARY */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>🛒</span>
              <span>محتويات الطلب ({order.order_items?.length || 0})</span>
            </h3>
          </div>

          <div className="space-y-2">
            {order.order_items?.map((item: any, idx: number) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-[#FA3802] text-[10px] font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {item.description}
                  </span>
                </div>
                {item.quantity && item.quantity > 1 ? (
                  <span className="px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-[#FA3802] font-black text-[11px]">
                    ×{item.quantity}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* 4. DELIVERY ADDRESS & MAP */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span>📍</span>
            <span>عنوان واستلام التوصيل</span>
          </h3>

          <div className="p-3 bg-orange-50/60 dark:bg-orange-950/20 rounded-2xl border border-orange-100/60 dark:border-orange-900/30 text-xs">
            <span className="text-[10px] font-bold text-[#FA3802] block mb-0.5">مكان التسليم:</span>
            <p className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
              {order.dropoff_address}
            </p>
          </div>

          {order.customer_notes && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400">
              <b>ملاحظاتك:</b> {order.customer_notes}
            </div>
          )}

          {mapsEmbedUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
              <iframe
                src={mapsEmbedUrl}
                width="100%"
                height="160"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="موقع التوصيل"
              />
            </div>
          )}
        </div>

        {/* 5. DELIVERY FEE SUMMARY */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold">رسوم التوصيل</span>
            <span className="text-xl font-black text-[#FA3802]">
              {order.delivery_fee} <span className="text-xs font-bold text-slate-600">ج.م</span>
            </span>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-bold">
            دفع نقدي عند الاستلام 💵
          </span>
        </div>

        {/* 6. RATING (If Delivered) */}
        {order.status === 'delivered' && (
          <DeliveryRatingCard
            orderId={order.id}
            existingRating={order.customer_rating}
            existingReview={order.customer_review}
          />
        )}

        {/* 7. GUEST ACCOUNT CONVERSION (Compact) */}
        {(!user || isGuestAuthorized) && (
          <GuestAccountConversionCard phone={guestPhone ?? order.customer?.phone ?? undefined} />
        )}

        {/* 8. CANCEL BUTTON — STRICTLY ONLY WHEN STATUS IS PENDING */}
        {order.status === 'pending' && (
          <div className="pt-2">
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={isCancelling}
              onClick={handleCancel}
              className="w-full rounded-2xl h-11 text-xs font-black shadow-xs"
              id="cancel-order-btn"
            >
              {isCancelling ? 'جاري الإلغاء...' : 'إلغاء الطلب 🚫'}
            </Button>
            <p className="text-[10px] text-slate-400 text-center mt-1">
              يمكنك إلغاء الطلب مجاناً فقط قبل أن يقبله الطيار
            </p>
          </div>
        )}

        {/* Live Chat Panel */}
        <ChatPanel
          orderId={order.id}
          currentUserId={currentChatUserId}
          isEnabled={isChatEnabled}
          readOnly={isChatReadOnly}
        />
      </div>
    </AppShell>
  );
}
