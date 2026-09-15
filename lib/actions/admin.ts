'use server';

// ============================================================
// Engz Admin Server Actions
// ============================================================

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/services/auth';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { reviewPayment } from '@/lib/services/payments';

async function ensureAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('غير مصرح — صلاحيات إدارة مطلوبة');
  }
  return user;
}

// ─── Pricing Actions ──────────────────────────────────────────
export async function updatePricingSettingsAction(formData: FormData) {
  await ensureAdmin();
  const supabase = await createClient();

  const baseDeliveryFee = parseFloat(formData.get('base_delivery_fee') as string);
  const defaultSearchRadius = parseFloat(formData.get('default_search_radius_km') as string);
  const radiusExpansionStep = parseFloat(formData.get('radius_expansion_step_km') as string);
  const maxSearchRadius = parseFloat(formData.get('max_search_radius_km') as string);
  const blockThreshold = parseFloat(formData.get('commission_block_threshold') as string);

  const { error } = await supabase
    .from('pricing_settings')
    .update({
      base_delivery_fee: baseDeliveryFee,
      default_search_radius_km: defaultSearchRadius,
      radius_expansion_step_km: radiusExpansionStep,
      max_search_radius_km: maxSearchRadius,
      commission_block_threshold: blockThreshold,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('is_active', true);

  if (error) return { error: 'فشل حفظ إعدادات التسعير' };

  revalidatePath('/admin/pricing');
  return { success: true };
}

export async function addDistanceTierAction(formData: FormData) {
  await ensureAdmin();
  const supabase = await createClient();

  const minKm = parseFloat(formData.get('min_distance_km') as string);
  const maxKm = parseFloat(formData.get('max_distance_km') as string);
  const fee = parseFloat(formData.get('additional_fee') as string);
  const sortOrder = parseInt(formData.get('sort_order') as string, 10) || 1;

  const { error } = await supabase.from('pricing_distance_tiers').insert({
    min_distance_km: minKm,
    max_distance_km: maxKm,
    additional_fee: fee,
    sort_order: sortOrder,
    is_active: true,
  } as never);

  if (error) return { error: 'فشل إضافة شريحة المسافة' };

  revalidatePath('/admin/pricing');
  return { success: true };
}

export async function deleteDistanceTierAction(tierId: string) {
  await ensureAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('pricing_distance_tiers')
    .delete()
    .eq('id', tierId);

  if (error) return { error: 'فشل حذف الشريحة' };

  revalidatePath('/admin/pricing');
  return { success: true };
}

// ─── Commission Actions ───────────────────────────────────────
export async function addCommissionTierAction(formData: FormData) {
  await ensureAdmin();
  const supabase = await createClient();

  const minOrders = parseInt(formData.get('min_orders') as string, 10);
  const maxOrdersRaw = formData.get('max_orders') as string;
  const maxOrders = maxOrdersRaw ? parseInt(maxOrdersRaw, 10) : null;
  const commissionType = formData.get('commission_type') as 'fixed' | 'percentage';
  const commissionValue = parseFloat(formData.get('commission_value') as string);
  const sortOrder = parseInt(formData.get('sort_order') as string, 10) || 1;

  const { error } = await supabase.from('commission_tiers').insert({
    min_orders: minOrders,
    max_orders: maxOrders,
    commission_type: commissionType,
    commission_value: commissionValue,
    sort_order: sortOrder,
    is_active: true,
  } as never);

  if (error) return { error: 'فشل إضافة شريحة العمولة' };

  revalidatePath('/admin/commissions');
  return { success: true };
}

export async function deleteCommissionTierAction(tierId: string) {
  await ensureAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('commission_tiers')
    .delete()
    .eq('id', tierId);

  if (error) return { error: 'فشل حذف الشريحة' };

  revalidatePath('/admin/commissions');
  return { success: true };
}

// ─── Region Actions ───────────────────────────────────────────
export async function createRegionAction(formData: FormData) {
  await ensureAdmin();
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const nameAr = formData.get('name_ar') as string;
  const whatsapp = (formData.get('whatsapp') as string) || '';
  const instagram = (formData.get('instagram') as string) || '';

  const { error } = await supabase.from('regions').insert({
    name,
    name_ar: nameAr,
    whatsapp,
    instagram,
    is_active: true,
  } as never);

  if (error) return { error: 'فشل إنشاء المنطقة' };

  revalidatePath('/admin/regions');
  return { success: true };
}

// ─── Driver Actions ───────────────────────────────────────────
export async function toggleDriverBlockAction(driverId: string, isBlocked: boolean) {
  await ensureAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('drivers')
    .update({ is_blocked: isBlocked } as never)
    .eq('id', driverId);

  if (error) return { error: 'فشل تغيير حالة الحظر' };

  revalidatePath('/admin/drivers');
  return { success: true };
}

// ─── Payment Actions ──────────────────────────────────────────
export async function adminReviewPaymentAction(
  paymentId: string,
  action: 'confirmed' | 'rejected',
  notes?: string
) {
  const user = await ensureAdmin();
  const res = await reviewPayment(paymentId, user.id, action, notes);

  if (res.success) {
    revalidatePath('/admin/payments');
    revalidatePath('/admin');
  }
  return res;
}
