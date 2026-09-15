'use client';

import { useTransition, useState } from 'react';
import { adminReviewPaymentAction } from '@/lib/actions/admin';
import { Card, Button, PaymentStatusBadge, Alert } from '@/components';

interface AdminPaymentsClientProps {
  payments: any[];
}

export function AdminPaymentsClient({ payments }: AdminPaymentsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleReview = (paymentId: string, action: 'confirmed' | 'rejected') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSelectedPaymentId(paymentId);

    startTransition(async () => {
      const res = await adminReviewPaymentAction(paymentId, action);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(
          action === 'confirmed'
            ? 'تم تأكيد استلام المبلغ وخصمه من رصيد الطيار بنجاح! ✅'
            : 'تم رفض إشعار السداد ❌'
        );
      }
      setSelectedPaymentId(null);
    });
  };

  return (
    <div className="space-y-3">
      {errorMsg && <Alert type="error">{errorMsg}</Alert>}
      {successMsg && <Alert type="success">{successMsg}</Alert>}

      {payments.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/40 rounded-2xl">
          <span className="text-3xl block mb-2">💳</span>
          <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">لا توجد إشعارات سداد مسجلة</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const isThisLoading = isPending && selectedPaymentId === p.id;

            return (
              <Card key={p.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block">إشعار #{p.id.slice(0, 8)}</span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                      الكابتن: {p.driver?.user?.full_name}
                    </h4>
                    <span className="text-xs text-gray-500">
                      المنطقة: {p.driver?.region?.name_ar || p.driver?.region?.name || 'عامة'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">
                      {p.amount} ج.م
                    </span>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                </div>

                {/* Details */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">طريقة التحويل:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{p.payment_method}</span>
                  </div>
                  {p.reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">المرجع:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{p.reference}</span>
                    </div>
                  )}
                  {p.notes && (
                    <div className="text-[11px] text-gray-600 dark:text-gray-400 pt-1">
                      <span className="font-semibold">ملاحظات:</span> {p.notes}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-gray-500 flex justify-between">
                  <span>الرصيد المستحق الحالي للطيار:</span>
                  <span className="font-bold text-amber-600">{p.driver?.commission_balance} ج.م</span>
                </div>

                {p.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      disabled={isPending}
                      onClick={() => handleReview(p.id, 'confirmed')}
                    >
                      {isThisLoading ? 'جاري التأكيد...' : 'تأكيد الاستلام ✅'}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleReview(p.id, 'rejected')}
                    >
                      رفض الإشعار ❌
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
