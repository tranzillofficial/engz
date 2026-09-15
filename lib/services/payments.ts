// ============================================================
// Engz Manual Payments Service
// ============================================================

import { createClient } from '@/lib/supabase/server';
import type { PaymentConfirmation, PaymentStatus } from '@/lib/types/database';
import type { SubmitPaymentInput } from '@/lib/validations';

/**
 * Driver submits a manual payment for commission.
 */
export async function submitDriverPayment(
  driverId: string,
  input: SubmitPaymentInput,
  proofImageUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from('payment_confirmations').insert({
    driver_id: driverId,
    amount: input.amount,
    payment_method: input.payment_method,
    reference: input.reference || '',
    proof_image_url: proofImageUrl || '',
    notes: input.notes || '',
    status: 'pending',
  } as never);

  if (error) {
    console.error('[PaymentsService] Error submitting payment:', error);
    return { success: false, error: 'فشل إرسال إشعار السداد، يرجى المحاولة مرة أخرى' };
  }

  return { success: true };
}

/**
 * Review/Confirm or Reject a manual payment via atomic Supabase RPC.
 */
export async function reviewPayment(
  paymentId: string,
  reviewerId: string,
  action: 'confirmed' | 'rejected',
  reviewNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (action === 'confirmed') {
    // Atomic RPC: confirms payment, inserts ledger transaction, deducts balance, and unblocks if eligible
    const { data, error } = await supabase.rpc('confirm_payment' as never, {
      p_payment_id: paymentId,
      p_reviewer_id: reviewerId,
      p_review_notes: reviewNotes || 'تم التحقق وتأكيد استلام المبلغ',
    } as never);

    if (error) {
      console.error('[PaymentsService] Error in confirm_payment RPC:', error);
      return { success: false, error: 'فشل تأكيد الدفعة وتحديث الرصيد' };
    }

    const result = data as { success: boolean; error?: string } | null;
    if (!result?.success) {
      return { success: false, error: result?.error || 'تعذر تأكيد الدفعة' };
    }

    return { success: true };
  } else {
    // Rejected flow
    const { error } = await supabase
      .from('payment_confirmations')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        review_notes: reviewNotes || 'تم رفض الإشعار لعدم صحة البيانات',
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq('id', paymentId);

    if (error) {
      return { success: false, error: 'فشل تحديث حالة الدفعة' };
    }

    return { success: true };
  }
}
