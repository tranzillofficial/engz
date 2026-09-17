'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/services/auth';
import { getAgentByUserId } from '@/lib/services/agent';
import { createAdminClient } from '@/lib/supabase/server';

export async function createAgentDriverAction(formData:FormData){
 const user=await getCurrentUser(); if(!user||user.role!=='agent')return{error:'غير مصرح'};
 const agent=await getAgentByUserId(user.id); if(!agent)return{error:'بيانات الوكيل غير مسجلة'};
 const fullName=String(formData.get('full_name')||'').trim(); const phone=String(formData.get('phone')||'').trim().replace(/\s/g,''); const password=String(formData.get('password')||'').trim();
 if(!fullName||!phone||password.length<6)return{error:'أدخل الاسم والهاتف وكلمة مرور 6 أحرف على الأقل'};
 const admin=await createAdminClient(); const email=`${phone}@driver.engz.app`;
 const {data:existing}=await admin.from('users').select('id').or(`phone.eq.${phone},email.eq.${email}`).maybeSingle(); if(existing)return{error:'يوجد حساب بهذا الرقم بالفعل'};
 const {data:auth,error:authError}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:fullName,phone,role:'driver'}});
 if(authError||!auth.user)return{error:authError?.message||'فشل إنشاء حساب الطيار'};
 const registrationCode=`AG-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
 const {error:userError}=await admin.from('users').insert({id:auth.user.id,email,full_name:fullName,phone,role:'driver',is_active:true,avatar_url:''} as never);
 if(userError){await admin.auth.admin.deleteUser(auth.user.id);return{error:'فشل إنشاء ملف الطيار'}}
 const {error:driverError}=await admin.from('drivers').insert({user_id:auth.user.id,region_id:agent.region_id,agent_id:agent.id,registration_code:registrationCode,status:'offline',is_blocked:false,commission_balance:0,total_completed_orders:0,is_active:true} as never);
 if(driverError){await admin.from('users').delete().eq('id',auth.user.id);await admin.auth.admin.deleteUser(auth.user.id);return{error:'فشل ربط الطيار بالوكيل'}}
 const base=process.env.NEXT_PUBLIC_APP_URL||'https://engz-ochre.vercel.app'; const digits=phone.replace(/\D/g,'').replace(/^0/,'20'); const message=`مرحباً ${fullName}، تم تسجيلك كطيار تابع للوكيل ${agent.user.full_name} في إنجز.\n\nرابط الطيار: ${base}/driver/login\nرقم الدخول: ${phone}\nكلمة المرور: ${password}\nكود التبعية: ${registrationCode}\n\nثبّت الموقع كتطبيق من الرابط.`;
 revalidatePath('/agent/drivers');revalidatePath('/admin/drivers'); return{success:true,registrationCode,whatsappUrl:`https://wa.me/${digits}?text=${encodeURIComponent(message)}`};
}
