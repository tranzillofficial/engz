// ============================================================
// Engz Auth Service — server-side auth operations
// ============================================================

import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/types/database';

export interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
  role?: UserRole;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  avatar_url: string;
  is_active: boolean;
}

/**
 * Register a new user (customer or driver only — admin/agent created by admin).
 * Creates Supabase Auth user + inserts into users table.
 * Driver also gets a row in the drivers table.
 */
export async function registerUser(params: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'customer' | 'driver';
}): Promise<AuthResult> {
  const supabase = await createClient();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.full_name,
        phone: params.phone ?? '',
        role: params.role,
      },
    },
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { success: false, error: 'هذا البريد الإلكتروني مسجل مسبقاً' };
    }
    return { success: false, error: 'حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى' };
  }

  if (!authData.user) {
    return { success: false, error: 'فشل إنشاء الحساب، حاول مرة أخرى' };
  }

  // 2. Insert user profile (upsert in case DB trigger already created it)
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: authData.user.id,
      email: params.email,
      full_name: params.full_name,
      phone: params.phone ?? '',
      role: params.role,
      is_active: true,
      avatar_url: '',
    } as never);

  if (profileError) {
    console.error('[auth] profile insert error:', profileError.message);
  }

  // 3. If driver, create driver profile
  if (params.role === 'driver') {
    const { error: driverError } = await supabase.from('drivers').insert({
      user_id: authData.user.id,
      status: 'offline',
      is_blocked: false,
      commission_balance: 0,
      total_completed_orders: 0,
      is_active: true,
    } as never);

    if (driverError) {
      console.error('[auth] driver insert error:', driverError.message);
    }
  }

  return {
    success: true,
    userId: authData.user.id,
    role: params.role,
  };
}

/**
 * Sign in with email and password.
 */
export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<AuthResult & { role?: UserRole }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }
    if (error.message.includes('Email not confirmed')) {
      return { success: false, error: 'يرجى تأكيد البريد الإلكتروني أولاً' };
    }
    return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
  }

  if (!data.user) {
    return { success: false, error: 'فشل تسجيل الدخول' };
  }

  // Fetch user role and active status
  const { data: userData } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single() as { data: Pick<UserRow, 'role' | 'is_active'> | null; error: unknown };

  if (userData && !userData.is_active) {
    await supabase.auth.signOut();
    return { success: false, error: 'تم تعطيل هذا الحساب، تواصل مع الدعم' };
  }

  return {
    success: true,
    userId: data.user.id,
    role: userData?.role as UserRole,
  };
}

/**
 * Sign out the current user.
 */
export async function logoutUser(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * Get the currently authenticated user with their profile.
 */
export async function getCurrentUser(): Promise<UserRow | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single() as { data: UserRow | null; error: unknown };

  return profile;
}

/**
 * Get only the role of the current user (lightweight check).
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: Pick<UserRow, 'role'> | null; error: unknown };

  return data?.role ?? null;
}

/**
 * Get the default dashboard path for a given role.
 */
export function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'agent':
      return '/agent';
    case 'driver':
      return '/driver';
    default:
      return '/orders';
  }
}

/**
 * Update user profile (full_name, phone).
 */
export async function updateProfile(params: {
  full_name: string;
  phone?: string;
}): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'غير مصرح' };

  const { error } = await supabase
    .from('users')
    .update({ full_name: params.full_name, phone: params.phone ?? '' } as never)
    .eq('id', user.id);

  if (error) return { success: false, error: 'فشل تحديث الملف الشخصي' };

  return { success: true };
}

/**
 * Admin helper: update any user's active status.
 * Only callable from admin server actions.
 */
export async function setUserActive(
  userId: string,
  isActive: boolean
): Promise<AuthResult> {
  const adminSupabase = await createAdminClient();

  const { error } = await adminSupabase
    .from('users')
    .update({ is_active: isActive } as never)
    .eq('id', userId);

  if (error) return { success: false, error: 'فشل تحديث حالة المستخدم' };

  return { success: true };
}
