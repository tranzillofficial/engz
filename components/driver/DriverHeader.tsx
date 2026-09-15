'use client';

import { useState, useTransition } from 'react';
import { toggleDriverStatusAction, updateDriverLocationAction } from '@/lib/actions/drivers';
import { Card, Button, Alert } from '@/components';
import type { DriverProfileWithUser } from '@/lib/services/drivers';

interface DriverHeaderProps {
  driver: DriverProfileWithUser;
}

export function DriverHeader({ driver }: DriverHeaderProps) {
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
                    isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span>{isOnline ? 'متاح لاستقبال الطلبات (Online)' : 'غير متصل (Offline)'}</span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant={isOnline ? 'danger' : 'primary'}
            size="sm"
            onClick={handleToggle}
            disabled={isPending || driver.is_blocked}
          >
            {isPending ? 'جاري التحويل...' : isOnline ? 'تحويل إلى Offline' : 'ابدأ العمل Online 🚀'}
          </Button>
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
    </div>
  );
}
