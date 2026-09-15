import { getCurrentUser } from '@/lib/services/auth';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';
import type { User } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return <ProfileClient user={user as User} />;
}
