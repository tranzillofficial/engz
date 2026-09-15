'use server';

// ============================================================
// Engz Agent Server Actions
// ============================================================

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/services/auth';
import { getAgentByUserId } from '@/lib/services/agent';
import { reviewPayment } from '@/lib/services/payments';
import { createClient } from '@/lib/supabase/server';

export async function agentReviewPaymentAction(
  paymentId: string,
  action: 'confirmed' | 'rejected',
  notes?: string
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'agent' && user.role !== 'admin')) {
    return { error: 'غير مصرح بتنفيذ هذه العملية' };
  }

  const res = await reviewPayment(paymentId, user.id, action, notes);
  if (res.success) {
    revalidatePath('/agent/payments');
    revalidatePath('/agent');
    revalidatePath('/driver/wallet');
  }
  return res;
}

export async function updateRegionContactAction(
  whatsapp: string,
  instagram: string
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'agent') {
    return { error: 'غير مصرح' };
  }

  const agent = await getAgentByUserId(user.id);
  if (!agent) {
    return { error: 'بيانات الوكيل غير مسجلة' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('regions')
    .update({
      whatsapp,
      instagram,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', agent.region_id);

  if (error) {
    return { error: 'فشل تحديث بيانات التواصل' };
  }

  revalidatePath('/agent/profile');
  revalidatePath('/agent');
  return { success: true };
}
