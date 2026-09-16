import Link from 'next/link';

export const metadata = {
  title: 'الشروط والأحكام | ENgz',
  description: 'الشروط والأحكام الخاصة باستخدام منصة ENgz.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:py-12" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-[#FA3802] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 focus-visible:ring-offset-2 rounded-lg px-1">
          ← العودة إلى ENgz
        </Link>
        <article className="mt-5 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-9 space-y-7">
          <header className="border-b border-gray-100 pb-5">
            <p className="text-xs font-bold text-[#FA3802] mb-1">ENgz</p>
            <h1 className="text-2xl font-black text-slate-900">الشروط والأحكام</h1>
            <p className="text-sm text-slate-500 mt-2">آخر تحديث: 17 سبتمبر 2026</p>
          </header>

          <section><h2 className="text-base font-black text-slate-900 mb-2">1. استخدام المنصة</h2><p className="text-sm leading-7 text-slate-600">تتيح ENgz للمستخدم إرسال طلبات توصيل وشراء حرة، وربط الطلب بطَيّار متاح لتنفيذه. باستخدام المنصة، تقر بأن البيانات التي تقدمها صحيحة وأنك ستستخدم الخدمة بطريقة قانونية ومسؤولة.</p></section>
          <section><h2 className="text-base font-black text-slate-900 mb-2">2. الطلبات والمشتريات</h2><p className="text-sm leading-7 text-slate-600">يجب أن تكون تفاصيل الأصناف والكميات والعنوان وبيانات التواصل واضحة قدر الإمكان. قد يتواصل الطيار معك لتأكيد التفاصيل أو السعر أو توافر الصنف قبل إتمام الشراء.</p></section>
          <section><h2 className="text-base font-black text-slate-900 mb-2">3. الأسعار والرسوم</h2><p className="text-sm leading-7 text-slate-600">رسوم التوصيل أو أي مبالغ مرتبطة بالطلب يتم عرضها أو تأكيدها وفق آلية التسعير المعمول بها وقت تنفيذ الطلب. قد تختلف تكلفة الأصناف نفسها حسب المتجر والتوافر والأسعار الفعلية.</p></section>
          <section><h2 className="text-base font-black text-slate-900 mb-2">4. مسؤولية المستخدم</h2><p className="text-sm leading-7 text-slate-600">المستخدم مسؤول عن صحة رقم الهاتف والعنوان ومحتوى الطلب. لا يجوز استخدام المنصة لطلب مواد أو خدمات غير قانونية أو تعريض الطيار أو أي طرف آخر للخطر.</p></section>
          <section><h2 className="text-base font-black text-slate-900 mb-2">5. تنفيذ الطلب</h2><p className="text-sm leading-7 text-slate-600">ENgz منصة تنسيق للتوصيل وليست المتجر أو الشركة المصنعة للأصناف التي يطلبها المستخدم. قد يتعذر تنفيذ الطلب بسبب عدم التوافر أو ظروف التشغيل أو عدم وجود طيار مناسب.</p></section>
          <section><h2 className="text-base font-black text-slate-900 mb-2">6. التعديلات والتواصل</h2><p className="text-sm leading-7 text-slate-600">قد يتم تحديث هذه الشروط عند الحاجة. استمرار استخدام المنصة بعد نشر التحديثات يعني الاطلاع عليها. للاستفسارات، استخدم <Link href="/help" className="text-[#FA3802] font-bold hover:underline">مركز المساعدة</Link>.</p></section>
        </article>
      </div>
    </main>
  );
}
