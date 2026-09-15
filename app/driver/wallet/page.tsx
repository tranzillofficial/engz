import { getCurrentUser } from '@/lib/services/auth';
import { getDriverByUserId } from '@/lib/services/drivers';
import { getDriverWalletSummary } from '@/lib/services/commissions';
import { redirect } from 'next/navigation';
import { DriverWalletClient } from '@/components/driver/DriverWalletClient';

export const dynamic = 'force-dynamic';

export default async function DriverWalletPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    redirect('/login');
  }

  const driver = await getDriverByUserId(user.id);
  if (!driver) {
    redirect('/login');
  }

  const walletSummary = await getDriverWalletSummary(driver.id);

  return (
    <DriverWalletClient
      driver={driver}
      currentBalance={walletSummary.currentBalance}
      totalCommissions={walletSummary.totalCommissions}
      totalPaid={walletSummary.totalPaid}
      transactions={walletSummary.transactions}
    />
  );
}
