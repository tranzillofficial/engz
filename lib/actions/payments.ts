'use server';

// ============================================================
// Engz Payment Server Actions
// ============================================================

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/services/auth';
import { getDriverByUserId } from '@/lib/services/drivers';
import { submitDriverPayment, reviewPayment } from '@/lib/services/payments';
import { submitPaymentSchema, reviewPaymentSchema } from '@/lib/validations';

export async function submitManualPaymentAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    return { error: 'يجب تسجيل الدخول كطيار' };
  }

  const driver = await getDriverByUserId(user.id);
  if (!driver) {
    return { error: 'بيانات الطيار غير مسجلة' };
  }

  const amount = parseFloat(formData.get('amount') as string);
  const paymentMethod = formData.get('payment_method') as string;
  const reference = (formData.get('reference') as string) || '';
  const notes = (formData.get('notes') as string) || '';

  const validation = submitPaymentSchema.safeParse({
    amount,
    payment_method: paymentMethod,
    reference,
    notes,
  });

  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || 'بيانات الدفعة غير صالحة' };
  }

  const res = await submitDriverPayment(driver.id, validation.data);
  if (res.success) {
    revalidatePath('/driver/wallet');
    revalidatePath('/driver');
    return { success: true };
  }

  return { error: res.error || 'فشل إرسال الإشعار' };
}

export async function reviewPaymentAction(
  paymentId: string,
  action: 'confirmed' | 'rejected',
  notes?: string
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'agent')) {
    return { error: 'غير مصرح بمراجعة الدفعات' };
  }

  const res = await reviewPayment(paymentId, user.id, action, notes);
  if (res.success) {
    revalidatePath('/admin/payments');
    revalidatePath('/agent/payments');
  }
  return res;
}
