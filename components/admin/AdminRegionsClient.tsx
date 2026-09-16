'use client';

import { useActionState } from 'react';
import { AppShell, PageHeader, Card, Button, Input, Alert } from '@/components';
import { createRegionAction, createAgentAccountAction } from '@/lib/actions/admin';
import type { Region } from '@/lib/types/database';

interface AdminRegionsClientProps {
  regions: Region[];
  agents: any[];
}

export function AdminRegionsClient({ regions, agents }: AdminRegionsClientProps) {
  const [regionState, regionAction, isRegionPending] = useActionState(
    async (_prev: any, formData: FormData) => await createRegionAction(formData),
    null
  );

  const [agentState, agentAction, isAgentPending] = useActionState(
    async (_prev: any, formData: FormData) => await createAgentAccountAction(formData),
    null
  );

  return (
    <AppShell
      header={
        <PageHeader
          title="المناطق والوكلاء"
          titleEn="Regions & Regional Agents"
          backHref="/admin"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 space-y-4">
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            المناطق المفعلة ({regions.length}) 🗺️
          </h3>

          <div className="space-y-2">
            {regions.map((reg) => {
              const assignedAgent = agents.find((a) => a.region_id === reg.id);
              return (
                <div key={reg.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                      {reg.name_ar || reg.name}
                    </span>
                    <span className="badge badge-success">نشطة</span>
                  </div>
                  <div className="text-gray-500">
                    الوكيل المسؤول: <strong>{assignedAgent?.user?.full_name || 'غير معين'}</strong>
                  </div>
                  {reg.whatsapp && (
                    <div className="text-[11px] text-gray-400">
                      واتساب: {reg.whatsapp} | إنستجرام: {reg.instagram || '-'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            إنشاء حساب وكيل جديد 👤
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            الحساب يُنشأ مباشرة من الإدارة ويُربط بمنطقة محددة.
          </p>
          <form action={agentAction} className="space-y-3">
            {agentState?.error && <Alert type="error">{agentState.error}</Alert>}
            {agentState?.success && <Alert type="success">تم إنشاء حساب الوكيل وربطه بالمنطقة بنجاح.</Alert>}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">اسم الوكيل *</label>
              <Input name="full_name" placeholder="مثال: أحمد محمد" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني *</label>
              <Input name="email" type="email" placeholder="agent@example.com" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
              <Input name="phone" placeholder="01012345678" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">كلمة المرور *</label>
              <Input name="password" type="password" minLength={6} placeholder="6 أحرف على الأقل" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">المنطقة *</label>
              <select name="region_id" required className="input w-full">
                <option value="">اختر المنطقة</option>
                {regions.filter((region) => region.is_active).map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name_ar || region.name} ({region.name})
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="primary" size="md" className="w-full font-bold" disabled={isAgentPending}>
              {isAgentPending ? 'جاري إنشاء الحساب...' : 'إنشاء حساب الوكيل'}
            </Button>
          </form>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            إضافة منطقة جغرافية جديدة ➕
          </h3>
          <form action={regionAction} className="space-y-3">
            {regionState?.error && <Alert type="error">{regionState.error}</Alert>}
            {regionState?.success && <Alert type="success">تمت إضافة المنطقة بنجاح! ✅</Alert>}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">اسم المنطقة بالعربية *</label>
              <Input name="name_ar" placeholder="مثال: الشيخ زايد" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">اسم المنطقة بالإنجليزية (Slug) *</label>
              <Input name="name" placeholder="مثال: zayed" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">واتساب الوكيل لسداد العمولات</label>
              <Input name="whatsapp" placeholder="مثال: 01012345678" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">حساب إنستجرام الوكيل</label>
              <Input name="instagram" placeholder="مثال: engz_zayed" />
            </div>
            <Button type="submit" variant="primary" size="md" className="w-full font-bold" disabled={isRegionPending}>
              {isRegionPending ? 'جاري الإضافة...' : 'حفظ المنطقة 💾'}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
