'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createOrderAction, ActionState } from '@/lib/actions/orders';
import FindMyOrderCard from '@/components/orders/FindMyOrderCard';
import LocationPicker from '@/components/location/LocationPicker';
import { PwaRoleInstallCard } from '@/components/pwa/PwaRoleInstallCard';

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
  street?: string;
  building?: string;
  floor?: string;
  landmark?: string;
}

const STEPS = [
  { id: 1, label: 'الأصناف', icon: '🛒' },
  { id: 2, label: 'التوصيل', icon: '📍' },
  { id: 3, label: 'المراجعة', icon: '🧾' },
  { id: 4, label: 'التأكيد', icon: '🚀' },
];

const EGYPTIAN_PHONE = /^(010|011|012|015)\d{8}$/;

function validateStep1(items: OrderItemForm[]): string | null {
  const valid = items.filter((i) => i.description.trim().length > 0);
  if (valid.length === 0) return 'أدخل صنفاً واحداً على الأقل في قائمة طلبك';
  return null;
}

function validateStep2(
  phone: string,
  dropoffAddress: string,
  lat: number | null,
  lng: number | null
): string | null {
  if (!phone.trim()) return 'رقم الهاتف مطلوب للتواصل مع الطيار';
  const digits = phone.replace(/\s/g, '');
  if (!EGYPTIAN_PHONE.test(digits)) return 'أدخل رقم مصري صحيح (010 / 011 / 012 / 015)';
  if (!dropoffAddress.trim()) return 'أدخل عنوان التوصيل بالتفصيل';
  if (lat == null || lng == null) return 'حدد موقع التسليم على الخريطة أو استخدم موقعك الحالي';
  return null;
}

function NewOrderPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  void searchParams;
  void router;

  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Items state (Free text items)
  const [items, setItems] = useState<OrderItemForm[]>([
    { id: '1', description: '', quantity: 1, notes: '' },
  ]);

  // Contact & Detailed Address State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [landmark, setLandmark] = useState('');
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [saveAddressLocally, setSaveAddressLocally] = useState(true);
  const [savedDataAvailable, setSavedDataAvailable] = useState<SavedCustomerData | null>(null);

  // Dynamic Base Fee
  const [baseFee, setBaseFee] = useState<number>(25);

  useEffect(() => {
    // Fetch dynamic base fee
    fetch('/api/pricing/base')
      .then((res) => res.json())
      .then((data) => {
        if (data?.base_delivery_fee) {
          setBaseFee(Number(data.base_delivery_fee));
        }
      })
      .catch(() => {});

    // Load saved data
    try {
      const saved = localStorage.getItem('engz_saved_customer');
      if (saved) {
        const parsed: SavedCustomerData = JSON.parse(saved);
        if (parsed.phone || parsed.dropoffAddress) {
          setSavedDataAvailable(parsed);
          if (!customerPhone && parsed.phone) setCustomerPhone(parsed.phone);
          if (!customerName && parsed.name) setCustomerName(parsed.name);
          if (!dropoffAddress && parsed.dropoffAddress) setDropoffAddress(parsed.dropoffAddress);
          if (parsed.dropoffLat != null) setDropoffLat(parsed.dropoffLat);
          if (parsed.dropoffLng != null) setDropoffLng(parsed.dropoffLng);
          if (parsed.street) setStreet(parsed.street);
          if (parsed.building) setBuilding(parsed.building);
          if (parsed.floor) setFloor(parsed.floor);
          if (parsed.landmark) setLandmark(parsed.landmark);
        }
      }
    } catch {}
  }, []);

  const applySavedData = () => {
    if (!savedDataAvailable) return;
    if (savedDataAvailable.phone) setCustomerPhone(savedDataAvailable.phone);
    if (savedDataAvailable.name) setCustomerName(savedDataAvailable.name);
    if (savedDataAvailable.dropoffAddress) setDropoffAddress(savedDataAvailable.dropoffAddress);
    if (savedDataAvailable.dropoffLat != null) setDropoffLat(savedDataAvailable.dropoffLat);
    if (savedDataAvailable.dropoffLng != null) setDropoffLng(savedDataAvailable.dropoffLng);
    if (savedDataAvailable.street) setStreet(savedDataAvailable.street);
    if (savedDataAvailable.building) setBuilding(savedDataAvailable.building);
    if (savedDataAvailable.floor) setFloor(savedDataAvailable.floor);
    if (savedDataAvailable.landmark) setLandmark(savedDataAvailable.landmark);
  };

  // Helper to sync composite address
  const updateAddressDetails = (newStreet: string, newBuilding: string, newFloor: string, newLandmark: string) => {
    setStreet(newStreet);
    setBuilding(newBuilding);
    setFloor(newFloor);
    setLandmark(newLandmark);

    const parts = [
      newStreet.trim() ? `الشارع: ${newStreet.trim()}` : '',
      newBuilding.trim() ? `عمارة: ${newBuilding.trim()}` : '',
      newFloor.trim() ? `الدور/الشقة: ${newFloor.trim()}` : '',
      newLandmark.trim() ? `علامة مميزة: ${newLandmark.trim()}` : '',
    ].filter(Boolean);

    if (parts.length > 0) {
      setDropoffAddress(parts.join(' - '));
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(), description: '', quantity: 1, notes: '' },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateItemDescription = (index: number, text: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], description: text };

      // Auto-append next row if user is typing in the last item
      if (index === prev.length - 1 && text.trim().length > 0) {
        updated.push({
          id: Math.random().toString(),
          description: '',
          quantity: 1,
          notes: '',
        });
      }
      return updated;
    });

    if (text.trim()) setStepError(null);
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setDropoffLat(lat);
    setDropoffLng(lng);
    setStepError((current) =>
      current === 'حدد موقع التسليم على الخريطة أو استخدم موقعك الحالي' ? null : current
    );
  };

  const goNext = () => {
    setStepError(null);
    if (currentStep === 1) {
      const err = validateStep1(items);
      if (err) {
        setStepError(err);
        return;
      }
    }
    if (currentStep === 2) {
      const err = validateStep2(customerPhone, dropoffAddress, dropoffLat, dropoffLng);
      if (err) {
        setStepError(err);
        return;
      }
      if (saveAddressLocally) {
        try {
          localStorage.setItem(
            'engz_saved_customer',
            JSON.stringify({
              name: customerName,
              phone: customerPhone,
              dropoffAddress,
              dropoffLat,
              dropoffLng,
              street,
              building,
              floor,
              landmark,
            })
          );
        } catch {}
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

  const handleSubmit = async () => {
    setIsPending(true);
    setSubmitError(null);
    try {
      if (saveAddressLocally) {
        try {
          localStorage.setItem(
            'engz_saved_customer',
            JSON.stringify({
              name: customerName,
              phone: customerPhone,
              dropoffAddress,
              dropoffLat,
              dropoffLng,
              street,
              building,
              floor,
              landmark,
            })
          );
        } catch {}
      }

      const validItems = items.filter((i) => i.description.trim().length > 0);

      const formData = new FormData();
      formData.set('items', JSON.stringify(validItems));
      formData.set('customer_name', customerName || 'عميل إنجز');
      formData.set('customer_phone', customerPhone.replace(/\s/g, ''));
      formData.set('pickup_address', 'حسب تفاصيل الأصناف المطلوبة');
      formData.set('dropoff_address', dropoffAddress);
      formData.set('pickup_lat', '30.0444');
      formData.set('pickup_lng', '31.2357');
      formData.set('dropoff_lat', String(dropoffLat));
      formData.set('dropoff_lng', String(dropoffLng));
      formData.set('customer_notes', customerNotes);

      const result: ActionState = await createOrderAction(null, formData);
      if (result?.error) {
        setSubmitError(result.error);
        setIsPending(false);
      }
    } catch {
      setSubmitError('حدث خطأ غير متوقع، حاول مرة أخرى');
      setIsPending(false);
    }
  };

  const validItems = items.filter((i) => i.description.trim().length > 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col font-sans" dir="rtl">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 group rounded-lg"
          >
            <img
              src="/assets/images/logo-name-dark.svg"
              alt="ENgz"
              className="h-7 w-auto object-contain dark:hidden"
            />
            <img
              src="/assets/images/logo-name.svg"
              alt="ENgz"
              className="h-7 w-auto object-contain hidden dark:block"
            />
          </Link>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FA3802] border border-orange-100 dark:border-orange-900/50">
            طلب فوري حر ⚡
          </span>
        </div>

        {/* Steps Progress */}
        <div className="max-w-xl mx-auto px-4 pb-3 pt-1">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 inset-x-4 h-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
            <div
              className="absolute top-4 right-4 h-1 bg-gradient-to-l from-[#FD7B03] to-[#FA3802] rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
              }}
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
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white ring-4 ring-orange-100 dark:ring-orange-950 shadow-orange-300 scale-110'
                        : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {isDone ? '✓' : step.icon}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-bold ${
                      isCurrent
                        ? 'text-[#FA3802]'
                        : isDone
                        ? 'text-slate-700 dark:text-slate-300'
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

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-3 sm:py-4 pb-28">
        {stepError && (
          <div className="mb-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-bold animate-in fade-in duration-200">
            <span>⚠️</span>
            <span>{stepError}</span>
          </div>
        )}
        {submitError && (
          <div className="mb-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-bold animate-in fade-in duration-200">
            <span>❌</span>
            <span>{submitError}</span>
          </div>
        )}

        <div className="mb-3 space-y-3">
          <PwaRoleInstallCard role="customer" />
          <FindMyOrderCard />
        </div>

        {/* STEP 1: FREE-TEXT ITEMS INPUT */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>🛒</span>
                <span>اكتب طلباتك بحرية</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1.5">
                اكتب أي طلب تريده نصاً (مثال: ٢ كيلو برتقال، عيش فينو، علاج من الصيدلية، طرد من مكان معين...). يتم فتح حقل جديد تلقائياً أثناء الكتابة.
              </p>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-3.5 sm:p-4 space-y-2 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 dark:focus-within:ring-orange-950 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-[#FA3802] flex items-center justify-center text-[10px] font-black">
                        {index + 1}
                      </span>
                      <span>الصنف #{index + 1}</span>
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-slate-400 hover:text-rose-500 text-xs font-bold px-2 py-1 rounded-lg"
                      >
                        حذف ✕
                      </button>
                    )}
                  </div>

                  <input
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30 focus:border-[#FA3802] transition"
                    placeholder="مثال: ٢ كيلو برتقال، أو علبة لبن جهينة كامل الدسم..."
                    value={item.description}
                    onChange={(e) => updateItemDescription(index, e.target.value)}
                    autoFocus={index === 0}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="w-full py-3.5 rounded-3xl border-2 border-dashed border-orange-200 dark:border-orange-900/40 hover:border-[#FA3802] bg-white dark:bg-slate-900 text-[#FA3802] text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <span className="text-base">+</span>
                <span>إضافة صنف إضافي</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CONTACT & DETAILED ADDRESS */}
        {currentStep === 2 && (
          <div className="space-y-3">
            {/* Contact Details */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>👤</span>
                  <span>بيانات التواصل</span>
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-[#FA3802]">
                  تواصل مباشر
                </span>
              </div>

              {savedDataAvailable && (
                <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-900/50 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      بيانات محفوظة من طلبك الأخير:
                    </p>
                    <p className="text-slate-500 mt-0.5 truncate max-w-[200px]">
                      {savedDataAvailable.phone} {savedDataAvailable.dropoffAddress ? `• ${savedDataAvailable.dropoffAddress}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={applySavedData}
                    className="text-xs font-black text-white bg-[#FA3802] px-3 py-1.5 rounded-xl shrink-0 hover:bg-[#e03102]"
                  >
                    استخدام
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الهاتف (واتساب) <span className="text-[#FA3802]">*</span>
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30"
                    placeholder="01xxxxxxxxx"
                    type="tel"
                    dir="ltr"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    maxLength={11}
                    inputMode="numeric"
                  />
                  {customerPhone && EGYPTIAN_PHONE.test(customerPhone.replace(/\s/g, '')) && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold">
                      ✓
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم (اختياري)
                </label>
                <input
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30"
                  placeholder="مثال: أحمد مصطفى"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            </div>

            {/* Delivery Address & Structured Fields */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span>📍</span>
                <span>عنوان التوصيل بالتفصيل</span>
              </h2>

              {/* Interactive Location Picker Map */}
              <LocationPicker lat={dropoffLat} lng={dropoffLng} onChange={handleLocationChange} />

              {/* Detailed Structured Address Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الشارع / المنطقة <span className="text-[#FA3802]">*</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30"
                    placeholder="مثال: شارع 9، المعادي"
                    value={street}
                    onChange={(e) => updateAddressDetails(e.target.value, building, floor, landmark)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم العمارة / المبنى
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30"
                    placeholder="مثال: عمارة 15"
                    value={building}
                    onChange={(e) => updateAddressDetails(street, e.target.value, floor, landmark)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الدور / رقم الشقة
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30"
                    placeholder="مثال: الدور 3 شقة 6"
                    value={floor}
                    onChange={(e) => updateAddressDetails(street, building, e.target.value, landmark)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    علامة مميزة (اختياري)
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30"
                    placeholder="مثال: بجوار صيدلية العزبي"
                    value={landmark}
                    onChange={(e) => updateAddressDetails(street, building, floor, e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  العنوان الكامل المجمّع <span className="text-[#FA3802]">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30"
                  placeholder="عنوان التسليم بالتفصيل..."
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات إضافية للطيار
                </label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FA3802]/30 resize-none"
                  placeholder="مثال: اتصل بي فور وصولك..."
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAddressLocally}
                    onChange={(e) => setSaveAddressLocally(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FA3802] focus:ring-[#FA3802]"
                  />
                  <span>💾 حفظ هذا العنوان ورقم الهاتف للطلبات القادمة</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & DYNAMIC PRICING */}
        {currentStep === 3 && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#FD7B03] to-[#FA3802] px-5 py-5 text-center text-white">
                <img
                  src="/assets/images/logo-name.svg"
                  alt="ENgz"
                  className="h-7 w-auto mx-auto mb-2"
                />
                <h2 className="font-black text-base">مراجعة بيانات وفاتورة الطلب</h2>
                <p className="text-white/80 text-xs mt-0.5">
                  تأكد من صحة الأصناف والعنوان قبل الإرسال
                </p>
              </div>

              {/* Items List */}
              <div className="p-5 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span>🛒</span>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    قائمة الأصناف المطلوبة ({validItems.length})
                  </h3>
                </div>
                {validItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2.5 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FA3802] text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mx-5 border-t border-dashed border-slate-200 dark:border-slate-800" />

              {/* Address */}
              <div className="p-5 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span>📍</span>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    مكان التوصيل والتواصل
                  </h3>
                </div>
                <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100/60 text-xs space-y-1">
                  <span className="text-[10px] font-black text-[#FA3802]">التسليم إلى:</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{dropoffAddress}</p>
                </div>
                <div className="flex justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs">
                  <span className="text-slate-400">رقم الهاتف:</span>
                  <b className="text-slate-800 dark:text-slate-200 dir-ltr">{customerPhone}</b>
                </div>
              </div>

              <div className="mx-5 border-t border-dashed border-slate-200 dark:border-slate-800" />

              {/* Dynamic Price Box */}
              <div className="m-5 p-4 rounded-2xl bg-gradient-to-r from-[#FFF4ED] to-[#FFF9F5] dark:from-slate-800 dark:to-slate-800/60 border border-orange-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-black">
                    سعر التوصيل الأساسي
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    توصيل فوري مباشر عبر أقرب طيار
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-black text-[#FA3802]">{baseFee}</p>
                  <p className="text-[10px] font-bold text-slate-500 -mt-0.5">جنيه مصري</p>
                </div>
              </div>
            </div>

            {customerNotes && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <span className="font-bold text-slate-400">ملاحظاتك للطيار:</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">{customerNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: CONFIRM & SUBMIT */}
        {currentStep === 4 && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FA3802] flex items-center justify-center text-xl font-bold">
                  🚀
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    أكد طلبك الآن
                  </h2>
                  <p className="text-xs text-slate-400">
                    سيتم إرسال إشعار فوري لأقرب طيارين متاحين
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] block">رقم التواصل:</span>
                    <b className="text-slate-800 dark:text-slate-200 dir-ltr">{customerPhone}</b>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-bold text-[#FA3802] hover:underline"
                  >
                    تعديل
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-400 text-[10px] block">عنوان التوصيل:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {dropoffAddress}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-bold text-[#FA3802] hover:underline mr-2 shrink-0"
                  >
                    تعديل
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-400 text-[10px] block">الأصناف:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {validItems.map((i) => i.description).join(' • ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold text-[#FA3802] hover:underline mr-2 shrink-0"
                  >
                    تعديل
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 z-40 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center gap-2 sm:gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={goBack}
              disabled={isPending}
              className="px-4 sm:px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 transition-all shrink-0"
            >
              رجوع
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white font-extrabold text-sm shadow-md shadow-orange-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>المتابعة إلى الخطوة التالية</span>
              <span className="rotate-180">←</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white font-black text-base shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center" dir="rtl">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#FA3802]/20 border-t-[#FA3802] rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 font-medium">جاري التحميل...</p>
          </div>
        </div>
      }
    >
      <NewOrderPageInner />
    </Suspense>
  );
}
