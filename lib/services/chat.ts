// ============================================================
// Engz Chat Service — Driver ↔ Customer messaging
// Chat enabled only after order acceptance, auto-delete after 48h
// ============================================================

import { createClient } from '@/lib/supabase/server';
import type { ChatMessage, Order } from '@/lib/types/database';

export interface ChatMessageWithSender extends Omit<ChatMessage, 'sender'> {
  sender: {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
  };
}

/**
 * Send a chat message for an order.
 * Validates that the order is in accepted/in_progress status and
 * the sender is either the customer or assigned driver.
 */
export async function sendMessage(params: {
  orderId: string;
  senderId: string;
  messageText?: string;
  imageUrl?: string;
}): Promise<{ success: boolean; message?: ChatMessageWithSender; error?: string }> {
  const supabase = await createClient();

  if (!params.messageText && !params.imageUrl) {
    return { success: false, error: 'يجب إرسال نص أو صورة' };
  }

  // Validate order status and participant authorization
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('id, status, customer_id, driver_id')
    .eq('id', params.orderId)
    .single();

  const order = orderData as Pick<Order, 'id' | 'status' | 'customer_id' | 'driver_id'> | null;

  if (orderError || !order) {
    return { success: false, error: 'الطلب غير موجود' };
  }

  if (order.status !== 'accepted' && order.status !== 'in_progress') {
    return { success: false, error: 'المحادثة متاحة فقط بعد قبول الطلب' };
  }

  // Check if sender is a participant
  // Get driver's user_id if sender is the driver
  let isParticipant = order.customer_id === params.senderId;
  if (!isParticipant && order.driver_id) {
    const { data: driverData } = await supabase
      .from('drivers')
      .select('user_id')
      .eq('id', order.driver_id)
      .single();
    if (driverData && (driverData as { user_id: string }).user_id === params.senderId) {
      isParticipant = true;
    }
  }

  if (!isParticipant) {
    return { success: false, error: 'غير مصرح لك بالمحادثة في هذا الطلب' };
  }

  // Insert message with 48h expiry
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: msgData, error: insertError } = await supabase
    .from('chat_messages')
    .insert({
      order_id: params.orderId,
      sender_id: params.senderId,
      message_text: params.messageText || '',
      image_url: params.imageUrl || '',
      expires_at: expiresAt,
    } as never)
    .select(`
      *,
      sender:users!chat_messages_sender_id_fkey(id, full_name, avatar_url, role)
    `)
    .single();

  if (insertError || !msgData) {
    console.error('[ChatService] Insert error:', insertError);
    return { success: false, error: 'تعذر إرسال الرسالة' };
  }

  return {
    success: true,
    message: msgData as unknown as ChatMessageWithSender,
  };
}

/**
 * Get all chat messages for an order, sorted by created_at ascending.
 */
export async function getMessages(orderId: string): Promise<ChatMessageWithSender[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      sender:users!chat_messages_sender_id_fkey(id, full_name, avatar_url, role)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('[ChatService] Fetch error:', error);
    return [];
  }

  return data as unknown as ChatMessageWithSender[];
}

/**
 * Upload a chat image to Supabase Storage.
 * Returns the public/signed URL of the uploaded image.
 */
export async function uploadChatImage(
  orderId: string,
  senderId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createClient();

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${orderId}/${senderId}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('chat-images')
    .upload(fileName, file, {
      cacheControl: '172800', // 48 hours
      upsert: false,
    });

  if (uploadError) {
    console.error('[ChatService] Upload error:', uploadError);
    return { success: false, error: 'تعذر رفع الصورة' };
  }

  const { data: urlData } = supabase.storage
    .from('chat-images')
    .getPublicUrl(fileName);

  return {
    success: true,
    url: urlData.publicUrl,
  };
}

/**
 * Admin: Save a message to prevent auto-deletion.
 */
export async function adminSaveMessage(
  messageId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('chat_messages')
    .update({
      is_saved_by_admin: true,
      saved_by: adminId,
    } as never)
    .eq('id', messageId);

  if (error) {
    return { success: false, error: 'تعذر حفظ الرسالة' };
  }

  return { success: true };
}

/**
 * Admin: Get all orders that have active chat messages.
 */
export async function getOrdersWithChats(params?: {
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(50, Math.max(1, params?.limit || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Get distinct order IDs that have chat messages
  const { data: chatOrders, error } = await supabase
    .from('chat_messages')
    .select(`
      order_id,
      orders!chat_messages_order_id_fkey(
        id,
        status,
        pickup_address,
        dropoff_address,
        created_at,
        customer:users!orders_customer_id_fkey(full_name, phone),
        driver:drivers(
          id,
          user:users(full_name, phone)
        )
      )
    `)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error || !chatOrders) {
    console.error('[ChatService] Fetch orders with chats error:', error);
    return { orders: [], page, totalPages: 0 };
  }

  // Deduplicate by order_id
  const uniqueOrders = new Map<string, any>();
  for (const item of (chatOrders as any[])) {
    if (item?.order_id && !uniqueOrders.has(item.order_id)) {
      uniqueOrders.set(item.order_id, item.orders);
    }
  }

  return {
    orders: Array.from(uniqueOrders.values()),
    page,
    totalPages: 1, // Simplified — could add count query
  };
}

/**
 * Admin: Bulk save an entire conversation.
 */
export async function adminSaveConversation(
  orderId: string,
  adminId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .update({
      is_saved_by_admin: true,
      saved_by: adminId,
    } as never)
    .eq('order_id', orderId)
    .eq('is_saved_by_admin', false)
    .select('id');

  if (error) {
    return { success: false, error: 'تعذر حفظ المحادثة' };
  }

  return { success: true, count: data?.length || 0 };
}
