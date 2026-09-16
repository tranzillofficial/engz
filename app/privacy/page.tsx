import Link from 'next/link';

export const metadata = {
  title: 'الخصوصية | ENgz',
  description: 'سياسة الخصوصية الخاصة بمنصة ENgz.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:py-12" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-[#FA3802] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 focus-visible:ring-offset-2 rounded-lg px-1">
          ← العودة إلى ENgz
        </Link>
        <article className="mt-5 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-9 space-y-7">
          <header className="border-b border-gray-100 pb-5">
            <p className="text-xs font-bold text-[#FA3802] mb-1">ENgz</p>
            <h1 className="text-2xl font-black text-slate-900">سياسة الخصوصية</h1>
            <p className="text-sm text-slate-500 mt-2">آخر تحديث: 17 سبتمبر 2026</p>
          </header>

          <section><h2 className="text-base font-black text-slate-900 mb-2">ما البيانات التي نجمعها؟</h2><p className="text-sm leading-7 text-slate-600">قد نجمع بيانات التواصل التي تدخلها مثل الاسم ورقم الهاتف، وبيانات الطلب والعنوان، ومعلومات الموقع الجغرافي عندما تختار استخدام تحديد الموقع.</p></section>
          <section><h2 className="text-base font-black text-slate-900 mb-2">كيف نستخدم البيانات؟</h2><p className="text-sm leading-7 text-slate-600">تُستخدم البيانات لإنشاء الطلب وتنفيذه، التواصل معك بشأنه، تحسين تجربة الاستخدام، وإدارة العمليات والدعم ومنع إساءة استخدام الخدمة.</p></section>
          <section><h2 className="text-base font-black text-slate-900 mb-2">الموقع الجغرافي</h2><p className="text-sm leading-7 text-slate-600">لا يتم طلب موقع جهازك إلا عند استخدام ميزة تحديد الموقع. يتم استخدام الإحداثيات المرتبطة بالطلب للمساعدة في تنفيذ التوصيل وعرض الموقع عند الحاجة.</p></section>
          <section><h2 className="text-base font-black text-slate-900 mb-2">الاحتفاظ بالبيانات</h2><p className="text-sm leading-7 text-slate-600">نحتفظ بالبيانات بالقدر اللازم لتشغيل الخدمة، معالجة الطلبات، حل النزاعات، والوفاء بالالتزامات القانونية والتشغيلية ذات الصلة.</p></section>
          <section><h2 className="text-base font-black text-slate-900 mb-2">مشاركة البيانات</h2><p className="text-sm leading-7 text-slate-600">قد تتم مشاركة بيانات الطلب الضرورية مع الطيار أو الأطراف اللازمة لتنفيذ التوصيل. لا يتم نشر بياناتك الشخصية للعامة لمجرد استخدامك للمنصة.</p></section>
          <section><h2 className="text-base font-black text-slate-900 mb-2">حقوقك والتواصل معنا</h2><p className="text-sm leading-7 text-slate-600">إذا كان لديك سؤال حول بياناتك أو تريد طلب تصحيحها، تواصل معنا من خلال <Link href="/help" className="text-[#FA3802] font-bold hover:underline">مركز المساعدة</Link>. قد نطلب معلومات إضافية للتحقق من الطلب.</p></section>
        </article>
      </div>
    </main>
  );
}
