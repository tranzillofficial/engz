// ============================================================
// Engz Database Types — mirrors the active Supabase schema
// ============================================================

export type UserRole = 'customer' | 'driver' | 'agent' | 'admin';
export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'cancelled';
export type DriverStatus = 'online' | 'offline' | 'busy';
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected';
export type CommissionType = 'fixed' | 'percentage';
export type TransactionType = 'commission' | 'payment';
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface User {
  id:string; email:string; full_name:string; phone:string; role:UserRole; is_active:boolean; avatar_url:string;
  created_at:string; updated_at:string;
}
export interface Region {
  id:string; name:string; name_ar:string; description:string; whatsapp:string; instagram:string; is_active:boolean;
  created_at:string; updated_at:string;
}
export interface Agent {
  id:string; user_id:string; region_id:string; is_active:boolean; created_at:string; updated_at:string;
  payout_phone?:string|null; commission_balance:number; user?:User; region?:Region;
}
export interface Driver {
  id:string; user_id:string; region_id:string|null; agent_id:string|null; status:DriverStatus;
  current_lat:number|null; current_lng:number|null; is_blocked:boolean; commission_balance:number;
  total_completed_orders:number; is_active:boolean; registration_code:string|null; verification_required:boolean;
  address:string|null; age:number|null; vehicle_type:string|null; personal_photo_url:string|null;
  id_card_front_url:string|null; id_card_back_url:string|null; verification_complete:boolean;
  verification_id_card_front_url:string; verification_id_card_back_url:string; verification_personal_photo_url:string;
  created_at:string; updated_at:string; user?:User; region?:Region;
}
export interface PricingSettings {
  id:string; base_delivery_fee:number; default_search_radius_km:number; radius_expansion_step_km:number;
  max_search_radius_km:number; commission_block_threshold:number; currency:string; is_active:boolean;
  created_at:string; updated_at:string; free_orders:number; driver_commission_per_order:number;
  platform_share_per_agent_order:number; agent_share_per_order:number; additional_fee_per_km:number;
  base_distance_km:number; additional_km_fee:number;
}
export interface PricingDistanceTier {
  id:string; min_distance_km:number; max_distance_km:number; additional_fee:number; sort_order:number;
  is_active:boolean; created_at:string;
}
export interface CommissionTier {
  id:string; min_orders:number; max_orders:number|null; commission_type:CommissionType; commission_value:number;
  sort_order:number; is_active:boolean; created_at:string; updated_at:string;
}
export interface Order {
  id:string; customer_id:string; driver_id:string|null; status:OrderStatus; pickup_address:string; pickup_lat:number;
  pickup_lng:number; dropoff_address:string; dropoff_lat:number; dropoff_lng:number; route_distance_km:number|null;
  route_duration_minutes:number|null; delivery_fee:number; pricing_snapshot:PricingSnapshot|null; customer_notes:string;
  accepted_at:string|null; picked_up_at:string|null; delivered_at:string|null; cancelled_at:string|null;
  created_at:string; updated_at:string; customer_rating?:number|null; customer_review?:string|null; rated_at?:string|null;
  customer?:User; driver?:Driver; order_items?:OrderItem[];
}
export interface OrderItem {
  id:string; order_id:string; description:string; quantity:number; notes:string; sort_order:number; created_at:string;
}
export interface OrderStatusHistory {
  id:string; order_id:string; old_status:OrderStatus|null; new_status:OrderStatus; changed_by:string|null; notes:string; created_at:string;
}
export interface CommissionTransaction {
  id:string; driver_id:string; order_id:string|null; transaction_type:TransactionType; amount:number; balance_after:number;
  tier_snapshot:CommissionTier|null; notes:string; created_at:string;
}
export interface PaymentConfirmation {
  id:string; driver_id:string; amount:number; payment_method:string; reference:string; proof_image_url:string;
  notes:string; status:PaymentStatus; reviewed_by:string|null; review_notes:string; reviewed_at:string|null;
  created_at:string; updated_at:string; driver?:Driver; reviewer?:User;
}
export interface PaymentMethod {
  id:string; method_key:string; method_name:string; account_name:string; account_number:string;
  instructions:string; is_active:boolean; created_at:string; updated_at:string;
}
export interface Notification {
  id:string; recipient_user_id:string|null; recipient_role:UserRole|null; title:string; body:string; type:string;
  data:Json; is_read:boolean; created_at:string;
}
export interface Complaint {
  id:string; order_id:string; customer_id:string; driver_id:string|null; agent_id:string|null; category:string;
  subject:string; description:string; status:string; agent_action:string|null; agent_action_at:string|null;
  escalated_by:string|null; escalated_at:string|null; admin_action:string|null; admin_action_at:string|null;
  created_at:string; updated_at:string;
}
export interface AuditLog {
  id:string; user_id:string|null; action:string; entity_type:string; entity_id:string|null;
  old_data:Record<string,unknown>|null; new_data:Record<string,unknown>|null; ip_address:string; created_at:string;
}
export interface ChatMessage {
  id:string; order_id:string; sender_id:string; message_text:string; image_url:string; is_saved_by_admin:boolean;
  saved_by:string|null; created_at:string; expires_at:string; sender?:User;
}
export interface PricingSnapshot {
  base_fee:number; distance_km:number; distance_fee:number; total_fee:number; currency:string;
  tiers_applied:{min_km:number;max_km:number;fee:number}[]; calculated_at:string;
}

type Insert<T> = Partial<T>;
type Update<T> = Partial<T>;

export interface Database {
  public:{
    Tables:{
      users:{Row:User;Insert:Insert<User>&{id:string;email:string};Update:Update<User>};
      regions:{Row:Region;Insert:Insert<Region>&{name:string};Update:Update<Region>};
      agents:{Row:Agent;Insert:Insert<Agent>&{user_id:string;region_id:string};Update:Update<Agent>};
      drivers:{Row:Driver;Insert:Insert<Driver>&{user_id:string};Update:Update<Driver>};
      pricing_settings:{Row:PricingSettings;Insert:Insert<PricingSettings>;Update:Update<PricingSettings>};
      pricing_distance_tiers:{Row:PricingDistanceTier;Insert:Insert<PricingDistanceTier>&{min_distance_km:number;max_distance_km:number};Update:Update<PricingDistanceTier>};
      commission_tiers:{Row:CommissionTier;Insert:Insert<CommissionTier>&{min_orders:number};Update:Update<CommissionTier>};
      orders:{Row:Order;Insert:Insert<Order>&{customer_id:string;pickup_address:string;pickup_lat:number;pickup_lng:number;dropoff_address:string;dropoff_lat:number;dropoff_lng:number};Update:Update<Order>};
      order_items:{Row:OrderItem;Insert:Insert<OrderItem>&{order_id:string;description:string};Update:Update<OrderItem>};
      order_status_history:{Row:OrderStatusHistory;Insert:Insert<OrderStatusHistory>&{order_id:string;new_status:OrderStatus};Update:Update<OrderStatusHistory>};
      commission_transactions:{Row:CommissionTransaction;Insert:Insert<CommissionTransaction>&{driver_id:string;amount:number;balance_after:number};Update:Update<CommissionTransaction>};
      payment_confirmations:{Row:PaymentConfirmation;Insert:Insert<PaymentConfirmation>&{driver_id:string;amount:number};Update:Update<PaymentConfirmation>};
      payment_methods:{Row:PaymentMethod;Insert:Insert<PaymentMethod>;Update:Update<PaymentMethod>};
      notifications:{Row:Notification;Insert:Insert<Notification>;Update:Update<Notification>};
      complaints:{Row:Complaint;Insert:Insert<Complaint>&{order_id:string;customer_id:string;category:string;subject:string;description:string};Update:Update<Complaint>};
      audit_logs:{Row:AuditLog;Insert:Insert<AuditLog>&{action:string;entity_type:string};Update:Update<AuditLog>};
      chat_messages:{Row:ChatMessage;Insert:Insert<ChatMessage>&{order_id:string;sender_id:string};Update:Update<ChatMessage>};
    };
    Functions:{
      accept_order:{Args:{p_order_id:string;p_driver_id:string};Returns:{success:boolean;error?:string;message?:string}};
      complete_order_with_commission:{Args:{p_order_id:string};Returns:{success:boolean;error?:string;commission?:number;new_balance?:number;is_blocked?:boolean}};
      confirm_payment:{Args:{p_payment_id:string;p_reviewer_id:string;p_review_notes?:string};Returns:{success:boolean;error?:string;new_balance?:number;is_blocked?:boolean}};
      get_user_role:{Args:Record<string,never>;Returns:UserRole};
      get_agent_region_id:{Args:Record<string,never>;Returns:string};
      get_driver_id:{Args:Record<string,never>;Returns:string};
    };
    Enums:{user_role:UserRole;order_status:OrderStatus;driver_status:DriverStatus;payment_status:PaymentStatus;commission_type:CommissionType;transaction_type:TransactionType};
  };
}