'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createOrderAction, ActionState } from '@/lib/actions/orders';
import FindMyOrderCard from '@/components/orders/FindMyOrderCard';

// ─── Types ────────────────────────────────────────────────────
interface OrderItemForm {
  id: string;
  description: string;
  quantity: number;
  notes: string;
}

interface SavedCustomerData {
  name: string;
  phone: string;
  dropoffAddress: string;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
}

// ─── Quick‑add chip presets ───────────────────────────────────
const QUICK_ITEMS = [
  { label: '🥖 عيش بلدي', value: 'عيش بلدي طازج' },
  { label: '🍌 كيلو موز', value: 'كيلو موز' },
  { label: '💊 بنادول', value: 'شريط بنادول أزرق' },
  { label: '🥛 حليب', value: 'علبة لبن جهينة' },
  { label: '🍅 طماطم', value: 'كيلو طماطم بلدي' },
];

// ─── Step Config ──────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'تفاصيل الطلب', icon: '📋' },
  { id: 2, label: 'بيانات التوصيل', icon: '📍' },
  { id: 3, label: 'مراجعة الطلب', icon: '🧾' },
  { id: 4, label: 'تأكيد الإرسال', icon: '🚀' },
];

// ─── Validation helpers ───────────────────────────────────────
const EGYPTIAN_PHONE = /^(010|011|012|015)\d{8}$/;

function validateStep1(items: OrderItemForm[]): string | null {
  if (items.every((i) => !i.description.trim())) {
    return 'أضف صنفاً واحداً على الأقل لطلبك';
  }
  if (items.some((i) => i.description.trim() && i.quantity < 1)) {
    return 'يجب أن تكون كمية كل صنف 1 على الأقل';
  }
  return null;
}

function validateStep2(
  phone: string,
  dropoffAddress: string
): string | null {
  if (!phone.trim()) return 'رقم الهاتف مطلوب للتواصل مع الطيار';
  const digits = phone.replace(/\s/g, '');
  if (!EGYPTIAN_PHONE.test(digits)) return 'أدخل رقم مصري صحيح (010 / 011 / 012 / 015)';
  if (!dropoffAddress.trim()) return 'أدخل عنوان التوصيل بالتفصيل';
  return null;
}

// ─── Component ────────────────────────────────────────────────
function NewOrderPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // Submission state
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─ Step 1: Items
  const [items, setItems] = useState<OrderItemForm[]>([
    { id: '1', description: '', quantity: 1, notes: '' },
  ]);

  // ─ Step 2: Contact + Delivery Address
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [saveAddressLocally, setSaveAddressLocally] = useState(true);
  const [savedDataAvailable, setSavedDataAvailable] = useState<SavedCustomerData | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Load saved local address/contact on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('engz_saved_customer');
      if (saved) {
        const parsed: SavedCustomerData = JSON.parse(saved);
        if (parsed.phone || parsed.dropoffAddress) {
          setSavedDataAvailable(parsed);
          // Pre-fill if fields are empty
          if (!customerPhone && parsed.phone) setCustomerPhone(parsed.phone);
          if (!customerName && parsed.name) setCustomerName(parsed.name);
          if (!dropoffAddress && parsed.dropoffAddress) {
            setDropoffAddress(parsed.dropoffAddress);
            if (parsed.dropoffLat) setDropoffLat(parsed.dropoffLat);
            if (parsed.dropoffLng) setDropoffLng(parsed.dropoffLng);
          }
        }
      }
    } catch {
      // Ignore local storage errors
    }
  }, []);

  const applySavedData = () => {
    if (savedDataAvailable) {
      if (savedDataAvailable.phone) setCustomerPhone(savedDataAvailable.phone);
      if (savedDataAvailable.name) setCustomerName(savedDataAvailable.name);
      if (savedDataAvailable.dropoffAddress) setDropoffAddress(savedDataAvailable.dropoffAddress);
      if (savedDataAvailable.dropoffLat) setDropoffLat(savedDataAvailable.dropoffLat);
      if (savedDataAvailable.dropoffLng) setDropoffLng(savedDataAvailable.dropoffLng);
    }
  };

  // ─── Items helpers ──────────────────────────────────────────
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(), description: '', quantity: 1, notes: '' },
    ]);

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItemForm, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addQuickItem = (desc: string) =>
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(), description: desc, quantity: 1, notes: '' },
    ]);

  // ─── GPS helper ─────────────────────────────────────────────
  const handleGps = () => {
    if (!navigator.geolocation) {
      setGpsMessage('المتصفح لا يدعم تحديد الموقع الجغرافي');
      return;
    }
    setGpsLoading(true);
    setGpsMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDropoffLat(lat);
        setDropoffLng(lng);
        // Don't overwrite a typed address with raw coordinates
        // The coords are stored separately and will show as a map on the order detail page
        setGpsMessage('✅ تم تحديد موقعك الجغرافي بنجاح — سيظهر الموقع كخريطة في صفحة تتبع الطلب');
        setGpsLoading(false);
      },
      () => {
        setGpsMessage('تعذّر تحديد الموقع، اكتب العنوان يدوياً');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // ─── Step navigation ────────────────────────────────────────
  const goNext = () => {
    setStepError(null);

    if (currentStep === 1) {
      const err = validateStep1(items);
      if (err) { setStepError(err); return; }
    }

    if (currentStep === 2) {
      const err = validateStep2(customerPhone, dropoffAddress);
      if (err) { setStepError(err); return; }

      // Save to localStorage if requested
      if (saveAddressLocally) {
        try {
          const toSave: SavedCustomerData = {
            name: customerName,
            phone: customerPhone,
            dropoffAddress: dropoffAddress,
            dropoffLat: dropoffLat,
            dropoffLng: dropoffLng,
          };
          localStorage.setItem('engz_saved_customer', JSON.stringify(toSave));
        } catch {
          // Ignore storage quota
        }
      }
    }

    setCurrentStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStepError(null);
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Final submission ────────────────────────────────────────
  const handleSubmit = async () => {
    setIsPending(true);
    setSubmitError(null);

    try {
      if (saveAddressLocally) {
        try {
          localStorage.setItem('engz_saved_customer', JSON.stringify({
            name: customerName,
            phone: customerPhone,
            dropoffAddress: dropoffAddress,
            dropoffLat: dropoffLat,
            dropoffLng: dropoffLng,
          }));
        } catch {}
      }

      const formData = new FormData();
      formData.set('items', JSON.stringify(items));
      formData.set('customer_name', customerName || 'عميل إنجز');
      formData.set('customer_phone', customerPhone.replace(/\s/g, ''));
      formData.set('pickup_address', 'حسب تفاصيل الأصناف المطلوبة');
      formData.set('dropoff_address', dropoffAddress);
      formData.set('pickup_lat', '30.0444');
      formData.set('pickup_lng', '31.2357');
      formData.set('dropoff_lat', String(dropoffLat ?? 30.0544));
      formData.set('dropoff_lng', String(dropoffLng ?? 31.2457));
      formData.set('customer_notes', customerNotes);

      const result: ActionState = await createOrderAction(null, formData);

      if (result?.error) {
        setSubmitError(result.error);
        setIsPending(false);
      }
      // On success, createOrderAction redirects automatically
    } catch {
      setSubmitError('حدث خطأ غير متوقع، حاول مرة أخرى');
      setIsPending(false);
    }
  };

  // Count valid items only
  const validItems = items.filter((i) => i.description.trim());

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans" dir="rtl">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
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
            طلب فوري بدون حساب ⚡
          </span>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="max-w-xl mx-auto px-4 pb-3 pt-1">
          <div className="flex items-center justify-between relative">
            {/* Background connecting bar */}
            <div className="absolute top-4 inset-x-4 h-1 bg-gray-100 -z-0 rounded-full" />
            {/* Active connecting bar */}
            <div
              className="absolute top-4 right-4 h-1 bg-gradient-to-l from-[#FD7B03] to-[#FA3802] -z-0 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />

            {STEPS.map((step) => {
              const isDone = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (step.id < currentStep) {
                      setStepError(null);
                      setCurrentStep(step.id);
                    }
                  }}
                  className={`flex flex-col items-center relative z-10 group transition-all duration-200 ${
                    step.id < currentStep ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-xs ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-emerald-200'
                        : isCurrent
                        ? 'bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white ring-4 ring-orange-100 shadow-orange-300 scale-110'
                        : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}
                  >
                    {isDone ? '✓' : step.icon}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-bold transition-colors ${
                      isCurrent
                        ? 'text-[#FA3802]'
                        : isDone
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-5 pb-28">
        {/* Error Alert Box */}
        {stepError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-bold animate-in fade-in duration-200">
            <span className="text-base shrink-0">⚠️</span>
            <span>{stepError}</span>
          </div>
        )}

        {submitError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-bold animate-in fade-in duration-200">
            <span className="text-base shrink-0">❌</span>
            <span>{submitError}</span>
          </div>
        )}

        {/* ── Find Existing Order (guest recovery) ─────────── */}
        <div className="mb-4">
          <FindMyOrderCard />
        </div>

        {/* ══════════════════════════════════════════════════════
            STEP 1 — Order Details Only
        ══════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Step Card Header */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🛒</span>
                  <span>ماذا تريد أن نشتري أو نوصل لك؟</span>
                </h1>
              </div>
              <p className="text-xs text-slate-500">
                اكتب أي طلب بحرية (سوبرماركت، صيدلية، مخبز، مطعم، أو استلام طرد)
              </p>

              {/* Quick Add Chips */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[11px] font-bold text-slate-400 mb-2">إضافة سريعة شائعة:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ITEMS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => addQuickItem(chip.value)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50/80 hover:bg-orange-100 text-[#FA3802] border border-orange-200/60 transition-colors"
                    >
                      + {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-3 transition-all focus-within:border-orange-300 focus-within:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FA3802] flex items-center justify-center text-[11px] font-black">
                        {index + 1}
                      </span>
                      <span>الصنف #{index + 1}</span>
                    </span>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-slate-400 hover:text-rose-500 p-1 text-xs font-bold transition-colors"
                      >
                        حذف ✕
                      </button>
                    )}
                  </div>

                  {/* Description Input */}
                  <div>
                    <input
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/25 focus:border-[#FA3802] transition"
                      placeholder="مثال: ٢ كيلو برتقال بسرة، أو علبة دواء..."
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      autoFocus={index === 0}
                    />
                  </div>

                  {/* Quantity & Notes Row */}
                  <div className="flex items-center gap-2">
                    {/* Quantity Stepper */}
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 rounded-xl bg-white text-slate-700 font-bold hover:bg-orange-50 hover:text-[#FA3802] transition-colors flex items-center justify-center shadow-2xs text-sm"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                        className="w-8 h-8 rounded-xl bg-white text-slate-700 font-bold hover:bg-orange-50 hover:text-[#FA3802] transition-colors flex items-center justify-center shadow-2xs text-sm"
                      >
                        +
                      </button>
                    </div>

                    {/* Notes for this item */}
                    <input
                      className="flex-1 px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-slate-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FA3802]/30 focus:border-[#FA3802] transition"
                      placeholder="ملاحظات (ماركة معينة، طازج...)"
                      value={item.notes}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              ))}

              {/* Add Item Button */}
              <button
                type="button"
                onClick={addItem}
                className="w-full py-3.5 rounded-3xl border-2 border-dashed border-orange-200 hover:border-[#FA3802] bg-white hover:bg-orange-50/50 text-[#FA3802] text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-[0.99]"
              >
                <span className="text-base">+</span>
                <span>إضافة صنف آخر للطلب</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 2 — Contact + Delivery Address Only
        ══════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Contact Info Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  👤 <span>بيانات التواصل</span>
                </h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-[#FA3802]">
                  بدون تسجيل مسبق
                </span>
              </div>

              {/* Saved Address Autofill Badge */}
              {savedDataAvailable && (
                <div className="mb-4 p-3 rounded-2xl bg-orange-50/70 border border-orange-200/70 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">بيانات محفوظة من طلبك السابق:</p>
                    <p className="text-slate-600 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                      {savedDataAvailable.phone} {savedDataAvailable.dropoffAddress ? `• ${savedDataAvailable.dropoffAddress}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={applySavedData}
                    className="text-xs font-extrabold text-white bg-[#FA3802] hover:bg-[#e03102] px-3 py-1.5 rounded-xl shadow-2xs transition-colors shrink-0"
                  >
                    استخدام
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    رقم الهاتف (واتساب) <span className="text-[#FA3802]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/25 focus:border-[#FA3802] transition"
                      placeholder="مثال: 01012345678"
                      type="tel"
                      dir="ltr"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      maxLength={11}
                      inputMode="numeric"
                    />
                    {customerPhone && EGYPTIAN_PHONE.test(customerPhone.replace(/\s/g, '')) && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold">✓</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">الطيار سيتواصل معك على هذا الرقم فور قبول الطلب</p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسمك (اختياري)
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/25 focus:border-[#FA3802] transition"
                    placeholder="مثال: أحمد مصطفى"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                📍 <span>عنوان التوصيل</span>
              </h2>

              <div className="space-y-4">
                {/* Dropoff Address + GPS */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      عنوان التسليم بالتفصيل <span className="text-[#FA3802]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGps}
                      disabled={gpsLoading}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#FA3802] hover:text-[#e03102] transition-colors disabled:opacity-60"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                      <span>{gpsLoading ? 'جاري التحديد...' : 'تحديد موقعي GPS'}</span>
                    </button>
                  </div>
                  <input
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/25 focus:border-[#FA3802] transition"
                    placeholder="مثال: المعادي شارع 9، عمارة 15، الدور الثالث شقة 6"
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                  />
                  {gpsMessage && (
                    <p className={`mt-1.5 text-xs font-medium ${gpsMessage.startsWith('✅') ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {gpsMessage}
                    </p>
                  )}
                  {dropoffLat && (
                    <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
                      <span>📍</span>
                      <span>تم ربط إحداثيات GPS الدقيقة بطلبك</span>
                    </p>
                  )}
                </div>

                {/* Driver Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ملاحظات إضافية للطيار (اختياري)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-slate-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/25 focus:border-[#FA3802] transition resize-none"
                    placeholder="مثال: رن الجرس مرتين، أو تواصل واتساب أول ما توصل..."
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                  />
                </div>

                {/* Save address checkbox */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveAddressLocally}
                      onChange={(e) => setSaveAddressLocally(e.target.checked)}
                      className="w-4 h-4 rounded text-[#FA3802] focus:ring-[#FA3802] border-gray-300"
                    />
                    <span>💾 حفظ هذا العنوان ورقم الهاتف لتسهيل طلباتي القادمة</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 3 — Order Invoice Preview
        ══════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div className="space-y-4">
            {/* Invoice Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Invoice Header */}
              <div className="bg-gradient-to-r from-[#FD7B03] to-[#FA3802] px-5 py-5 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/logo-name.svg" alt="Engz" className="h-7 w-auto mx-auto mb-2" />
                <h2 className="text-white font-extrabold text-base">فاتورة مراجعة الطلب</h2>
                <p className="text-white/80 text-xs mt-0.5">تأكد من صحة بيانات طلبك وعنوانك قبل الإرسال</p>
              </div>

              {/* Items Section */}
              <div className="px-5 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🛒</span>
                  <h3 className="text-sm font-extrabold text-slate-800">قائمة الطلبات ({validItems.length} صنف)</h3>
                </div>
                <div className="space-y-2">
                  {validItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between py-2.5 px-3.5 rounded-2xl bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-start gap-2.5 flex-1">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FA3802] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.description}</p>
                          {item.notes && (
                            <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#FA3802] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 shrink-0 mr-2">
                        ×{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashed Divider */}
              <div className="mx-5 my-4 border-t border-dashed border-gray-200" />

              {/* Delivery Address Section */}
              <div className="px-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📍</span>
                  <h3 className="text-sm font-extrabold text-slate-800">عنوان التوصيل والتواصل</h3>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-orange-50 border border-orange-100">
                    <div className="w-6 h-6 rounded-full bg-[#FA3802] flex items-center justify-center shrink-0 mt-0.5 text-white text-xs">
                      📍
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#FA3802] uppercase tracking-wide">التسليم إلى</p>
                      <p className="text-sm text-slate-900 font-bold mt-0.5">{dropoffAddress}</p>
                      {dropoffLat && (
                        <p className="text-[11px] text-slate-400 mt-0.5">✓ تم ربط إحداثيات GPS</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                    <span className="font-semibold text-slate-500">رقم التواصل (واتساب):</span>
                    <span className="font-bold text-slate-900">{customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Dashed Divider */}
              <div className="mx-5 my-4 border-t border-dashed border-gray-200" />

              {/* Pricing Banner */}
              <div className="mx-5 mb-5 p-4 rounded-2xl bg-gradient-to-r from-[#FFF4ED] to-[#FFF9F5] border border-orange-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-bold">سعر التوصيل المبدئي</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">توصيل فوري مباشر عبر أقرب طيار</p>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-black text-[#FA3802]">20</p>
                  <p className="text-xs font-bold text-slate-600 -mt-0.5">جنيه مصري</p>
                </div>
              </div>
            </div>

            {/* Customer Notes Summary (if any) */}
            {customerNotes && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
                <span className="text-base shrink-0">💬</span>
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-1">ملاحظاتك للطيار</p>
                  <p className="text-sm text-slate-600">{customerNotes}</p>
                </div>
              </div>
            )}

            <p className="text-center text-xs text-slate-400 px-4">
              إذا أردت تعديل أي بيانات، اضغط «رجوع» للعودة للخطوة السابقة
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 4 — Final Confirmation
        ══════════════════════════════════════════════════════ */}
        {currentStep === 4 && (
          <div className="space-y-4">
            {/* Full Summary Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Card Top */}
              <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl shrink-0">🚀</div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">أكد طلبك للإرسال</h2>
                  <p className="text-xs text-slate-500">راجع جميع البيانات قبل الإرسال النهائي</p>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Contact Info Row */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                  <span className="text-lg">👤</span>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium">بيانات التواصل</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{customerPhone}</p>
                    {customerName && <p className="text-xs text-slate-600">{customerName}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCurrentStep(2); setStepError(null); }}
                    className="text-xs font-bold text-[#FA3802] hover:underline"
                  >
                    تعديل
                  </button>
                </div>

                {/* Items summary row */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                  <span className="text-lg">🛒</span>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium mb-1.5">قائمة الطلبات ({validItems.length} صنف)</p>
                    <div className="space-y-1">
                      {validItems.map((item, idx) => (
                        <p key={item.id} className="text-xs text-slate-700 flex items-center gap-1.5">
                          <span className="text-[#FA3802] font-bold">{idx + 1}.</span>
                          <span className="font-medium">{item.description}</span>
                          <span className="text-slate-400">×{item.quantity}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCurrentStep(1); setStepError(null); }}
                    className="text-xs font-bold text-[#FA3802] hover:underline shrink-0"
                  >
                    تعديل
                  </button>
                </div>

                {/* Delivery Address summary row */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                  <span className="text-lg">📍</span>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs text-slate-500 font-medium">عنوان التوصيل</p>
                    <p className="text-xs font-bold text-slate-800">{dropoffAddress}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCurrentStep(2); setStepError(null); }}
                    className="text-xs font-bold text-[#FA3802] hover:underline shrink-0"
                  >
                    تعديل
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 p-4 z-40 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {/* Back Button (shown from Step 2 onwards) */}
          {currentStep > 1 && (
            <button
              type="button"
              onClick={goBack}
              disabled={isPending}
              className="px-5 py-3.5 rounded-2xl border-2 border-gray-200 text-slate-700 font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all shrink-0"
            >
              رجوع
            </button>
          )}

          {/* Next or Submit Button */}
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white font-extrabold text-sm shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              <span>المتابعة إلى الخطوة التالية</span>
              <span className="rotate-180">←</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white font-black text-base shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري إرسال طلبك...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>تأكيد وإرسال الطلب الآن</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Suspense wrapper required because this page uses useSearchParams()
export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#FA3802]/20 border-t-[#FA3802] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">جاري التحميل...</p>
        </div>
      </div>
    }>
      <NewOrderPageInner />
    </Suspense>
  );
}
