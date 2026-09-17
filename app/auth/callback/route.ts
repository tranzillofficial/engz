import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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
  const admin = await createAdminClient();
  const { data: existing } = await admin
    .from('users')
    .select('id, role, is_active')
    .eq('id', authUser.id)
    .maybeSingle();

  // Keep the narrow shape explicit so this route remains compatible with
  // Supabase's generated query inference even when the schema types change.
  const existingUser = existing as { id: string; role: string; is_active: boolean } | null;

  if (!existingUser) {
    const metadata = (authUser.user_metadata || {}) as Record<string, unknown>;
    const email = authUser.email || '';
    const fullName = String(metadata.full_name || metadata.name || email.split('@')[0] || 'عميل إنجز');
    const avatarUrl = String(metadata.avatar_url || metadata.picture || '');

    await admin.from('users').upsert({
      id: authUser.id,
      email,
      full_name: fullName,
      phone: String(metadata.phone || ''),
      role: 'customer',
      is_active: true,
      avatar_url: avatarUrl,
    });
  } else if (!existingUser.is_active) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login?error=disabled', url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
