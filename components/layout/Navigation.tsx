'use client';
// ============================================================
// Mobile Navigation — Engz Design System
// Bottom tab bar (mobile-first) + optional top header
// Arabic labels with English subtitles
// ============================================================
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;       // Arabic
  labelEn: string;     // English
  icon: ReactNode;
  badge?: number | string;
}

// ─── Bottom Tab Bar (Mobile Primary Nav) ─────────────────────
interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="القائمة الرئيسية">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={['bottom-nav-item', isActive ? 'bottom-nav-item-active' : ''].filter(Boolean).join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="bottom-nav-icon" aria-hidden="true">
              {item.icon}
              {item.badge !== undefined && (
                <span className="bottom-nav-badge">{item.badge}</span>
              )}
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Top Page Header ──────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  titleEn?: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
  avatar?: ReactNode;
  showLogo?: boolean;
}

function DashboardLogoutButton() {
  const pathname = usePathname();
  const router = useRouter();

  const isDashboard =
    pathname === '/admin' || pathname.startsWith('/admin/') ||
    pathname === '/engzadmin' || pathname.startsWith('/engzadmin/') ||
    pathname === '/driver' || pathname.startsWith('/driver/') ||
    pathname === '/agent' || pathname.startsWith('/agent/');

  if (!isDashboard) return null;

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/60"
      aria-label="تسجيل الخروج"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span>خروج</span>
    </button>
  );
}

export function PageHeader({ title, titleEn, subtitle, backHref, action, avatar, showLogo = false }: PageHeaderProps) {
  return (
    <header className="page-top-header">
      <div className="page-top-header-inner">
        {backHref ? (
          <Link href={backHref} className="back-btn" aria-label="رجوع">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {/* RTL: arrow pointing right (back in RTL) */}
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ) : showLogo ? (
          <div className="flex items-center shrink-0 ml-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/logo-name.svg"
              alt="ENgz"
              className="h-6 w-auto"
            />
          </div>
        ) : null}

        {avatar && <div className="header-avatar">{avatar}</div>}

        <div className="header-text">
          <h1 className="header-title">
            {title}
            {titleEn && <span className="header-title-en">{titleEn}</span>}
          </h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>

        <div className="header-action flex items-center gap-2">
          {action}
          <DashboardLogoutButton />
        </div>
      </div>
    </header>
  );
}

// ─── App Shell — wraps page with header + bottom nav ─────────
interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  navItems?: NavItem[];
  noPad?: boolean;
}

export function AppShell({ children, header, navItems, noPad = false }: AppShellProps) {
  return (
    <div className="app-shell">
      {header}
      <main className={['app-main', noPad ? '' : 'app-main-padded', navItems ? 'app-main-with-nav' : ''].filter(Boolean).join(' ')}>
        {children}
      </main>
      {navItems && <BottomNav items={navItems} />}
    </div>
  );
}
