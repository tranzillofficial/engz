'use client';

import Link from 'next/link';

export default function LandingHero() {
  return (
    <section id="top" className="relative pt-20 md:pt-24 lg:pt-28 pb-12 lg:pb-16 w-full overflow-hidden bg-white">
      <div className="absolute top-10 right-10 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-orange-50/50 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-4">
          <div className="w-full lg:w-[42%] space-y-6 text-right z-10 lg:pr-4">
            <div className="flex items-center justify-start gap-3 w-full">
              <div className="inline-flex flex-col items-start">
                <div className="inline-flex items-center gap-2 text-lg sm:text-xl font-black text-slate-800 tracking-wide">
                  <span>أسرع</span><span className="text-orange-400">•</span><span>أسهل</span><span className="text-orange-400">•</span><span>أضمن</span>
                </div>
                <svg width="100" height="14" viewBox="0 0 100 14" fill="none" className="mt-0.5"><path d="M4 10C30 3 70 3 96 10" stroke="#FA3802" strokeWidth="3.5" strokeLinecap="round" /></svg>
              </div>

              <div className="inline-flex items-center shrink-0">
                <div className="flex items-center gap-3">
                  <img src="/assets/images/engz-logo.svg" alt="ENgz" className="h-16 sm:h-24 w-auto object-contain drop-shadow-2xs" />
                  <div className="hidden sm:block text-right">
                    <div className="text-xl font-black tracking-tight text-slate-900">ENgz</div>
                    <div className="text-xs font-semibold text-slate-500 mt-1 whitespace-nowrap">وصل أي حاجة في أي وقت</div>
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
              كل طلباتك .. <span className="bg-gradient-to-l from-[#FD7B03] to-[#FA3802] bg-clip-text text-transparent">نوصلها لك</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-normal leading-relaxed max-w-lg">
              من أي مكان وفي أي وقت، منصة توصيل ويب متكاملة، سريعة وآمنة لتوصيل أي شيء.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link href="/orders/new" className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white text-base sm:text-lg font-bold shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/45 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-center">
                <span className="text-xl">⚡</span><span>اطلب أي حاجة الآن — بدون حساب</span>
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors shrink-0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-180 group-hover:-translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></span>
              </Link>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-1.5"><span>تطبيق ويب سريع للموبايل</span></div><span className="text-gray-300">•</span><div className="flex items-center gap-1.5 text-emerald-600 font-semibold"><span>✓</span><span>توصيل فوري لأي مكان</span></div>
            </div>
          </div>

          <div className="w-full lg:w-[58%] relative overflow-hidden flex items-center justify-center">
            <div className="relative w-full overflow-hidden">
              <img src="/assets/images/hero.png" alt="ENgz Delivery Service" className="w-full h-auto object-cover md:object-contain block drop-shadow-sm select-none" loading="eager" />
              <div className="hidden lg:block absolute inset-y-0 right-0 w-36 bg-gradient-to-l from-white via-white/70 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-x-0 bottom-0 h-12 sm:h-16 bg-gradient-to-t from-white via-white/50 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/40 to-transparent pointer-events-none z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
