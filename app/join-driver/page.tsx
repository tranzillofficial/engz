'use client';

import { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { submitDriverApplicationAction, DriverApplicationState } from '@/lib/actions/driver-applications';

const EGYPTIAN_PHONE = /^(010|011|012|015)\d{8}$/;

const VEHICLE_OPTIONS = [
  { id: 'سكوتر', label: 'سكوتر', icon: '🛴', desc: 'سكوتر كهربائي أو عادي' },
  { id: 'دراجة هوائية', label: 'عجلة / دراجة هوائية', icon: '🚲', desc: 'لتوصيل خفيف وسريع داخل النطاق' },
];

// Helper to compress camera photos on client-side before sending
async function compressImage(file: File, maxWidth = 1600, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export default function JoinDriverPage() {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [vehicleType, setVehicleType] = useState('سكوتر');

  // 3 Images
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);

  const [backImage, setBackImage] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [personalPhoto, setPersonalPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // File Handlers with auto-compression
  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File) => void,
    previewSetter: (url: string) => void,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size < 10000) {
      setError(`حجم ${fieldName} صغير جداً، يرجى التقاط صورة واضحة ومقروءة`);
      return;
    }

    setError(null);
    previewSetter(URL.createObjectURL(file));

    // Compress in background
    try {
      const compressed = await compressImage(file);
      setter(compressed);
    } catch {
      setter(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 3) {
      setError('يرجى إدخال اسمك الرباعي كما هو مسجل بالبطاقة الشخصية');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (!ageNum || ageNum < 18 || ageNum > 70) {
      setError('يجب أن يكون السن بين 18 و 70 عاماً');
      return;
    }

    const cleanPhone = phone.trim().replace(/\s/g, '');
    if (!EGYPTIAN_PHONE.test(cleanPhone)) {
      setError('يرجى إدخال رقم هاتف مصري صحيح (010 / 011 / 012 / 015)');
      return;
    }

    if (!address.trim() || address.trim().length < 5) {
      setError('يرجى إدخال عنوان سكنك الحالي بالتفصيل');
      return;
    }

    if (!frontImage) {
      setError('يرجى رفع صورة واضحة لوجه البطاقة الشخصية');
      return;
    }

    if (!backImage) {
      setError('يرجى رفع صورة واضحة لظهر البطاقة الشخصية');
      return;
    }

    if (!personalPhoto) {
      setError('يرجى رفع صورة شخصية واضحة للطيار');
      return;
    }

    const formData = new FormData();
    formData.set('full_name', fullName.trim());
    formData.set('age', age);
    formData.set('phone', cleanPhone);
    formData.set('address', address.trim());
    formData.set('vehicle_type', vehicleType);
    formData.set('id_card_front', frontImage);
    formData.set('id_card_back', backImage);
    formData.set('personal_photo', personalPhoto);

    startTransition(async () => {
      const result: DriverApplicationState = await submitDriverApplicationAction(null, formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  // ─────────────────────────────────────────────────────────────
  // SUCCESS VIEW
  // ─────────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#FDFEFE] flex flex-col font-sans" dir="rtl">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 shadow-2xs py-3.5">
          <div className="max-w-xl mx-auto px-4 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/images/logo-name-dark.svg" alt="Engz" className="h-7 w-auto" />
            </Link>
          </div>
        </header>

        {/* Success Card */}
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8">
          <div className="bg-white rounded-[2rem] border border-orange-100 shadow-xl shadow-orange-500/5 p-6 sm:p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
            {/* Animated Icon */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#FD7B03] to-[#FA3802] text-white flex items-center justify-center text-4xl mx-auto shadow-xl shadow-orange-500/30">
              🛵
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200">
                ✓ تم استلام طلبك بنجاح
              </span>
              <h1 className="text-2xl font-black text-slate-900">
                شكراً يا كابتن {fullName.split(' ')[0] || ''}! 🎉
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto pt-1">
                تم حفظ بياناتك ومستنداتك بنجاح، وطلبك الآن قيد المراجعة الأمنية والتحقق.
              </p>
            </div>

            {/* SLA Notice Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-50/90 to-amber-50/80 border border-orange-200 text-right space-y-2.5">
              <div className="flex items-center gap-2 text-[#FA3802] font-black text-sm">
                <span>⏱️</span>
                <span>مدة المراجعة والرد:</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                سيقوم فريق إدارة إنجز بمراجعة طلبك والتواصل معك عبر الواتساب على رقمك (<span className="text-[#FA3802] font-black dir-ltr">{phone}</span>) خلال <strong className="text-slate-900 underline font-black">من يوم إلى 3 أيام عمل</strong> لإرسال رابط لوحة التحكم الخاصة بك وبيانات الدخول.
              </p>
            </div>

            {/* Next Steps */}
            <div className="text-right space-y-2 pt-2 border-t border-gray-100 text-xs text-slate-600">
              <p className="font-extrabold text-slate-900">ما الخطوة التالية؟</p>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FA3802] flex items-center justify-center font-black shrink-0">1</span>
                <span>تصلك رسالة واتساب برابط لوحة تحكم الطيار الخاصة بك.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FA3802] flex items-center justify-center font-black shrink-0">2</span>
                <span>تسجل دخولك برقم هاتفك وكلمة المرور، ويمكنك تغيير كلمة المرور فور الدخول.</span>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white text-sm font-bold shadow-md shadow-orange-500/25 hover:shadow-lg transition-all"
            >
              العودة للرئيسية
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // FORM VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/logo-name-dark.svg"
              alt="Engz"
              className="h-7 w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
          </Link>

          <span className="text-xs font-black px-3 py-1 rounded-full bg-orange-50 text-[#FA3802] border border-orange-100">
            انضم كطيار 🛵
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6 pb-24 space-y-4">
        
        {/* Hero Title & Student Banner */}
        <div className="text-center space-y-3 pt-2">
          {/* Priority for Students Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-orange-600/15 border border-orange-300 text-[#FA3802] text-xs sm:text-sm font-black shadow-2xs animate-pulse">
            <span>🎓</span>
            <span>الأولوية للطلبة لدعمهم وتوفير دخل مرن!</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            انضم لفريق طيارين إنجز
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
            استقبل طلبات التوصيل في منطقتك بحرية كاملة، بأعلى عائد وأقل عمولة، مع مرونة تامة في مواعيد العمل.
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
            <span className="text-lg shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ══════════════════════════════════════════════════════
              Section 1: Personal Data
          ══════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="w-6 h-6 rounded-lg bg-orange-100 text-[#FA3802] flex items-center justify-center text-xs">👤</span>
              <span>البيانات الأساسية</span>
            </h2>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الاسم الرباعي (كما هو في البطاقة الشخصية) <span className="text-[#FA3802]">*</span>
              </label>
              <input
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/25 focus:border-[#FA3802] transition"
                placeholder="مثال: أحمد محمد علي محمود"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Age & Phone Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  السن / العمر <span className="text-[#FA3802]">*</span>
                </label>
                <input
                  type="number"
                  min="18"
                  max="70"
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/25 focus:border-[#FA3802] transition"
                  placeholder="مثال: 21"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الهاتف (واتساب) <span className="text-[#FA3802]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    dir="ltr"
                    maxLength={11}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/25 focus:border-[#FA3802] transition"
                    placeholder="01012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  {phone && EGYPTIAN_PHONE.test(phone.replace(/\s/g, '')) && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-sm">✓</span>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عنوان السكن الحالي بالتفصيل <span className="text-[#FA3802]">*</span>
              </label>
              <input
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/25 focus:border-[#FA3802] transition"
                placeholder="مثال: القاهرة - المعادي شارع 9، عمارة 12"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            {/* Vehicle Selection: Scooter or Bicycle only */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                وسيلة التوصيل المتاحة معك <span className="text-[#FA3802]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {VEHICLE_OPTIONS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVehicleType(v.id)}
                    className={`p-3.5 rounded-2xl text-right transition-all border ${
                      vehicleType === v.id
                        ? 'border-[#FA3802] bg-orange-50/80 text-[#FA3802] ring-2 ring-[#FA3802]/20 font-black shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-slate-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{v.icon}</span>
                      <p className="text-xs font-extrabold">{v.label}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              Section 2: Required 3 Photos (ID Front + ID Back + Personal Photo)
          ══════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-100 text-[#FA3802] flex items-center justify-center text-xs">📸</span>
                <span>المستندات والصور المطلوبة (3 صور)</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-400">إجباري للتوثيق</span>
            </div>

            {/* 1. Front ID Card */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-slate-700">
                1. صورة وجه البطاقة الشخصية (سارية) <span className="text-[#FA3802]">*</span>
              </span>

              <input
                ref={frontInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={(e) => handleFile(e, setFrontImage, setFrontPreview, 'وجه البطاقة')}
                className="hidden"
              />

              <div
                onClick={() => frontInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  frontPreview
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : 'border-gray-300 hover:border-[#FA3802] bg-gray-50/70 hover:bg-orange-50/40'
                }`}
              >
                {frontPreview ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={frontPreview} alt="وجه البطاقة" className="w-full h-32 object-cover rounded-xl shadow-xs" />
                    <p className="text-xs font-bold text-emerald-700">✓ تم اختيار وجه البطاقة (اضغط للتغيير)</p>
                  </div>
                ) : (
                  <div className="py-3 space-y-1 text-slate-500">
                    <span className="text-2xl block">🪪</span>
                    <p className="text-xs font-bold text-slate-800">اضغط لرفع صورة وجه البطاقة</p>
                    <p className="text-[10px] text-slate-400">تأكد من وضوح الصورة والاسم</p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Back ID Card */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-slate-700">
                2. صورة ظهر البطاقة الشخصية <span className="text-[#FA3802]">*</span>
              </span>

              <input
                ref={backInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={(e) => handleFile(e, setBackImage, setBackPreview, 'ظهر البطاقة')}
                className="hidden"
              />

              <div
                onClick={() => backInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  backPreview
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : 'border-gray-300 hover:border-[#FA3802] bg-gray-50/70 hover:bg-orange-50/40'
                }`}
              >
                {backPreview ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={backPreview} alt="ظهر البطاقة" className="w-full h-32 object-cover rounded-xl shadow-xs" />
                    <p className="text-xs font-bold text-emerald-700">✓ تم اختيار ظهر البطاقة (اضغط للتغيير)</p>
                  </div>
                ) : (
                  <div className="py-3 space-y-1 text-slate-500">
                    <span className="text-2xl block">🪪</span>
                    <p className="text-xs font-bold text-slate-800">اضغط لرفع صورة ظهر البطاقة</p>
                    <p className="text-[10px] text-slate-400">تأكد من وضوح الرقم القومي والعنوان</p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Personal Photo */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-slate-700">
                3. صورة شخصية واضحة للطيار (سيلفي أو بورتريه) <span className="text-[#FA3802]">*</span>
              </span>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={(e) => handleFile(e, setPersonalPhoto, setPhotoPreview, 'الصورة الشخصية')}
                className="hidden"
              />

              <div
                onClick={() => photoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  photoPreview
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : 'border-gray-300 hover:border-[#FA3802] bg-gray-50/70 hover:bg-orange-50/40'
                }`}
              >
                {photoPreview ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="الصورة الشخصية" className="w-24 h-24 mx-auto object-cover rounded-2xl shadow-xs border-2 border-emerald-300" />
                    <p className="text-xs font-bold text-emerald-700">✓ تم اختيار صورتك الشخصية (اضغط للتغيير)</p>
                  </div>
                ) : (
                  <div className="py-3 space-y-1 text-slate-500">
                    <span className="text-2xl block">🤳</span>
                    <p className="text-xs font-bold text-slate-800">اضغط لالتقاط أو رفع صورتك الشخصية</p>
                    <p className="text-[10px] text-slate-400">صورة واضحة للوجه بدون نظارة شمسية</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white text-base font-black shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري إرسال طلب الانضمام...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>إرسال طلب الانضمام الآن</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
