import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/types/database';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. If trying to access /register, redirect to /login
  if (pathname.startsWith('/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Public routes that don't require authentication
  const isOrderTracking = pathname.startsWith('/orders/') && pathname !== '/orders';
  const publicRoutes = [
    '/login',
    '/driver/login',
    '/engzadmin/login',
    '/admin/login',
    '/join-driver',
    '/orders/new',
    '/api/pricing/estimate',
  ];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route)) || isOrderTracking;

  // 3. Unauthenticated access handling
  if (!user && !isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone();
    if (pathname.startsWith('/engzadmin') || pathname.startsWith('/admin')) {
      url.pathname = '/engzadmin/login';
    } else if (pathname.startsWith('/driver')) {
      url.pathname = '/driver/login';
    } else {
      url.pathname = '/login';
    }
    return NextResponse.redirect(url);
  }

  // 4. If logged in and accessing login pages, redirect to role dashboard
  if (user && (pathname.startsWith('/login') || pathname === '/engzadmin/login' || pathname === '/driver/login')) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle() as { data: { role: string } | null };

    const role = userData?.role || (user.user_metadata as any)?.role || 'customer';
    const url = request.nextUrl.clone();

    switch (role) {
      case 'admin':
        url.pathname = '/engzadmin';
        break;
      case 'agent':
        url.pathname = '/agent';
        break;
      case 'driver':
        url.pathname = '/driver';
        break;
      default:
        url.pathname = '/orders';
        break;
    }
    return NextResponse.redirect(url);
  }

  // 5. Role-based Route Protection
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle() as { data: { role: string } | null };

    const role = userData?.role || (user.user_metadata as any)?.role || 'customer';

    // Protect admin routes
    if ((pathname.startsWith('/admin') || pathname.startsWith('/engzadmin')) && !pathname.endsWith('/login') && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/engzadmin/login';
      return NextResponse.redirect(url);
    }

    // Protect agent routes
    if (pathname.startsWith('/agent') && role !== 'agent' && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Protect driver routes
    if (pathname.startsWith('/driver') && !pathname.endsWith('/login') && role !== 'driver' && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/driver/login';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
