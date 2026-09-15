'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { driverLoginAction } from '@/lib/actions/auth';

export default function DriverLoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/\s/g, '');
    if (!cleanPhone) {
      setError('يرجى إدخال رقم الهاتف المسجل');
      return;
    }
    if (!password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    const formData = new FormData();
    formData.set('phone', cleanPhone);
    formData.set('password', password);

    startTransition(async () => {
      const res = await driverLoginAction(null, formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans" dir="rtl">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10 text-center space-y-4">
        <Link href="/" className="inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/logo-name.svg"
            alt="Engz"
            className="h-10 w-auto mx-auto drop-shadow-md"
          />
        </Link>

        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xs font-black">
            <span>🛵</span>
            <span>بوابة طياري إنجز الخاصة</span>
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
            تسجيل دخول الطيار
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            سجل دخولك برقم هاتفك للبدء في استقبال وتنفيذ الطلبات فوراً
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-700/60 space-y-5">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رقم الهاتف (المسجل في الحساب)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FA3802] focus:border-[#FA3802] transition"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FA3802] focus:border-[#FA3802] transition"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white text-sm font-black shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري التحقق والدخول...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول واستقبال الطلبات</span>
                  <span className="rotate-180">←</span>
                </>
              )}
            </button>
          </form>

          {/* Help Box */}
          <div className="pt-4 border-t border-slate-700/60 text-center space-y-2 text-xs text-slate-400">
            <p>
              لم تنضم لفريق الطيارين بعد؟{' '}
              <Link href="/join-driver" className="text-orange-400 font-bold hover:underline">
                قدم طلب انضمام الآن
              </Link>
            </p>
            <p className="text-[11px] text-slate-500">
              🔒 يتم إرسال بيانات الدخول عبر واتساب مباشرة من الإدارة بعد الموافقة على طلبك.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
