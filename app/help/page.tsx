import Link from 'next/link';

export const metadata = {
  title: 'مركز المساعدة | ENgz',
  description: 'إجابات سريعة عن طلبات ENgz والتوصيل والتواصل مع الطيار.',
};

const faqs = [
  ['كيف أطلب؟', 'اكتب الأصناف التي تريدها، أضف الكميات والملاحظات، ثم أدخل رقم الهاتف وعنوان التوصيل وأرسل الطلب.'],
  ['هل أحتاج إلى إنشاء حساب؟', 'يمكنك إرسال الطلب من صفحة الطلب الجديدة بدون تسجيل مسبق.'],
  ['هل أستطيع طلب أكثر من صنف؟', 'نعم، يمكنك إضافة أي عدد من الأصناف داخل نفس الطلب مع كمية وملاحظات لكل صنف.'],
  ['كيف يتواصل معي الطيار؟', 'بعد قبول الطلب، يستخدم الطيار بيانات التواصل المرتبطة بالطلب للتنسيق معك عند الحاجة.'],
  ['ماذا أفعل إذا كان هناك خطأ في الطلب؟', 'احتفظ بتفاصيل الطلب وتواصل مع فريق ENgz من خلال وسيلة التواصل المتاحة، وسنراجع الحالة والتفاصيل المرتبطة بها.'],
  ['هل أستطيع حفظ بياناتي لطلب قادم؟', 'نعم، يمكنك تفعيل خيار حفظ رقم الهاتف والعنوان محلياً من نموذج الطلب لتسهيل الطلبات التالية على نفس الجهاز.'],
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:py-12" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-[#FA3802] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 focus-visible:ring-offset-2 rounded-lg px-1">
          ← العودة إلى ENgz
        </Link>
        <div className="mt-5 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <header className="p-6 sm:p-9 bg-gradient-to-l from-[#FFF4ED] to-white border-b border-orange-100">
            <p className="text-xs font-bold text-[#FA3802] mb-1">ENgz Help Center</p>
            <h1 className="text-2xl font-black text-slate-900">مركز المساعدة</h1>
            <p className="text-sm text-slate-600 mt-2">كل الأسئلة الأساسية عن الطلب والتوصيل في مكان واحد.</p>
            <Link href="/orders/new" className="inline-flex mt-5 px-4 py-2.5 rounded-xl bg-[#FA3802] text-white text-sm font-extrabold hover:bg-[#e03102] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 focus-visible:ring-offset-2 transition-colors">إنشاء طلب جديد</Link>
          </header>
          <div className="p-6 sm:p-9 space-y-3">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group rounded-2xl border border-gray-100 bg-gray-50/70 p-4 open:bg-white open:border-orange-100">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-sm font-extrabold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 focus-visible:ring-offset-2 rounded-lg">
                  <span>{question}</span><span className="text-[#FA3802] text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm leading-7 text-slate-600 mt-3">{answer}</p>
              </details>
            ))}
          </div>
          <footer className="px-6 sm:px-9 pb-7 flex flex-wrap gap-4 text-xs font-bold">
            <Link href="/terms" className="text-[#FA3802] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 focus-visible:ring-offset-2 rounded">الشروط والأحكام</Link>
            <Link href="/privacy" className="text-[#FA3802] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 focus-visible:ring-offset-2 rounded">الخصوصية</Link>
          </footer>
        </div>
      </div>
    </main>
  );
}
