import { NextRequest, NextResponse } from 'next/server';
import { defaultMapsProvider } from '@/lib/services/maps';
import { calculateDeliveryFee } from '@/lib/services/pricing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = body;

    if (!pickup_lat || !pickup_lng || !dropoff_lat || !dropoff_lng) {
      return NextResponse.json(
        { error: 'إحداثيات الاستلام والتسليم مطلوبة' },
        { status: 400 }
      );
    }

    // Calculate actual driving route
    const route = await defaultMapsProvider.getDrivingRoute(
      { lat: Number(pickup_lat), lng: Number(pickup_lng) },
      { lat: Number(dropoff_lat), lng: Number(dropoff_lng) }
    );

    const distanceKm = route.distanceKm > 0 ? route.distanceKm : 1;
    const durationMinutes = route.durationMinutes > 0 ? route.durationMinutes : 15;

    // Calculate fee
    const feeResult = await calculateDeliveryFee({ distanceKm });

    return NextResponse.json({
      success: true,
      distanceKm,
      durationMinutes,
      ...feeResult,
    });
  } catch (err) {
    console.error('[PricingAPI] Error calculating fee:', err);
    return NextResponse.json(
      { error: 'تعذر حساب السعر التقديري' },
      { status: 500 }
    );
  }
}
