'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import InstallPwaButton from '@/components/pwa/InstallPwaButton';

export interface NavItem {
  href: string;
  label: string;
  labelEn?: string;
  icon: ReactNode;
  badge?: number | string;
}

function getContextualNavItems(items: NavItem[], pathname: string): NavItem[] {
  if (pathname.startsWith('/admin')) {
    return [
      { href: '/admin', label: 'الرئيسية', labelEn: 'Overview', icon: '▦' },
      { href: '/admin/orders', label: 'الطلبات', labelEn: 'Orders', icon: '📦' },
      { href: '/admin/drivers', label: 'الطيارين', labelEn: 'Drivers', icon: '🛵' },
      { href: '/admin/regions', label: 'المناطق', labelEn: 'Regions', icon: '🗺️' },
      { href: '/admin/notifications', label: 'الإشعارات', labelEn: 'Notifications', icon: '🔔' },
    ];
  }

  if (pathname.startsWith('/agent')) {
    return [
      { href: '/agent', label: 'الرئيسية', labelEn: 'Overview', icon: '▦' },
      { href: '/agent/orders', label: 'الطلبات', labelEn: 'Orders', icon: '📦' },
      { href: '/agent/drivers', label: 'الطيارين', labelEn: 'Drivers', icon: '🛵' },
      { href: '/agent/drivers/new', label: 'إضافة طيار', labelEn: 'New Driver', icon: '➕' },
      { href: '/agent/profile', label: 'حسابي', labelEn: 'Profile', icon: '👤' },
    ];
  }

  if (pathname.startsWith('/driver')) {
    return [
      { href: '/driver', label: 'المتاحة', labelEn: 'Available', icon: '⚡' },
      { href: '/driver/orders', label: 'طلباتي', labelEn: 'My Orders', icon: '📦' },
      { href: '/driver/wallet', label: 'المحفظة', labelEn: 'Wallet', icon: '💳' },
      { href: '/driver/profile', label: 'حسابي', labelEn: 'Profile', icon: '👤' },
    ];
  }

  return items.slice(0, 5);
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const nav = getContextualNavItems(items, pathname);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 flex items-stretch md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
      aria-label="القائمة الرئيسية"
    >
      <div className="flex w-full items-center justify-around px-1 py-1">
        {nav.map((i) => {
          const active = pathname === i.href || (i.href !== '/admin' && i.href !== '/agent' && pathname.startsWith(i.href + '/'));
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`relative flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 min-h-[56px] ${
                active
                  ? 'text-[#FA3802] font-black scale-105'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <span className="absolute top-0.5 w-6 h-1 rounded-full bg-[#FA3802] shadow-sm shadow-orange-500/50" />
              )}
              <span className="relative flex items-center justify-center text-lg leading-none mb-1">
                {i.icon}
                {i.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold inline-flex items-center justify-center shadow-xs">
                    {i.badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] tracking-tight leading-none text-center ${active ? 'font-black text-[#FA3802]' : 'font-medium'}`}>
                {i.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const nav = items;

  return (
    <nav className="hidden md:flex items-center px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800 shadow-xs sticky top-[64px] z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto w-full flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
        {nav.map((i) => {
          const active = pathname === i.href || (i.href !== '/admin' && i.href !== '/agent' && pathname.startsWith(i.href + '/'));
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-150 ${
                active
                  ? 'bg-[#FA3802] text-white shadow-sm shadow-orange-500/20'
                  : 'text-slate-600 hover:bg-orange-50 hover:text-[#FA3802] dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-sm">{i.icon}</span>
              <span>{i.label}</span>
              {i.badge !== undefined && (
                <span className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] inline-flex items-center justify-center font-black ${
                  active ? 'bg-white text-[#FA3802]' : 'bg-red-100 text-red-600'
                }`}>
                  {i.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DashboardLogoutButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (
    !(
      pathname.startsWith('/admin') ||
      pathname.startsWith('/engzadmin') ||
      pathname.startsWith('/driver') ||
      pathname.startsWith('/agent')
    )
  ) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } finally {
          router.replace('/login');
          router.refresh();
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/90 dark:bg-red-950/40 dark:border-red-900/50 px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors shadow-xs shrink-0"
      title="تسجيل الخروج"
    >
      <span>خروج</span>
      <span className="text-xs">🚪</span>
    </button>
  );
}

export function PageHeader({
  title,
  titleEn,
  subtitle,
  backHref,
  action,
  avatar,
  showLogo = false,
}: {
  title: string;
  titleEn?: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
  avatar?: ReactNode;
  showLogo?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2.5 min-h-[56px]">
        {/* Left / Start Section */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {backHref ? (
            <Link
              href={backHref}
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-orange-50 hover:text-[#FA3802] hover:border-orange-200 transition-colors shrink-0 shadow-xs"
              aria-label="رجوع"
            >
              ←
            </Link>
          ) : showLogo ? (
            <div className="flex items-center shrink-0">
              <img
                src="/assets/images/logo-name.svg"
                alt="ENgz"
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </div>
          ) : null}

          {avatar && <div className="shrink-0">{avatar}</div>}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate">
                {title}
              </h1>
              {titleEn && (
                <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {titleEn}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right / End Section */}
        <div className="flex items-center gap-1.5 shrink-0">
          <InstallPwaButton className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FA3802] border border-orange-200 dark:border-orange-900/50 text-[11px] font-black hover:bg-orange-100 transition-colors shadow-2xs" />
          {action}
          <DashboardLogoutButton />
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  children,
  header,
  navItems,
  noPad = false,
}: {
  children: ReactNode;
  header?: ReactNode;
  navItems?: NavItem[];
  noPad?: boolean;
}) {
  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col">
      {header}
      {navItems && <DesktopNav items={navItems} />}
      <main
        className={`flex-1 overflow-x-hidden ${
          noPad ? '' : 'p-3 sm:p-5'
        } ${navItems ? 'pb-24 md:pb-6' : ''}`}
      >
        {children}
      </main>
      {navItems && <BottomNav items={navItems} />}
    </div>
  );
}
