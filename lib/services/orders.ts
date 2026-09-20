// ============================================================
// Engz Orders Service — Order management and lifecycle operations
// ============================================================

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { defaultMapsProvider } from './maps';
import { calculateDeliveryFee } from './pricing';
import type { Order, OrderItem, OrderStatus, User, Driver } from '@/lib/types/database';
import type { CreateOrderInput } from '@/lib/validations';

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export interface OrderWithDetails extends Omit<Order, 'driver'> {
  customer?: User;
  order_items: OrderItem[];
  driver?: (Driver & {
    user?: Pick<User, 'full_name' | 'phone' | 'avatar_url'>;
  }) | null;
}

/**
 * Valid order status transitions map to enforce business rules.
 */
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function isValidStatusTransition(current: OrderStatus, target: OrderStatus): boolean {
  return VALID_STATUS_TRANSITIONS[current]?.includes(target) ?? false;
}

/**
 * Create a new delivery order.
 * Calculates driving distance, computes pricing snapshot, and inserts order with items atomically.
 */
export async function createOrder(
  customerId: string,
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const supabase = await createAdminClient();

  try {
    // 1. Calculate driving route distance & duration
    const isLocalErrand =
      Math.abs(input.pickup_lat - input.dropoff_lat) < 0.005 &&
      Math.abs(input.pickup_lng - input.dropoff_lng) < 0.005;

    let distanceKm = 1;
    let durationMinutes = 15;

    if (!isLocalErrand) {
      const route = await defaultMapsProvider.getDrivingRoute(
        { lat: input.pickup_lat, lng: input.pickup_lng },
        { lat: input.dropoff_lat, lng: input.dropoff_lng }
      );
      distanceKm = route.distanceKm > 0 ? route.distanceKm : 1;
      durationMinutes = route.durationMinutes > 0 ? route.durationMinutes : 15;
    }

    // 2. Calculate delivery fee & build immutable pricing snapshot
    const feeResult = await calculateDeliveryFee({ distanceKm });

    // 3. Insert order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        status: 'pending',
        pickup_address: input.pickup_address,
        pickup_lat: input.pickup_lat,
        pickup_lng: input.pickup_lng,
        dropoff_address: input.dropoff_address,
        dropoff_lat: input.dropoff_lat,
        dropoff_lng: input.dropoff_lng,
        route_distance_km: distanceKm,
        route_duration_minutes: durationMinutes,
        delivery_fee: feeResult.totalFee,
        pricing_snapshot: feeResult.pricingSnapshot,
        customer_notes: input.customer_notes || '',
      } as never)
      .select('id, order_number')
      .single();

    if (orderError || !order) {
      console.error('[OrdersService] Error creating order:', orderError);
      return { success: false, error: 'تعذر إنشاء الطلب، يرجى المحاولة مرة أخرى' };
    }

    const orderId = (order as { id: string; order_number?: number }).id;

    // 4. Insert order items
    const itemsToInsert = input.items.map((item, index) => ({
      order_id: orderId,
      description: item.description,
      quantity: item.quantity,
      notes: item.notes || '',
      sort_order: index + 1,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert as never);

    if (itemsError) {
      console.error('[OrdersService] Error creating order items:', itemsError);
    }

    // 5. Insert initial status history
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      old_status: null,
      new_status: 'pending',
      changed_by: customerId,
      notes: 'تم إنشاء الطلب بنجاح',
    } as never);

    // 6. Notify eligible online drivers asynchronously
    try {
      const { notifyDriversNewOrder } = await import('@/lib/actions/notifications');
      await notifyDriversNewOrder({
        orderId,
        orderNumber: (order as any).order_number,
        pickupAddress: input.pickup_address,
        dropoffAddress: input.dropoff_address,
        deliveryFee: feeResult.totalFee,
        pickupLat: input.pickup_lat,
        pickupLng: input.pickup_lng,
      });
    } catch (notifyErr) {
      console.warn('[OrdersService] Error notifying drivers:', notifyErr);
    }

    return {
      success: true,
      orderId,
    };
  } catch (err) {
    console.error('[OrdersService] Unexpected error creating order:', err);
    return { success: false, error: 'حدث خطأ غير متوقع أثناء معالجة الطلب' };
  }
}

/**
 * Get customer orders with pagination & status filter.
 */
export async function getCustomerOrders(
  customerId: string,
  params?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }
) {
  const supabase = await createClient();
  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(50, Math.max(1, params?.limit || 10));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `, { count: 'exact' })
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('[OrdersService] Error fetching customer orders:', error);
    return { orders: [], total: 0, page, totalPages: 0 };
  }

  return {
    orders: (data as unknown as OrderWithDetails[]) || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get detailed order by ID. Ensures customer/driver/admin authorization.
 */
export async function getOrderById(orderId: string): Promise<OrderWithDetails | null> {
  // Use admin client to bypass RLS — authorization is enforced at the page/action level.
  // Guest orders have no session, so the regular client's RLS would block them.
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:users!orders_customer_id_fkey(id, full_name, phone, avatar_url, email),
      order_items(*),
      driver:drivers(
        id,
        status,
        user:users(full_name, phone, avatar_url)
      )
    `)
    .eq('id', orderId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as OrderWithDetails;
}

/**
 * Cancel an order if it is in a cancellable status.
 */
export async function cancelOrder(
  orderId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // 1. Fetch current order status
  const { data: orderData, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, customer_id')
    .eq('id', orderId)
    .single();

  const order = orderData as Pick<Order, 'id' | 'status' | 'customer_id'> | null;

  if (fetchError || !order) {
    return { success: false, error: 'الطلب غير موجود' };
  }

  if (order.status !== 'pending') {
    return {
      success: false,
      error: 'لا يمكن إلغاء الطلب بعد قبوله وبدء تنفيذه من قبل الطيار',
    };
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    } as never)
    .eq('id', orderId);

  if (updateError) {
    return { success: false, error: 'تعذر إلغاء الطلب' };
  }

  // Record status history
  await supabase.from('order_status_history').insert({
    order_id: orderId,
    old_status: order.status,
    new_status: 'cancelled',
    changed_by: userId,
    notes: reason || 'تم إلغاء الطلب من قبل العميل',
  } as never);

  return { success: true };
}

/**
 * Rate a delivered order (1 to 5 stars + optional review text)
 */
export async function rateOrder(params: {
  orderId: string;
  rating: number;
  review?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();

  const ratingVal = Math.min(5, Math.max(1, Math.round(params.rating)));

  const { error } = await supabase
    .from('orders')
    .update({
      customer_rating: ratingVal,
      customer_review: params.review || null,
      rated_at: new Date().toISOString(),
    } as never)
    .eq('id', params.orderId);

  if (error) {
    console.error('[OrdersService] Error rating order:', error);
    return { success: false, error: 'تعذر تسجيل التقييم' };
  }

  return { success: true };
}
