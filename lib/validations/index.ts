import { z } from 'zod';

// ============================================================
// Auth Validations
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export const registerSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  full_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  phone: z.string().optional(),
  role: z.enum(['customer', 'driver']).default('customer'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================================
// Order Validations
// ============================================================

export const orderItemSchema = z.object({
  description: z.string().min(1, 'وصف الصنف مطلوب'),
  quantity: z.number().int().min(1, 'الكمية يجب أن تكون 1 على الأقل').default(1),
  notes: z.string().optional().default(''),
});

export const createOrderSchema = z.object({
  pickup_address: z.string().optional().default('حسب تفاصيل الأصناف المطلوب شراؤها'),
  pickup_lat: z.number().min(-90).max(90).optional().default(30.0444),
  pickup_lng: z.number().min(-180).max(180).optional().default(31.2357),
  dropoff_address: z.string().min(3, 'عنوان التوصيل مطلوب'),
  dropoff_lat: z.number().min(-90).max(90),
  dropoff_lng: z.number().min(-180).max(180),
  items: z.array(orderItemSchema).min(1, 'يجب إضافة صنف واحد على الأقل'),
  customer_notes: z.string().optional().default(''),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;

// ============================================================
// Payment Validations
// ============================================================

export const submitPaymentSchema = z.object({
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  payment_method: z.string().min(1, 'طريقة الدفع مطلوبة'),
  reference: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export const reviewPaymentSchema = z.object({
  payment_id: z.string().uuid(),
  action: z.enum(['confirmed', 'rejected']),
  review_notes: z.string().optional().default(''),
});

export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;
export type ReviewPaymentInput = z.infer<typeof reviewPaymentSchema>;

// ============================================================
// Pricing Validations
// ============================================================

export const updatePricingSchema = z.object({
  base_delivery_fee: z.number().min(0, 'الرسوم الأساسية لا يمكن أن تكون سالبة'),
  default_search_radius_km: z.number().min(0.5, 'نصف القطر يجب أن يكون 0.5 كم على الأقل'),
  radius_expansion_step_km: z.number().min(0.5, 'خطوة التوسيع يجب أن تكون 0.5 كم على الأقل'),
  max_search_radius_km: z.number().min(1, 'الحد الأقصى يجب أن يكون 1 كم على الأقل'),
  commission_block_threshold: z.number().min(0),
});

export const distanceTierSchema = z.object({
  min_distance_km: z.number().min(0),
  max_distance_km: z.number().min(0),
  additional_fee: z.number().min(0),
  sort_order: z.number().int().min(0),
}).refine(data => data.max_distance_km > data.min_distance_km, {
  message: 'الحد الأقصى للمسافة يجب أن يكون أكبر من الحد الأدنى',
});

export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;
export type DistanceTierInput = z.infer<typeof distanceTierSchema>;

// ============================================================
// Commission Validations
// ============================================================

export const commissionTierSchema = z.object({
  min_orders: z.number().int().min(1),
  max_orders: z.number().int().min(1).nullable(),
  commission_type: z.enum(['fixed', 'percentage']),
  commission_value: z.number().min(0),
  sort_order: z.number().int().min(0),
});

export type CommissionTierInput = z.infer<typeof commissionTierSchema>;

// ============================================================
// Region Validations
// ============================================================

export const regionSchema = z.object({
  name: z.string().min(2, 'اسم المنطقة مطلوب'),
  name_ar: z.string().optional().default(''),
  description: z.string().optional().default(''),
  whatsapp: z.string().optional().default(''),
  instagram: z.string().optional().default(''),
});

export type RegionInput = z.infer<typeof regionSchema>;

// ============================================================
// Driver Validations
// ============================================================

export const updateDriverLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const updateDriverStatusSchema = z.object({
  status: z.enum(['online', 'offline']),
});

export type UpdateDriverLocationInput = z.infer<typeof updateDriverLocationSchema>;
export type UpdateDriverStatusInput = z.infer<typeof updateDriverStatusSchema>;

// ============================================================
// Profile Validations
// ============================================================

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  phone: z.string().optional().default(''),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================================
// Driver Application Validations
// ============================================================

export const driverApplicationSchema = z.object({
  full_name: z.string().min(3, 'الاسم الرباعي يجب أن يكون 3 أحرف على الأقل'),
  age: z.coerce.number().min(18, 'يجب أن يكون السن 18 سنة على الأقل للعمل كطيار').max(70, 'أدخل سن صالح'),
  phone: z.string().regex(/^(010|011|012|015)\d{8}$/, 'أدخل رقم هاتف مصري صحيح (010 / 011 / 012 / 015)'),
  address: z.string().min(5, 'أدخل العنوان بالتفصيل'),
  vehicle_type: z.string().min(2, 'حدد وسيلة التوصيل'),
});

export type DriverApplicationInput = z.infer<typeof driverApplicationSchema>;

