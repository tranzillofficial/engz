import { getCurrentUser } from '@/lib/services/auth';
import { getDriverByUserId } from '@/lib/services/drivers';
import { getOrderById } from '@/lib/services/orders';
import { notFound, redirect } from 'next/navigation';
import { DriverOrderExecutionClient } from '@/components/driver/DriverOrderExecutionClient';

export const dynamic = 'force-dynamic';

interface DriverOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DriverOrderDetailPage({ params }: DriverOrderDetailPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    redirect('/login');
  }

  const driver = await getDriverByUserId(user.id);
  if (!driver) {
    redirect('/login');
  }

  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  // Ensure this order belongs to this driver
  if (order.driver_id !== driver.id) {
    redirect('/driver/orders');
  }

  return <DriverOrderExecutionClient order={order} driverId={driver.id} />;
}
