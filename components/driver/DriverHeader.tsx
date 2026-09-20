'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { toggleDriverStatusAction, updateDriverLocationAction } from '@/lib/actions/drivers';
import { Card, Button } from '@/components';
import Link from 'next/link';

export function DriverHeader({
  driver,
  activeOrderId,
}: {
  driver: any;
  activeOrderId?: string | null;
}) {
  const [online, setOnline] = useState(driver.status === 'online');
  const [p, start] = useTransition();
  const [msg, setMsg] = useState('');
  const [locating, setLocating] = useState(false);

  const locate = useCallback(async (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) setMsg('خاصية تحديد الموقع غير مدعومة');
      return;
    }
    if (!silent) setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const r = await updateDriverLocationAction(pos.coords.latitude, pos.coords.longitude);
        if (!silent) {
          setMsg(r?.error || 'تم تحديث الموقع بنجاح 📍');
          setLocating(false);
          setTimeout(() => setMsg(''), 4000);
        }
      },
      (err) => {
        if (!silent) {
          setMsg('تعذر الوصول للموقع — يرجى تفعيل الـ GPS في هاتفك');
          setLocating(false);
          setTimeout(() => setMsg(''), 5000);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Auto-sync GPS location on mount and periodically when online
  useEffect(() => {
    locate(true);

    if (online) {
      const interval = setInterval(() => {
        locate(true);
      }, 45000); // every 45s
      return () => clearInterval(interval);
    }
  }, [online, locate]);

  const toggle = () =>
    start(async () => {
      const nextStatus = online ? 'offline' : 'online';
      const r = await toggleDriverStatusAction(nextStatus);
      if (r?.error) {
        setMsg(r.error);
      } else {
        setOnline(!online);
        if (nextStatus === 'online') {
          locate(false);
        }
      }
    });

  return (
    <Card className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
      <div className="flex justify-between items-start gap-3">
        <div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FA3802] border border-orange-100 dark:border-orange-900/50">
            كابتن إنجز ⚡
          </span>
          <h2 className="font-black text-base text-slate-900 dark:text-slate-100 mt-1">
            {driver.user?.full_name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            منطقة العمل: <b>{driver.region?.name_ar || driver.region?.name || 'غير محددة'}</b>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {driver.agent?.user?.full_name
              ? `تابع لوكيل: ${driver.agent.user.full_name}`
              : 'تابع للمنصة مباشرة'}
          </p>
        </div>

        {driver.status === 'busy' ? (
          <Link
            className="btn btn-sm btn-primary bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white font-bold rounded-2xl px-4 py-2 text-xs"
            href={activeOrderId ? `/driver/orders/${activeOrderId}` : '/driver/orders'}
          >
            متابعة الرحلة 🚴
          </Link>
        ) : (
          <Button
            size="sm"
            onClick={toggle}
            disabled={p || driver.is_blocked}
            className={`font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-sm ${
              online
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
            }`}
          >
            {p ? '...' : online ? 'إيقاف (Offline)' : 'ابدأ استقبال الطلبات ⚡'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400">الرصيد المستحق</span>
          <b className="block font-black text-base text-slate-900 dark:text-slate-100 mt-0.5">
            {driver.commission_balance} ج
          </b>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400">الحالة الحالية</span>
          <b
            className={`block font-black text-sm mt-0.5 ${
              driver.status === 'busy'
                ? 'text-amber-500'
                : online
                ? 'text-emerald-500'
                : 'text-slate-400'
            }`}
          >
            {driver.status === 'busy' ? 'مشغول برحلة' : online ? 'متصل (Online)' : 'غير متصل (Offline)'}
          </b>
        </div>
      </div>

      {msg && (
        <p className="text-xs font-bold text-[#FA3802] mt-2.5 bg-orange-50 dark:bg-orange-950/30 p-2 rounded-xl border border-orange-100 dark:border-orange-900/40">
          {msg}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => locate(false)}
          disabled={locating}
          className="text-xs font-black text-[#FA3802] hover:underline flex items-center gap-1.5"
        >
          <span>📍</span>
          <span>{locating ? 'جاري تحديث الموقع...' : 'تحديث موقعي الآن (GPS)'}</span>
        </button>
        <span className="text-[10px] text-slate-400">
          {online ? 'يتم التحديث تلقائياً' : 'حدد موقعك لاستقبال الأقرب'}
        </span>
      </div>
    </Card>
  );
}