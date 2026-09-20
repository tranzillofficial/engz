import { createClient } from '@/lib/supabase/server';
import type { PricingSnapshot } from '@/lib/types/database';

export interface FeeCalculationInput {
  distanceKm: number;
}

export interface FeeCalculationResult {
  baseFee: number;
  distanceFee: number;
  totalFee: number;
  currency: string;
  tiersApplied: { min_km: number; max_km: number; fee: number }[];
  pricingSnapshot: PricingSnapshot;
}

export async function getActivePricingSettings() {
  try {
    const db = await createClient();
    const { data } = await db
      .from('pricing_settings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) return data;
  } catch (e) {
    console.error('[Pricing] Failed to fetch settings:', e);
  }

  return {
    base_delivery_fee: 25,
    base_distance_km: 4,
    additional_km_fee: 3,
    currency: 'EGP',
  };
}

export async function calculateDeliveryFee(
  input: FeeCalculationInput
): Promise<FeeCalculationResult> {
  const s: any = await getActivePricingSettings();

  const distanceKm = Math.max(0, Number(input.distanceKm) || 0);
  const baseFee = Math.max(0, Number(s.base_delivery_fee ?? 25));
  const baseDistance = Math.max(0, Number(s.base_distance_km ?? 4));
  const extraKm = Math.max(0, Math.ceil(distanceKm - baseDistance));
  const distanceFee = extraKm * Math.max(0, Number(s.additional_km_fee ?? 3));
  const totalFee = baseFee + distanceFee;

  const tiersApplied = extraKm
    ? [{ min_km: baseDistance, max_km: 999999, fee: distanceFee }]
    : [];

  const pricingSnapshot: PricingSnapshot = {
    base_fee: baseFee,
    distance_km: distanceKm,
    distance_fee: distanceFee,
    total_fee: totalFee,
    currency: s.currency || 'EGP',
    tiers_applied: tiersApplied,
    calculated_at: new Date().toISOString(),
  };

  return {
    baseFee,
    distanceFee,
    totalFee,
    currency: pricingSnapshot.currency,
    tiersApplied,
    pricingSnapshot,
  };
}