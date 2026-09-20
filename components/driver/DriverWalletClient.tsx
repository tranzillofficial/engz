'use client';

import { useState, useActionState, useTransition } from 'react';
import {
  AppShell,
  PageHeader,
  Button,
  Input,
  Select,
  Textarea,
  Alert,
} from '@/components';
import { submitManualPaymentAction } from '@/lib/actions/payments';

interface PaymentMethodItem {
  id?: string;
  method_key?: string;
  method_name?: string;
  account_name?: string;
  account_number?: string;
  instructions?: string;
}

interface DriverWalletClientProps {
  driver: any;
  currentBalance: number;
  totalCommissions: number;
  totalPaid: number;
  transactions: any[];
  paymentMethod: PaymentMethodItem | null;
  paymentMethods?: PaymentMethodItem[];
}

export function DriverWalletClient({
  driver,
  currentBalance,
  totalCommissions,
  totalPaid,
  transactions,
  paymentMethod,
  paymentMethods = [],
}: DriverWalletClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [zeroBalanceAlert, setZeroBalanceAlert] = useState(false);
  const [needRequestAlert, setNeedRequestAlert] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasRequestedNumber, setHasRequestedNumber] = useState(false);
  const [isRequestingNumber, startRequestTransition] = useTransition();

  // Selected payment method
  const availableMethods = paymentMethods.length > 0 ? paymentMethods : paymentMethod ? [paymentMethod] : [];
  const [selectedMethodKey, setSelectedMethodKey] = useState<string>(
    availableMethods[0]?.method_key || 'vodafone_cash'
  );

  const activeMethod =
    availableMethods.find((m) => m.method_key === selectedMethodKey) ||
    availableMethods[0] ||
    paymentMethod;

  const [state, action, pending] = useActionState(submitManualPaymentAction, null);

  const handleRequestNumber = () => {
    startRequestTransition(() => {
      setHasRequestedNumber(true);
      setNeedRequestAlert(false);
    });
  };

  const handleCopyNumber = (num: string) => {
    if (!num) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(num);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleToggleForm = () => {
    if (currentBalance <= 0) {
      setZeroBalanceAlert(true);
      setTimeout(() => setZeroBalanceAlert(false), 5000);
      return;
    }

    if (!hasRequestedNumber) {
      setNeedRequestAlert(true);
      setTimeout(() => setNeedRequestAlert(false), 5000);
      return;
    }

    setShowForm((prev) => !prev);
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
              <span>سداد مستحقات المنصة</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">خطوات السداد والتأكيد</span>
          </div>

          {/* Workflow Steps Indicator */}
          {currentBalance > 0 && (
            <div className="grid grid-cols-2 gap-2 text-center text-xs pb-1">
              <div
                className={`p-2.5 rounded-2xl border transition-all ${
                  hasRequestedNumber
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-[#FA3802]/10 border-[#FA3802]/30 text-[#FA3802]'
                }`}
              >
                <span className="block font-black text-[11px]">
                  {hasRequestedNumber ? '✓ 1. رقم السداد' : '1. طلب رقم السداد'}
                </span>
                <span className="text-[10px] opacity-80">
                  {hasRequestedNumber ? 'تم استخراج الرقم' : 'مطلوب أولاً'}
                </span>
              </div>
              <div
                className={`p-2.5 rounded-2xl border transition-all ${
                  showForm
                    ? 'bg-[#FA3802]/10 border-[#FA3802]/30 text-[#FA3802]'
                    : hasRequestedNumber
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-400'
                }`}
              >
                <span className="block font-black text-[11px]">2. تسجيل الإشعار</span>
                <span className="text-[10px] opacity-80">
                  {hasRequestedNumber ? 'جاهز للتسجيل' : 'بعد استلام الرقم'}
                </span>
              </div>
            </div>
          )}

          {needRequestAlert && (
            <Alert type="warning" title="تنبيه السداد">
              يجب طلب رقم السداد المعتمد أولاً والتحويل عليه قبل تسجيل إشعار السداد!
            </Alert>
          )}

          {currentBalance > 0 && (
            <>
              {/* Step 1: Request Payment Number */}
              {!hasRequestedNumber ? (
                <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 p-4 text-xs space-y-3">
                  <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                    <span className="text-base">⚠️</span>
                    <div className="space-y-0.5">
                      <b className="font-bold block">يجب طلب رقم السداد المعتمد أولاً</b>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                        لضمان سلامة تحويلك، يرجى طلب رقم السداد الرسمي لإظهار بيانات الحساب المعتمد حالياً، ثم التحويل وتسجيل رقم العملية.
                      </p>
                    </div>
                  </div>

                  {availableMethods.length > 1 && (
                    <div className="space-y-1 pt-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        اختر طريقة السداد المفضلة:
                      </label>
                      <select
                        className="w-full h-10 px-3 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
                        value={selectedMethodKey}
                        onChange={(e) => setSelectedMethodKey(e.target.value)}
                      >
                        {availableMethods.map((m) => (
                          <option key={m.method_key} value={m.method_key}>
                            {m.method_name || m.method_key}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Button
                    type="button"
                    className="w-full h-11 rounded-2xl bg-[#FA3802] text-white font-black text-xs hover:bg-[#e03102] transition-all shadow-sm flex items-center justify-center gap-2"
                    onClick={handleRequestNumber}
                    disabled={isRequestingNumber}
                  >
                    <span>📲</span>
                    <span>{isRequestingNumber ? 'جاري تجهيز الرقم...' : 'طلب رقم للسداد الآن'}</span>
                  </Button>
                </div>
              ) : (
                /* Step 1 Completed: Verified Number Display */
                <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 p-4 text-xs space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm">✅</span>
                      <b className="text-emerald-800 dark:text-emerald-300 font-black">
                        رقم السداد المعتمد ({activeMethod?.method_name || 'فودافون كاش / إنستاباي'})
                      </b>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasRequestedNumber(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline font-bold"
                    >
                      تغيير الطريقة
                    </button>
                  </div>

                  {activeMethod ? (
                    <div className="space-y-2">
                      {activeMethod.account_name && (
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-[11px]">
                          <span>اسم الحساب المستلم:</span>
                          <b className="font-bold text-slate-900 dark:text-slate-100">
                            {activeMethod.account_name}
                          </b>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200/50 dark:border-emerald-900/40">
                        <div>
                          <span className="text-[10px] text-slate-400 block">رقم التحويل / المحفظة:</span>
                          <b className="dir-ltr text-[#FA3802] text-sm select-all font-mono font-black tracking-wider">
                            {activeMethod.account_number}
                          </b>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 rounded-lg text-[11px] font-bold border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          onClick={() => handleCopyNumber(activeMethod.account_number || '')}
                        >
                          {copied ? 'تم النسخ! ✓' : 'نسخ الرقم 📋'}
                        </Button>
                      </div>

                      {activeMethod.instructions && (
                        <p className="text-[11px] text-slate-500 leading-relaxed bg-white/60 dark:bg-slate-800/60 p-2 rounded-xl">
                          💡 {activeMethod.instructions}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      يرجى التواصل مع الدعم الفني للحصول على رقم المحفظة النشط.
                    </p>
                  )}

                  <div className="pt-2 border-t border-emerald-200/40 dark:border-emerald-900/30 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <span>👉</span>
                    <span>قم بالتحويل على هذا الرقم ثم اضغط أدناه لتسجيل إشعار السداد.</span>
                  </div>
                </div>
              )}

              {/* Step 2: Register Payment Button & Form */}
              <div className="pt-1">
                <Button
                  type="button"
                  className={`w-full h-11 rounded-2xl font-black text-xs transition-all shadow-xs ${
                    hasRequestedNumber
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer'
                  }`}
                  onClick={handleToggleForm}
                >
                  {showForm
                    ? 'إغلاق نموذج السداد'
                    : hasRequestedNumber
                    ? '📝 تسجيل إشعار السداد الآن'
                    : 'تسجيل إشعار السداد (يتطلب طلب الرقم أولاً)'}
                </Button>
              </div>

              {showForm && hasRequestedNumber && (
                <form action={action} className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4 animate-fadeIn">
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
                      defaultValue={activeMethod?.method_key || 'vodafone_cash'}
                      options={
                        availableMethods.length > 0
                          ? availableMethods.map((m) => ({
                              value: m.method_key || 'vodafone_cash',
                              label: m.method_name || m.method_key || 'فودافون كاش',
                            }))
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
            </>
          )}

          {currentBalance <= 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 text-center text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              لا توجد أي مديونية أو مستحقات عمولات مطلوبة للسداد حالياً.
            </div>
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