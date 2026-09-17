import {redirect} from 'next/navigation';
import {getCurrentUser} from '@/lib/services/auth';
import {getAdminCustomers,getAdminDrivers,getAdminAgents} from '@/lib/services/admin';
import {AppShell,PageHeader} from '@/components';
import {AdminNotificationsClient} from '@/components/admin/AdminNotificationsClient';
export const dynamic='force-dynamic';
export default async function AdminNotificationsPage(){const user=await getCurrentUser();if(!user||user.role!=='admin')redirect('/login');const [customers,drivers,agents]=await Promise.all([getAdminCustomers(),getAdminDrivers(),getAdminAgents()]);const users=[...customers,...drivers.map((d:any)=>d.user).filter(Boolean),...agents.map((a:any)=>a.user).filter(Boolean)];return <AppShell header={<PageHeader title="الإشعارات" titleEn="Notifications" backHref="/admin"/>} navItems={[{href:'/admin',label:'الرئيسية',labelEn:'Overview',icon:<span>▦</span>},{href:'/admin/orders',label:'الطلبات',labelEn:'Orders',icon:<span>▣</span>},{href:'/admin/drivers',label:'الطيارين',labelEn:'Drivers',icon:<span>◉</span>},{href:'/admin/payments',label:'مدفوعات الطيارين',labelEn:'Payments',icon:<span>▤</span>},{href:'/admin/notifications',label:'الإشعارات',labelEn:'Notifications',icon:<span>◌</span>}]}> <div className="py-4 px-2"><AdminNotificationsClient users={users}/></div></AppShell>}
