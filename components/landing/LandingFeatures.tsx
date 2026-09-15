'use client';

export default function LandingFeatures() {
  return (
    <section id="features" className="py-8 md:py-12 bg-white relative scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Banner Strip (Compact, sleek, horizontal strip matching reference) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.04)] p-2.5 sm:p-3 overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-2">
          
          {/* 1. Engz Orange Delivery & Pricing Card (RTL: Right side) */}
          <div className="w-full lg:w-[45%] xl:w-[42%] bg-gradient-to-r from-[#FD7B03] via-[#FA4A02] to-[#FA3802] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between shadow-sm shrink-0">
            {/* Ambient subtle glow */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

            {/* Top Logo */}
            <div className="flex items-center justify-end relative z-10 mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/images/logo-name.svg"
                alt="Engz"
                className="h-5 sm:h-6 w-auto object-contain"
              />
            </div>

            {/* Middle Row: Pricing info on left + Bike on right */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              
              {/* Pricing Content */}
              <div className="flex flex-col items-start text-right">
                <span className="text-white text-xs sm:text-sm font-bold tracking-tight mb-1">
                  التوصيل من
                </span>

                {/* Price White Pill */}
                <div className="relative inline-flex items-center">
                  {/* Left Burst */}
                  <span className="hidden sm:inline-block text-white/80 text-xs mr-1 select-none font-mono">
                    ˏˋ
                  </span>

                  <div className="bg-white px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-sm inline-flex items-center gap-1.5">
                    <span className="text-xl sm:text-2xl lg:text-[26px] font-black text-[#FA3802] tracking-tight leading-none">
                      20 إلى 30
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#FA3802]">
                      جنيه
                    </span>
                  </div>

                  {/* Right Burst */}
                  <span className="hidden sm:inline-block text-white/80 text-xs ml-1 select-none font-mono">
                    ˎˊ
                  </span>
                </div>

                {/* Range Pill */}
                <div className="mt-2 inline-flex items-center gap-1 bg-white/95 px-2.5 py-1 rounded-full shadow-2xs text-[11px] sm:text-xs font-bold text-slate-800">
                  <span className="text-xs text-[#FA3802]">📍</span>
                  <span>توصيل قريب ضمن نطاق 2 - 3 كم</span>
                </div>
              </div>

              {/* Courier on Bicycle (Compact size with bike.png) */}
              <div className="relative shrink-0 w-28 sm:w-36 md:w-40 lg:w-40 flex items-center justify-center">
                {/* Subtle speed lines */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 space-y-1 opacity-80 pointer-events-none hidden sm:block">
                  <div className="w-6 h-0.5 bg-white rounded-full translate-x-2" />
                  <div className="w-10 h-0.5 bg-white/90 rounded-full" />
                  <div className="w-5 h-0.5 bg-white/70 rounded-full translate-x-1" />
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/bike.png"
                  alt="طيار إنجز"
                  className="w-full h-auto max-h-28 sm:max-h-32 object-contain -scale-x-100 drop-shadow-sm select-none"
                  loading="eager"
                />
              </div>
            </div>

            {/* Bottom Note */}
            <div className="pt-2 mt-2 text-center text-[11px] sm:text-xs font-medium text-white/90 tracking-wide border-t border-white/15 relative z-10">
              نطاقات قريبة • فرص أفضل للطيارين
            </div>
          </div>

          {/* 2. Four Feature Items (RTL: Left side, 4 compact columns with dividers) */}
          <div className="w-full lg:w-[55%] xl:w-[58%] grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-gray-100/90 py-2 sm:py-3 px-1 sm:px-2 items-center">
            
            {/* Feature 1: أسعار مناسبة (Wallet) */}
            <div className="p-2 sm:p-3 flex flex-col items-center text-center group hover:bg-orange-50/40 rounded-2xl transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/wallet.png"
                  alt="أسعار مناسبة"
                  className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-xs select-none"
                  loading="lazy"
                />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                أسعار مناسبة
              </h4>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">
                أفضل قيمة مقابل الخدمة
              </p>
            </div>

            {/* Feature 2: توصيل سريع (Fast Lightning) */}
            <div className="p-2 sm:p-3 flex flex-col items-center text-center group hover:bg-orange-50/40 rounded-2xl transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/fast.png"
                  alt="توصيل سريع"
                  className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-xs select-none"
                  loading="lazy"
                />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                توصيل سريع
              </h4>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">
                لأن وقتك مهم
              </p>
            </div>

            {/* Feature 3: أمان وموثوقية (Safe Shield) */}
            <div className="p-2 sm:p-3 flex flex-col items-center text-center group hover:bg-orange-50/40 rounded-2xl transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/safe.png"
                  alt="أمان وموثوقية"
                  className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-xs select-none"
                  loading="lazy"
                />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                أمان وموثوقية
              </h4>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">
                بياناتك وطلباتك في أمان
              </p>
            </div>

            {/* Feature 4: دعم العملاء (Support Headset) */}
            <div className="p-2 sm:p-3 flex flex-col items-center text-center group hover:bg-orange-50/40 rounded-2xl transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/support.png"
                  alt="دعم العملاء"
                  className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-xs select-none"
                  loading="lazy"
                />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                دعم العملاء
              </h4>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">
                متواجدين دائماً لمساعدتك
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
