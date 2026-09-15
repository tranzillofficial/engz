'use client';

interface CategoryCard {
  id: string;
  title: string;
  subtitle: string;
  imageSrc: string;
}

const CATEGORIES: CategoryCard[] = [
  {
    id: 'free',
    title: 'طلبات حرة',
    subtitle: 'أي شيء تريده نوصله لك',
    imageSrc: '/assets/images/free-orders.png',
  },
  {
    id: 'vegetables',
    title: 'خضار وفواكه',
    subtitle: 'خضار وفواكه طازجة من السوق مباشرة',
    imageSrc: '/assets/images/market.png',
  },
  {
    id: 'bread',
    title: 'عيش',
    subtitle: 'طازج يومياً من أفضل المخابز',
    imageSrc: '/assets/images/bread.png',
  },
  {
    id: 'pharmacy',
    title: 'صيدلية',
    subtitle: 'أدويتك في وقتها وبكل أمان',
    imageSrc: '/assets/images/pills.png',
  },
  {
    id: 'supermarket',
    title: 'مشتريات',
    subtitle: 'كل احتياجاتك اليومية من السوبرماركت',
    imageSrc: '/assets/images/vegetables.png',
  },
];

export default function LandingCategories() {
  return (
    <section className="py-16 md:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            طلباتك المختلفة في{' '}
            <span className="bg-gradient-to-l from-[#FD7B03] to-[#FA3802] bg-clip-text text-transparent">
              طلب واحد
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 font-medium">
            اجمع أكثر من نوع طلب في سلة واحدة ووفر وقتك وجهدك
          </p>
        </div>

        {/* 5 Non-clickable Showcase Cards (No center icon badges, no link) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-center select-none"
            >
              {/* Image Container with Soft Background */}
              <div className="relative w-full h-44 bg-gradient-to-b from-gray-50/80 to-gray-100/40 p-4 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.imageSrc}
                  alt={cat.title}
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>

              {/* Card Body */}
              <div className="pt-5 pb-6 px-4 flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-slate-900">
                  {cat.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {cat.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
