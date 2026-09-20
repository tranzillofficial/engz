'use server';

import webpush from 'web-push';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/services/auth';
import { createAdminClient } from '@/lib/supabase/server';

const VAPID_PUBLIC =
  process.env.VAPID_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BIM9wRsEdWA_Bomq2tkv4qql7tYqKYj4PzjRp1JBpqSrog56rpnC4cJ3W2pbec1ipWGdhAjhVgYkBT-wGYb66qM';

const VAPID_PRIVATE =
  process.env.VAPID_PRIVATE_KEY || '8CzzhaMiMc2m8lHo_-OgR5goG4IjQbj47BrrhnFZZMM';

const VAPID_SUB = process.env.VAPID_SUBJECT || 'mailto:support@engz.app';

try {
  webpush.setVapidDetails(VAPID_SUB, VAPID_PUBLIC, VAPID_PRIVATE);
} catch (e) {
  console.warn('[WebPush] setVapidDetails initialization:', e);
}

export async function savePushSubscription(params: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId?: string;
}) {
  const user = await getCurrentUser();
  const targetUserId = params.userId || user?.id;

  if (!targetUserId) {
    return { error: 'لا يوجد معرف مستخدم لحفظ الإشعار' };
  }

  const db: any = await createAdminClient();
  const { error } = await db.from('push_subscriptions').upsert(
    {
      user_id: targetUserId,
      endpoint: params.endpoint,
      p256dh: params.keys.p256dh,
      auth: params.keys.auth,
      user_agent: 'browser',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' }
  );

  return error ? { error: 'تعذر حفظ إشعارات الهاتف' } : { success: true };
}

export async function sendNotificationAction(formData: FormData) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'admin') return { error: 'غير مصرح — الإدارة فقط' };

  const target = String(formData.get('target') || 'all');
  const userId = String(formData.get('user_id') || '');
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const type = String(formData.get('type') || 'info');

  if (!title || !body) return { error: 'اكتب عنوان الإشعار ومحتواه' };

  const db: any = await createAdminClient();
  let ids: string[] = [];

  if (target === 'user') {
    if (!userId) return { error: 'اختر المستخدم' };
    ids = [userId];
  } else if (target === 'all') {
    ids = ((await db.from('users').select('id')).data || []).map((u: any) => u.id);
  } else {
    ids = ((await db.from('users').select('id').eq('role', target)).data || []).map((u: any) => u.id);
  }

  if (!ids.length) return { error: 'لا يوجد مستلمون مطابقون' };

  const rows = ids.map((id) => ({
    recipient_user_id: id,
    title,
    body,
    type,
    data: { source: 'admin' },
  }));

  const { error } = await db.from('notifications').insert(rows);
  if (error) return { error: 'فشل حفظ الإشعار' };

  // Dispatch Web Push
  const { data: subscriptions } = await db
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', ids);

  for (const sub of subscriptions || []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, type })
      );
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await db.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }

  revalidatePath('/admin/notifications');
  return { success: true, pushConfigured: true };
}

/**
 * Send instant notification to all online / active drivers when a new order is posted
 */
export async function notifyDriversNewOrder(params: {
  orderId: string;
  orderNumber?: number;
  pickupAddress?: string;
  dropoffAddress?: string;
  deliveryFee: number;
  pickupLat: number;
  pickupLng: number;
}) {
  try {
    const db: any = await createAdminClient();

    // 1. Fetch active unblocked drivers
    const { data: drivers, error: driversError } = await db
      .from('drivers')
      .select('id, user_id, current_lat, current_lng, status')
      .eq('is_active', true)
      .eq('is_blocked', false);

    if (driversError || !drivers || drivers.length === 0) {
      return { success: true, count: 0 };
    }

    const title = `طلب توصيل جديد 🚀 (${params.deliveryFee} ج)`;
    const body = `توصيل إلى: ${(params.dropoffAddress || 'العنوان المسجل').slice(0, 50)}`;
    const driverUserIds = drivers.map((d: any) => d.user_id).filter(Boolean);

    if (driverUserIds.length === 0) return { success: true, count: 0 };

    // 2. Insert notifications table records
    const notificationRows = driverUserIds.map((uid: string) => ({
      recipient_user_id: uid,
      title,
      body,
      type: 'order_created',
      data: {
        orderId: params.orderId,
        deliveryFee: params.deliveryFee,
        url: '/driver',
      },
    }));

    await db.from('notifications').insert(notificationRows);

    // 3. Send Web Push to phones
    const { data: subscriptions } = await db
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', driverUserIds);

    for (const sub of subscriptions || []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title,
            body,
            type: 'order_created',
            url: '/driver',
          })
        );
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await db.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }

    return { success: true, count: driverUserIds.length };
  } catch (err) {
    console.error('[Notifications] Failed to notify drivers:', err);
    return { success: false, error: 'Failed to notify drivers' };
  }
}

/**
 * Send instant notification to customer when driver accepts their order
 */
export async function notifyCustomerOrderAccepted(orderId: string, driverName?: string) {
  try {
    const db: any = await createAdminClient();

    const { data: order, error } = await db
      .from('orders')
      .select('id, customer_id, order_number')
      .eq('id', orderId)
      .single();

    if (error || !order || !order.customer_id) return;

    const name = driverName || 'الطيار';
    const title = '🎉 تم قبول طلبك!';
    const body = `الكابتن ${name} في طريقه لاستلام وتوصيل طلبك الآن 🚴`;

    // 1. Insert in-app notification
    await db.from('notifications').insert({
      recipient_user_id: order.customer_id,
      title,
      body,
      type: 'order_accepted',
      data: {
        orderId,
        url: `/orders/${orderId}`,
      },
    });

    // 2. Send Web Push
    const { data: subscriptions } = await db
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .eq('user_id', order.customer_id);

    for (const sub of subscriptions || []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title,
            body,
            type: 'order_accepted',
            url: `/orders/${orderId}`,
          })
        );
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await db.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }
  } catch (err) {
    console.warn('[Notifications] Failed to notify customer:', err);
  }
}
