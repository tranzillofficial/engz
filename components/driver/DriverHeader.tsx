'use client';

import { useState, useTransition } from 'react';
import { toggleDriverStatusAction, updateDriverLocationAction } from '@/lib/actions/drivers';
import { Card, Button, Alert } from '@/components';
import Link from 'next/link';
import type { DriverProfileWithUser } from '@/lib/services/drivers';

interface DriverHeaderProps {
  driver: DriverProfileWithUser;
  activeOrderId?: string | null;
}

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
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setIsOnline(nextStatus === 'online');
      }
    });
  };

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setLocationStatus('جاري تحديد موقعك الحالي...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await updateDriverLocationAction(latitude, longitude);
        if (res && 'success' in res && res.success) {
          setLocationStatus('تم تحديث موقعك بنجاح! 📍');
          setTimeout(() => setLocationStatus(null), 3000);
        } else {
          setLocationStatus('فشل حفظ الموقع في الخادم');
        }
      },
      (err) => {
        setLocationStatus('تعذر الوصول للـ GPS، يرجى تفعيل إذن الموقع');
        console.error(err);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3 mb-4">
      {errorMsg && (
        <Alert type="error" title="تنبيه">{errorMsg}</Alert>
      )}

      {driver.is_blocked && (
        <Alert type="error" title="حسابك محظور مؤقتاً 🚫">
          تجاوزت الحد المسموح به لعمولات المنصة غير المسددة ({driver.commission_balance} جنيه).
          يرجى التواصل مع الوكيل لسداد المستحقات وإعادة استقبال الطلبات فوراً.
        </Alert>
      )}

      <Card className="p-4 bg-gradient-to-r from-gray-900 to-indigo-950 text-white border-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg border-2 border-indigo-400">
              🛵
            </div>
            <div>
              <h2 className="text-base font-bold">{driver.user?.full_name}</h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-300">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isBusy
                      ? 'bg-amber-400 animate-pulse'
                      : isOnline
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-gray-400'
                  }`}
                />
                <span>
                  {isBusy
                    ? 'مشغول — في رحلة توصيل حالياً 🚴'
                    : isOnline
                    ? 'متاح لاستقبال الطلبات (Online)'
                    : 'غير متصل (Offline)'}
                </span>
              </div>
            </div>
          </div>

          {isBusy ? (
            activeOrderId ? (
              <Link
                href={`/driver/orders/${activeOrderId}`}
                className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg px-3 py-2 no-underline"
              >
                متابعة الرحلة 🚀
              </Link>
            ) : (
              <Link
                href="/driver/orders?status=accepted"
                className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg px-3 py-2 no-underline"
              >
                رحلاتي النشطة 🚴
              </Link>
            )
          ) : (
            <Button
              type="button"
              variant={isOnline ? 'danger' : 'primary'}
              size="sm"
              onClick={handleToggle}
              disabled={isPending || driver.is_blocked}
            >
              {isPending ? 'جاري التحويل...' : isOnline ? 'تحويل إلى Offline' : 'ابدأ العمل Online 🚀'}
            </Button>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <button
            type="button"
            onClick={handleUpdateLocation}
            className="text-indigo-300 hover:text-indigo-200 underline font-medium flex items-center gap-1"
          >
            <span>📍 تحديث موقعي الحالي</span>
          </button>
          <span>المنطقة: {driver.region?.name_ar || driver.region?.name || 'عامة'}</span>
        </div>

        {locationStatus && (
          <p className="mt-2 text-[11px] text-emerald-300 animate-fade-in">
            {locationStatus}
          </p>
        )}
      </Card>

      {/* Active order banner when busy */}
      {isBusy && (
        <Link
          href={activeOrderId ? `/driver/orders/${activeOrderId}` : '/driver/orders?status=accepted'}
          className="block no-underline"
        >
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 flex items-center gap-3 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl shrink-0 animate-pulse">
              🚴
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-amber-900">لديك رحلة نشطة الآن</p>
              <p className="text-xs text-amber-700 mt-0.5">اضغط هنا للعودة لتفاصيل الرحلة ومتابعة التوصيل</p>
            </div>
            <span className="text-amber-500 text-lg shrink-0">←</span>
          </div>
        </Link>
      )}
    </div>
  );
}

