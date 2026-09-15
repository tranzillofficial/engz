import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/services/auth';
import { getOrderById } from '@/lib/services/orders';
import { notFound, redirect } from 'next/navigation';
import { AppShell, PageHeader, Card, OrderStatusBadge, Button } from '@/components';
import { cancelOrderAction } from '@/lib/actions/orders';
import { ChatPanel } from '@/components/chat/ChatPanel';
import DeliveryRatingCard from '@/components/orders/DeliveryRatingCard';
import GuestAccountConversionCard from '@/components/orders/GuestAccountConversionCard';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Formats a 5-digit zero-padded order number
function formatOrderNumber(n: number | null | undefined) {
  if (!n) return null;
  return `#${String(n).padStart(5, '0')}`;
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

  // Security check:
  // Allowed if:
  // 1. Guest cookie matches order ID
  // 2. Logged in customer is owner
  // 3. Admin / Agent / Assigned Driver
  const isOwnerCustomer = user && user.role === 'customer' && order.customer_id === user.id;
  const isStaffOrDriver = user && (user.role === 'admin' || user.role === 'agent' || user.role === 'driver');

  if (!isGuestAuthorized && !isOwnerCustomer && !isStaffOrDriver) {
    redirect('/orders');
  }

  const handleCancel = async () => {
    'use server';
    await cancelOrderAction(order.id, 'إلغاء من قبل العميل');
  };

  const isChatEnabled = order.status === 'accepted' || order.status === 'in_progress' || order.status === 'delivered';
  const isChatReadOnly = order.status === 'delivered';
  const currentChatUserId = user ? user.id : order.customer_id;

  // Google Maps embed URL for dropoff location
  const mapsApiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;
  const hasDropoffCoords =
    order.dropoff_lat &&
    order.dropoff_lng &&
    Math.abs(order.dropoff_lat) > 0.001 &&
    Math.abs(order.dropoff_lng) > 0.001;

  const mapsEmbedUrl =
    hasDropoffCoords && mapsApiKey
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${order.dropoff_lat},${order.dropoff_lng}&zoom=15`
      : hasDropoffCoords
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${order.dropoff_lng! - 0.005},${order.dropoff_lat! - 0.005},${order.dropoff_lng! + 0.005},${order.dropoff_lat! + 0.005}&layer=mapnik&marker=${order.dropoff_lat},${order.dropoff_lng}`
      : null;

  const orderNumDisplay = formatOrderNumber((order as unknown as { order_number?: number }).order_number);

  return (
    <AppShell
      header={
        <PageHeader
          title={orderNumDisplay ? `طلب ${orderNumDisplay}` : `طلب #${order.id.slice(0, 8)}`}
          titleEn="Delivery Tracking"
          backHref="/"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 px-2 sm:px-0 space-y-4 pb-24">
        {/* Status Card */}
        <Card className="p-4 bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                حالة الطلب الحالية
              </span>
              {orderNumDisplay && (
                <span className="text-[11px] font-bold text-indigo-500 mt-0.5 block">
                  رقم الطلب: {orderNumDisplay}
                </span>
              )}
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="text-center py-2">
            {order.status === 'pending' && (
              <p className="text-sm font-semibold text-amber-600 animate-pulse">
                🔍 جاري البحث عن أقرب طيار متاح في منطقتك لتنفيذ طلبك...
              </p>
            )}
            {order.status === 'accepted' && (
              <p className="text-sm font-semibold text-indigo-600">
                🚴 تم قبول طلبك من الطيار وهو في طريقه لجمع الأصناف!
              </p>
            )}
            {order.status === 'in_progress' && (
              <p className="text-sm font-semibold text-blue-600">
                📦 الطيار جمع الأصناف وجاري التوصيل لعنوانك الآن!
              </p>
            )}
            {order.status === 'delivered' && (
              <p className="text-sm font-semibold text-emerald-600">
                ✅ تم توصيل الطلب بنجاح. شكراً لثقتك في إنجز!
              </p>
            )}
            {order.status === 'cancelled' && (
              <p className="text-sm font-semibold text-red-600">
                ❌ تم إلغاء هذا الطلب.
              </p>
            )}
          </div>
        </Card>

        {/* Rating Card when Delivered */}
        {order.status === 'delivered' && (
          <DeliveryRatingCard
            orderId={order.id}
            existingRating={order.customer_rating}
            existingReview={order.customer_review}
          />
        )}

        {/* Guest Conversion Card if placed as guest */}
        {(!user || isGuestAuthorized) && (
          <GuestAccountConversionCard phone={guestPhone || order.customer?.phone} />
        )}

        {/* Assigned Driver Details (if accepted) */}
        {order.driver && (
          <Card className="p-4 border-l-4 border-l-emerald-500 shadow-xs">
            <h3 className="text-xs font-bold text-gray-500 mb-2">بيانات الطيار المسؤول 🛵</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-gray-900">
                  {order.driver.user?.full_name || 'طيار إنجز'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {order.driver.user?.phone ? (
                    <a
                      href={`tel:${order.driver.user.phone}`}
                      className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>📞</span>
                      <span dir="ltr">{order.driver.user.phone}</span>
                    </a>
                  ) : (
                    'متاح عبر المحادثة المباشرة'
                  )}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                طيار معتمد
              </span>
            </div>
          </Card>
        )}

        {/* Order Items List */}
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <span>🛒</span>
              <span>الأصناف المطلوبة من الطيار ({order.order_items?.length || 0})</span>
            </h3>
          </div>
          <div className="space-y-2">
            {order.order_items?.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-2.5 bg-gray-50 rounded-xl text-xs border border-gray-100"
              >
                <div>
                  <span className="font-bold text-gray-900 block">
                    {idx + 1}. {item.description}
                  </span>
                  {item.notes && (
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      ملاحظة: {item.notes}
                    </p>
                  )}
                </div>
                <span className="font-black text-[#FA3802] bg-orange-50 px-2.5 py-1 rounded-lg shrink-0">
                  {item.quantity}x
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Delivery Address — only dropoff, no pickup, no distance */}
        <Card className="p-4 space-y-3 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <span>📍</span>
            <span>عنوان التوصيل</span>
          </h3>

          {/* Full address text */}
          <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100 text-xs">
            <span className="font-bold text-gray-700 block mb-0.5">عنوانك:</span>
            <p className="text-gray-800 font-semibold leading-relaxed">
              {order.dropoff_address}
            </p>
          </div>

          {/* Customer notes */}
          {order.customer_notes && (
            <div className="p-2.5 bg-gray-50 rounded-lg text-gray-600 text-xs">
              <strong>ملاحظات التوصيل:</strong> {order.customer_notes}
            </div>
          )}

          {/* Map embed if coords exist */}
          {mapsEmbedUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-xs">
              <iframe
                src={mapsEmbedUrl}
                width="100%"
                height="180"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="موقع التوصيل"
              />
            </div>
          )}
        </Card>

        {/* Delivery Fee Summary */}
        <Card className="p-4 bg-orange-50/50 border border-orange-100 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 block">إجمالي رسوم التوصيل</span>
              <span className="text-xl font-black text-[#FA3802]">
                {order.delivery_fee} ج.م
              </span>
            </div>
            {order.pricing_snapshot && (
              <span className="text-[11px] text-gray-400">
                رسوم أساسية: {order.pricing_snapshot.base_fee} ج + مسافة: {order.pricing_snapshot.distance_fee} ج
              </span>
            )}
          </div>
        </Card>

        {/* Cancel Action (if still pending) */}
        {order.status === 'pending' && (
          <form action={handleCancel} className="pt-2">
            <Button
              type="submit"
              variant="danger"
              size="md"
              className="w-full"
              id="cancel-order-btn"
            >
              إلغاء الطلب 🚫
            </Button>
          </form>
        )}

        {/* Live Chat Panel with Driver */}
        <ChatPanel
          orderId={order.id}
          currentUserId={currentChatUserId}
          isEnabled={isChatEnabled}
          readOnly={isChatReadOnly}
        />
      </div>
    </AppShell>
  );
}

