'use client';

import { useActionState } from 'react';
import { AppShell, PageHeader, Card, Button, Input, Alert } from '@/components';
import { updateRegionContactAction } from '@/lib/actions/agent';
import { logoutAction } from '@/lib/actions/auth';
import type { AgentWithRegion } from '@/lib/services/agent';

interface AgentProfileClientProps {
  agent: AgentWithRegion;
}

export function AgentProfileClient({ agent }: AgentProfileClientProps) {
  const [contactState, contactAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const whatsapp = formData.get('whatsapp') as string;
      const instagram = formData.get('instagram') as string;

      const res = await updateRegionContactAction(whatsapp, instagram);
      return res;
    },
    null
  );

  return (
    <AppShell
      header={
        <PageHeader
          title="بيانات الوكيل والمنطقة"
          titleEn="Agent & Region Profile"
          backHref="/agent"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 space-y-4">
        {/* Agent Info */}
        <Card className="p-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 text-white text-xl font-bold flex items-center justify-center mx-auto mb-2 shadow-md">
            🏢
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {agent.user.full_name}
          </h2>
          <p className="text-xs text-gray-500">{agent.user.email}</p>
          <div className="mt-2 flex justify-center gap-2">
            <span className="badge badge-primary">وكيل منطقة معتمد</span>
            <span className="badge badge-success">
              منطقة: {agent.region.name_ar || agent.region.name}
            </span>
          </div>
        </Card>

        {/* Region Contacts Settings */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
            بيانات التواصل الخاصة بالمنطقة 📱
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            هذه الأرقام والحسابات تظهر تلقائياً لطياري منطقتك في صفحة المحفظة لسداد العمولات.
          </p>

          <form action={contactAction} className="space-y-3">
            {contactState?.error && (
              <Alert type="error">{contactState.error}</Alert>
            )}
            {contactState?.success && (
              <Alert type="success">تم حفظ وتحديث بيانات التواصل بنجاح! ✅</Alert>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                رقم الواتساب لاستقبال التحويلات (WhatsApp)
              </label>
              <Input
                name="whatsapp"
                defaultValue={agent.region.whatsapp}
                placeholder="مثال: 01012345678"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                حساب الإنستجرام (Instagram Handle)
              </label>
              <Input
                name="instagram"
                defaultValue={agent.region.instagram}
                placeholder="مثال: engz_october"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full font-bold"
              disabled={isPending}
            >
              {isPending ? 'جاري الحفظ...' : 'حفظ بيانات التواصل 💾'}
            </Button>
          </form>
        </Card>

        {/* Logout */}
        <form action={logoutAction} className="pt-2">
          <Button
            type="submit"
            variant="outline"
            size="md"
            className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            تسجيل الخروج 🚪
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
