'use server';

// ============================================================
// Engz Driver Server Actions
// ============================================================

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import {
  getDriverByUserId,
  updateDriverStatus,
  updateDriverLocation,
  acceptOrderAtomically,
  updateDriverOrderStatus,
} from '@/lib/services/drivers';
import type { DriverStatus } from '@/lib/types/database';

export async function toggleDriverStatusAction(status: DriverStatus) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    return { error: 'غير مصرح' };
  }

  const driver = await getDriverByUserId(user.id);
  if (!driver) {
    return { error: 'بيانات الطيار غير موجودة' };
  }

  const res = await updateDriverStatus(driver.id, status);
  if (res.success) {
    revalidatePath('/driver');
    revalidatePath('/driver/orders');
  }
  return res;
}

export async function updateDriverLocationAction(lat: number, lng: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    return { error: 'غير مصرح' };
  }

  const driver = await getDriverByUserId(user.id);
  if (!driver) {
    return { error: 'بيانات الطيار غير موجودة' };
  }

  return updateDriverLocation(driver.id, lat, lng);
}

export async function acceptOrderAction(orderId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    return { error: 'يجب تسجيل الدخول كطيار' };
  }

  const driver = await getDriverByUserId(user.id);
  if (!driver) {
    return { error: 'حساب الطيار غير مسجل' };
  }

  if (driver.is_blocked) {
    return { error: 'حسابك محظور مؤقتاً بسبب مستحقات العمولات. يرجى سداد المبلغ لإعادة التفعيل.' };
  }

  const res = await acceptOrderAtomically(orderId, driver.id);
  if (res.success) {
    try {
      const { notifyCustomerOrderAccepted } = await import('@/lib/actions/notifications');
      await notifyCustomerOrderAccepted(orderId, driver.user?.full_name);
    } catch (e) {
      console.warn('[DriverAction] notify customer error:', e);
    }

    revalidatePath('/driver');
    revalidatePath('/driver/orders');
    revalidatePath(`/driver/orders/${orderId}`);
    revalidatePath(`/orders/${orderId}`);
    redirect(`/driver/orders/${orderId}`);
  }
  return res;
}

export async function updateOrderStatusByDriverAction(
  orderId: string,
  status: 'in_progress' | 'delivered'
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    return { error: 'غير مصرح' };
  }

  const driver = await getDriverByUserId(user.id);
  if (!driver) {
    return { error: 'حساب الطيار غير مسجل' };
  }

  const res = await updateDriverOrderStatus(orderId, driver.id, status);
  if (res.success) {
    revalidatePath('/driver');
    revalidatePath('/driver/orders');
    revalidatePath(`/driver/orders/${orderId}`);
    revalidatePath('/driver/wallet');
  }
  return res;
}
