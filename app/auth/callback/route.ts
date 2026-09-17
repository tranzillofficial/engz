import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/orders';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth', url.origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login?error=oauth', url.origin));
  }

  const authUser = data.user;

  // The generated Database type in this project can infer a missing/changed
  // users table shape as `never`. This callback only needs a small, known shape,
  // so use an untyped Supabase client locally instead of weakening the global
  // database types or relying on `never` casts.
  const admin = (await createAdminClient()) as unknown as SupabaseClient;
  const { data: existing, error: existingError } = await admin
    .from('users')
    .select('id, role, is_active')
    .eq('id', authUser.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.redirect(new URL('/login?error=profile', url.origin));
  }

  if (!existing) {
    const metadata = (authUser.user_metadata || {}) as Record<string, unknown>;
    const email = authUser.email || '';
    const fullName = String(metadata.full_name || metadata.name || email.split('@')[0] || 'عميل إنجز');
    const avatarUrl = String(metadata.avatar_url || metadata.picture || '');

    const { error: profileError } = await admin.from('users').upsert({
      id: authUser.id,
      email,
      full_name: fullName,
      phone: String(metadata.phone || ''),
      role: 'customer',
      is_active: true,
      avatar_url: avatarUrl,
    });

    if (profileError) {
      return NextResponse.redirect(new URL('/login?error=profile', url.origin));
    }
  } else if (existing.is_active === false) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login?error=disabled', url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
