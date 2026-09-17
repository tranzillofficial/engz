'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/services/auth';
import { getAgentByUserId } from '@/lib/services/agent';
import { createClient } from '@/lib/supabase/server';

export async function requestAgentPayoutAction(formData:FormData){
 const user=await getCurrentUser();
 if(!user||user.role!=='agent')return{error:'غير مصرح'};
 const agent=await getAgentByUserId(user.id);if(!agent)return{error:'بيانات الوكيل غير مسجلة'};
 const amount=Number(formData.get('amount'));const payoutPhone=String(formData.get('payout_phone')||'').trim();
 if(!Number.isFinite(amount)||amount<=0||!payoutPhone)return{error:'أدخل المبلغ ورقم التحويل'};
 const supabase=await createClient();
 const {error}=await(supabase as any).from('agent_payout_requests').insert({agent_id:agent.id,amount,payout_phone:payoutPhone,status:'pending'});
 if(error)return{error:'فشل إرسال طلب السحب'};
 revalidatePath('/agent/payments');revalidatePath('/agent');return{success:true};
}

export async function updateRegionContactAction(){return{error:'بيانات التواصل للمنطقة أصبحت تحت إدارة المنصة فقط.'}}
