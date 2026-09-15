'use client';
// ============================================================
// Mobile Navigation — Engz Design System
// Bottom tab bar (mobile-first) + optional top header
// Arabic labels with English subtitles
// ============================================================
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
              alt="Engz"
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

        {action && <div className="header-action">{action}</div>}
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
