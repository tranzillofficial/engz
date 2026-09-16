'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction } from '@/lib/actions/auth';

const initialState = { error: undefined, success: false };

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <div className="auth-card animate-fade-in">
      <div className="auth-card-header">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-50 text-[#FA3802] text-xl mb-3">✦</span>
        <h1 className="auth-title">أنشئ حسابك في ENgz</h1>
        <p className="auth-subtitle">احفظ طلباتك وتابع التوصيل بسهولة</p>
      </div>

      {state?.error && <div className="auth-alert auth-alert-error" role="alert"><span>⚠️</span><span>{state.error}</span></div>}

      <form action={formAction} className="auth-form" noValidate>
        <div className="form-group">
          <label htmlFor="register-name" className="form-label">الاسم بالكامل</label>
          <input id="register-name" name="full_name" type="text" autoComplete="name" required placeholder="محمد أحمد" className="form-input" />
        </div>
        <div className="form-group">
          <label htmlFor="register-email" className="form-label">البريد الإلكتروني</label>
          <input id="register-email" name="email" type="email" autoComplete="email" required placeholder="name@example.com" className="form-input" dir="ltr" />
        </div>
        <div className="form-group">
          <label htmlFor="register-phone" className="form-label">رقم الهاتف <span className="text-slate-400 font-normal">(اختياري)</span></label>
          <input id="register-phone" name="phone" type="tel" autoComplete="tel" placeholder="01012345678" className="form-input" dir="ltr" inputMode="numeric" />
        </div>
        <div className="form-group">
          <label htmlFor="register-password" className="form-label">كلمة المرور</label>
          <input id="register-password" name="password" type="password" autoComplete="new-password" required minLength={6} placeholder="6 أحرف على الأقل" className="form-input" dir="ltr" />
        </div>
        <button type="submit" disabled={isPending} className="btn-primary btn-full">
          {isPending ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
        </button>
      </form>

      <div className="auth-divider"><span>أو</span></div>
      <Link href="/login" className="btn-outline btn-full text-center">لديك حساب بالفعل؟ تسجيل الدخول</Link>
      <p className="text-[11px] leading-5 text-center text-slate-400">بإنشاء الحساب، أنت توافق على الشروط وسياسة الخصوصية.</p>
    </div>
  );
}
