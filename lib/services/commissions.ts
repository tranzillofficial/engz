// ============================================================
// Engz Commission Service — Tier calculation, transactions & threshold blocking
// ============================================================

import { createClient } from '@/lib/supabase/server';
import type { CommissionTier, CommissionTransaction, PricingSettings, Driver } from '@/lib/types/database';

export interface CommissionCalculationResult {
  completedOrdersCount: number;
  tierApplied: CommissionTier | null;
  commissionAmount: number;
  notes: string;
}

/**
 * Determine driver's matching commission tier and calculate commission amount for an order.
 */
export async function calculateOrderCommission(
  driverId: string,
  deliveryFee: number
): Promise<CommissionCalculationResult> {
  const supabase = await createClient();

  // 1. Get driver's total completed orders
  const { data: driverData } = await supabase
    .from('drivers')
    .select('total_completed_orders')
    .eq('id', driverId)
    .single();

  const completedCount = (driverData as Pick<Driver, 'total_completed_orders'> | null)?.total_completed_orders || 0;
  const currentOrderIndex = completedCount + 1;

  // 2. Fetch active commission tiers sorted
  const { data: tiersData } = await supabase
    .from('commission_tiers')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const tiers: CommissionTier[] = tiersData || [];

  // 3. Find matching tier for currentOrderIndex
  let matchedTier: CommissionTier | null = null;
  for (const tier of tiers) {
    if (currentOrderIndex >= tier.min_orders) {
      if (tier.max_orders === null || currentOrderIndex <= tier.max_orders) {
        matchedTier = tier;
        break;
      }
    }
  }

  // 4. Calculate commission
  let commissionAmount = 0;
  let notes = '';

  if (matchedTier) {
    if (matchedTier.commission_type === 'fixed') {
      commissionAmount = Number(matchedTier.commission_value);
      notes = `عمولة ثابتة: ${commissionAmount} ج (شريحة الطلبات ${matchedTier.min_orders} - ${matchedTier.max_orders || 'ما لا نهاية'})`;
    } else {
      commissionAmount = Math.round(((deliveryFee * Number(matchedTier.commission_value)) / 100) * 100) / 100;
      notes = `عمولة نسبة ${matchedTier.commission_value}% من رسوم التوصيل ${deliveryFee} ج = ${commissionAmount} ج`;
    }
  } else {
    // Fallback default tier
    commissionAmount = 0;
    notes = 'الطلب ضمن أول 3 طلبات بدون عمولة (Default Tier)';
  }

  return {
    completedOrdersCount: completedCount,
    tierApplied: matchedTier,
    commissionAmount,
    notes,
  };
}

/**
 * Check if driver should be blocked based on unpaid commission vs threshold.
 */
export async function shouldBlockDriver(driverBalance: number): Promise<{ shouldBlock: boolean; threshold: number }> {
  const supabase = await createClient();

  const { data: settingsData } = await supabase
    .from('pricing_settings')
    .select('commission_block_threshold')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const threshold = (settingsData as Pick<PricingSettings, 'commission_block_threshold'> | null)?.commission_block_threshold ?? 100;

  return {
    shouldBlock: driverBalance >= threshold,
    threshold,
  };
}

/**
 * Get driver wallet summary (balance, paid, unpaid, and ledger transactions).
 */
export async function getDriverWalletSummary(driverId: string) {
  const supabase = await createClient();

  // 1. Fetch driver details
  const { data: driverData } = await supabase
    .from('drivers')
    .select(`
      id,
      commission_balance,
      is_blocked,
      region:regions(whatsapp, instagram, name_ar, name)
    `)
    .eq('id', driverId)
    .single();

  const driver = driverData as unknown as {
    id: string;
    commission_balance: number;
    is_blocked: boolean;
    region?: {
      whatsapp: string;
      instagram: string;
      name_ar: string;
      name: string;
    };
  } | null;

  // 2. Fetch ledger transactions
  const { data: txData } = await supabase
    .from('commission_transactions')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  const transactions: CommissionTransaction[] = (txData as unknown as CommissionTransaction[]) || [];

  // Calculate totals
  let totalCommissions = 0;
  let totalPaid = 0;

  for (const tx of transactions) {
    if (tx.transaction_type === 'commission') {
      totalCommissions += Number(tx.amount);
    } else if (tx.transaction_type === 'payment') {
      totalPaid += Number(tx.amount);
    }
  }

  return {
    driver,
    currentBalance: driver?.commission_balance || 0,
    totalCommissions,
    totalPaid,
    transactions,
  };
}
