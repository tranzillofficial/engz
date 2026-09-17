'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/services/auth';
import { getDriverByUserId } from '@/lib/services/drivers';
import { reviewPayment, submitDriverPayment } from '@/lib/services/payments';
import { submitPaymentSchema } from '@/lib/validations';

export async function submitManualPaymentAction(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') return { error: 'يجب تسجيل الدخول كطيار' };
  const driver = await getDriverByUserId(user.id);
  if (!driver) return { error: 'بيانات الطيار غير مسجلة' };
  const validation = submitPaymentSchema.safeParse({ amount: parseFloat(String(formData.get('amount') || '')), payment_method: String(formData.get('payment_method') || ''), reference: String(formData.get('reference') || ''), notes: String(formData.get('notes') || '') });
  if (!validation.success) return { error: validation.error.issues[0]?.message || 'بيانات الدفعة غير صالحة' };
  const res = await submitDriverPayment(driver.id, validation.data);
  if (res.success) { revalidatePath('/driver/wallet'); revalidatePath('/driver'); return { success: true }; }
  return { error: res.error || 'فشل إرسال الإشعار' };
}

export async function reviewPaymentAction(paymentId: string, action: 'confirmed'|'rejected', notes?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return { error: 'غير مصرح — مراجعة دفعات الطيارين متاحة للإدارة فقط' };
  const res = await reviewPayment(paymentId, user.id, action, notes);
  if (res.success) { revalidatePath('/admin/payments'); revalidatePath('/admin'); revalidatePath('/driver/wallet'); }
  return res;
}
