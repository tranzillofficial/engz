'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatusByDriverAction } from '@/lib/actions/drivers';
import { AppShell, PageHeader, Card, OrderStatusBadge, Button, Alert } from '@/components';
import Link from 'next/link';
import { ChatPanel } from '@/components/chat/ChatPanel';

interface DriverOrderExecutionClientProps { order: any; driverId: string; }

function mapEmbed(lat: number | null | undefined, lng: number | null | undefined) {
  if (lat == null || lng == null || Math.abs(lat) < 0.001 || Math.abs(lng) < 0.001) return null;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.006},${lat - 0.006},${lng + 0.006},${lat + 0.006}&layer=mapnik&marker=${lat},${lng}`;
}

export function DriverOrderExecutionClient({ order, driverId }: DriverOrderExecutionClientProps) {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pickupMap = mapEmbed(order.pickup_lat, order.pickup_lng);
  const dropoffMap = mapEmbed(order.dropoff_lat, order.dropoff_lng);

  const handleStatusChange = (nextStatus: 'in_progress' | 'delivered') => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateOrderStatusByDriverAction(order.id, nextStatus);
      if (res?.error) setErrorMsg(res.error); else setCurrentStatus(nextStatus);
    });
  };

  return (
    <AppShell header={<PageHeader title={`تنفيذ طلب #${order.id.slice(0, 8)}`} titleEn="Trip Execution" backHref="/driver/orders" />}>
      <div className="max-w-md mx-auto py-2 px-1 sm:px-0 space-y-3 pb-8">
        {errorMsg && <Alert type="error">{errorMsg}</Alert>}

        <Card className="p-0 overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#24130e] text-white p-5">
            <div className="flex items-center justify-between gap-3"><span className="text-xs text-white/55">حالة الرحلة الحالية</span><OrderStatusBadge status={currentStatus} /></div>
            <div className="text-center py-3">{currentStatus === 'accepted' && <p className="text-sm font-black text-amber-300">🚀 توجه لمكان الاستلام وابدأ شراء الأصناف</p>}{currentStatus === 'in_progress' && <p className="text-sm font-black text-emerald-300">🚴 الأصناف معك الآن — توجه للعميل</p>}{currentStatus === 'delivered' && <p className="text-sm font-black text-emerald-300">🎉 تم التسليم وإضافة العمولة لمحفظتك</p>}</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black text-slate-400">العميل</p><h3 className="font-black text-sm text-slate-900 mt-1">{order.customer?.full_name || 'عميل ENgz'}</h3>{order.customer?.phone ? <a href={`tel:${order.customer.phone}`} className="text-xs text-[#FA3802] font-bold">📞 {order.customer.phone}</a> : <p className="text-xs text-slate-400">لا يوجد رقم مسجل</p>}</div>{order.customer?.phone && <a href={`https://wa.me/2${order.customer.phone.replace(/^0+/, '')}`} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">واتساب</a>}</div>
        </Card>

        <Card className="p-4"><h3 className="text-sm font-black text-slate-900 mb-3">الأصناف المطلوب شراؤها 🛒</h3><div className="space-y-2">{order.order_items?.map((item: any, idx: number) => <div key={item.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start justify-between"><div><div className="font-bold text-xs text-slate-900">{idx + 1}. {item.description}</div>{item.notes && <p className="text-[11px] text-slate-500 mt-0.5">ملاحظة: {item.notes}</p>}</div><span className="font-black text-[#FA3802] bg-orange-50 px-2 py-1 rounded-lg text-xs">{item.quantity}×</span></div>)}</div></Card>

        <Card className="p-4 space-y-3">
          <div><p className="text-[10px] font-black text-slate-400">المسار</p><h3 className="text-sm font-black text-slate-900 mt-1">الاستلام ثم التسليم 📍</h3></div>
          <div className="grid grid-cols-2 gap-2"><div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100"><span className="text-[10px] font-black text-emerald-700">الاستلام</span><p className="text-[11px] font-bold text-slate-700 mt-1 line-clamp-3">{order.pickup_address}</p></div><div className="p-3 rounded-2xl bg-orange-50 border border-orange-100"><span className="text-[10px] font-black text-[#FA3802]">التسليم</span><p className="text-[11px] font-bold text-slate-700 mt-1 line-clamp-3">{order.dropoff_address}</p></div></div>
          <div className="space-y-2">
            {currentStatus === 'accepted' && pickupMap && <div className="rounded-2xl overflow-hidden border border-emerald-100"><div className="px-3 py-2 bg-emerald-50 text-[11px] font-black text-emerald-800">خريطة مكان الاستلام</div><iframe src={pickupMap} width="100%" height="190" style={{ border: 0 }} loading="lazy" title="خريطة الاستلام" /></div>}
            {currentStatus !== 'accepted' && dropoffMap && <div className="rounded-2xl overflow-hidden border border-orange-100"><div className="px-3 py-2 bg-orange-50 text-[11px] font-black text-[#FA3802]">خريطة عنوان العميل</div><iframe src={dropoffMap} width="100%" height="190" style={{ border: 0 }} loading="lazy" title="خريطة التسليم" /></div>}
          </div>
          {order.customer_notes && <div className="p-3 bg-amber-50 text-amber-800 rounded-2xl text-[11px]"><span className="font-black">ملاحظات العميل: </span>{order.customer_notes}</div>}
          <div className="grid grid-cols-2 gap-2 pt-1"><a href={`https://www.google.com/maps/dir/?api=1&destination=${order.pickup_lat},${order.pickup_lng}`} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-800 text-center text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">ملاحة الاستلام</a><a href={`https://www.google.com/maps/dir/?api=1&destination=${order.dropoff_lat},${order.dropoff_lng}`} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FA3802] text-center text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40">ملاحة التسليم</a></div>
        </Card>

        <Card className="p-4 flex items-center justify-between"><div><span className="text-[10px] text-slate-400 block">رسوم التوصيل</span><span className="text-xl font-black text-emerald-600">{order.delivery_fee} جنيه</span></div><span className="text-[10px] text-slate-400">تحصيل عند التسليم</span></Card>

        <div className="pt-1 pb-3 space-y-2">{currentStatus === 'accepted' && <Button type="button" variant="primary" size="lg" className="w-full font-black shadow-lg" disabled={isPending} onClick={() => handleStatusChange('in_progress')}>{isPending ? 'جاري التحديث...' : 'تم الاستلام والشراء ← بدء التوصيل 📦'}</Button>}{currentStatus === 'in_progress' && <Button type="button" variant="success" size="lg" className="w-full font-black shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isPending} onClick={() => handleStatusChange('delivered')}>{isPending ? 'جاري تأكيد التسليم...' : 'تم تسليم الطلب وتحصيل الحساب ✅'}</Button>}{currentStatus === 'delivered' && <Link href="/driver/orders" className="btn btn-outline btn-md w-full block text-center">العودة لقائمة الرحلات</Link>}</div>

        <ChatPanel orderId={order.id} currentUserId={driverId} isEnabled={currentStatus === 'accepted' || currentStatus === 'in_progress' || currentStatus === 'delivered'} readOnly={currentStatus === 'delivered'} />
      </div>
    </AppShell>
  );
}
