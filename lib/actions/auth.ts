'use server';

import { redirect } from 'next/navigation';
import { loginSchema, registerSchema, updateProfileSchema } from '@/lib/validations';
import { loginUser, registerUser, logoutUser, updateProfile, getRoleDashboard } from '@/lib/services/auth';

/**
 * Server Action: Login (General)
 */
export async function loginAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; redirectTo?: string }> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message;
    return { error: firstError ?? 'بيانات غير صالحة' };
  }

  const result = await loginUser(parsed.data);

  if (!result.success) {
    return { error: result.error };
  }

  const dashboardPath = getRoleDashboard(result.role!);
  redirect(dashboardPath);
}

/**
 * Server Action: Admin Dedicated Login (/engzadmin/login)
 */
export async function adminLoginAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const raw = {
    email: (formData.get('email') as string)?.trim().toLowerCase(),
    password: formData.get('password') as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message;
    return { error: firstError ?? 'بيانات غير صالحة' };
  }

  const result = await loginUser(parsed.data);

  if (!result.success) {
    return { error: result.error };
  }

  if (result.role !== 'admin') {
    await logoutUser();
    return { error: 'غير مصرح: هذا الحساب ليس لديه صلاحيات الإدارة المركزية' };
  }

  redirect('/engzadmin');
}

/**
 * Server Action: Register (Disabled — Customers use Guest checkout, Drivers use /join-driver)
 */
export async function registerAction(
  _prevState: { error?: string; success?: boolean } | null,
  _formData: FormData
): Promise<{ error?: string; success?: boolean; message?: string }> {
  return {
    error: 'التسجيل المباشر متوقف حالياً. يمكن للعملاء إنشاء الطلبات مباشرة، ويمكن للطيارين التقديم عبر رابط (انضم كطيار).',
  };
}

/**
 * Server Action: Update Profile
 */
export async function updateProfileAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const fullName = formData.get('full_name') as string;
  const phone = (formData.get('phone') as string) || '';

  const parsed = updateProfileSchema.safeParse({ full_name: fullName, phone });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'البيانات غير صالحة' };
  }

  const result = await updateProfile(parsed.data);
  return result;
}

/**
 * Server Action: Logout
 */
export async function logoutAction(): Promise<void> {
  await logoutUser();
  redirect('/login');
}

/**
 * Server Action: Driver Login by Phone Number
 */
export async function driverLoginAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; redirectTo?: string }> {
  const phone = (formData.get('phone') as string)?.trim().replace(/\s/g, '') || '';
  const password = formData.get('password') as string;

  if (!phone) return { error: 'يرجى إدخال رقم الهاتف' };
  if (!password) return { error: 'يرجى إدخال كلمة المرور' };

  // Convert phone to driver email format
  const email = `${phone}@driver.engz.app`;
  const result = await loginUser({ email, password });

  if (!result.success) {
    // Try raw email in case driver registered with email
    const fallback = await loginUser({ email: phone, password });
    if (!fallback.success) {
      return { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' };
    }
    if (fallback.role !== 'driver' && fallback.role !== 'admin') {
      return { error: 'هذا الحساب ليس حساب طيار' };
    }
    redirect('/driver');
  }

  if (result.role !== 'driver' && result.role !== 'admin') {
    return { error: 'هذا الحساب ليس حساب طيار مصرح له' };
  }

  redirect('/driver');
}

/**
 * Server Action: Change Password
 */
export async function changePasswordAction(formData: FormData) {
  const newPassword = formData.get('new_password') as string;
  if (!newPassword || newPassword.length < 6) {
    return { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: 'فشل تغيير كلمة المرور' };
  }

  return { success: true };
}

