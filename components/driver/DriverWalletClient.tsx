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
    region?: { whatsapp?: string; instagram?: string; name_ar?: string; name?: string } | null;
  };
  currentBalance: number;
  totalCommissions: number;
  totalPaid: number;
  transactions: CommissionTransaction[];
}

export function DriverWalletClient({ driver, currentBalance, totalCommissions, totalPaid, transactions }: DriverWalletClientProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentState, paymentAction, isPending] = useActionState(submitManualPaymentAction, null);

  const paymentOptions = [
    { value: 'vodafone_cash', label: 'فودافون كاش / محفظة إلكترونية' },
    { value: 'instapay', label: 'إنستاباي (InstaPay)' },
    { value: 'cash_hand', label: 'سداد نقدي مباشر للوكيل' },
    { value: 'bank_transfer', label: 'تحويل بنكي' },
  ];

  return (
    <AppShell header={<PageHeader title="محفظة الطيار" titleEn="Driver Wallet" backHref="/driver" />}>
      <div className="max-w-md mx-auto py-2 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="col-span-2 overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-300">الرصيد المستحق للمنصة</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tight">{currentBalance}</span>
                    <span className="text-sm text-slate-300">ج.م</span>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${driver.is_blocked ? 'bg-red-500 text-white' : currentBalance > 0 ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'}`}>
                  {driver.is_blocked ? 'الحساب محظور' : currentBalance > 0 ? 'مستحق السداد' : 'الرصيد خالص'}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs">
                <div><span className="block text-slate-400">إجمالي العمولات</span><strong className="mt-1 block text-white">{totalCommissions} ج.م</strong></div>
                <div><span className="block text-slate-400">إجمالي المسدد</span><strong className="mt-1 block text-emerald-300">{totalPaid} ج.م</strong></div>
              </div>
            </div>
          </Card>
        </div>

        {driver.is_blocked && (
          <Alert type="error" title="الحساب محظور بسبب تجاوز حد العمولات">
            عليك مستحقات بقيمة <strong>{currentBalance} ج.م</strong>. سجّل إشعار السداد بعد التحويل ليتم مراجعته.
          </Alert>
        )}

        <Card className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">سداد العمولة</h3>
              <p className="mt-1 text-[11px] text-gray-500">تواصل مع وكيل منطقتك ثم أرسل إشعار الدفع للمراجعة.</p>
            </div>
            <span className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {driver.region?.name_ar || driver.region?.name || 'المنطقة'}
            </span>
          </div>

          <div className="grid gap-2">
            {driver.region?.whatsapp && (
              <a href={`https://wa.me/${driver.region.whatsapp}?text=${encodeURIComponent(`السلام عليكم، أنا الطيار ومحتاج أسدد عمولة بمبلغ ${currentBalance} ج.م`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 no-underline dark:bg-emerald-950/30 dark:text-emerald-300">
                <span>تواصل عبر واتساب الوكيل</span><span>←</span>
              </a>
            )}
            {driver.region?.instagram && (
              <a href={`https://instagram.com/${driver.region.instagram}`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl bg-pink-50 p-3 text-xs font-semibold text-pink-800 no-underline dark:bg-pink-950/30 dark:text-pink-300">
                <span>إنستجرام الوكيل (@{driver.region.instagram})</span><span>←</span>
              </a>
            )}
          </div>

          <Button type="button" variant="primary" size="md" className="w-full font-bold" onClick={() => setShowPaymentForm((v) => !v)}>
            {showPaymentForm ? 'إغلاق نموذج الدفع' : 'إرسال إشعار سداد'}
          </Button>
        </Card>

        {showPaymentForm && (
          <Card className="p-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">إشعار سداد جديد</h3>
            <p className="mt-1 text-xs text-gray-500">سيظهر الإشعار فوراً في لوحة الإدارة للمراجعة.</p>
            <form action={paymentAction} className="mt-4 space-y-3">
              {paymentState?.error && <Alert type="error">{paymentState.error}</Alert>}
              {paymentState?.success && <Alert type="success">تم إرسال إشعار السداد بنجاح. في انتظار المراجعة.</Alert>}
              <Input name="amount" type="number" step="0.01" min="1" defaultValue={currentBalance > 0 ? currentBalance : ''} placeholder="المبلغ بالجنيه" required />
              <Select label="طريقة التحويل" name="payment_method" required defaultValue="vodafone_cash" options={paymentOptions} />
              <Input name="reference" placeholder="رقم المرجع / رقم المحول منه (اختياري)" />
              <Textarea name="notes" rows={3} placeholder="ملاحظات إضافية (اختياري)" />
              <Button type="submit" variant="primary" size="md" className="w-full font-bold" disabled={isPending}>
                {isPending ? 'جاري إرسال الإشعار...' : 'تأكيد وإرسال الإشعار'}
              </Button>
            </form>
          </Card>
        )}

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">سجل المحفظة</h3>
              <p className="text-[11px] text-gray-500">كل العمولات وعمليات السداد</p>
            </div>
            <span className="text-[10px] text-gray-400">{transactions.length} عملية</span>
          </div>

          {transactions.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-500">لا توجد عمليات مسجلة في محفظتك حتى الآن.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${tx.transaction_type === 'commission' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span className="font-bold text-gray-800 dark:text-gray-200">{tx.transaction_type === 'commission' ? 'عمولة طلب' : 'سداد عمولة'}</span>
                    </div>
                    {tx.notes && <p className="mt-1 truncate text-[11px] text-gray-500">{tx.notes}</p>}
                    <span className="mt-1 block text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="shrink-0 text-left">
                    <span className={`text-sm font-black ${tx.transaction_type === 'commission' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {tx.transaction_type === 'commission' ? '+' : '-'}{tx.amount} ج
                    </span>
                    <span className="block text-[10px] text-gray-400">بعدها: {tx.balance_after} ج</span>
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
