import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth';
export const dynamic='force-dynamic';
export default async function AdminCommissionsPage(){const user=await getCurrentUser();if(!user||user.role!=='admin')redirect('/login');redirect('/admin/pricing');}
