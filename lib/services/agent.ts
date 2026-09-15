// ============================================================
// Engz Agent Core Service — Region scoped management
// ============================================================

import { createClient } from '@/lib/supabase/server';
import type { Agent, Region, Driver, Order, PaymentConfirmation, OrderStatus, PaymentStatus } from '@/lib/types/database';

export interface AgentWithRegion extends Omit<Agent, 'user' | 'region'> {
  user: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    avatar_url: string;
  };
  region: Region;
}

export interface RegionStats {
  totalDrivers: number;
  onlineDrivers: number;
  blockedDrivers: number;
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  pendingPaymentsCount: number;
  totalPendingPaymentsAmount: number;
}

/**
 * Get Agent record and assigned region by user_id.
 */
export async function getAgentByUserId(userId: string): Promise<AgentWithRegion | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agents')
    .select(`
      *,
      user:users!agents_user_id_fkey(id, full_name, email, phone, avatar_url),
      region:regions(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as AgentWithRegion;
}

/**
 * Get aggregated statistics for agent's region.
 */
export async function getAgentRegionStats(regionId: string): Promise<RegionStats> {
  const supabase = await createClient();

  // 1. Drivers in this region
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, status, is_blocked')
    .eq('region_id', regionId);

  const rawDrivers = (drivers as unknown as Pick<Driver, 'id' | 'status' | 'is_blocked'>[]) || [];
  const totalDrivers = rawDrivers.length;
  const onlineDrivers = rawDrivers.filter((d) => d.status === 'online').length;
  const blockedDrivers = rawDrivers.filter((d) => d.is_blocked).length;

  // 2. Orders in this region
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status')
    .eq('region_id', regionId);

  const rawOrders = (orders as unknown as Pick<Order, 'id' | 'status'>[]) || [];
  const totalOrders = rawOrders.length;
  const activeOrders = rawOrders.filter((o) => o.status === 'accepted' || o.status === 'in_progress').length;
  const deliveredOrders = rawOrders.filter((o) => o.status === 'delivered').length;

  // 3. Pending payments for drivers in this region
  const driverIds = rawDrivers.map((d) => d.id);
  let pendingPaymentsCount = 0;
  let totalPendingPaymentsAmount = 0;

  if (driverIds.length > 0) {
    const { data: payments } = await supabase
      .from('payment_confirmations')
      .select('amount')
      .in('driver_id', driverIds)
      .eq('status', 'pending');

    const rawPayments = (payments as unknown as Pick<PaymentConfirmation, 'amount'>[]) || [];
    pendingPaymentsCount = rawPayments.length;
    totalPendingPaymentsAmount = rawPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  }

  return {
    totalDrivers,
    onlineDrivers,
    blockedDrivers,
    totalOrders,
    activeOrders,
    deliveredOrders,
    pendingPaymentsCount,
    totalPendingPaymentsAmount,
  };
}

/**
 * Get all drivers in agent's region with full details.
 */
export async function getAgentDrivers(regionId: string, statusFilter?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('drivers')
    .select(`
      *,
      user:users!drivers_user_id_fkey(id, full_name, email, phone, avatar_url, is_active)
    `)
    .eq('region_id', regionId)
    .order('created_at', { ascending: false });

  if (statusFilter === 'online') {
    query = query.eq('status', 'online');
  } else if (statusFilter === 'blocked') {
    query = query.eq('is_blocked', true);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data as unknown as (Driver & {
    user: { id: string; full_name: string; email: string; phone: string; avatar_url: string; is_active: boolean };
  })[];
}

/**
 * Get orders in agent's region with filter.
 */
export async function getAgentOrders(regionId: string, statusFilter?: OrderStatus) {
  const supabase = await createClient();

  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      customer:users!orders_customer_id_fkey(full_name, phone),
      driver:drivers(
        id,
        user:users(full_name, phone)
      )
    `)
    .eq('region_id', regionId)
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data as any[];
}

/**
 * Get manual payment confirmations for drivers in agent's region.
 */
export async function getAgentPayments(regionId: string, statusFilter?: PaymentStatus) {
  const supabase = await createClient();

  // First get driver IDs in region
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id')
    .eq('region_id', regionId);

  const driverIds = ((drivers as unknown as Pick<Driver, 'id'>[]) || []).map((d) => d.id);
  if (driverIds.length === 0) return [];

  let query = supabase
    .from('payment_confirmations')
    .select(`
      *,
      driver:drivers(
        id,
        commission_balance,
        is_blocked,
        user:users(full_name, phone, email)
      ),
      reviewer:users!payment_confirmations_reviewed_by_fkey(full_name)
    `)
    .in('driver_id', driverIds)
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data as (PaymentConfirmation & {
    driver: {
      id: string;
      commission_balance: number;
      is_blocked: boolean;
      user: { full_name: string; phone: string; email: string };
    };
    reviewer?: { full_name: string } | null;
  })[];
}
