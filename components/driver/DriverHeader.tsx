'use client';

import { useState, useTransition } from 'react';
import { toggleDriverStatusAction, updateDriverLocationAction } from '@/lib/actions/drivers';
import { Card, Button, Alert } from '@/components';
import Link from 'next/link';
import type { DriverProfileWithUser } from '@/lib/services/drivers';

interface DriverHeaderProps { driver: DriverProfileWithUser; activeOrderId?: string | null; }

export function DriverHeader({ driver, activeOrderId }: DriverHeaderProps) {
  const isBusy = driver.status === 'busy';
  const [isOnline, setIsOnline] = useState(driver.status === 'online');
  const [isPending, startTransition] = useTransition();
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToggle = () => {
    const nextStatus = isOnline ? 'offline' : 'online';
    setErrorMsg(null);
    startTransition(async () => {
      const res = await toggleDriverStatusAction(nextStatus);
      if (res?.error) setErrorMsg(res.error); else setIsOnline(nextStatus === 'online');
    });
  };

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('المتصفح لا يدعم تحديد الموقع'); return; }
    setLocationStatus('جاري تحديد موقعك الحالي...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await updateDriverLocationAction(pos.coords.latitude, pos.coords.longitude);
        if (res && 'success' in res && res.success) { setLocationStatus('تم تحديث موقعك بنجاح 📍'); setTimeout(() => setLocationStatus(null), 3000); }
        else setLocationStatus('فشل حفظ الموقع في الخادم');
      },
      () => setLocationStatus('تعذر الوصول للـ GPS، يرجى تفعيل إذن الموقع'),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3 mb-4">
      {errorMsg && <Alert type="error" title="تنبيه">{errorMsg}</Alert>}
      {driver.is_blocked && <Alert type="error" title="حسابك محظور مؤقتاً 🚫">تجاوزت الحد المسموح به لعمولات المنصة غير المسددة ({driver.commission_balance} جنيه). يرجى التواصل مع الوكيل لسداد المستحقات وإعادة استقبال الطلبات.</Alert>}

      <Card className="p-0 overflow-hidden bg-white border-gray-100 shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#22120d] text-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-xl shrink-0">🛵</div>
              <div className="min-w-0">
                <p className="text-[11px] text-white/50 font-bold">كابتن ENgz</p>
                <h2 className="text-base font-black truncate">{driver.user?.full_name}</h2>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-white/65">
                  <span className={`w-2.5 h-2.5 rounded-full ${isBusy ? 'bg-amber-400 animate-pulse' : isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
                  <span>{isBusy ? 'في رحلة حالياً' : isOnline ? 'متاح لاستقبال الطلبات' : 'غير متصل'}</span>
                </div>
              </div>
            </div>
            {isBusy ? (
              <Link href={activeOrderId ? `/driver/orders/${activeOrderId}` : '/driver/orders?status=accepted'} className="px-3 py-2 rounded-xl bg-amber-400 text-slate-950 text-[11px] font-black no-underline shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">متابعة الرحلة</Link>
            ) : (
              <Button type="button" variant={isOnline ? 'danger' : 'primary'} size="sm" onClick={handleToggle} disabled={isPending || driver.is_blocked}>{isPending ? '...' : isOnline ? 'Offline' : 'ابدأ Online'}</Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="rounded-2xl bg-white/5 border border-white/5 p-3"><p className="text-[10px] text-white/45">رصيد العمولة</p><p className="text-sm font-black mt-1">{driver.commission_balance} ج</p></div>
            <div className="rounded-2xl bg-white/5 border border-white/5 p-3"><p className="text-[10px] text-white/45">الحالة</p><p className="text-sm font-black mt-1">{isBusy ? 'مشغول' : isOnline ? 'Online' : 'Offline'}</p></div>
            <div className="rounded-2xl bg-white/5 border border-white/5 p-3"><p className="text-[10px] text-white/45">المنطقة</p><p className="text-sm font-black mt-1 truncate">{driver.region?.name_ar || driver.region?.name || 'عامة'}</p></div>
          </div>
        </div>

        <div className="p-3 flex items-center justify-between gap-3 bg-gray-50/70">
          <button type="button" onClick={handleUpdateLocation} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#FA3802] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 rounded px-1">📍 تحديث موقعي الحالي</button>
          {locationStatus && <span className="text-[10px] font-bold text-emerald-600 truncate">{locationStatus}</span>}
        </div>
      </Card>

      {isBusy && <Link href={activeOrderId ? `/driver/orders/${activeOrderId}` : '/driver/orders?status=accepted'} className="block no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 rounded-2xl"><div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center gap-3 hover:shadow-md transition-all"><div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl shrink-0">🚴</div><div className="flex-1 min-w-0"><p className="text-sm font-extrabold text-amber-900">لديك رحلة نشطة الآن</p><p className="text-xs text-amber-700 mt-0.5">اضغط للعودة إلى الطلب ومتابعة خطوات التوصيل</p></div><span className="text-amber-500 text-lg">←</span></div></Link>}
    </div>
  );
}
