// ============================================================
// Badge / StatusBadge Component — Engz Design System
// Order statuses, driver statuses, role tags — Arabic labels
// ============================================================
import type { OrderStatus, DriverStatus, PaymentStatus, UserRole } from '@/lib/types/database';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ children, variant = 'neutral', size = 'md', dot = false, pulse = false }: BadgeProps) {
  return (
    <span className={['badge', `badge-${variant}`, `badge-${size}`].join(' ')}>
      {dot && <span className={['badge-dot', pulse ? 'animate-pulse-dot' : ''].filter(Boolean).join(' ')} aria-hidden="true" />}
      {children}
    </span>
  );
}

// ─── Order Status Badge ───────────────────────────────────────
const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; labelEn: string; variant: BadgeVariant; dot?: boolean; pulse?: boolean }> = {
  pending:     { label: 'في الانتظار',   labelEn: 'Pending',     variant: 'warning',  dot: true,  pulse: true },
  accepted:    { label: 'تم القبول',      labelEn: 'Accepted',    variant: 'info',     dot: true  },
  in_progress: { label: 'قيد التوصيل',   labelEn: 'In Progress', variant: 'primary',  dot: true,  pulse: true },
  delivered:   { label: 'تم التوصيل',    labelEn: 'Delivered',   variant: 'success' },
  cancelled:   { label: 'ملغي',           labelEn: 'Cancelled',   variant: 'danger' },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  showEn?: boolean;
}

export function OrderStatusBadge({ status, showEn = false }: OrderStatusBadgeProps) {
  const config = ORDER_STATUS_MAP[status];
  return (
    <Badge variant={config.variant} dot={config.dot} pulse={config.pulse}>
      {config.label}
      {showEn && <span className="badge-en-label">{config.labelEn}</span>}
    </Badge>
  );
}

// ─── Driver Status Badge ──────────────────────────────────────
const DRIVER_STATUS_MAP: Record<DriverStatus, { label: string; labelEn: string; variant: BadgeVariant; pulse?: boolean }> = {
  online:  { label: 'متصل',    labelEn: 'Online',  variant: 'success', pulse: true },
  offline: { label: 'غير متصل', labelEn: 'Offline', variant: 'neutral' },
  busy:    { label: 'مشغول',   labelEn: 'Busy',    variant: 'warning', pulse: true },
};

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const config = DRIVER_STATUS_MAP[status];
  return (
    <Badge variant={config.variant} dot pulse={config.pulse}>
      {config.label}
    </Badge>
  );
}

// ─── Payment Status Badge ─────────────────────────────────────
const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  pending:   { label: 'قيد المراجعة', variant: 'warning' },
  confirmed: { label: 'مؤكد',         variant: 'success' },
  rejected:  { label: 'مرفوض',        variant: 'danger' },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = PAYMENT_STATUS_MAP[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ─── Role Badge ───────────────────────────────────────────────
const ROLE_MAP: Record<UserRole, { label: string; variant: BadgeVariant }> = {
  admin:    { label: 'مدير',     variant: 'danger' },
  agent:    { label: 'وكيل',    variant: 'info' },
  driver:   { label: 'مندوب',   variant: 'primary' },
  customer: { label: 'عميل',    variant: 'neutral' },
};

export function RoleBadge({ role }: { role: UserRole }) {
  const config = ROLE_MAP[role];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

import React from 'react';
