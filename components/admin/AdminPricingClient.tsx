'use client';

import { useActionState, useTransition } from 'react';
import { AppShell, PageHeader, Card, Button, Input, Alert } from '@/components';
import {
  updatePricingSettingsAction,
  addDistanceTierAction,
  deleteDistanceTierAction,
} from '@/lib/actions/admin';
import type { PricingSettings, PricingDistanceTier } from '@/lib/types/database';

interface AdminPricingClientProps {
  settings: PricingSettings;
  distanceTiers: PricingDistanceTier[];
}

export function AdminPricingClient({ settings, distanceTiers }: AdminPricingClientProps) {
  const [settingsState, settingsAction, isSettingsPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      return await updatePricingSettingsAction(formData);
    },
    null
  );

  const [tierState, tierAction, isTierPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      return await addDistanceTierAction(formData);
    },
    null
  );

  const [isDeleting, startDeleteTransition] = useTransition();

  const handleDeleteTier = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الشريحة؟')) {
      startDeleteTransition(async () => {
        await deleteDistanceTierAction(id);
      });
    }
  };

  return (
    <AppShell
      header={
        <PageHeader
          title="إعدادات التسعير والمسافات"
          titleEn="Pricing & Radius Config"
          backHref="/admin"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 space-y-4">
        {/* General Pricing Settings */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            الإعدادات الأساسية ونصف القطر ⚙️
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            تحكم في الرسوم الثابتة وخوارزمية البحث عن أقرب طيار وتوسيع النطاق.
          </p>

          <form action={settingsAction} className="space-y-3">
            {settingsState?.error && <Alert type="error">{settingsState.error}</Alert>}
            {settingsState?.success && <Alert type="success">تم حفظ إعدادات التسعير بنجاح! ✅</Alert>}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                الرسوم الأساسية للتوصيل (ج.م) *
              </label>
              <Input
                name="base_delivery_fee"
                type="number"
                step="0.5"
                defaultValue={settings.base_delivery_fee}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  نصف القطر الأولي (كم)
                </label>
                <Input
                  name="default_search_radius_km"
                  type="number"
                  step="0.5"
                  defaultValue={settings.default_search_radius_km}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  خطوة التوسيع (كم)
                </label>
                <Input
                  name="radius_expansion_step_km"
                  type="number"
                  step="0.5"
                  defaultValue={settings.radius_expansion_step_km}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  أقصى نطاق بحث (كم)
                </label>
                <Input
                  name="max_search_radius_km"
                  type="number"
                  step="0.5"
                  defaultValue={settings.max_search_radius_km}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  حد حظر العمولات (ج.م)
                </label>
                <Input
                  name="commission_block_threshold"
                  type="number"
                  defaultValue={settings.commission_block_threshold}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full font-bold"
              disabled={isSettingsPending}
            >
              {isSettingsPending ? 'جاري الحفظ...' : 'حفظ الإعدادات الأساسية 💾'}
            </Button>
          </form>
        </Card>

        {/* Distance Pricing Tiers List */}
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            شرائح تسعير المسافات الإضافية 📏
          </h3>

          <div className="space-y-2">
            {distanceTiers.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">لا توجد شرائح مسافات مخصصة</p>
            ) : (
              distanceTiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      من {tier.min_distance_km} كم إلى {tier.max_distance_km === 0 ? 'ما فوق' : `${tier.max_distance_km} كم`}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 block font-semibold">
                      +{tier.additional_fee} جنيه إضافي
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => handleDeleteTier(tier.id)}
                  >
                    حذف
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Add Distance Tier Form */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            إضافة شريحة مسافة جديدة ➕
          </h3>

          <form action={tierAction} className="space-y-3">
            {tierState?.error && <Alert type="error">{tierState.error}</Alert>}
            {tierState?.success && <Alert type="success">تمت إضافة الشريحة بنجاح! ✅</Alert>}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  من مسافة (كم)
                </label>
                <Input name="min_distance_km" type="number" step="0.5" placeholder="مثال: 2" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  إلى مسافة (كم)
                </label>
                <Input name="max_distance_km" type="number" step="0.5" placeholder="مثال: 4" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                الرسوم الإضافية (ج.م)
              </label>
              <Input name="additional_fee" type="number" step="1" placeholder="مثال: 5" required />
            </div>

            <Button
              type="submit"
              variant="outline"
              size="md"
              className="w-full font-bold text-indigo-600 border-indigo-200"
              disabled={isTierPending}
            >
              {isTierPending ? 'جاري الإضافة...' : '+ إضافة الشريحة'}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
