import { createAdminClient } from '@/lib/supabase/server';

export async function getAdminOrderDetailSafe(orderId: string) {
  try {
    const db = await createAdminClient();

    // 1. Fetch order with core customer and driver details
    const { data: order, error } = await (db as any)
      .from('orders')
      .select(`
        *,
        customer:users!orders_customer_id_fkey(id, full_name, phone, email, avatar_url),
        driver:drivers(
          id,
          status,
          commission_balance,
          total_completed_orders,
          user:users(id, full_name, phone, avatar_url)
        ),
        order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      // Fallback: try fetching plain order without nested joins in case of schema discrepancy
      const { data: fallbackOrder, error: fallbackError } = await (db as any)
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fallbackError || !fallbackOrder) {
        console.error('[AdminOrderDetail] Order not found:', orderId, error || fallbackError);
        return null;
      }

      // Fetch items separately
      const { data: items } = await (db as any)
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      fallbackOrder.order_items = items || [];
      return {
        order: fallbackOrder,
        messages: [],
        customerPreviousOrders: [],
      };
    }

    // 2. Fetch chat messages safely
    let messages: any[] = [];
    try {
      const { data: msgData } = await (db as any)
        .from('chat_messages')
        .select(`
          *,
          sender:users!chat_messages_sender_id_fkey(id, full_name, role, avatar_url)
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      messages = msgData || [];
    } catch {
      // Fallback if chat_messages table or join has issues
      try {
        const { data: msgData } = await (db as any)
          .from('chat_messages')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });
        messages = msgData || [];
      } catch {
        messages = [];
      }
    }

    // 3. Fetch customer previous orders
    let customerPreviousOrders: any[] = [];
    if (order.customer_id) {
      try {
        const { data: prev } = await (db as any)
          .from('orders')
          .select('id, status, delivery_fee, created_at, dropoff_address')
          .neq('id', orderId)
          .eq('customer_id', order.customer_id)
          .order('created_at', { ascending: false })
          .limit(10);

        customerPreviousOrders = prev || [];
      } catch {
        customerPreviousOrders = [];
      }
    }

    return {
      order,
      messages,
      customerPreviousOrders,
    };
  } catch (err) {
    console.error('[AdminOrderDetail] Unexpected error:', err);
    return null;
  }
}
