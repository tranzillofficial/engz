// ============================================================
// Spinner / Loading States — Engz Design System
// ============================================================
import type { ReactNode } from 'react';

// ─── Inline Spinner ───────────────────────────────────────────
export function Spinner({ size = 'md', color = 'primary' }: {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'neutral';
}) {
  return (
    <span
      className={['spinner', `spinner-${size}`, `spinner-${color}`].join(' ')}
      role="status"
      aria-label="جاري التحميل..."
    />
  );
}

// ─── Full Page Loader ─────────────────────────────────────────
export function PageLoader({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="relative flex items-center justify-center mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/images/engz-logo.svg"
          alt="Engz Logo"
          className="w-16 h-16 animate-bounce"
        />
      </div>
      <p className="page-loader-text">{message}</p>
    </div>
  );
}

// ─── Skeleton Blocks ──────────────────────────────────────────
export function Skeleton({ width, height, rounded = 'md', className = '' }: {
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}) {
  return (
    <div
      className={['skeleton', `skeleton-rounded-${rounded}`, className].filter(Boolean).join(' ')}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

// ─── Card Skeleton (for order/driver cards) ───────────────────
export function CardSkeleton() {
  return (
    <div className="card card-default card-p-md" aria-hidden="true">
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <Skeleton width="48px" height="48px" rounded="lg" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton height="16px" width="60%" />
          <Skeleton height="14px" width="80%" />
          <Skeleton height="12px" width="40%" />
        </div>
      </div>
    </div>
  );
}

// ─── List Skeletons ───────────────────────────────────────────
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="list-skeleton" aria-busy="true" aria-label="جاري تحميل البيانات">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  titleEn?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = '📭', title, titleEn, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state animate-fade-in" role="status">
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      <div className="empty-text">
        <h3 className="empty-title">{title}</h3>
        {titleEn && <p className="empty-title-en">{titleEn}</p>}
        {description && <p className="empty-description">{description}</p>}
      </div>
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────
export function ErrorState({
  title = 'حدث خطأ',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state animate-fade-in" role="alert">
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <div className="empty-text">
        <h3 className="empty-title">{title}</h3>
        {description && <p className="empty-description">{description}</p>}
      </div>
      {onRetry && (
        <button type="button" className="btn btn-outline btn-md" onClick={onRetry}>
          حاول مرة أخرى
        </button>
      )}
    </div>
  );
}
