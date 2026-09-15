'use client';

import { useState } from 'react';
import { rateOrderAction } from '@/lib/actions/orders';

interface DeliveryRatingCardProps {
  orderId: string;
  existingRating?: number | null;
  existingReview?: string | null;
}

export default function DeliveryRatingCard({
  orderId,
  existingRating,
  existingReview,
}: DeliveryRatingCardProps) {
  const [rating, setRating] = useState<number>(existingRating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [review, setReview] = useState<string>(existingReview || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<boolean>(!!existingRating);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await rateOrderAction({
        orderId,
        rating,
        review,
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.error || 'تعذر حفظ التقييم');
      }
    } catch {
      setError('حدث خطأ أثناء إرسال التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border border-amber-200/80 shadow-sm text-center">
      <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-600 flex items-center justify-center mx-auto mb-3 text-2xl shadow-2xs">
        ⭐
      </div>

      <h3 className="text-lg font-bold text-slate-900">
        {submitted ? 'شكراً لتقييمك لتجربة التوصيل!' : 'كيف كانت تجربة التوصيل مع الطيار؟'}
      </h3>
      <p className="mt-1 text-xs sm:text-sm text-slate-500">
        {submitted
          ? `تقييمك: ${rating} من 5 نجوم`
          : 'رأيك يهمنا ويساعدنا على تحسين جودة الخدمة دائماً'}
      </p>

      {error && (
        <p className="mt-2 text-xs text-red-600 font-medium">{error}</p>
      )}

      {submitted ? (
        <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
          <span>✅ تم تسجيل تقييمك بنجاح!</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Star Rating Selector */}
          <div className="flex items-center justify-center gap-2 direction-ltr">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating ?? rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="text-3xl transition-transform hover:scale-125 focus:outline-hidden"
                  aria-label={`تقييم ${star} نجوم`}
                >
                  <span className={active ? 'text-amber-400 drop-shadow-xs' : 'text-gray-300'}>
                    ★
                  </span>
                </button>
              );
            })}
          </div>

          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="اكتب كلمة شكر للطيار أو ملاحظة عن التوصيلة (اختياري)..."
            rows={2}
            className="w-full p-3 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-hidden focus:border-orange-400 bg-white"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white text-sm font-bold shadow-md shadow-orange-500/20 hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'إرسال التقييم ⭐'}
          </button>
        </form>
      )}
    </div>
  );
}
