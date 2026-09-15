// ============================================================
// Engz Driver Core Service — State, orders, location, and atomic actions
// ============================================================

import { createClient } from '@/lib/supabase/server';
import type { Driver, DriverStatus, Order, OrderStatus } from '@/lib/types/database';
import type { OrderWithDetails } from './orders';

export interface DriverProfileWithUser extends Omit<Driver, 'user' | 'region'> {
  user: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    avatar_url: string;
  };
  region?: {
    id: string;
    name: string;
    name_ar: string;
    whatsapp: string;
    instagram: string;
  } | null;
}

/**
 * Get driver record linked to user_id.
 */
export async function getDriverByUserId(userId: string): Promise<DriverProfileWithUser | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('drivers')
    .select(`
      *,
      user:users!drivers_user_id_fkey(id, full_name, email, phone, avatar_url),
      region:regions(id, name, name_ar, whatsapp, instagram)
    `)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as DriverProfileWithUser;
}

/**
 * Update driver status (online / offline / busy).
 */
export async function updateDriverStatus(driverId: string, status: DriverStatus): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Check if driver is blocked
  const { data: driverData } = await supabase
    .from('drivers')
    .select('is_blocked')
    .eq('id', driverId)
    .single();

  const driver = driverData as Pick<Driver, 'is_blocked'> | null;

  if (driver?.is_blocked && status === 'online') {
    return { success: false, error: 'حسابك محظور بسبب تجاوز حد العمولات، يرجى السداد أولاً لتفعيل التواجد' };
  }

  const { error } = await supabase
    .from('drivers')
    .update({ status } as never)
    .eq('id', driverId);

  if (error) {
    return { success: false, error: 'تعذر تحديث الحالة' };
  }

  return { success: true };
}

/**
 * Update driver real-time GPS location.
 */
export async function updateDriverLocation(
  driverId: string,
  lat: number,
  lng: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('drivers')
    .update({
      current_lat: lat,
      current_lng: lng,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', driverId);

  if (error) {
    return { success: false, error: 'تعذر تحديث الموقع' };
  }

  return { success: true };
}

/**
 * Atomically accept an order via Supabase RPC.
 * Prevents race condition so only one driver can accept the order.
 */
export async function acceptOrderAtomically(
  orderId: string,
  driverId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('accept_order' as never, {
    p_order_id: orderId,
    p_driver_id: driverId,
  } as never);

  if (error) {
    console.error('[DriverService] Error in accept_order RPC:', error);
    return { success: false, error: 'تعذر قبول الطلب، قد يكون تم قبوله من طيار آخر' };
  }

  const result = data as { success: boolean; error?: string; message?: string } | null;

  if (!result?.success) {
    return { success: false, error: result?.error || 'تعذر قبول الطلب' };
  }

  return { success: true };
}

/**
 * Update order status by driver (e.g. accepted -> in_progress -> delivered).
 * When delivered, calls atomic commission RPC.
 */
export async function updateDriverOrderStatus(
  orderId: string,
  driverId: string,
  newStatus: 'in_progress' | 'delivered'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // 1. Verify driver owns this order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('id, status, driver_id')
    .eq('id', orderId)
    .single();

  const order = orderData as Pick<Order, 'id' | 'status' | 'driver_id'> | null;

  if (orderError || !order || order.driver_id !== driverId) {
    return { success: false, error: 'غير مصرح بتعديل هذا الطلب' };
  }

  if (newStatus === 'in_progress') {
    if (order.status !== 'accepted') {
      return { success: false, error: 'لا يمكن بدء توصيل الطلب إلا بعد قبوله' };
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'in_progress',
        picked_up_at: new Date().toISOString(),
      } as never)
      .eq('id', orderId);

    if (updateError) return { success: false, error: 'تعذر تحديث حالة الطلب' };

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      old_status: 'accepted',
      new_status: 'in_progress',
      changed_by: driverId,
      notes: 'بدأ الطيار في شراء الأصناف والتوجه للتسليم',
    } as never);

    return { success: true };
  }

  if (newStatus === 'delivered') {
    if (order.status !== 'in_progress') {
      return { success: false, error: 'الطلب ليس في حالة التوصيل حالياً' };
    }

    // Call atomic RPC to complete order and compute commission safely
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'complete_order_with_commission' as never,
      { p_order_id: orderId } as never
    );

    if (rpcError) {
      console.error('[DriverService] Error in complete_order_with_commission RPC:', rpcError);
      return { success: false, error: 'فشل تسجيل إتمام الطلب والعمولة' };
    }

    const result = rpcData as { success: boolean; error?: string } | null;
    if (!result?.success) {
      return { success: false, error: result?.error || 'تعذر إتمام الطلب' };
    }

    return { success: true };
  }

  return { success: false, error: 'حالة غير صالحة' };
}

/**
 * Get assigned orders for driver (active & history).
 */
export async function getDriverOrders(driverId: string, statusFilter?: OrderStatus) {
  const supabase = await createClient();

  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      customer:users!orders_customer_id_fkey(full_name, phone, avatar_url)
    `)
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data as unknown as OrderWithDetails[];
}

/**
 * Get the driver's currently active order (accepted or in_progress).
 * Returns just the order ID for lightweight use in the dashboard.
 */
export async function getDriverActiveOrderId(driverId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('driver_id', driverId)
    .in('status', ['accepted', 'in_progress'] as never[])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return (data as { id: string }).id;
}
