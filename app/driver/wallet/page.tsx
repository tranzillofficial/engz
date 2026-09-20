import { getCurrentUser } from '@/lib/services/auth';
import { getDriverByUserId } from '@/lib/services/drivers';
import { getDriverWalletSummary } from '@/lib/services/commissions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DriverWalletClient } from '@/components/driver/DriverWalletClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const u = await getCurrentUser();
  if (!u || u.role !== 'driver') redirect('/login');
  const d = await getDriverByUserId(u.id);
  if (!d) redirect('/login');

  const [w, db] = await Promise.all([getDriverWalletSummary(d.id), createClient()]);

  // Fetch active payment methods (supports both payment_methods and legacy admin_payment_methods)
  let paymentMethods: any[] = [];
  const { data: pMethods } = await (db as any)
    .from('payment_methods')
    .select('id,method_key,method_name,account_name,account_number,instructions,is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (pMethods && pMethods.length > 0) {
    paymentMethods = pMethods;
  } else {
    const { data: adminMethods } = await (db as any)
      .from('admin_payment_methods')
      .select('id,method_key,method_name,account_name,account_number,instructions,is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (adminMethods && adminMethods.length > 0) {
      paymentMethods = adminMethods;
    }
  }

  const primaryMethod = paymentMethods[0] || null;

  return (
    <DriverWalletClient
      driver={d}
      currentBalance={w.currentBalance}
      totalCommissions={w.totalCommissions}
      totalPaid={w.totalPaid}
      transactions={w.transactions}
      paymentMethod={primaryMethod}
      paymentMethods={paymentMethods}
    />
  );
}
