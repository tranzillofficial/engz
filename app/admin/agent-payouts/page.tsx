import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import { getAdminAgents } from '@/lib/services/admin';
import { createClient } from '@/lib/supabase/server';
import { AppShell, PageHeader } from '@/components';
import { AdminAgentPayoutsClient } from '@/components/admin/AdminAgentPayoutsClient';
export const dynamic='force-dynamic';
export default async function AdminAgentPayoutsPage(){const user=await getCurrentUser();if(!user||user.role!=='admin')redirect('/login');const agents=await getAdminAgents();const supabase=await createClient();const{data:payouts}=await(supabase as any).from('agent_payouts').select('*, agent:agents(id,user:users(full_name),region:regions(name_ar,name))').order('created_at',{ascending:false});return <AppShell header={<PageHeader title="مستحقات الوكلاء" titleEn="Agent Payouts" subtitle="الإدارة فقط تسجل وترسل مستحقات الوكلاء" showLogo backHref="/admin"/>} navItems={[{href:'/admin',label:'الرئيسية',labelEn:'Overview',icon:<span>▦</span>},{href:'/admin/orders',label:'الطلبات',labelEn:'Orders',icon:<span>▣</span>},{href:'/admin/drivers',label:'الطيارين',labelEn:'Drivers',icon:<span>◉</span>},{href:'/admin/payments',label:'مدفوعات الطيارين',labelEn:'Payments',icon:<span>▤</span>},{href:'/admin/agent-payouts',label:'مستحقات الوكلاء',labelEn:'Agent Payouts',icon:<span>٪</span>}]}><div className="max-w-3xl mx-auto py-3"><AdminAgentPayoutsClient agents={agents} payouts={payouts||[]}/></div></AppShell>}
