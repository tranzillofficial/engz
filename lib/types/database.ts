// ============================================================
// Engz Database Types — mirrors schema.sql
// ============================================================

// Enums
export type UserRole = 'customer' | 'driver' | 'agent' | 'admin';
export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'cancelled';
export type DriverStatus = 'online' | 'offline' | 'busy';
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected';
export type CommissionType = 'fixed' | 'percentage';
export type TransactionType = 'commission' | 'payment';

// Table Row Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface Region {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  whatsapp: string;
  instagram: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  region_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
  region?: Region;
}

export interface Driver {
  id: string;
  user_id: string;
  region_id: string | null;
  status: DriverStatus;
  current_lat: number | null;
  current_lng: number | null;
  is_blocked: boolean;
  commission_balance: number;
  total_completed_orders: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
  region?: Region;
}

export interface PricingSettings {
  id: string;
  base_delivery_fee: number;
  default_search_radius_km: number;
  radius_expansion_step_km: number;
  max_search_radius_km: number;
  commission_block_threshold: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingDistanceTier {
  id: string;
  min_distance_km: number;
  max_distance_km: number;
  additional_fee: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CommissionTier {
  id: string;
  min_orders: number;
  max_orders: number | null;
  commission_type: CommissionType;
  commission_value: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  driver_id: string | null;
  status: OrderStatus;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  route_distance_km: number | null;
  route_duration_minutes: number | null;
  delivery_fee: number;
  pricing_snapshot: PricingSnapshot | null;
  customer_notes: string;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  customer_rating?: number | null;
  customer_review?: string | null;
  rated_at?: string | null;
  // Relations
  customer?: User;
  driver?: Driver;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  description: string;
  quantity: number;
  notes: string;
  sort_order: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string | null;
  notes: string;
  created_at: string;
}

export interface CommissionTransaction {
  id: string;
  driver_id: string;
  order_id: string | null;
  transaction_type: TransactionType;
  amount: number;
  balance_after: number;
  tier_snapshot: CommissionTier | null;
  notes: string;
  created_at: string;
}

export interface PaymentConfirmation {
  id: string;
  driver_id: string;
  amount: number;
  payment_method: string;
  reference: string;
  proof_image_url: string;
  notes: string;
  status: PaymentStatus;
  reviewed_by: string | null;
  review_notes: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  driver?: Driver;
  reviewer?: User;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  message_text: string;
  image_url: string;
  is_saved_by_admin: boolean;
  saved_by: string | null;
  created_at: string;
  expires_at: string;
  // Relations
  sender?: User;
}

// Pricing Snapshot — stored with each order
export interface PricingSnapshot {
  base_fee: number;
  distance_km: number;
  distance_fee: number;
  total_fee: number;
  currency: string;
  tiers_applied: {
    min_km: number;
    max_km: number;
    fee: number;
  }[];
  calculated_at: string;
}

// Supabase Database type for typed client
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User> & { id: string; email: string };
        Update: Partial<User>;
      };
      regions: {
        Row: Region;
        Insert: Partial<Region> & { name: string };
        Update: Partial<Region>;
      };
      agents: {
        Row: Agent;
        Insert: Partial<Agent> & { user_id: string; region_id: string };
        Update: Partial<Agent>;
      };
      drivers: {
        Row: Driver;
        Insert: Partial<Driver> & { user_id: string };
        Update: Partial<Driver>;
      };
      pricing_settings: {
        Row: PricingSettings;
        Insert: Partial<PricingSettings>;
        Update: Partial<PricingSettings>;
      };
      pricing_distance_tiers: {
        Row: PricingDistanceTier;
        Insert: Partial<PricingDistanceTier> & { min_distance_km: number; max_distance_km: number };
        Update: Partial<PricingDistanceTier>;
      };
      commission_tiers: {
        Row: CommissionTier;
        Insert: Partial<CommissionTier> & { min_orders: number };
        Update: Partial<CommissionTier>;
      };
      orders: {
        Row: Order;
        Insert: Partial<Order> & {
          customer_id: string;
          pickup_address: string;
          pickup_lat: number;
          pickup_lng: number;
          dropoff_address: string;
          dropoff_lat: number;
          dropoff_lng: number;
        };
        Update: Partial<Order>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem> & { order_id: string; description: string };
        Update: Partial<OrderItem>;
      };
      order_status_history: {
        Row: OrderStatusHistory;
        Insert: Partial<OrderStatusHistory> & { order_id: string; new_status: OrderStatus };
        Update: Partial<OrderStatusHistory>;
      };
      commission_transactions: {
        Row: CommissionTransaction;
        Insert: Partial<CommissionTransaction> & { driver_id: string; amount: number; balance_after: number };
        Update: Partial<CommissionTransaction>;
      };
      payment_confirmations: {
        Row: PaymentConfirmation;
        Insert: Partial<PaymentConfirmation> & { driver_id: string; amount: number };
        Update: Partial<PaymentConfirmation>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog> & { action: string; entity_type: string };
        Update: Partial<AuditLog>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Partial<ChatMessage> & { order_id: string; sender_id: string };
        Update: Partial<ChatMessage>;
      };
    };
    Functions: {
      accept_order: {
        Args: { p_order_id: string; p_driver_id: string };
        Returns: { success: boolean; error?: string; message?: string };
      };
      complete_order_with_commission: {
        Args: { p_order_id: string };
        Returns: {
          success: boolean;
          error?: string;
          commission?: number;
          new_balance?: number;
          is_blocked?: boolean;
        };
      };
      confirm_payment: {
        Args: { p_payment_id: string; p_reviewer_id: string; p_review_notes?: string };
        Returns: {
          success: boolean;
          error?: string;
          new_balance?: number;
          is_blocked?: boolean;
        };
      };
      get_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
      get_agent_region_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_driver_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      driver_status: DriverStatus;
      payment_status: PaymentStatus;
      commission_type: CommissionType;
      transaction_type: TransactionType;
    };
  };
}
