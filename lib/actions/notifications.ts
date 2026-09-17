'use server';
import webpush from 'web-push';
import {revalidatePath} from 'next/cache';
import {getCurrentUser} from '@/lib/services/auth';
import {createAdminClient} from '@/lib/supabase/server';

const configured=!!process.env.VAPID_PUBLIC_KEY&&!!process.env.VAPID_PRIVATE_KEY&&!!process.env.VAPID_SUBJECT;
if(configured)webpush.setVapidDetails(process.env.VAPID_SUBJECT!,process.env.VAPID_PUBLIC_KEY!,process.env.VAPID_PRIVATE_KEY!);

export async function savePushSubscription(subscription:{endpoint:string;keys:{p256dh:string;auth:string}}){
  const user=await getCurrentUser();if(!user)return{error:'غير مصرح'};
  const db:any=await createAdminClient();
  const{error}=await db.from('push_subscriptions').upsert({user_id:user.id,endpoint:subscription.endpoint,p256dh:subscription.keys.p256dh,auth:subscription.keys.auth,user_agent:'browser',updated_at:new Date().toISOString()},{onConflict:'user_id,endpoint'});
  return error?{error:'تعذر حفظ إشعارات الهاتف'}:{success:true};
}

export async function sendNotificationAction(formData:FormData){
  const admin=await getCurrentUser();if(!admin||admin.role!=='admin')return{error:'غير مصرح — الإدارة فقط'};
  const target=String(formData.get('target')||'all');const userId=String(formData.get('user_id')||'');const title=String(formData.get('title')||'').trim();const body=String(formData.get('body')||'').trim();const type=String(formData.get('type')||'info');
  if(!title||!body)return{error:'اكتب عنوان الإشعار ومحتواه'};
  const db:any=await createAdminClient();let ids:string[]=[];
  if(target==='user'){if(!userId)return{error:'اختر المستخدم'};ids=[userId];}
  else if(target==='all'){ids=((await db.from('users').select('id')).data||[]).map((u:any)=>u.id);}
  else{ids=((await db.from('users').select('id').eq('role',target)).data||[]).map((u:any)=>u.id);}
  if(!ids.length)return{error:'لا يوجد مستلمون مطابقون'};
  const rows=ids.map(id=>({recipient_user_id:id,title,body,type,data:{source:'admin'}}));const{error}=await db.from('notifications').insert(rows);
  if(error)return{error:'فشل حفظ الإشعار'};
  if(configured){const{subscriptions}=await db.from('push_subscriptions').select('id,user_id,endpoint,p256dh,auth').in('user_id',ids);for(const sub of (subscriptions||[])){try{await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},JSON.stringify({title,body,type}));}catch(e:any){if(e?.statusCode===404||e?.statusCode===410)await db.from('push_subscriptions').delete().eq('id',sub.id);}}}
  revalidatePath('/admin/notifications');return{success:true,pushConfigured:configured};
}
