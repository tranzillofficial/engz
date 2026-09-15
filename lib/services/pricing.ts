// ============================================================
// Engz Dynamic Pricing Engine — Server-side calculation & snapshots
// ============================================================

import { createClient } from '@/lib/supabase/server';
import type { PricingSettings, PricingDistanceTier, PricingSnapshot } from '@/lib/types/database';

export interface FeeCalculationInput {
  distanceKm: number;
}

export interface FeeCalculationResult {
  baseFee: number;
  distanceFee: number;
  totalFee: number;
  currency: string;
  tiersApplied: {
    min_km: number;
    max_km: number;
    fee: number;
  }[];
  pricingSnapshot: PricingSnapshot;
}

/**
 * Calculates delivery fee based on active pricing settings & distance tiers in Supabase.
 * Returns both the total fee and an immutable pricing snapshot to attach to the Order.
 */
export async function calculateDeliveryFee(input: FeeCalculationInput): Promise<FeeCalculationResult> {
  const supabase = await createClient();

  // 1. Fetch active pricing settings
  const { data: settingsData } = await supabase
    .from('pricing_settings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const settings: PricingSettings = settingsData || {
    id: 'default',
    base_delivery_fee: 20,
    default_search_radius_km: 2,
    radius_expansion_step_km: 2,
    max_search_radius_km: 10,
    commission_block_threshold: 100,
    currency: 'EGP',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 2. Fetch active distance pricing tiers ordered by distance
  const { data: tiersData } = await supabase
    .from('pricing_distance_tiers')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const tiers: PricingDistanceTier[] = tiersData || [];

  const baseFee = Number(settings.base_delivery_fee) || 20;
  const currency = settings.currency || 'EGP';
  const distanceKm = Math.max(0, input.distanceKm);

  let distanceFee = 0;
  const tiersApplied: { min_km: number; max_km: number; fee: number }[] = [];

  // Match the distance with applicable tiers
  // Tiers can be cumulative or range-based.
  // Standard range approach: find the matching tier interval for total distance
  for (const tier of tiers) {
    if (distanceKm > tier.min_distance_km) {
      if (tier.max_distance_km === 0 || distanceKm <= tier.max_distance_km) {
        distanceFee += Number(tier.additional_fee);
        tiersApplied.push({
          min_km: tier.min_distance_km,
          max_km: tier.max_distance_km,
          fee: Number(tier.additional_fee),
        });
      }
    }
  }

  // Fallback distance calculation if no tiers defined in DB (e.g. 5 EGP per extra 2km past 2km)
  if (tiers.length === 0 && distanceKm > 2) {
    const extraKm = distanceKm - 2;
    distanceFee = Math.ceil(extraKm / 2) * 5;
    tiersApplied.push({
      min_km: 2,
      max_km: 999,
      fee: distanceFee,
    });
  }

  const totalFee = Math.round((baseFee + distanceFee) * 100) / 100;

  const pricingSnapshot: PricingSnapshot = {
    base_fee: baseFee,
    distance_km: distanceKm,
    distance_fee: distanceFee,
    total_fee: totalFee,
    currency,
    tiers_applied: tiersApplied,
    calculated_at: new Date().toISOString(),
  };

  return {
    baseFee,
    distanceFee,
    totalFee,
    currency,
    tiersApplied,
    pricingSnapshot,
  };
}
