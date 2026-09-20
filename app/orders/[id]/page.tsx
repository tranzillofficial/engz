import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/services/auth';
import { getOrderById } from '@/lib/services/orders';
import { notFound, redirect } from 'next/navigation';
import { CustomerOrderTrackerClient } from '@/components/orders/CustomerOrderTrackerClient';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  const cookieStore = await cookies();
  const guestOrderId = cookieStore.get(`engz_guest_${id}`)?.value;
  const guestPhone = cookieStore.get('engz_guest_phone')?.value;
  const isGuestAuthorized = guestOrderId === id;

  if (!user && !isGuestAuthorized) {
    redirect('/login');
  }

  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const isOwnerCustomer = user && user.role === 'customer' && order.customer_id === user.id;
  const isStaffOrDriver =
    user && (user.role === 'admin' || user.role === 'agent' || user.role === 'driver');

  if (!isGuestAuthorized && !isOwnerCustomer && !isStaffOrDriver) {
    redirect('/orders');
  }

  const mapsApiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;

  return (
    <CustomerOrderTrackerClient
      initialOrder={order}
      user={user}
      isGuestAuthorized={isGuestAuthorized}
      guestPhone={guestPhone}
      mapsApiKey={mapsApiKey}
    />
  );
}
