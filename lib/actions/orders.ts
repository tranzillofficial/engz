'use server';

// ============================================================
// Engz Order Server Actions
// Supports both Authenticated and Guest Order Placement
// ============================================================

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/services/auth';
import { createOrder, cancelOrder, rateOrder } from '@/lib/services/orders';
import { createOrderSchema } from '@/lib/validations';
import { createAdminClient } from '@/lib/supabase/server';

export interface ActionState {
  error?: string;
  success?: boolean;
  orderId?: string;
}

export async function createOrderAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();

  const customerName = (formData.get('customer_name') as string)?.trim() || '';
  const customerPhone = (formData.get('customer_phone') as string)?.trim() || '';
  const dropoffAddress = (formData.get('dropoff_address') as string)?.trim() || '';
  const dropoffLat = parseFloat(formData.get('dropoff_lat') as string) || 30.0444;
  const dropoffLng = parseFloat(formData.get('dropoff_lng') as string) || 31.2357;
  const pickupAddress = (formData.get('pickup_address') as string)?.trim() || dropoffAddress || 'حسب تفاصيل الأصناف المطلوبة';
  const pickupLat = parseFloat(formData.get('pickup_lat') as string) || dropoffLat;
  const pickupLng = parseFloat(formData.get('pickup_lng') as string) || dropoffLng;
  const customerNotes = (formData.get('customer_notes') as string) || '';
  const itemsJson = formData.get('items') as string;

  let items = [];
  try {
    items = JSON.parse(itemsJson || '[]');
  } catch {
    return { error: 'بيانات الأصناف غير صالحة' };
  }

  // Determine Customer ID
  let customerId: string;
  let isGuest = false;

  if (user && user.role === 'customer') {
    customerId = user.id;
  } else {
    // Guest Order without registration
    isGuest = true;
    if (!customerPhone || customerPhone.length < 8) {
      return { error: 'يرجى إدخال رقم الهاتف للتواصل مع الطيار أثناء التوصيل' };
    }

    try {
      const adminSupabase = await createAdminClient();

      // Check if user already exists with this phone
      const { data: existingUser } = await adminSupabase
        .from('users')
        .select('id, full_name')
        .eq('phone', customerPhone)
        .maybeSingle();

      if (existingUser) {
        customerId = (existingUser as { id: string }).id;
      } else {
        const guestEmail = `${customerPhone}@guest.engz.app`;
        const newId = crypto.randomUUID();

        // 1. Try direct upsert into users
        const { error: insertUserError } = await adminSupabase
          .from('users')
          .upsert({
            id: newId,
            phone: customerPhone,
            full_name: customerName || 'عميل إنجز',
            email: guestEmail,
            role: 'customer',
            is_active: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any);

        if (insertUserError) {
          console.warn('[CreateOrder] Direct insert into users had error, trying auth admin creation:', insertUserError.message);

          // 2. Fallback: create via auth.admin in case foreign key to auth.users is enforced
          const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
            email: guestEmail,
            password: `Guest@${newId.slice(0, 8)}`,
            email_confirm: true,
            user_metadata: { full_name: customerName || 'عميل إنجز', phone: customerPhone, role: 'customer' },
          });

          if (!authUser?.user) {
            console.error('[CreateOrder] Failed to create guest user via auth fallback:', authError);
            return { error: 'تعذر تسجيل بيانات العميل، يرجى المحاولة مرة أخرى' };
          }

          customerId = authUser.user.id;
          await adminSupabase.from('users').upsert({
            id: customerId,
            phone: customerPhone,
            full_name: customerName || 'عميل إنجز',
            email: guestEmail,
            role: 'customer',
            is_active: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any);
        } else {
          customerId = newId;
        }
      }
    } catch (err) {
      console.error('[CreateOrder] Guest setup exception:', err);
      return { error: 'حدث خطأ أثناء معالجة الطلب، حاول مرة أخرى' };
    }
  }

  const validation = createOrderSchema.safeParse({
    pickup_address: pickupAddress,
    pickup_lat: pickupLat,
    pickup_lng: pickupLng,
    dropoff_address: dropoffAddress,
    dropoff_lat: dropoffLat,
    dropoff_lng: dropoffLng,
    customer_notes: customerNotes,
    customer_name: customerName,
    customer_phone: customerPhone,
    items,
  });

  if (!validation.success) {
    const msg = validation.error.issues[0]?.message || 'بيانات الطلب غير صالحة';
    return { error: msg };
  }

  const result = await createOrder(customerId, validation.data);

  if (!result.success || !result.orderId) {
    return { error: result.error || 'تعذر إنشاء الطلب' };
  }

  // Set guest order tracking cookie if placed as guest
  if (isGuest) {
    const cookieStore = await cookies();
    cookieStore.set(`engz_guest_${result.orderId}`, result.orderId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false,
    });
    cookieStore.set('engz_guest_phone', customerPhone, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
    });
  }

  revalidatePath('/orders');
  redirect(`/orders/${result.orderId}`);
}

export async function cancelOrderAction(orderId: string, reason?: string) {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestCookie = cookieStore.get(`engz_guest_${orderId}`)?.value;

  if (!user && guestCookie !== orderId) {
    return { error: 'غير مصرح' };
  }

  const userId = user ? user.id : 'guest-customer';
  const res = await cancelOrder(orderId, userId, reason);
  if (res.success) {
    revalidatePath('/orders');
    revalidatePath(`/orders/${orderId}`);
  }
  return res;
}

export async function rateOrderAction(params: {
  orderId: string;
  rating: number;
  review?: string;
}) {
  const result = await rateOrder(params);
  if (result.success) {
    revalidatePath(`/orders/${params.orderId}`);
  }
  return result;
}

/**
 * Find an order by phone number or order number (for guests who lost their session).
 * Returns the orderId + sets the tracking cookie so guest can access the order page.
 */
export async function findOrderByPhoneAction(
  phone: string,
  orderNumber?: string
): Promise<{ orderId?: string; error?: string }> {
  const cleanPhone = phone.trim().replace(/\s/g, '');
  if (!cleanPhone) return { error: 'أدخل رقم هاتفك' };

  try {
    const adminSupabase = await createAdminClient();

    // Find the user matching this phone
    const { data: userRow } = await adminSupabase
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (!userRow) {
      return { error: 'لا يوجد طلب مرتبط بهذا الرقم' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (userRow as any).id as string;

    let query = adminSupabase
      .from('orders')
      .select('id, order_number, status, created_at')
      .eq('customer_id', userId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    // If order number provided, filter by it
    if (orderNumber) {
      const num = parseInt(orderNumber.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num)) {
        query = query.eq('order_number', num);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orders } = await query.limit(1) as { data: any[] | null };

    if (!orders || orders.length === 0) {
      return { error: 'لم يُعثر على طلب نشط لهذا الرقم' };
    }

    const foundOrderId = orders[0].id as string;

    // Set the guest tracking cookie so they can access the page
    const cookieStore = await cookies();
    cookieStore.set(`engz_guest_${foundOrderId}`, foundOrderId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false,
    });
    cookieStore.set('engz_guest_phone', cleanPhone, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
    });

    return { orderId: foundOrderId };
  } catch {
    return { error: 'حدث خطأ أثناء البحث، حاول مرة أخرى' };
  }
}
