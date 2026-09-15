'use client';

import { useActionState } from 'react';
import { adminLoginAction } from '@/lib/actions/auth';
import Image from 'next/image';

const initialState = { error: undefined, success: false };

export default function EngzAdminLoginPage() {
  const [state, formAction, isPending] = useActionState(adminLoginAction, initialState);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        
        {/* Header with Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-1">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            بوابة الإدارة المركزية
          </h1>
          <p className="text-xs text-slate-400">
            منظومة إنجز • تسجيل دخول المشرفين والمديرين
          </p>
        </div>

        {/* Error Notification */}
        {state?.error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-bold text-rose-400 flex items-center gap-2">
            <span>⚠️</span>
            <span>{state.error}</span>
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              البريد الإلكتروني للإدارة
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@engz.shop"
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FA3802] focus:border-transparent transition-all"
              dir="ltr"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              كلمة المرور المشفرة
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FA3802] focus:border-transparent transition-all"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FD7B03] to-[#FA3802] hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-orange-500/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري التحقق والدخول...</span>
              </>
            ) : (
              <span>تسجيل الدخول للوحة التحكم</span>
            )}
          </button>
        </form>

        {/* Security badge footer */}
        <div className="pt-2 text-center border-t border-slate-800/80">
          <p className="text-[11px] text-slate-500 font-medium">
            🔒 اتصال مشفر وآمن • مخصص للأدمن فقط
          </p>
        </div>

      </div>
    </div>
  );
}
