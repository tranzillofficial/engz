'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { findOrderByPhoneAction } from '@/lib/actions/orders';

const EGYPTIAN_PHONE = /^(010|011|012|015)\d{8}$/;

export default function FindMyOrderCard() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [orderNum, setOrderNum] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    const clean = phone.trim().replace(/\s/g, '');
    if (!EGYPTIAN_PHONE.test(clean)) {
      setError('أدخل رقم مصري صحيح (010 / 011 / 012 / 015)');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await findOrderByPhoneAction(clean, orderNum || undefined);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.orderId) {
      router.push(`/orders/${result.orderId}`);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-right"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🔍</span>
          <div>
            <p className="text-sm font-bold text-slate-800">عندك طلب سابق؟</p>
            <p className="text-xs text-slate-400">ابحث عن طلبك برقم هاتفك</p>
          </div>
        </div>
        <span
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              رقم الهاتف الذي أدخلته عند الطلب
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              dir="ltr"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition placeholder:text-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              رقم الطلب (اختياري)
            </label>
            <input
              type="text"
              value={orderNum}
              onChange={(e) => setOrderNum(e.target.value)}
              placeholder="#12345"
              dir="ltr"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition placeholder:text-slate-300"
            />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white font-extrabold text-sm shadow-md shadow-orange-500/25 hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري البحث...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>ابحث عن طلبي</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
