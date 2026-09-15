'use client';

import { useState, useActionState } from 'react';
import { AppShell, PageHeader, Card, Button, Input, Select, Textarea, Alert } from '@/components';
import { submitManualPaymentAction } from '@/lib/actions/payments';
import type { CommissionTransaction } from '@/lib/types/database';

interface DriverWalletClientProps {
  driver: {
    id: string;
    commission_balance: number;
    is_blocked: boolean;
    region?: {
      whatsapp?: string;
      instagram?: string;
      name_ar?: string;
      name?: string;
    } | null;
  };
  currentBalance: number;
  totalCommissions: number;
  totalPaid: number;
  transactions: CommissionTransaction[];
}

export function DriverWalletClient({
  driver,
  currentBalance,
  totalCommissions,
  totalPaid,
  transactions,
}: DriverWalletClientProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [paymentState, paymentAction, isPending] = useActionState(
    submitManualPaymentAction,
    null
  );

  const paymentOptions = [
    { value: 'vodafone_cash', label: 'فودافون كاش / محفظة إلكترونية' },
    { value: 'instapay', label: 'إنستاباي (InstaPay)' },
    { value: 'cash_hand', label: 'سداد نقدي مباشر للوكيل' },
    { value: 'bank_transfer', label: 'تحويل بنكي' },
  ];

  return (
    <AppShell
      header={
        <PageHeader
          title="محفظة العمولات"
          titleEn="Driver Commission Wallet"
          backHref="/driver"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 space-y-4">
        {/* Block Alert if driver is blocked */}
        {driver.is_blocked && (
          <Alert type="error" title="الحساب محظور بسبب تجاوز حد العمولات 🚫">
            عليك مستحقات غير مسددة بقيمة <strong>{currentBalance} ج.م</strong>.
            يرجى سداد المبلغ عبر طرق الدفع المتاحة أدناه وإرسال إيصال التحويل لإعادة تفعيل الحساب فوراً.
          </Alert>
        )}

        {/* Balance Overview Card */}
        <Card className="p-4 bg-gradient-to-br from-gray-900 to-indigo-950 text-white shadow-xl">
          <span className="text-xs text-indigo-300 block mb-1">الرصيد المستحق الحالي للمنصة</span>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-3xl font-black tracking-tight">
              {currentBalance} <span className="text-sm font-normal text-gray-300">جنيه</span>
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                driver.is_blocked ? 'bg-red-500 text-white' : currentBalance > 0 ? 'bg-amber-400 text-gray-950' : 'bg-emerald-400 text-gray-950'
              }`}
            >
              {driver.is_blocked ? 'محظور للتجاوز' : currentBalance > 0 ? 'مستحق السداد' : 'خالص'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-800 text-xs">
            <div>
              <span className="text-gray-400 block">إجمالي العمولات المسجلة:</span>
              <span className="font-bold text-gray-200">{totalCommissions} ج.م</span>
            </div>
            <div>
              <span className="text-gray-400 block">إجمالي ما تم سداده:</span>
              <span className="font-bold text-emerald-400">{totalPaid} ج.م</span>
            </div>
          </div>
        </Card>

        {/* Regional Payment Channels */}
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center justify-between">
            <span>طرق السداد والتواصل مع الوكيل 💳</span>
            <span className="text-xs text-indigo-600 font-normal">
              {driver.region?.name_ar || driver.region?.name || 'المنطقة'}
            </span>
          </h3>
          <p className="text-xs text-gray-500">
            يمكنك تحويل العمولة عبر فودافون كاش / إنستاباي والتواصل مع الوكيل لتأكيد الدفع:
          </p>

          <div className="space-y-2 pt-1">
            {driver.region?.whatsapp && (
              <a
                href={`https://wa.me/${driver.region.whatsapp}?text=${encodeURIComponent(
                  `السلام عليكم، أنا الطيار ومحتاج أسدد عمولة بمبلغ ${currentBalance} ج.م`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold no-underline"
              >
                <span>💬 تواصل عبر واتساب الوكيل ({driver.region.whatsapp})</span>
                <span>←</span>
              </a>
            )}

            {driver.region?.instagram && (
              <a
                href={`https://instagram.com/${driver.region.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 bg-pink-50 dark:bg-pink-950/30 rounded-xl text-pink-800 dark:text-pink-300 text-xs font-semibold no-underline"
              >
                <span>📸 إنستجرام الوكيل (@{driver.region.instagram})</span>
                <span>←</span>
              </a>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full mt-2"
            onClick={() => setShowPaymentForm(!showPaymentForm)}
          >
            {showPaymentForm ? 'إخفاء نموذج تسجيل الدفعة' : '📝 تسجيل إشعار تحويل / سداد يدوي'}
          </Button>
        </Card>

        {/* Manual Payment Submission Form */}
        {showPaymentForm && (
          <Card className="p-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
              تسجيل إشعار دفع جديد
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              سجل تفاصيل التحويل ليقوم الوكيل أو المدير بمراجعته وتأكيد خصمه من رصيدك فوراً.
            </p>

            <form action={paymentAction} className="space-y-3">
              {paymentState?.error && (
                <Alert type="error">{paymentState.error}</Alert>
              )}
              {paymentState?.success && (
                <Alert type="success">تم إرسال إشعار السداد بنجاح! في انتظار مراجعة الوكيل.</Alert>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  المبلغ المحول (ج.م) *
                </label>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  defaultValue={currentBalance > 0 ? currentBalance : ''}
                  placeholder="مثال: 50"
                  required
                />
              </div>

              <div>
                <Select
                  label="طريقة التحويل"
                  name="payment_method"
                  required
                  defaultValue="vodafone_cash"
                  options={paymentOptions}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  رقم المرجع / رقم المحول منه (اختياري)
                </label>
                <Input
                  name="reference"
                  placeholder="مثال: تحويل من رقم 010xxxxxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  ملاحظات إضافية
                </label>
                <Textarea
                  name="notes"
                  rows={2}
                  placeholder="أي تفاصيل أخرى بخصوص عملية التحويل..."
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full font-bold"
                disabled={isPending}
              >
                {isPending ? 'جاري الإرسال...' : 'إرسال إشعار السداد للمراجعة 🚀'}
              </Button>
            </form>
          </Card>
        )}

        {/* Transaction History Ledger */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
            سجل العمليات والعمولات (Ledger) 📜
          </h3>

          {transactions.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              لا توجد عمليات مسجلة في محفظتك حتى الآن.
            </p>
          ) : (
            <div className="space-y-2.5">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-xs flex items-start justify-between border border-gray-100 dark:border-gray-800"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold ${
                          tx.transaction_type === 'commission'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {tx.transaction_type === 'commission' ? 'عمولة طلب' : 'سداد عمولة'}
                      </span>
                      {tx.order_id && (
                        <span className="text-[11px] text-gray-400">
                          (طلب #{tx.order_id.slice(0, 6)})
                        </span>
                      )}
                    </div>
                    {tx.notes && (
                      <p className="text-gray-500 text-[11px] mt-0.5">{tx.notes}</p>
                    )}
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(tx.created_at).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${
                        tx.transaction_type === 'commission'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {tx.transaction_type === 'commission' ? `+${tx.amount}` : `-${tx.amount}`} ج
                    </span>
                    <span className="block text-[10px] text-gray-400">
                      الرصيد بعدها: {tx.balance_after} ج
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
