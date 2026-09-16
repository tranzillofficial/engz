'use client';

import { useTransition, useState } from 'react';
import { acceptOrderAction } from '@/lib/actions/drivers';
import { Card, Button, Alert } from '@/components';

interface AvailableOrdersListProps { orders: any[]; isDriverBlocked: boolean; isDriverOnline: boolean; isDriverBusy: boolean; }

export function AvailableOrdersList({ orders, isDriverBlocked, isDriverOnline, isDriverBusy }: AvailableOrdersListProps) {
  const [isPending, startTransition] = useTransition();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAccept = (orderId: string) => {
    setErrorMsg(null);
    setAcceptingId(orderId);
    startTransition(async () => {
      const res = await acceptOrderAction(orderId);
      if (res?.error) { setErrorMsg(res.error); setAcceptingId(null); }
    });
  };

  if (!isDriverOnline && isDriverBusy) return <div className="p-6 text-center bg-amber-50 rounded-3xl border border-amber-200"><span className="text-3xl block mb-2">🚴</span><h3 className="font-black text-sm text-amber-900">أنت في رحلة حالياً</h3><p className="text-xs text-amber-700 mt-1">أكمل الرحلة الحالية أولاً لاستقبال طلب جديد.</p></div>;
  if (!isDriverOnline) return <div className="p-7 text-center bg-white rounded-3xl border border-gray-100 shadow-sm"><span className="text-3xl block mb-2">🌙</span><h3 className="font-black text-sm text-slate-900">أنت غير متصل</h3><p className="text-xs text-slate-500 mt-1">فعّل Online من الأعلى ليظهر لك الطلبات القريبة.</p></div>;
  if (isDriverBlocked) return <div className="p-7 text-center bg-rose-50 rounded-3xl border border-rose-200"><span className="text-3xl block mb-2">🚫</span><h3 className="font-black text-sm text-rose-900">استقبال الطلبات متوقف</h3><p className="text-xs text-rose-700 mt-1">سدد مستحقات العمولات لإعادة تفعيل حسابك.</p></div>;

  return (
    <div className="space-y-3">
      {errorMsg && <Alert type="error">{errorMsg}</Alert>}
      <div className="flex items-end justify-between px-1"><div><h3 className="font-black text-sm text-slate-900">طلبات قريبة منك</h3><p className="text-[11px] text-slate-400 mt-0.5">اقبل الطلب المناسب وابدأ الرحلة فوراً</p></div><span className="px-2.5 py-1 rounded-full bg-orange-50 text-[#FA3802] border border-orange-100 text-[11px] font-black">{orders.length} متاح</span></div>

      {orders.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm"><span className="text-3xl block mb-2">🔎</span><h3 className="font-black text-sm text-slate-900">مفيش طلبات متاحة دلوقتي</h3><p className="text-xs text-slate-500 mt-1">خليك Online وهتظهر الطلبات الجديدة هنا تلقائياً.</p></div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const busy = isPending && acceptingId === order.id;
            return (
              <Card key={order.id} className="p-0 overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><span className="text-[10px] font-black text-slate-400">طلب #{order.id.slice(0, 8)}</span><h4 className="font-black text-sm text-slate-900 mt-1">{order.customer?.full_name || 'عميل ENgz'}</h4></div>
                    <div className="text-left shrink-0"><span className="text-lg font-black text-emerald-600">{order.delivery_fee} <span className="text-xs">ج.م</span></span>{order.distanceToPickupKm !== undefined && <span className="block text-[10px] text-slate-400 mt-0.5">{order.distanceToPickupKm.toFixed(1)} كم منك</span>}</div>
                  </div>

                  <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100"><p className="text-[10px] font-black text-slate-400 mb-1">الأصناف</p><p className="text-xs font-bold text-slate-700 leading-5 line-clamp-2">{order.order_items?.map((it: any) => `${it.quantity}× ${it.description}`).join(' • ') || 'أصناف متنوعة'}</p></div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-start gap-2 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"/><div className="min-w-0"><span className="text-[10px] font-bold text-slate-400">الاستلام</span><p className="font-semibold text-slate-700 truncate">{order.pickup_address}</p></div></div>
                    <div className="flex items-start gap-2 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-[#FA3802] mt-1 shrink-0"/><div className="min-w-0"><span className="text-[10px] font-bold text-slate-400">التسليم</span><p className="font-semibold text-slate-700 truncate">{order.dropoff_address}</p></div></div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 p-3 rounded-2xl bg-orange-50 border border-orange-100"><span className="text-lg">💰</span><div><p className="text-[10px] text-orange-700 font-bold">أجرك على الرحلة</p><p className="text-xs font-black text-[#FA3802]">{order.delivery_fee} جنيه قبل أي مستحقات عمولة</p></div></div>

                  <Button type="button" variant="primary" size="md" className="w-full mt-4 font-black shadow-md shadow-orange-500/15 focus-visible:ring-2 focus-visible:ring-[#FA3802]/40" onClick={() => handleAccept(order.id)} disabled={busy || isPending}>{busy ? 'جاري حجز الطلب لك...' : 'قبول الطلب والبدء 🚴'}</Button>
                  <p className="text-[10px] text-center text-slate-400 mt-2">بمجرد القبول، يختفي الطلب من قائمة الطيارين الآخرين.</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
