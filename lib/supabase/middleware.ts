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

  // Refresh the session — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't need auth: login, register, new order, and order detail tracking
  const isOrderTracking = pathname.startsWith('/orders/') && pathname !== '/orders';
  const publicRoutes = ['/login', '/register', '/orders/new'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route)) || isOrderTracking;

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access login/register, redirect based on role
  if (user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    const url = request.nextUrl.clone();
    switch (userData?.role) {
      case 'admin':
        url.pathname = '/admin';
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

  // Role-based route protection
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    const role = userData?.role;

    // Protect admin routes
    if ((pathname.startsWith('/admin') || pathname.startsWith('/engzadmin')) && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Protect agent routes
    if (pathname.startsWith('/agent') && role !== 'agent' && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Protect driver routes
    if (pathname.startsWith('/driver') && role !== 'driver' && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
