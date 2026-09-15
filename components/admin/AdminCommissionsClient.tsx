'use client';

import { useActionState, useTransition } from 'react';
import { AppShell, PageHeader, Card, Button, Input, Select, Alert } from '@/components';
import { addCommissionTierAction, deleteCommissionTierAction } from '@/lib/actions/admin';
import type { CommissionTier } from '@/lib/types/database';

interface AdminCommissionsClientProps {
  tiers: CommissionTier[];
}

export function AdminCommissionsClient({ tiers }: AdminCommissionsClientProps) {
  const [tierState, tierAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      return await addCommissionTierAction(formData);
    },
    null
  );

  const [isDeleting, startDeleteTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف شريحة العمولة هذه؟')) {
      startDeleteTransition(async () => {
        await deleteCommissionTierAction(id);
      });
    }
  };

  const typeOptions = [
    { value: 'fixed', label: 'مبلغ ثابت (ج.م لكل طلب)' },
    { value: 'percentage', label: 'نسبة مئوية (% من رسوم التوصيل)' },
  ];

  return (
    <AppShell
      header={
        <PageHeader
          title="شرائح عمولات المنصة"
          titleEn="Commission Tiers"
          backHref="/admin"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 space-y-4">
        {/* Existing Tiers */}
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            الشرائح الحالية المفعلة 📊
          </h3>

          <div className="space-y-2">
            {tiers.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">لا توجد شرائح عمولة مسجلة</p>
            ) : (
              tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 block">
                      الطلبات من {tier.min_orders} إلى {tier.max_orders ? tier.max_orders : 'ما لا نهاية (∞)'}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-extrabold mt-0.5 block">
                      {tier.commission_type === 'fixed'
                        ? `${tier.commission_value} جنيه ثابت / طلب`
                        : `${tier.commission_value}% نسبة من التوصيل`}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => handleDelete(tier.id)}
                  >
                    حذف
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Add Tier Form */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            إضافة شريحة عمولة جديدة ➕
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            حدد عدد الطلبات ونوع العمولة (ثابتة أو نسبة) لتطبيقها تلقائياً على الطيارين.
          </p>

          <form action={tierAction} className="space-y-3">
            {tierState?.error && <Alert type="error">{tierState.error}</Alert>}
            {tierState?.success && <Alert type="success">تمت إضافة شريحة العمولة بنجاح! ✅</Alert>}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  من الطلب رقم *
                </label>
                <Input name="min_orders" type="number" min="1" placeholder="مثال: 4" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  إلى الطلب رقم (اتركه فارغاً لما لا نهاية)
                </label>
                <Input name="max_orders" type="number" min="1" placeholder="مثال: 10" />
              </div>
            </div>

            <div>
              <Select
                label="نوع احتساب العمولة"
                name="commission_type"
                required
                defaultValue="fixed"
                options={typeOptions}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                قيمة العمولة (مبلغ أو نسبة) *
              </label>
              <Input name="commission_value" type="number" step="0.5" placeholder="مثال: 4 أو 10" required />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full font-bold"
              disabled={isPending}
            >
              {isPending ? 'جاري الإضافة...' : 'حفظ شريحة العمولة 💾'}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
