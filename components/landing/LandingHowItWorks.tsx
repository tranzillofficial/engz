'use client';

const STEPS = [
  {
    step: '1',
    title: 'أنشئ طلبك',
    desc: 'اكتب تفاصيل طلبك وحدد الأصناف والملاحظات بدون أي تعقيد.',
    image: '/assets/images/create.png',
  },
  {
    step: '2',
    title: 'حدد الموقع',
    desc: 'حدد مكان الاستلام بدقة .',
    image: '/assets/images/location.png',
  },
  {
    step: '3',
    title: 'تابع واستلم',
    desc: 'شاهد حالة الطلب لحظياً وتواصل مع الطيار مباشرة .',
    image: '/assets/images/track.png',
  },
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-[#FCFDFE] relative overflow-hidden scroll-mt-24">
      {/* Soft Background Accent */}
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-orange-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

          {/* Steps Column (RTL Right side - 6 cols) */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-right order-2 lg:order-1">
            {/* Header / Title */}
            <div>
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="w-8 h-1 bg-[#FA3802] rounded-full" />
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  كيف يعمل؟
                </h2>
              </div>
              <p className="text-lg sm:text-xl text-slate-500 font-medium">
                طلبك في 3 خطوات بسيطة
              </p>
            </div>

            {/* 3 Step Items with 3D Icons */}
            <div className="space-y-4 sm:space-y-5 pt-1">
              {STEPS.map((item) => (
                <div
                  key={item.step}
                  className="group flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-md hover:border-orange-200 transition-all duration-200"
                >
                  {/* Step Number Badge */}
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#FD7B03] to-[#FA3802] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {item.step}
                  </div>

                  {/* 3D Illustrated Icon */}
                  <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-13 h-13 sm:w-15 sm:h-15 object-contain drop-shadow-xs select-none"
                      loading="lazy"
                    />
                  </div>

                  {/* Step Text Content */}
                  <div className="flex-1 text-right">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-[#FA3802] transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm sm:text-base text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phone Mockups Visual (RTL Left side - 6 cols) */}
          <div className="lg:col-span-6 flex justify-center items-center order-1 lg:order-2">
            <div className="relative w-full max-w-lg drop-shadow-xl hover:scale-102 transition-transform duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/images/how-it-work-section.png"
                alt="كيف يعمل تطبيق إنجز - شاشات إضافة الأصناف والخريطة"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
