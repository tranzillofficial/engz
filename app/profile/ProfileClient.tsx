'use client';

import { useActionState } from 'react';
import { AppShell, PageHeader, Card, Button, Input, Alert } from '@/components';
import { PwaRoleInstallCard } from '@/components/pwa/PwaRoleInstallCard';
import { updateProfileAction, logoutAction } from '@/lib/actions/auth';
import type { User } from '@/lib/types/database';

interface ProfilePageProps {
  user: User;
}

export default function ProfileClient({ user }: ProfilePageProps) {
  const [profileState, profileAction, isPending] = useActionState(
    updateProfileAction,
    null
  );

  return (
    <AppShell
      header={
        <PageHeader
          title="الملف الشخصي"
          titleEn="My Profile"
          backHref="/orders"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 space-y-4">
        <PwaRoleInstallCard role={user.role as any} />

        <Card className="p-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-2 shadow-md">
            {user.full_name?.charAt(0) || 'ع'}
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {user.full_name}
          </h2>
          <p className="text-xs text-gray-500">{user.email}</p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {user.role === 'customer' ? 'عميل' : user.role === 'driver' ? 'طيار' : user.role}
          </span>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
            تعديل البيانات الأساسية
          </h3>

          <form action={profileAction} className="space-y-3">
            {profileState?.error && (
              <Alert type="error">{profileState.error}</Alert>
            )}
            {profileState?.success && (
              <Alert type="success">تم حفظ التعديلات بنجاح!</Alert>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                الاسم بالكامل
              </label>
              <Input
                name="full_name"
                defaultValue={user.full_name}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                رقم الهاتف
              </label>
              <Input
                name="phone"
                defaultValue={user.phone ?? ''}
                placeholder="01xxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                البريد الإلكتروني (غير قابل للتعديل)
              </label>
              <Input
                value={user.email}
                disabled
                className="opacity-70 cursor-not-allowed"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              disabled={isPending}
            >
              {isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </form>
        </Card>

        <form action={logoutAction} className="pt-2">
          <Button
            type="submit"
            variant="outline"
            size="md"
            className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40"
            id="profile-logout-btn"
          >
            تسجيل الخروج 🚪
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
