// ============================================================
// Card Component — Engz Design System
// ============================================================
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  clickable?: boolean;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  clickable = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'card',
        `card-${variant}`,
        `card-p-${padding}`,
        clickable ? 'card-clickable' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Card Header ─────────────────────────────────────────────
interface CardHeaderProps {
  title: string;
  titleEn?: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({ title, titleEn, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="card-header">
      <div className="card-header-content">
        {icon && <span className="card-header-icon" aria-hidden="true">{icon}</span>}
        <div>
          <h3 className="card-title">
            {title}
            {titleEn && <span className="card-title-en">{titleEn}</span>}
          </h3>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  labelEn?: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: { value: number; positive: boolean };
}

export function StatCard({ label, labelEn, value, icon, color = 'primary', trend }: StatCardProps) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-top">
        <div className="stat-info">
          <p className="stat-label">
            {label}
            {labelEn && <span className="stat-label-en">{labelEn}</span>}
          </p>
          <p className="stat-value">{value}</p>
        </div>
        {icon && <div className={`stat-icon stat-icon-${color}`} aria-hidden="true">{icon}</div>}
      </div>
      {trend && (
        <p className={`stat-trend ${trend.positive ? 'stat-trend-up' : 'stat-trend-down'}`}>
          {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          <span className="stat-trend-label">{trend.positive ? 'ارتفاع' : 'انخفاض'}</span>
        </p>
      )}
    </div>
  );
}
