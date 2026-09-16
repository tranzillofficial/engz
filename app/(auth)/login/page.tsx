'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';

const initialState = { error: undefined, success: false };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setGoogleError('تعذر فتح تسجيل الدخول بجوجل. تأكد من تفعيل Google في إعدادات Supabase.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-card animate-fade-in">
      <div className="auth-card-header">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-50 text-[#FA3802] text-xl mb-3">↗</span>
        <h1 className="auth-title">أهلاً بعودتك</h1>
        <p className="auth-subtitle">سجّل دخولك وتابع طلباتك في أي وقت</p>
      </div>

      {(state?.error || googleError) && (
        <div className="auth-alert auth-alert-error" role="alert">
          <span>⚠️</span><span>{state?.error || googleError}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="google-button"
      >
        <span className="google-icon" aria-hidden="true">G</span>
        <span>{googleLoading ? 'جاري فتح Google...' : 'المتابعة باستخدام Google'}</span>
      </button>

      <div className="auth-divider"><span>أو البريد الإلكتروني</span></div>

      <form action={formAction} className="auth-form" noValidate>
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">البريد الإلكتروني</label>
          <input id="login-email" name="email" type="email" autoComplete="email" required placeholder="name@example.com" className="form-input" dir="ltr" />
        </div>
        <div className="form-group">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="login-password" className="form-label">كلمة المرور</label>
            <span className="text-[11px] text-slate-400">6 أحرف على الأقل</span>
          </div>
          <input id="login-password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" className="form-input" dir="ltr" />
        </div>
        <button type="submit" disabled={isPending} className="btn-primary btn-full">
          {isPending ? <span className="btn-loading"><span className="spinner" aria-hidden="true" /> جاري تسجيل الدخول...</span> : 'تسجيل الدخول'}
        </button>
      </form>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <span>مش عندك حساب؟</span>
        <Link href="/register" className="font-black text-[#FA3802] hover:underline">إنشاء حساب جديد</Link>
      </div>

      <div className="auth-divider"><span>أو بدون حساب</span></div>
      <Link href="/orders/new" className="btn-outline btn-full text-center">🚀 اطلب توصيل فوري كزائر</Link>
      <Link href="/join-driver" className="text-center text-xs text-[#FA3802] font-bold hover:underline py-1">🛵 تريد العمل معنا كطيار؟ قدّم طلب انضمام الآن ›</Link>

      <style>{`
        .auth-card { width:100%; background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:var(--radius-xl); padding:clamp(1.25rem,4vw,2rem); box-shadow:var(--shadow-xl); display:flex; flex-direction:column; gap:1rem; }
        .auth-card-header { text-align:center; margin-bottom:.25rem; }
        .auth-title { font-size:1.5rem; font-weight:800; color:var(--color-text); margin:0 0 .375rem; letter-spacing:-.02em; }
        .auth-subtitle { font-size:.9rem; color:var(--color-text-secondary); margin:0; }
        .auth-alert { display:flex; align-items:center; gap:.5rem; padding:.75rem 1rem; border-radius:var(--radius-md); font-size:.875rem; font-weight:500; }
        .auth-alert-error { background:var(--color-danger-light); color:var(--color-danger); border:1px solid rgba(225,112,85,.2); }
        .auth-form { display:flex; flex-direction:column; gap:1rem; }
        .form-group { display:flex; flex-direction:column; gap:.375rem; }
        .form-label { font-size:.875rem; font-weight:700; color:var(--color-text); }
        .form-input { width:100%; padding:.8rem 1rem; border:1.5px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-bg); color:var(--color-text); font-size:.95rem; font-family:var(--font-family); transition:border-color .2s,box-shadow .2s,transform .15s; }
        .form-input::placeholder { color:var(--color-text-muted); }
        .form-input:focus { outline:none; border-color:#FA3802; box-shadow:0 0 0 3px rgba(250,56,2,.12); }
        .btn-primary { display:inline-flex; align-items:center; justify-content:center; padding:.8125rem 1.5rem; background:linear-gradient(135deg,#FD7B03,#FA3802); color:white; border:none; border-radius:var(--radius-md); font-size:.95rem; font-weight:800; font-family:var(--font-family); cursor:pointer; transition:transform .15s,box-shadow .15s,opacity .15s; box-shadow:0 4px 14px rgba(250,56,2,.22); text-decoration:none; }
        .btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(250,56,2,.3); }
        .btn-primary:disabled { opacity:.65; cursor:not-allowed; }
        .btn-outline { display:inline-flex; align-items:center; justify-content:center; padding:.8125rem 1.5rem; background:transparent; color:#FA3802; border:1.5px solid #FA3802; border-radius:var(--radius-md); font-size:.95rem; font-weight:700; font-family:var(--font-family); cursor:pointer; transition:background .15s,transform .15s; text-decoration:none; }
        .btn-outline:hover { background:#FFF4ED; transform:translateY(-1px); }
        .btn-full { width:100%; }
        .google-button { width:100%; display:flex; align-items:center; justify-content:center; gap:.75rem; min-height:48px; padding:.75rem 1rem; background:white; color:#1f2937; border:1px solid #dfe3e8; border-radius:var(--radius-md); font-size:.9rem; font-weight:800; cursor:pointer; transition:background .15s,box-shadow .15s,transform .15s; }
        .google-button:hover:not(:disabled) { background:#fafafa; box-shadow:0 5px 18px rgba(15,23,42,.08); transform:translateY(-1px); }
        .google-button:focus-visible,.btn-outline:focus-visible,.btn-primary:focus-visible { outline:2px solid rgba(250,56,2,.55); outline-offset:3px; }
        .google-button:disabled { opacity:.65; cursor:wait; }
        .google-icon { width:26px; height:26px; border-radius:50%; display:grid; place-items:center; font-size:15px; font-weight:900; color:#4285F4; border:1px solid #e5e7eb; }
        .btn-loading { display:flex; align-items:center; gap:.5rem; }
        .spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.35); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .auth-divider { display:flex; align-items:center; gap:.75rem; font-size:.8rem; color:var(--color-text-muted); text-align:center; }
        .auth-divider::before,.auth-divider::after { content:''; flex:1; height:1px; background:var(--color-border); }
      `}</style>
    </div>
  );
}
