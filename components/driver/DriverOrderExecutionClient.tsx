'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatusByDriverAction } from '@/lib/actions/drivers';
import { AppShell, PageHeader, Card, Button, Alert } from '@/components';
import Link from 'next/link';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { DriverNavigationMap } from './DriverNavigationMap';

export function DriverOrderExecutionClient({
  order,
  driverId,
}: {
  order: any;
  driverId: string;
}) {
  const [s, setS] = useState(order.status);
  const [p, start] = useTransition();
  const [e, setE] = useState<string | null>(null);

  const change = (x: 'in_progress' | 'delivered') =>
    start(async () => {
      setE(null);
      const r = await updateOrderStatusByDriverAction(order.id, x);
      if (r?.error) setE(r.error);
      else setS(x);
    });

  const orderNumberDisplay = order.order_number
    ? `#${String(order.order_number).padStart(5, '0')}`
    : `#${order.id.slice(0, 8)}`;

  return (
    <AppShell
      header={
        <PageHeader
          title={`تنفيذ الطلب ${orderNumberDisplay}`}
          titleEn="Live Trip Execution"
          backHref="/driver/orders"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 sm:py-3 space-y-3.5 pb-28 font-sans">
        {e && <Alert type="error">{e}</Alert>}

        {/* 1. Customer Contact & Quick Info */}
        <Card className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-[#FA3802] font-black text-lg flex items-center justify-center">
                👤
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 block">بيانات العميل</span>
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  {order.customer?.full_name || 'عميل إنجز'}
                </h3>
              </div>
            </div>

            {order.customer?.phone && (
              <a
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-sm shadow-emerald-500/20 transition-all"
                href={`tel:${order.customer.phone}`}
              >
                <span>اتصال</span>
                <span>📞</span>
              </a>
            )}
          </div>
        </Card>

        {/* 2. Items To Buy & Details */}
        <Card className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>🛒</span>
              <span>الأصناف المطلوب شراؤها وتوصيلها ({order.order_items?.length || 0})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">تأكد من شراء كافة الأصناف</span>
          </div>

          <div className="space-y-2">
            {order.order_items && order.order_items.length > 0 ? (
              order.order_items.map((i: any, idx: number) => (
                <div
                  key={i.id || idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-750 flex items-start gap-2.5 text-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FA3802] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {i.quantity && i.quantity > 1 ? (
                        <span className="text-[#FA3802] font-black ml-1">[{i.quantity}×]</span>
                      ) : null}
                      {i.description}
                    </p>
                    {i.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <b>ملاحظة:</b> {i.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-2">لا توجد أصناف مسجلة</p>
            )}
          </div>
        </Card>

        {/* 3. Live Driver Navigation Map with Distance & GPS Routing */}
        <DriverNavigationMap
          dropoffLat={Number(order.dropoff_lat)}
          dropoffLng={Number(order.dropoff_lng)}
          dropoffAddress={order.dropoff_address}
          driverId={driverId}
        />

        {/* 4. Delivery Fee */}
        <Card className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block">حساب التوصيل المستحق</span>
            <span className="text-xs text-slate-500">تحصيل نقدي من العميل</span>
          </div>
          <div className="text-left">
            <span className="text-2xl font-black text-[#FA3802]">{order.delivery_fee}</span>
            <span className="text-xs font-bold text-slate-500 mr-1">جنيه</span>
          </div>
        </Card>

        {/* 5. Trip Action Flow Buttons */}
        <div className="space-y-2 pt-1">
          {s === 'accepted' && (
            <Button
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white font-black text-base shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all"
              size="lg"
              disabled={p}
              onClick={() => change('in_progress')}
            >
              {p ? 'جاري التحديث...' : '✅ تم شراء الأصناف — بدء التحرك للعميل'}
            </Button>
          )}

          {s === 'in_progress' && (
            <Button
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-600/25 transition-all"
              size="lg"
              disabled={p}
              onClick={() => change('delivered')}
            >
              {p ? 'جاري التأكيد...' : '🎉 تم الوصول وتسليم الطلب للعميل'}
            </Button>
          )}

          {s === 'delivered' && (
            <Link
              className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-sm block text-center border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-all"
              href="/driver/orders"
            >
              العودة لقائمة الرحلات
            </Link>
          )}
        </div>

        {/* 6. Live Chat with Customer */}
        <ChatPanel
          orderId={order.id}
          currentUserId={driverId}
          isEnabled={s !== 'cancelled'}
          readOnly={s === 'delivered'}
        />
      </div>
    </AppShell>
  );
}