'use client';
import { useActionState } from 'react';
import { AppShell, PageHeader, Card, Button, Input, Alert } from '@/components';
import { updatePricingSettingsAction } from '@/lib/actions/admin';
import type { PricingSettings } from '@/lib/types/database';

export function AdminPricingClient({ settings }: { settings: PricingSettings }) {
  const [state, action, pending] = useActionState(async (_: any, formData: FormData) => updatePricingSettingsAction(formData), null);
  return <AppShell header={<PageHeader title="إعدادات التسعير" titleEn="Pricing" backHref="/admin" />}>
    <div className="max-w-xl mx-auto py-3 px-2 space-y-4">
      <Card className="p-5 space-y-5">
        <div><h2 className="text-base font-black text-slate-900 dark:text-white">تسعير التوصيل</h2><p className="text-xs text-slate-500 mt-1">25 جنيه لمسافة أقل من 4 كم، وبعدها 3 جنيه لكل كيلومتر إضافي.</p></div>
        <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-orange-50 border border-orange-100 p-4 text-center"><b className="block text-2xl font-black text-[#FA3802]">25</b><span className="text-xs text-slate-600">جنيه حتى 4 كم</span></div><div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center"><b className="block text-2xl font-black text-slate-900">+3</b><span className="text-xs text-slate-600">لكل كم إضافي</span></div></div>
        <form action={action} className="space-y-3">
          {state?.error && <Alert type="error">{state.error}</Alert>}{state?.success && <Alert type="success">تم حفظ الإعدادات.</Alert>}
          <input type="hidden" name="base_delivery_fee" value="25" /><input type="hidden" name="default_search_radius_km" value={settings.default_search_radius_km}/><input type="hidden" name="radius_expansion_step_km" value={settings.radius_expansion_step_km}/><input type="hidden" name="max_search_radius_km" value={settings.max_search_radius_km}/><input type="hidden" name="commission_block_threshold" value={settings.commission_block_threshold}/>
          <div><label className="block text-xs font-bold mb-1">أول 3 طلبات</label><div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">بدون عمولة</div><input type="hidden" name="free_orders" value="3"/></div>
          <div><label className="block text-xs font-bold mb-1">عمولة الطيار بعد أول 3 طلبات</label><Input name="driver_commission_per_order" type="number" min="0" step="0.5" defaultValue={(settings as any).driver_commission_per_order ?? 6} required /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold mb-1">نصيب المنصة مع الوكيل</label><Input name="platform_share_per_agent_order" type="number" min="0" step="0.5" defaultValue={(settings as any).platform_share_per_agent_order ?? 2.5} required /></div><div><label className="block text-xs font-bold mb-1">نصيب الوكيل</label><Input name="agent_share_per_order" type="number" min="0" step="0.5" defaultValue={(settings as any).agent_share_per_order ?? 3.5} required /></div></div>
          <Button type="submit" className="w-full" disabled={pending}>{pending?'جاري الحفظ...':'حفظ إعدادات العمولة'}</Button>
        </form>
      </Card>
    </div>
  </AppShell>;
}
