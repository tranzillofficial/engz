'use client';

import { useState, useActionState } from 'react';
import {
  AppShell,
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Alert,
} from '@/components';
import { submitManualPaymentAction } from '@/lib/actions/payments';

interface DriverWalletClientProps {
  driver: any;
  currentBalance: number;
  totalCommissions: number;
  totalPaid: number;
  transactions: any[];
  paymentMethod: any;
}

export function DriverWalletClient({
  driver,
  currentBalance,
  totalCommissions,
  totalPaid,
  transactions,
  paymentMethod,
}: DriverWalletClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [zeroBalanceAlert, setZeroBalanceAlert] = useState(false);
  const [state, action, pending] = useActionState(submitManualPaymentAction, null);

  const handlePaymentClick = () => {
    if (currentBalance <= 0) {
      setZeroBalanceAlert(true);
      setTimeout(() => setZeroBalanceAlert(false), 5000);
      return;
    }
    setShowForm(!showForm);
  };

  return (
    <AppShell
      header={
        <PageHeader
          title="محفظة الطيار"
          titleEn="Driver Wallet"
          subtitle="متابعة مستحقات العمولات وسجل السداد"
          backHref="/driver"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 sm:py-4 space-y-4 font-sans">
        {zeroBalanceAlert && (
          <Alert type="info" title="حسابك سليم!">
            رصيدك الحالي 0 ج.م — لا توجد أي مستحقات أو مبالغ مطلوبة للسداد حالياً 🎉
          </Alert>
        )}

        {/* Main Wallet Balance Card */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 shadow-lg space-y-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الرصيد المستحق للمنصة</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                currentBalance > 0
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {currentBalance > 0 ? 'مستحق للسداد' : 'لا توجد مديونية'}
            </span>
          </div>

          <div>
            <p className="text-4xl font-black tracking-tight text-white">
              {Number(currentBalance).toLocaleString('ar-EG')}{' '}
              <span className="text-sm font-bold text-slate-400">ج.م</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              العمولات الناتجة عن توصيل الطلبات المكتملة
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-2xl">
              <span className="text-slate-400 block text-[10px] mb-0.5">إجمالي العمولات المحسوبة</span>
              <b className="text-sm text-slate-100">{totalCommissions} ج.م</b>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-2xl">
              <span className="text-slate-400 block text-[10px] mb-0.5">إجمالي المبالغ المسددة</span>
              <b className="text-sm text-emerald-400">{totalPaid} ج.م</b>
            </div>
          </div>
        </div>

        {/* Payment Action Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>💳</span>
              <span>سداد العمولات</span>
            </h3>
            <span className="text-[11px] text-slate-400">إشعار تحويل فودافون كاش / إنستاباي</span>
          </div>

          {currentBalance > 0 && paymentMethod ? (
            <div className="rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/30 p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <b className="text-[#FA3802] font-black">{paymentMethod.method_name}</b>
                <span className="text-[10px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 font-bold">
                  بيانات معتمدة
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                اسم الحساب المستلم: <b>{paymentMethod.account_name}</b>
              </p>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800">
                <span className="text-slate-500 text-[11px]">رقم التحويل / المحفظة:</span>
                <b className="dir-ltr text-[#FA3802] text-sm select-all font-mono">
                  {paymentMethod.account_number}
                </b>
              </div>
              {paymentMethod.instructions && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {paymentMethod.instructions}
                </p>
              )}
            </div>
          ) : currentBalance > 0 && !paymentMethod ? (
            <Alert type="warning">
              لم تضف الإدارة بيانات التحويل بعد، يرجى التواصل مع الدعم الفني.
            </Alert>
          ) : null}

          <Button
            type="button"
            className="w-full h-11 rounded-2xl bg-[#FA3802] text-white font-black text-xs hover:bg-[#e03102] transition-colors shadow-xs"
            onClick={handlePaymentClick}
          >
            {currentBalance > 0
              ? showForm
                ? 'إلغاء نموذج السداد'
                : 'تسجيل إشعار سداد جديد'
              : 'طلب سداد عمولات'}
          </Button>

          {showForm && currentBalance > 0 && (
            <form action={action} className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المبلغ المراد سداده (ج.م) <span className="text-red-500">*</span>
                </label>
                <Input
                  name="amount"
                  type="number"
                  min="1"
                  step=".01"
                  defaultValue={currentBalance}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  طريقة التحويل المستخدمة <span className="text-red-500">*</span>
                </label>
                <Select
                  name="payment_method"
                  options={
                    paymentMethod
                      ? [{ value: paymentMethod.method, label: paymentMethod.method_name || paymentMethod.method }]
                      : [
                          { value: 'vodafone_cash', label: 'فودافون كاش' },
                          { value: 'instapay', label: 'إنستاباي InstaPay' },
                          { value: 'bank_transfer', label: 'تحويل بنكي' },
                        ]
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم المرجع / العملية <span className="text-red-500">*</span>
                </label>
                <Input
                  name="reference"
                  placeholder="رقم العملية من الرسالة أو الإشعار"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات إضافية (اختياري)
                </label>
                <Textarea name="notes" placeholder="أي تفاصيل أخرى تخص التحويل..." rows={2} />
              </div>

              {state?.error && <Alert type="error">{state.error}</Alert>}
              {state?.success && (
                <Alert type="success">
                  تم إرسال إشعار السداد للإدارة بنجاح، سيتم مراجعته وتحديث رصيدك فوراً.
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-2xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-colors"
                disabled={pending}
              >
                {pending ? 'جاري إرسال الإشعار...' : 'تأكيد وإرسال إشعار السداد'}
              </Button>
            </form>
          )}
        </div>

        {/* Transactions Ledger */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>📜</span>
            <span>سجل المعاملات والعمولات</span>
          </h3>

          {transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((t: any) => {
                const isCommission = t.transaction_type === 'commission';
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs"
                  >
                    <div className="space-y-0.5">
                      <b className="text-slate-800 dark:text-slate-200 block font-bold">
                        {isCommission ? 'عمولة طلب مكتمل' : 'سداد عمولة معتمد'}
                      </b>
                      <p className="text-[10px] text-slate-400">
                        {new Date(t.created_at).toLocaleString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <span
                      className={`font-black text-sm ${
                        isCommission ? 'text-[#FA3802]' : 'text-emerald-600'
                      }`}
                    >
                      {isCommission ? `+${t.amount}` : `-${t.amount}`} ج.م
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 rounded-2xl bg-slate-50 dark:bg-slate-800/30">
              لا توجد معاملات مسجلة حتى الآن.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}