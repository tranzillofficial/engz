'use client';

import { useState } from 'react';
import Link from 'next/link';

interface GuestAccountConversionCardProps {
  phone?: string;
}

export default function GuestAccountConversionCard({ phone }: GuestAccountConversionCardProps) {
  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-[#FD7B03] flex items-center justify-center shrink-0 text-xl font-bold">
          ⚡
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-white">
            حابب تحفظ عنوانك وسجل طلباتك؟
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            أنشئ حسابك الآن لطلب أسرع في المرات القادمة بدون إعادة إدخال عنوانك كل مرة.
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400 font-mono" dir="ltr">
          {phone ? `📱 ${phone}` : 'سجل حسابك'}
        </span>
        <Link
          href={`/register${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white text-xs font-bold shadow-md hover:scale-105 transition-transform"
        >
          إنشاء حساب مجاناً ➔
        </Link>
      </div>
    </div>
  );
}
