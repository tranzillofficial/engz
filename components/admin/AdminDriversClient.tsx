'use client';

import { useState, useTransition } from 'react';
import { AppShell, PageHeader, Card, Button, DriverStatusBadge } from '@/components';
import { toggleDriverBlockAction } from '@/lib/actions/admin';
import {
  approveDriverApplicationAction,
  rejectDriverApplicationAction,
  DriverApprovalResult,
} from '@/lib/actions/driver-applications';

interface AdminDriversClientProps {
  drivers: any[];
  applications?: any[];
}

export function AdminDriversClient({ drivers, applications = [] }: AdminDriversClientProps) {
  const [activeTab, setActiveTab] = useState<'drivers' | 'applications'>('drivers');
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isPending, startTransition] = useTransition();

  // Modal / Preview States
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [approvalModalApp, setApprovalModalApp] = useState<any | null>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [approvalResult, setApprovalResult] = useState<DriverApprovalResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingAppsCount = applications.filter((a) => a.status === 'pending').length;

  const filteredApps = applications.filter((app) => {
    if (appStatusFilter === 'all') return true;
    return app.status === appStatusFilter;
  });

  const handleToggleBlock = (driverId: string, currentBlocked: boolean) => {
    const actionName = currentBlocked ? 'إلغاء حظر' : 'حظر';
    if (confirm(`هل أنت متأكد من ${actionName} هذا الطيار؟`)) {
      startTransition(async () => {
        await toggleDriverBlockAction(driverId, !currentBlocked);
      });
    }
  };

  const handleApprove = (app: any) => {
    setApprovalModalApp(app);
    setCustomPassword(`Engz@${Math.floor(1000 + Math.random() * 9000)}`);
    setApprovalResult(null);
    setActionError(null);
  };

  const submitApproval = () => {
    if (!approvalModalApp) return;
    setActionError(null);

    startTransition(async () => {
      const res = await approveDriverApplicationAction(approvalModalApp.id, customPassword);
      if (res.error) {
        setActionError(res.error);
      } else {
        setApprovalResult(res);
      }
    });
  };

  const handleReject = (appId: string) => {
    const reason = prompt('أدخل سبب رفض الطلب (اختياري):', 'عدم وضوح صورة البطاقة أو عدم استيفاء الشروط');
    if (reason !== null) {
      startTransition(async () => {
        const res = await rejectDriverApplicationAction(appId, reason);
        if (res?.error) {
          alert(res.error);
        }
      });
    }
  };

  return (
    <AppShell
      header={
        <PageHeader
          title="إدارة الطيارين وطلبات الانضمام"
          titleEn="Drivers & Applications Management"
          subtitle={`الطيارون المعتمدون: ${drivers.length} • طلبات الانضمام: ${applications.length}`}
          backHref="/admin"
        />
      }
    >
      <div className="max-w-4xl mx-auto py-3 px-2 sm:px-4 space-y-4 font-sans" dir="rtl">
        
        {/* Main Tab Switcher */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('drivers')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'drivers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🛵 الطيارون المعتمدون</span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-black">
              {drivers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'applications'
                ? 'bg-white text-[#FA3802] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📑 طلبات الانضمام الجديدة</span>
            {pendingAppsCount > 0 && (
              <span className="bg-[#FA3802] text-white px-2 py-0.5 rounded-full text-xs font-black animate-pulse">
                {pendingAppsCount} جديد
              </span>
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB 1: ACTIVE DRIVERS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'drivers' && (
          <div className="space-y-3">
            {drivers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-6 text-slate-400 text-xs">
                لا يوجد طيارون مسجلون حالياً.
              </div>
            ) : (
              drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FD7B03] to-[#FA3802] text-white flex items-center justify-center font-black text-lg shadow-sm">
                        {driver.user?.full_name?.charAt(0) || 'ك'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {driver.user?.full_name}
                        </h4>
                        <span className="text-xs text-slate-500 dir-ltr font-medium">{driver.user?.phone || driver.user?.email}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <DriverStatusBadge status={driver.status} />
                      <span className="text-[11px] text-slate-400">
                        منطقة: {driver.region?.name_ar || driver.region?.name || 'عامة'}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-2xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">العمولة المستحقة:</span>
                      <span className={`font-black text-sm ${driver.commission_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {driver.commission_balance} ج.م
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">الطلبات المكتملة:</span>
                      <span className="font-black text-sm text-slate-800">
                        {driver.total_completed_orders} طلب
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                    <span className={`text-xs font-extrabold ${driver.is_blocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {driver.is_blocked ? '⛔ الحساب محظور (تجاوز حد العمولة)' : '✅ الحساب نشط'}
                    </span>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleBlock(driver.id, driver.is_blocked)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                        driver.is_blocked
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {driver.is_blocked ? 'إلغاء الحظر وتفعيل' : 'حظر الطيار'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 2: DRIVER APPLICATIONS (NEW)
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            {/* Status Sub-filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setAppStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  appStatusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-gray-200 text-slate-600'
                }`}
              >
                الكل ({applications.length})
              </button>
              <button
                type="button"
                onClick={() => setAppStatusFilter('pending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  appStatusFilter === 'pending'
                    ? 'bg-[#FA3802] text-white'
                    : 'bg-white border border-gray-200 text-slate-600'
                }`}
              >
                ⏳ قيد المراجعة ({pendingAppsCount})
              </button>
              <button
                type="button"
                onClick={() => setAppStatusFilter('approved')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  appStatusFilter === 'approved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-gray-200 text-slate-600'
                }`}
              >
                ✓ المقبولة ({applications.filter((a) => a.status === 'approved').length})
              </button>
              <button
                type="button"
                onClick={() => setAppStatusFilter('rejected')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  appStatusFilter === 'rejected'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white border border-gray-200 text-slate-600'
                }`}
              >
                ✕ المرفوضة ({applications.filter((a) => a.status === 'rejected').length})
              </button>
            </div>

            {/* Applications List */}
            {filteredApps.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-6 text-slate-400 text-xs">
                لا توجد طلبات انضمام في هذا القسم حالياً.
              </div>
            ) : (
              filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-slate-900 bg-orange-50 text-[#FA3802] px-2.5 py-1 rounded-lg border border-orange-200">
                        طلب انضمام #{app.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(app.created_at).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-black ${
                        app.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status === 'approved' ? '✓ تم القبول والاعتماد' : app.status === 'rejected' ? '✕ تم الرفض' : '⏳ قيد المراجعة'}
                    </span>
                  </div>

                  {/* Applicant Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-slate-400">الاسم الرباعي:</span>
                        <span className="font-bold text-slate-900">{app.full_name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-slate-400">السن:</span>
                        <span className="font-bold text-slate-900">{app.age} سنة</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-slate-400">رقم الهاتف:</span>
                        <span className="font-extrabold text-slate-900 dir-ltr">{app.phone}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-slate-400">وسيلة التوصيل:</span>
                        <span className="font-bold text-[#FA3802]">{app.vehicle_type}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-slate-400">العنوان:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[180px]">{app.address}</span>
                      </div>
                      {app.rejection_reason && (
                        <div className="flex justify-between py-1 text-rose-600">
                          <span>سبب الرفض:</span>
                          <span className="font-bold">{app.rejection_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documents & Photos Section */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <span>📸</span>
                        <span>الصور والمستندات المرفقة (اضغط للتكبير والفحص):</span>
                      </span>
                      <span className="text-[11px] text-slate-400">فحص الدقة والأصالة</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Personal Photo */}
                      {app.personal_photo_url && (
                        <div
                          onClick={() => setSelectedImage({ url: app.personal_photo_url, title: `الصورة الشخصية: ${app.full_name}` })}
                          className="group relative border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-[#FA3802] transition-colors bg-gray-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={app.personal_photo_url}
                            alt="الصورة الشخصية"
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 text-white text-[11px] font-bold flex items-center justify-between">
                            <span>🤳 الصورة الشخصية</span>
                            <span>🔍 تكبير</span>
                          </div>
                        </div>
                      )}

                      {/* Front ID Card */}
                      <div
                        onClick={() => setSelectedImage({ url: app.id_card_front_url, title: `وجه بطاقة: ${app.full_name}` })}
                        className="group relative border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-[#FA3802] transition-colors bg-gray-50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={app.id_card_front_url}
                          alt="وجه البطاقة"
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 text-white text-[11px] font-bold flex items-center justify-between">
                          <span>🪪 وجه البطاقة</span>
                          <span>🔍 تكبير</span>
                        </div>
                      </div>

                      {/* Back ID Card */}
                      <div
                        onClick={() => setSelectedImage({ url: app.id_card_back_url, title: `ظهر بطاقة: ${app.full_name}` })}
                        className="group relative border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-[#FA3802] transition-colors bg-gray-50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={app.id_card_back_url}
                          alt="ظهر البطاقة"
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 text-white text-[11px] font-bold flex items-center justify-between">
                          <span>🪪 ظهر البطاقة</span>
                          <span>🔍 تكبير</span>
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Admin Actions */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                    {app.status === 'pending' && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleApprove(app)}
                          className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>✓ قبول وإنشاء حساب للطيار</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(app.id)}
                          className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                        >
                          ✕ رفض
                        </button>
                      </div>
                    )}

                    {app.status === 'approved' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-700 font-bold">✓ تم إنشاء حساب الطيار بنجاح</span>
                        <a
                          href={`https://wa.me/${app.phone.startsWith('0') ? '2' + app.phone : app.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] transition-colors flex items-center gap-1"
                        >
                          <span>تواصل واتساب</span>
                          <span>💬</span>
                        </a>
                      </div>
                    )}

                    {app.status === 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(app)}
                        className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold transition-colors"
                      >
                        إعادة النظر وقبول الطلب
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            IMAGE ZOOM MODAL
        ══════════════════════════════════════════════════════ */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-slate-900">{selectedImage.title}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-600 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-[70vh] overflow-auto rounded-2xl bg-gray-900 flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="max-h-[65vh] w-auto object-contain rounded-xl"
                />
              </div>

              {/* Authenticity Checklist */}
              <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-[#FA3802]">ارشادات التحقق من صحة البطاقة:</p>
                <p>1. تأكد من وضوح الرقم القومي المكون من 14 رقماً ومطابقته لتاريخ الميلاد.</p>
                <p>2. تأكد من وضوح الصورة الشخصية وعدم وجود تعديلات بالفوتوشوب أو طمس للبيانات.</p>
                <p>3. تأكد من سريان البطاقة وعدم انتهاء صلاحيتها.</p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            APPROVAL & WHATSAPP DISPATCH MODAL
        ══════════════════════════════════════════════════════ */}
        {approvalModalApp && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
              
              {!approvalResult ? (
                <>
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 text-2xl flex items-center justify-center mx-auto mb-2 font-black">
                      🛵
                    </div>
                    <h3 className="text-base font-black text-slate-900">
                      اعتماد حساب الطيار: {approvalModalApp.full_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      سيتم تفعيل حساب الطيار وإنشاء بيانات الدخول الخاصة به.
                    </p>
                  </div>

                  {actionError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                      {actionError}
                    </div>
                  )}

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        رقم الهاتف للدخول (اسم المستخدم):
                      </label>
                      <input
                        disabled
                        value={approvalModalApp.phone}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 font-bold text-slate-800 dir-ltr"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        كلمة المرور المؤقتة (يمكن للطيار تغييرها بعد أول تسجيل):
                      </label>
                      <input
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FA3802]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={submitApproval}
                      className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isPending ? 'جاري الاعتماد...' : 'تأكيد الاعتماد والإنشاء'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovalModalApp(null)}
                      className="px-4 py-3 rounded-xl bg-gray-100 text-slate-700 text-xs font-bold hover:bg-gray-200"
                    >
                      إلغاء
                    </button>
                  </div>
                </>
              ) : (
                /* SUCCESS & ONE-CLICK WHATSAPP DISPATCH */
                <div className="space-y-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 text-3xl flex items-center justify-center mx-auto shadow-sm">
                    🎉
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900">تم إنشاء حساب الطيار بنجاح!</h3>
                    <p className="text-xs text-slate-600">
                      يمكنك الآن إرسال بيانات الدخول والرابط السري للطيار عبر واتساب بنقرة واحدة.
                    </p>
                  </div>

                  {/* Credentials Box */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-right text-xs space-y-1.5 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400">الاسم:</span>
                      <span className="font-bold text-slate-900">{approvalResult.driverName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">رقم الهاتف:</span>
                      <span className="font-bold text-slate-900 dir-ltr">{approvalResult.driverPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">كلمة المرور:</span>
                      <span className="font-black text-[#FA3802] font-mono">{approvalResult.tempPassword}</span>
                    </div>
                  </div>

                  {/* 1-Click WhatsApp Button */}
                  {approvalResult.whatsappUrl && (
                    <a
                      href={approvalResult.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                      <span>💬 إرسال رسالة التفعيل والبيانات للطيار عبر واتساب</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setApprovalModalApp(null);
                      setApprovalResult(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gray-100 text-slate-700 text-xs font-bold hover:bg-gray-200"
                  >
                    إغلاق
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
