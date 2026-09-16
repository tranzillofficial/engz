'use server';

import { redirect } from 'next/navigation';
import { loginSchema, registerSchema, updateProfileSchema } from '@/lib/validations';
import { loginUser, registerUser, logoutUser, updateProfile, getRoleDashboard } from '@/lib/services/auth';

export async function loginAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; redirectTo?: string }> {
  const raw = { email: formData.get('email') as string, password: formData.get('password') as string };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' };
  const result = await loginUser(parsed.data);
  if (!result.success) return { error: result.error };
  redirect(getRoleDashboard(result.role!));
}

export async function adminLoginAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const raw = { email: (formData.get('email') as string)?.trim().toLowerCase(), password: formData.get('password') as string };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' };
  const result = await loginUser(parsed.data);
  if (!result.success) return { error: result.error };
  if (result.role !== 'admin') {
    await logoutUser();
    return { error: 'غير مصرح: هذا الحساب ليس لديه صلاحيات الإدارة المركزية' };
  }
  redirect('/engzadmin');
}

export async function registerAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; message?: string }> {
  const raw = {
    email: (formData.get('email') as string)?.trim().toLowerCase(),
    password: formData.get('password') as string,
    full_name: (formData.get('full_name') as string)?.trim(),
    phone: ((formData.get('phone') as string) || '').replace(/\s/g, ''),
  };
  const parsed = registerSchema.safeParse({ ...raw, role: 'customer' });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'البيانات غير صالحة' };

  const result = await registerUser({
    email: parsed.data.email,
    password: parsed.data.password,
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    role: 'customer',
  });
  if (!result.success) return { error: result.error };

  redirect('/orders');
}

export async function updateProfileAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const fullName = formData.get('full_name') as string;
  const phone = (formData.get('phone') as string) || '';
  const parsed = updateProfileSchema.safeParse({ full_name: fullName, phone });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'البيانات غير صالحة' };
  return updateProfile(parsed.data);
}

export async function logoutAction(): Promise<void> {
  await logoutUser();
  redirect('/login');
}

export async function driverLoginAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; redirectTo?: string }> {
  const phone = (formData.get('phone') as string)?.trim().replace(/\s/g, '') || '';
  const password = formData.get('password') as string;
  if (!phone) return { error: 'يرجى إدخال رقم الهاتف' };
  if (!password) return { error: 'يرجى إدخال كلمة المرور' };
  const email = `${phone}@driver.engz.app`;
  const result = await loginUser({ email, password });
  if (!result.success) {
    const fallback = await loginUser({ email: phone, password });
    if (!fallback.success) return { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' };
    if (fallback.role !== 'driver' && fallback.role !== 'admin') return { error: 'هذا الحساب ليس حساب طيار' };
    redirect('/driver');
  }
  if (result.role !== 'driver' && result.role !== 'admin') return { error: 'هذا الحساب ليس حساب طيار مصرح له' };
  redirect('/driver');
}

export async function changePasswordAction(formData: FormData) {
  const newPassword = formData.get('new_password') as string;
  if (!newPassword || newPassword.length < 6) return { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: 'فشل تغيير كلمة المرور' };
  return { success: true };
}
