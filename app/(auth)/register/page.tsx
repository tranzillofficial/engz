import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  // Direct customer registration is disabled. Redirect to login.
  redirect('/login');
}
