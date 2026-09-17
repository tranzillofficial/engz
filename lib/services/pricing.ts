import { createClient } from '@/lib/supabase/server';
import type { PricingSettings, PricingSnapshot } from '@/lib/types/database';

export interface FeeCalculationInput { distanceKm: number; }
export interface FeeCalculationResult {
  baseFee: number; distanceFee: number; totalFee: number; currency: string;
  tiersApplied: { min_km: number; max_km: number; fee: number }[];
  pricingSnapshot: PricingSnapshot;
}

/** Fixed Engz pricing: 25 EGP up to 4 km, then 3 EGP for every started km above 4. */
export async function calculateDeliveryFee(input: FeeCalculationInput): Promise<FeeCalculationResult> {
  const supabase = await createClient();
  const { data } = await supabase.from('pricing_settings').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
  const settings = (data as unknown as PricingSettings | null) || {
    id: 'default', base_delivery_fee: 25, default_search_radius_km: 2,
    radius_expansion_step_km: 2, max_search_radius_km: 10, commission_block_threshold: 100,
    currency: 'EGP', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
  const distanceKm = Math.max(0, Number(input.distanceKm) || 0);
  const baseFee = 25;
  const extraKm = Math.max(0, Math.ceil(distanceKm - 4));
  const distanceFee = extraKm * 3;
  const totalFee = baseFee + distanceFee;
  const tiersApplied = extraKm > 0 ? [{ min_km: 4, max_km: 999999, fee: distanceFee }] : [];
  const pricingSnapshot: PricingSnapshot = {
    base_fee: baseFee, distance_km: distanceKm, distance_fee: distanceFee,
    total_fee: totalFee, currency: settings.currency || 'EGP', tiers_applied: tiersApplied,
    calculated_at: new Date().toISOString(),
  };
  return { baseFee, distanceFee, totalFee, currency: pricingSnapshot.currency, tiersApplied, pricingSnapshot };
}
