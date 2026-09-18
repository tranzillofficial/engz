// Compatibility domain types backed by the generated Supabase schema.
// The generated schema in types/supabase.ts is the source of truth.
import type { Database } from '@/types/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';

export type { Database, Json } from '@/types/supabase';
export type UserRole = Database['public']['Enums']['user_role'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type DriverStatus = Database['public']['Enums']['driver_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type CommissionType = Database['public']['Enums']['commission_type'];
export type TransactionType = Database['public']['Enums']['transaction_type'];

export type User = Tables<'users'>;
export type Region = Tables<'regions'>;
export type PricingSettings = Tables<'pricing_settings'>;
export type PricingDistanceTier = Tables<'pricing_distance_tiers'>;
export type CommissionTier = Tables<'commission_tiers'>;
export type OrderItem = Tables<'order_items'>;
export type OrderStatusHistory = Tables<'order_status_history'>;
export type CommissionTransaction = Tables<'commission_transactions'>;
export type PaymentConfirmation = Tables<'payment_confirmations'>;
export type PaymentMethod = Tables<'payment_methods'>;
export type Notification = Tables<'notifications'>;
export type Complaint = Tables<'complaints'>;
export type AuditLog = Tables<'audit_logs'>;
export type ChatMessage = Tables<'chat_messages'>;
export type DriverApplication = Tables<'driver_applications'>;

export type Agent = Tables<'agents'> & { user?: User; region?: Region };
export type Driver = Tables<'drivers'> & { user?: User; region?: Region };

export type PricingSnapshot = {
  base_fee: number;
  distance_km: number;
  distance_fee: number;
  total_fee: number;
  currency: string;
  tiers_applied: { min_km: number; max_km: number; fee: number }[];
  calculated_at: string;
};

export type Order = Omit<Tables<'orders'>, 'pricing_snapshot'> & {
  pricing_snapshot: PricingSnapshot | null;
  customer?: User;
  driver?: Driver;
  order_items?: OrderItem[];
};

export type TablesInsertType<T extends keyof Database['public']['Tables']> = TablesInsert<T>;
export type TablesUpdateType<T extends keyof Database['public']['Tables']> = TablesUpdate<T>;
