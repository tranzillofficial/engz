'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/services/auth';
import { getAgentByUserId } from '@/lib/services/agent';
import { createClient } from '@/lib/supabase/server';

export async function updateRegionContactAction(whatsapp: string, instagram: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'agent') return { error: 'غير مصرح' };
  const agent = await getAgentByUserId(user.id);
  if (!agent) return { error: 'بيانات الوكيل غير مسجلة' };
  const supabase = await createClient();
  const { error } = await supabase.from('regions').update({ whatsapp, instagram, updated_at: new Date().toISOString() } as never).eq('id', agent.region_id);
  if (error) return { error: 'فشل تحديث بيانات التواصل' };
  revalidatePath('/agent/profile'); revalidatePath('/agent');
  return { success: true };
}
