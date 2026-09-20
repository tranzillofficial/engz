import { NextResponse } from 'next/server';
import { getActivePricingSettings } from '@/lib/services/pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getActivePricingSettings();
    return NextResponse.json({
      base_delivery_fee: Number(settings.base_delivery_fee) || 25,
      currency: settings.currency || 'EGP',
    });
  } catch (error) {
    return NextResponse.json(
      { base_delivery_fee: 25, currency: 'EGP' },
      { status: 200 }
    );
  }
}
