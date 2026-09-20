'use client';

import { useState, useTransition } from 'react';
import { Card, Button, Input, Alert } from '@/components';
import { createAgentDriverAction } from '@/lib/actions/agent-drivers';

export function AgentAddDriverCard() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);

  return (
    <Card className="p-5 sm:p-6 space-y-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-[#FA3802] font-black flex items-center justify-center text-sm">
            ➕
          </span>
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
            إضافة طيار جديد للوكالة
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          سجل بيانات الطيار الأساسية وسيتم تزويدك برابط مباشر لإرسال بيانات الدخول له عبر واتساب.
        </p>
      </div>

      {result?.error && <Alert type="error">{result.error}</Alert>}
      {result?.success && (
        <Alert type="success">
          <div className="space-y-2">
            <p className="font-bold">تم تسجيل حساب الطيار بنجاح!</p>
            {result.whatsappUrl && (
              <a
                href={result.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <span>إرسال بيانات الدخول عبر واتساب</span>
                <span>💬</span>
              </a>
            )}
          </div>
        </Alert>
      )}

      <form
        action={(formData) => {
          setResult(null);
          startTransition(async () => {
            const res = await createAgentDriverAction(formData);
            setResult(res);
          });
        }}
        className="space-y-3 font-sans"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              الاسم الرباعي <span className="text-red-500">*</span>
            </label>
            <Input name="full_name" placeholder="مثال: أحمد محمد علي حسن" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              رقم الهاتف <span className="text-red-500">*</span>
            </label>
            <Input name="phone" placeholder="01xxxxxxxxx" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              السن <span className="text-red-500">*</span>
            </label>
            <Input name="age" type="number" min="18" max="70" placeholder="مثال: 24" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              وسيلة التوصيل <span className="text-red-500">*</span>
            </label>
            <select
              name="vehicle_type"
              required
              className="w-full h-11 px-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30"
            >
              <option value="موتوسيكل">موتوسيكل</option>
              <option value="سكوتر">سكوتر</option>
              <option value="دراجة">دراجة / عجلة</option>
              <option value="سيارة">سيارة</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            العنوان بالتفصيل <span className="text-red-500">*</span>
          </label>
          <Input name="address" placeholder="المنطقة، الشارع، علامة مميزة" required />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            كلمة المرور المؤقتة <span className="text-red-500">*</span>
          </label>
          <Input
            name="password"
            type="text"
            minLength={6}
            defaultValue="engz123456"
            placeholder="كلمة المرور للدخول"
            required
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            يمكن للطيار تغييرها بعد أول تسجيل دخول.
          </span>
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-2xl bg-[#FA3802] text-white font-black text-xs hover:bg-[#e03102] transition-colors"
          disabled={isPending}
        >
          {isPending ? 'جاري التسجيل...' : 'تسجيل الطيار وإنشاء الحساب'}
        </Button>
      </form>
    </Card>
  );
}