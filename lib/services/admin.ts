// ============================================================
// Engz Admin Core Service — System-wide management & analytics
// ============================================================

import { createClient, createAdminClient } from '@/lib/supabase/server';
import type {
  User,
  Region,
  Agent,
  Driver,
  Order,
  PricingSettings,
  PricingDistanceTier,
  CommissionTier,
  PaymentConfirmation,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from '@/lib/types/database';

export interface AdminSystemStats {
  totalOrders: number;
  totalCustomers: number;
  totalDrivers: number;
  onlineDrivers: number;
  totalAgents: number;
  totalRegions: number;
  totalCommissionsCollected: number;
  unpaidCommissionsTotal: number;
  pendingPaymentsCount: number;
}

/**
 * Get system-wide platform KPIs and metrics.
 */
export async function getAdminSystemStats(): Promise<AdminSystemStats> {
  const supabase = await createClient();

  // Orders count
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  // Users counts by role
  const { count: totalCustomers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer');

  const { count: totalAgents } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: totalRegions } = await supabase
    .from('regions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Drivers & Commissions
  const { data: driversData } = await supabase
    .from('drivers')
    .select('id, status, commission_balance');

  const rawDrivers = (driversData as unknown as Pick<Driver, 'id' | 'status' | 'commission_balance'>[]) || [];
  const totalDrivers = rawDrivers.length;
  const onlineDrivers = rawDrivers.filter((d) => d.status === 'online').length;
  const unpaidCommissionsTotal = rawDrivers.reduce((sum, d) => sum + Number(d.commission_balance || 0), 0);

  // Transactions ledger sum for paid
  const { data: txData } = await supabase
    .from('commission_transactions')
    .select('amount')
    .eq('transaction_type', 'payment');

  const totalCommissionsCollected = ((txData as unknown as { amount: number }[]) || []).reduce(
    (sum, tx) => sum + Number(tx.amount || 0),
    0
  );

  // Pending payments count
  const { count: pendingPaymentsCount } = await supabase
    .from('payment_confirmations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    totalOrders: totalOrders || 0,
    totalCustomers: totalCustomers || 0,
    totalDrivers,
    onlineDrivers,
    totalAgents: totalAgents || 0,
    totalRegions: totalRegions || 0,
    totalCommissionsCollected,
    unpaidCommissionsTotal,
    pendingPaymentsCount: pendingPaymentsCount || 0,
  };
}

/**
 * Get all orders with search & status filters.
 */
export async function getAdminOrders(params?: {
  status?: OrderStatus;
  search?: string;
  limit?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('orders')
    .select(`
      *,
      customer:users!orders_customer_id_fkey(id, full_name, phone, email),
      driver:drivers(
        id,
        user:users(full_name, phone)
      ),
      order_items(*)
    `)
    .order('created_at', { ascending: false })
    .limit(params?.limit || 100);

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  
  let result = data as any[];
  if (params?.search && params.search.trim()) {
    const s = params.search.trim().toLowerCase();
    result = result.filter(
      (o) =>
        o.id.toLowerCase().includes(s) ||
        o.customer?.phone?.includes(s) ||
        o.customer?.full_name?.toLowerCase().includes(s) ||
        o.dropoff_address?.toLowerCase().includes(s)
    );
  }
  return result;
}

/**
 * Get complete order details for admin review, including items, customer history, and chat messages.
 */
export async function getAdminOrderDetail(orderId: string) {
  const supabase = await createClient();

  const { data: orderData, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:users!orders_customer_id_fkey(id, full_name, phone, email, created_at),
      driver:drivers(
        id,
        commission_balance,
        user:users(id, full_name, phone, avatar_url)
      ),
      order_items(*),
      region:regions(id, name_ar, name)
    `)
    .eq('id', orderId)
    .single();

  if (error || !orderData) return null;
  const order = orderData as any;

  // Fetch chat messages (retained for 48 hours)
  const { data: messages } = await supabase
    .from('chat_messages')
    .select(`
      *,
      sender:users!chat_messages_sender_id_fkey(id, full_name, role, avatar_url)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  // Fetch other orders by this customer
  let customerPreviousOrders: any[] = [];
  if (order.customer_id) {
    const { data: prev } = await supabase
      .from('orders')
      .select('id, status, delivery_fee, created_at, dropoff_address')
      .neq('id', orderId)
      .eq('customer_id', order.customer_id)
      .order('created_at', { ascending: false })
      .limit(15);
    customerPreviousOrders = prev || [];
  }

  return {
    order,
    messages: messages || [],
    customerPreviousOrders,
  };
}

/**
 * Get all drivers in the system with region and user details.
 */
export async function getAdminDrivers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('drivers')
    .select(`
      *,
      user:users!drivers_user_id_fkey(id, full_name, email, phone, avatar_url, is_active),
      region:regions(id, name, name_ar)
    `)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as any[];
}

/**
 * Get all customers.
 */
export async function getAdminCustomers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as User[];
}

/**
 * Get all agents with assigned regions and user info.
 */
export async function getAdminAgents() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agents')
    .select(`
      *,
      user:users!agents_user_id_fkey(id, full_name, email, phone, is_active),
      region:regions(id, name, name_ar)
    `)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as any[];
}

/**
 * Get all regions.
 */
export async function getAdminRegions() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Region[];
}

/**
 * Get full pricing configuration and distance tiers.
 */
export async function getAdminPricingConfig() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('pricing_settings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: distanceTiers } = await supabase
    .from('pricing_distance_tiers')
    .select('*')
    .order('sort_order', { ascending: true });

  return {
    settings: (settings as PricingSettings | null) || {
      id: 'default',
      base_delivery_fee: 25,
      default_search_radius_km: 2,
      radius_expansion_step_km: 2,
      max_search_radius_km: 5,
      commission_block_threshold: 100,
      currency: 'EGP',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      free_orders: 3,
      driver_commission_per_order: 6,
      platform_share_per_agent_order: 2.5,
      agent_share_per_order: 3.5,
      additional_fee_per_km: 3,
      base_distance_km: 4,
      additional_km_fee: 3,
    },
    distanceTiers: (distanceTiers as PricingDistanceTier[]) || [],
  };
}

/**
 * Get all commission tiers.
 */
export async function getAdminCommissionTiers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('commission_tiers')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data as CommissionTier[];
}

/**
 * Get all manual payment confirmations platform-wide.
 */
export async function getAdminPayments(statusFilter?: PaymentStatus) {
  const supabase = await createClient();

  let query = supabase
    .from('payment_confirmations')
    .select(`
      *,
      driver:drivers(
        id,
        commission_balance,
        user:users(full_name, phone, email),
        region:regions(name_ar, name)
      ),
      reviewer:users!payment_confirmations_reviewed_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as any[];
}
