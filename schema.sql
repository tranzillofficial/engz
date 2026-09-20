-- ============================================================
-- Engz Platform — Complete Database Schema
-- Run this file directly in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. Enums
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'driver', 'agent', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'in_progress', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('online', 'offline', 'busy');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_type AS ENUM ('fixed', 'percentage');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('commission', 'payment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. Tables
-- ============================================================

-- 3.1 Users (Supports both Supabase Auth users and guest customers)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  role user_role NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Regions
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Agents (linked to region)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3.4 Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  age INTEGER DEFAULT NULL,
  address TEXT DEFAULT '',
  vehicle_type TEXT DEFAULT 'موتوسيكل',
  status driver_status NOT NULL DEFAULT 'offline',
  current_lat DOUBLE PRECISION DEFAULT NULL,
  current_lng DOUBLE PRECISION DEFAULT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  verification_complete BOOLEAN NOT NULL DEFAULT FALSE,
  id_front_url TEXT DEFAULT '',
  id_back_url TEXT DEFAULT '',
  license_url TEXT DEFAULT '',
  commission_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total_completed_orders INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id),
  CONSTRAINT commission_balance_non_negative CHECK (commission_balance >= 0)
);

-- 3.5 Pricing Settings (singleton-ish, admin-managed)
CREATE TABLE IF NOT EXISTS pricing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
  base_distance_km DECIMAL(6, 2) NOT NULL DEFAULT 4.00,
  additional_km_fee DECIMAL(10, 2) NOT NULL DEFAULT 3.00,
  driver_commission_per_order DECIMAL(10, 2) NOT NULL DEFAULT 6.00,
  platform_share_per_agent_order DECIMAL(10, 2) NOT NULL DEFAULT 2.50,
  agent_share_per_order DECIMAL(10, 2) NOT NULL DEFAULT 3.50,
  free_orders INTEGER NOT NULL DEFAULT 3,
  default_search_radius_km DECIMAL(6, 2) NOT NULL DEFAULT 2.00,
  radius_expansion_step_km DECIMAL(6, 2) NOT NULL DEFAULT 2.00,
  max_search_radius_km DECIMAL(6, 2) NOT NULL DEFAULT 10.00,
  commission_block_threshold DECIMAL(12, 2) NOT NULL DEFAULT 200.00,
  currency TEXT NOT NULL DEFAULT 'EGP',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.6 Pricing Distance Tiers
CREATE TABLE IF NOT EXISTS pricing_distance_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_distance_km DECIMAL(6, 2) NOT NULL,
  max_distance_km DECIMAL(6, 2) NOT NULL,
  additional_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_distance_range CHECK (max_distance_km > min_distance_km)
);

-- 3.7 Commission Tiers
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_orders INTEGER NOT NULL,
  max_orders INTEGER, -- NULL = unlimited
  commission_type commission_type NOT NULL DEFAULT 'fixed',
  commission_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_order_range CHECK (max_orders IS NULL OR max_orders >= min_orders),
  CONSTRAINT commission_value_non_negative CHECK (commission_value >= 0)
);

-- 3.8 Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number SERIAL UNIQUE, -- Human-readable order number (e.g. #00042)
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',

  -- Pickup
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,

  -- Drop-off
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,

  -- Route & Pricing
  route_distance_km DECIMAL(8, 2) DEFAULT NULL,
  route_duration_minutes INTEGER DEFAULT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  pricing_snapshot JSONB DEFAULT NULL,

  -- Notes
  customer_notes TEXT DEFAULT '',

  -- Customer Rating & Review
  customer_rating INTEGER DEFAULT NULL CHECK (customer_rating IS NULL OR (customer_rating >= 1 AND customer_rating <= 5)),
  customer_review TEXT DEFAULT NULL,
  rated_at TIMESTAMPTZ DEFAULT NULL,

  -- Timestamps
  accepted_at TIMESTAMPTZ DEFAULT NULL,
  picked_up_at TIMESTAMPTZ DEFAULT NULL,
  delivered_at TIMESTAMPTZ DEFAULT NULL,
  cancelled_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add order_number to existing DB (idempotent)
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN order_number SERIAL UNIQUE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- 3.9 Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.10 Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status order_status DEFAULT NULL,
  new_status order_status NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.11 Commission Transactions
CREATE TABLE IF NOT EXISTS commission_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL DEFAULT 'commission',
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  tier_snapshot JSONB DEFAULT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate commission per order
  UNIQUE(order_id, transaction_type)
);

-- 3.12 Payment Confirmations (Manual Payments)
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT '',
  reference TEXT DEFAULT '',
  proof_image_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status payment_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_notes TEXT DEFAULT '',
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payment_amount_positive CHECK (amount > 0)
);

-- 3.13 Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID DEFAULT NULL,
  old_data JSONB DEFAULT NULL,
  new_data JSONB DEFAULT NULL,
  ip_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.14 Driver Applications (Registration & ID Verification)
CREATE TABLE IF NOT EXISTS driver_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'موتوسيكل',
  id_card_front_url TEXT NOT NULL,
  id_card_back_url TEXT NOT NULL,
  personal_photo_url TEXT DEFAULT '',
  id_card_front_metadata JSONB DEFAULT NULL,
  id_card_back_metadata JSONB DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT DEFAULT '',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.15 Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.16 Push Subscriptions (Web Push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT DEFAULT 'browser',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- 3.17 Complaints (Customer & Agent Escalation)
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'driver',
  subject TEXT DEFAULT 'شكوى',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'agent_review', -- 'agent_review', 'agent_actioned', 'admin_review'
  agent_action TEXT DEFAULT '',
  agent_action_at TIMESTAMPTZ DEFAULT NULL,
  escalated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  escalated_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.18 Payment Methods (Vodafone Cash, InstaPay, etc.)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  method_key TEXT UNIQUE NOT NULL,
  method_name TEXT NOT NULL,
  account_name TEXT DEFAULT '',
  account_number TEXT NOT NULL,
  instructions TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.19 Agent Payouts
CREATE TABLE IF NOT EXISTS agent_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'manual',
  reference TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status payment_status NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent Column Additions for Existing Databases
DO $$ BEGIN
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT NULL;
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'موتوسيكل';
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS verification_complete BOOLEAN DEFAULT FALSE;
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS id_front_url TEXT DEFAULT '';
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS id_back_url TEXT DEFAULT '';
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_url TEXT DEFAULT '';
  
  ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS base_distance_km DECIMAL(6, 2) DEFAULT 4.00;
  ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS additional_km_fee DECIMAL(10, 2) DEFAULT 3.00;
  ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS driver_commission_per_order DECIMAL(10, 2) DEFAULT 6.00;
  ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS platform_share_per_agent_order DECIMAL(10, 2) DEFAULT 2.50;
  ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS agent_share_per_order DECIMAL(10, 2) DEFAULT 3.50;
  ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS free_orders INTEGER DEFAULT 3;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add personal_photo_url if running on existing DB (idempotent)
DO $$ BEGIN
  ALTER TABLE driver_applications ADD COLUMN personal_photo_url TEXT DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_region_id ON agents(region_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_region_id ON drivers(region_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_blocked ON drivers(is_blocked);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers(current_lat, current_lng) WHERE current_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_driver_id ON commission_transactions(driver_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_order_id ON commission_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_driver_id ON payment_confirmations(driver_id);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_status ON payment_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- 5. Functions & Triggers
-- ============================================================

-- 5.1 Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT unnest(ARRAY[
      'users', 'regions', 'agents', 'drivers', 
      'pricing_settings', 'commission_tiers',
      'orders', 'payment_confirmations'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trigger_update_%s_updated_at ON %I; 
       CREATE TRIGGER trigger_update_%s_updated_at 
       BEFORE UPDATE ON %I 
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t, t, t
    );
  END LOOP;
END $$;

-- 5.2 Validate order status transitions
CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow any -> cancelled
  IF NEW.status = 'cancelled' THEN
    IF OLD.status = 'delivered' THEN
      RAISE EXCEPTION 'Cannot cancel a delivered order';
    END IF;
    NEW.cancelled_at = NOW();
    RETURN NEW;
  END IF;

  -- Valid transitions
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    NEW.accepted_at = NOW();
    RETURN NEW;
  ELSIF OLD.status = 'accepted' AND NEW.status = 'in_progress' THEN
    NEW.picked_up_at = NOW();
    RETURN NEW;
  ELSIF OLD.status = 'in_progress' AND NEW.status = 'delivered' THEN
    NEW.delivered_at = NOW();
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_order_status ON orders;
CREATE TRIGGER trigger_validate_order_status
BEFORE UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION validate_order_status_transition();

-- 5.3 Log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_order_status ON orders;
CREATE TRIGGER trigger_log_order_status
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- 5.4 Atomic order acceptance (RPC)
CREATE OR REPLACE FUNCTION accept_order(
  p_order_id UUID,
  p_driver_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_driver drivers%ROWTYPE;
BEGIN
  -- Lock the order row
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  IF v_order.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order is no longer available');
  END IF;

  -- Check driver
  SELECT * INTO v_driver FROM drivers WHERE id = p_driver_id FOR UPDATE;
  
  IF v_driver IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Driver not found');
  END IF;
  
  IF v_driver.is_blocked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Driver is blocked due to unpaid commission');
  END IF;
  
  IF v_driver.status != 'online' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Driver must be online to accept orders');
  END IF;

  -- Accept the order
  UPDATE orders 
  SET status = 'accepted', driver_id = p_driver_id
  WHERE id = p_order_id;

  -- Set driver to busy
  UPDATE drivers SET status = 'busy' WHERE id = p_driver_id;

  RETURN jsonb_build_object('success', true, 'message', 'Order accepted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5 Complete order + commission calculation (RPC)
CREATE OR REPLACE FUNCTION complete_order_with_commission(
  p_order_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_driver drivers%ROWTYPE;
  v_tier commission_tiers%ROWTYPE;
  v_commission DECIMAL(10, 2);
  v_new_balance DECIMAL(12, 2);
  v_settings pricing_settings%ROWTYPE;
  v_driver_order_count INTEGER;
BEGIN
  -- Lock and get order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  IF v_order.status != 'in_progress' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order must be in_progress to complete');
  END IF;
  
  IF v_order.driver_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No driver assigned');
  END IF;

  -- Check duplicate commission
  IF EXISTS (
    SELECT 1 FROM commission_transactions 
    WHERE order_id = p_order_id AND transaction_type = 'commission'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Commission already calculated for this order');
  END IF;

  -- Lock driver
  SELECT * INTO v_driver FROM drivers WHERE id = v_order.driver_id FOR UPDATE;
  
  -- Get settings
  SELECT * INTO v_settings FROM pricing_settings WHERE is_active = true LIMIT 1;

  -- Update order status to delivered
  UPDATE orders SET status = 'delivered' WHERE id = p_order_id;

  -- Count completed orders for this driver (including this one)
  v_driver_order_count := v_driver.total_completed_orders + 1;

  -- Find matching commission tier
  SELECT * INTO v_tier FROM commission_tiers
  WHERE is_active = true
    AND v_driver_order_count >= min_orders
    AND (max_orders IS NULL OR v_driver_order_count <= max_orders)
  ORDER BY sort_order ASC
  LIMIT 1;

  -- Calculate commission
  IF v_tier IS NULL THEN
    v_commission := 0;
  ELSIF v_tier.commission_type = 'fixed' THEN
    v_commission := v_tier.commission_value;
  ELSIF v_tier.commission_type = 'percentage' THEN
    v_commission := ROUND(v_order.delivery_fee * v_tier.commission_value / 100, 2);
  ELSE
    v_commission := 0;
  END IF;

  -- Update driver
  v_new_balance := v_driver.commission_balance + v_commission;
  
  UPDATE drivers SET
    total_completed_orders = v_driver_order_count,
    commission_balance = v_new_balance,
    is_blocked = CASE 
      WHEN v_settings IS NOT NULL AND v_new_balance >= v_settings.commission_block_threshold THEN true
      ELSE v_driver.is_blocked
    END,
    status = 'online'
  WHERE id = v_order.driver_id;

  -- Create commission transaction (even if 0, for audit)
  INSERT INTO commission_transactions (
    driver_id, order_id, transaction_type, amount, balance_after, tier_snapshot
  ) VALUES (
    v_order.driver_id,
    p_order_id,
    'commission',
    v_commission,
    v_new_balance,
    CASE WHEN v_tier IS NOT NULL THEN to_jsonb(v_tier) ELSE NULL END
  );

  RETURN jsonb_build_object(
    'success', true, 
    'commission', v_commission,
    'new_balance', v_new_balance,
    'is_blocked', CASE 
      WHEN v_settings IS NOT NULL AND v_new_balance >= v_settings.commission_block_threshold THEN true
      ELSE false
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.6 Confirm payment atomically (RPC)
CREATE OR REPLACE FUNCTION confirm_payment(
  p_payment_id UUID,
  p_reviewer_id UUID,
  p_review_notes TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
  v_payment payment_confirmations%ROWTYPE;
  v_driver drivers%ROWTYPE;
  v_new_balance DECIMAL(12, 2);
  v_settings pricing_settings%ROWTYPE;
BEGIN
  -- Lock payment
  SELECT * INTO v_payment FROM payment_confirmations WHERE id = p_payment_id FOR UPDATE;
  
  IF v_payment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment not found');
  END IF;
  
  IF v_payment.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment already processed');
  END IF;

  -- Lock driver
  SELECT * INTO v_driver FROM drivers WHERE id = v_payment.driver_id FOR UPDATE;
  
  IF v_driver IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Driver not found');
  END IF;

  -- Get settings
  SELECT * INTO v_settings FROM pricing_settings WHERE is_active = true LIMIT 1;

  -- Calculate new balance
  v_new_balance := GREATEST(0, v_driver.commission_balance - v_payment.amount);

  -- Update payment
  UPDATE payment_confirmations SET
    status = 'confirmed',
    reviewed_by = p_reviewer_id,
    review_notes = p_review_notes,
    reviewed_at = NOW()
  WHERE id = p_payment_id;

  -- Create payment ledger entry
  INSERT INTO commission_transactions (
    driver_id, transaction_type, amount, balance_after, notes
  ) VALUES (
    v_payment.driver_id,
    'payment',
    v_payment.amount,
    v_new_balance,
    'Payment confirmed: ' || v_payment.reference
  );

  -- Update driver balance and recalculate blocked status
  UPDATE drivers SET
    commission_balance = v_new_balance,
    is_blocked = CASE 
      WHEN v_settings IS NOT NULL AND v_new_balance >= v_settings.commission_block_threshold THEN true
      ELSE false
    END
  WHERE id = v_payment.driver_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'is_blocked', CASE 
      WHEN v_settings IS NOT NULL AND v_new_balance >= v_settings.commission_block_threshold THEN true
      ELSE false
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.7 Handle new user signup — auto-create users row safely
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = CASE WHEN EXCLUDED.email <> '' THEN EXCLUDED.email ELSE public.users.email END,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.users.full_name END,
    role = EXCLUDED.role,
    phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.users.phone END,
    updated_at = NOW();
  
  -- If role is driver, also ensure driver row
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'driver' THEN
    INSERT INTO public.drivers (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never abort auth user creation because of trigger error
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 6. Row Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_distance_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get agent's region
CREATE OR REPLACE FUNCTION get_agent_region_id()
RETURNS UUID AS $$
  SELECT region_id FROM agents WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get driver id for current user
CREATE OR REPLACE FUNCTION get_driver_id()
RETURNS UUID AS $$
  SELECT id FROM drivers WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- USERS ----
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "users_select_admin" ON users;
CREATE POLICY "users_select_admin" ON users FOR SELECT USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "users_select_agent" ON users;
CREATE POLICY "users_select_agent" ON users FOR SELECT USING (get_user_role() = 'agent');
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "users_update_admin" ON users;
CREATE POLICY "users_update_admin" ON users FOR UPDATE USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "users_insert_self" ON users;
CREATE POLICY "users_insert_self" ON users FOR INSERT WITH CHECK (id = auth.uid());

-- ---- REGIONS ----
DROP POLICY IF EXISTS "regions_select_all" ON regions;
CREATE POLICY "regions_select_all" ON regions FOR SELECT USING (true);
DROP POLICY IF EXISTS "regions_insert_admin" ON regions;
CREATE POLICY "regions_insert_admin" ON regions FOR INSERT WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "regions_update_admin" ON regions;
CREATE POLICY "regions_update_admin" ON regions FOR UPDATE USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "regions_delete_admin" ON regions;
CREATE POLICY "regions_delete_admin" ON regions FOR DELETE USING (get_user_role() = 'admin');

-- ---- AGENTS ----
DROP POLICY IF EXISTS "agents_select_own" ON agents;
CREATE POLICY "agents_select_own" ON agents FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "agents_select_admin" ON agents;
CREATE POLICY "agents_select_admin" ON agents FOR SELECT USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "agents_insert_admin" ON agents;
CREATE POLICY "agents_insert_admin" ON agents FOR INSERT WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "agents_update_admin" ON agents;
CREATE POLICY "agents_update_admin" ON agents FOR UPDATE USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "agents_delete_admin" ON agents;
CREATE POLICY "agents_delete_admin" ON agents FOR DELETE USING (get_user_role() = 'admin');

-- ---- DRIVERS ----
DROP POLICY IF EXISTS "drivers_select_own" ON drivers;
CREATE POLICY "drivers_select_own" ON drivers FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "drivers_select_admin" ON drivers;
CREATE POLICY "drivers_select_admin" ON drivers FOR SELECT USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "drivers_select_agent" ON drivers;
CREATE POLICY "drivers_select_agent" ON drivers FOR SELECT 
  USING (get_user_role() = 'agent' AND region_id = get_agent_region_id());
DROP POLICY IF EXISTS "drivers_update_own" ON drivers;
CREATE POLICY "drivers_update_own" ON drivers FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "drivers_update_admin" ON drivers;
CREATE POLICY "drivers_update_admin" ON drivers FOR UPDATE USING (get_user_role() = 'admin');

-- ---- PRICING SETTINGS ----
DROP POLICY IF EXISTS "pricing_select_all" ON pricing_settings;
CREATE POLICY "pricing_select_all" ON pricing_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "pricing_insert_admin" ON pricing_settings;
CREATE POLICY "pricing_insert_admin" ON pricing_settings FOR INSERT WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "pricing_update_admin" ON pricing_settings;
CREATE POLICY "pricing_update_admin" ON pricing_settings FOR UPDATE USING (get_user_role() = 'admin');

-- ---- PRICING DISTANCE TIERS ----
DROP POLICY IF EXISTS "distance_tiers_select_all" ON pricing_distance_tiers;
CREATE POLICY "distance_tiers_select_all" ON pricing_distance_tiers FOR SELECT USING (true);
DROP POLICY IF EXISTS "distance_tiers_insert_admin" ON pricing_distance_tiers;
CREATE POLICY "distance_tiers_insert_admin" ON pricing_distance_tiers FOR INSERT WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "distance_tiers_update_admin" ON pricing_distance_tiers;
CREATE POLICY "distance_tiers_update_admin" ON pricing_distance_tiers FOR UPDATE USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "distance_tiers_delete_admin" ON pricing_distance_tiers;
CREATE POLICY "distance_tiers_delete_admin" ON pricing_distance_tiers FOR DELETE USING (get_user_role() = 'admin');

-- ---- COMMISSION TIERS ----
DROP POLICY IF EXISTS "commission_tiers_select_all" ON commission_tiers;
CREATE POLICY "commission_tiers_select_all" ON commission_tiers FOR SELECT USING (true);
DROP POLICY IF EXISTS "commission_tiers_insert_admin" ON commission_tiers;
CREATE POLICY "commission_tiers_insert_admin" ON commission_tiers FOR INSERT WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "commission_tiers_update_admin" ON commission_tiers;
CREATE POLICY "commission_tiers_update_admin" ON commission_tiers FOR UPDATE USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "commission_tiers_delete_admin" ON commission_tiers;
CREATE POLICY "commission_tiers_delete_admin" ON commission_tiers FOR DELETE USING (get_user_role() = 'admin');

-- ---- ORDERS ----
DROP POLICY IF EXISTS "orders_select_own_customer" ON orders;
CREATE POLICY "orders_select_own_customer" ON orders FOR SELECT 
  USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "orders_select_own_driver" ON orders;
CREATE POLICY "orders_select_own_driver" ON orders FOR SELECT 
  USING (driver_id = get_driver_id());
DROP POLICY IF EXISTS "orders_select_pending_driver" ON orders;
CREATE POLICY "orders_select_pending_driver" ON orders FOR SELECT
  USING (get_user_role() = 'driver' AND status = 'pending');
DROP POLICY IF EXISTS "orders_select_admin" ON orders;
CREATE POLICY "orders_select_admin" ON orders FOR SELECT 
  USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "orders_select_agent" ON orders;
CREATE POLICY "orders_select_agent" ON orders FOR SELECT
  USING (get_user_role() = 'agent');
-- Guest orders are inserted via service_role key (bypasses RLS)
-- Logged-in customers insert their own orders
DROP POLICY IF EXISTS "orders_insert_customer" ON orders;
CREATE POLICY "orders_insert_customer" ON orders FOR INSERT 
  WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "orders_update_driver" ON orders;
CREATE POLICY "orders_update_driver" ON orders FOR UPDATE
  USING (driver_id = get_driver_id() AND status IN ('accepted', 'in_progress'));
DROP POLICY IF EXISTS "orders_update_admin" ON orders;
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE 
  USING (get_user_role() = 'admin');

-- ---- ORDER ITEMS ----
DROP POLICY IF EXISTS "order_items_select_related" ON order_items;
CREATE POLICY "order_items_select_related" ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        orders.customer_id = auth.uid() 
        OR orders.driver_id = get_driver_id()
        OR (get_user_role() = 'driver' AND orders.status = 'pending')
        OR get_user_role() IN ('admin', 'agent')
      )
    )
  );
DROP POLICY IF EXISTS "order_items_insert_customer" ON order_items;
CREATE POLICY "order_items_insert_customer" ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.customer_id = auth.uid()
      AND orders.status = 'pending'
    )
  );

-- ---- ORDER STATUS HISTORY ----
DROP POLICY IF EXISTS "status_history_select" ON order_status_history;
CREATE POLICY "status_history_select" ON order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_status_history.order_id 
      AND (
        orders.customer_id = auth.uid() 
        OR orders.driver_id = get_driver_id()
        OR get_user_role() IN ('admin', 'agent')
      )
    )
  );

-- ---- COMMISSION TRANSACTIONS ----
DROP POLICY IF EXISTS "commission_tx_select_own_driver" ON commission_transactions;
CREATE POLICY "commission_tx_select_own_driver" ON commission_transactions FOR SELECT
  USING (driver_id = get_driver_id());
DROP POLICY IF EXISTS "commission_tx_select_admin" ON commission_transactions;
CREATE POLICY "commission_tx_select_admin" ON commission_transactions FOR SELECT
  USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "commission_tx_select_agent" ON commission_transactions;
CREATE POLICY "commission_tx_select_agent" ON commission_transactions FOR SELECT
  USING (get_user_role() = 'agent');

-- ---- PAYMENT CONFIRMATIONS ----
DROP POLICY IF EXISTS "payments_select_own_driver" ON payment_confirmations;
CREATE POLICY "payments_select_own_driver" ON payment_confirmations FOR SELECT
  USING (driver_id = get_driver_id());
DROP POLICY IF EXISTS "payments_select_admin" ON payment_confirmations;
CREATE POLICY "payments_select_admin" ON payment_confirmations FOR SELECT
  USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "payments_select_agent" ON payment_confirmations;
CREATE POLICY "payments_select_agent" ON payment_confirmations FOR SELECT
  USING (
    get_user_role() = 'agent' AND 
    EXISTS (
      SELECT 1 FROM drivers 
      WHERE drivers.id = payment_confirmations.driver_id 
      AND drivers.region_id = get_agent_region_id()
    )
  );
DROP POLICY IF EXISTS "payments_insert_driver" ON payment_confirmations;
CREATE POLICY "payments_insert_driver" ON payment_confirmations FOR INSERT
  WITH CHECK (driver_id = get_driver_id());

-- ---- AUDIT LOGS ----
DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;
CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT
  USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "audit_logs_insert_system" ON audit_logs;
CREATE POLICY "audit_logs_insert_system" ON audit_logs FOR INSERT
  WITH CHECK (true); -- Inserts are done via SECURITY DEFINER functions

-- ---- DRIVER APPLICATIONS ----
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_apps_insert_public" ON driver_applications;
CREATE POLICY "driver_apps_insert_public" ON driver_applications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "driver_apps_select_admin" ON driver_applications;
CREATE POLICY "driver_apps_select_admin" ON driver_applications FOR SELECT USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "driver_apps_update_admin" ON driver_applications;
CREATE POLICY "driver_apps_update_admin" ON driver_applications FOR UPDATE USING (get_user_role() = 'admin');

-- ---- NOTIFICATIONS ----
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (recipient_user_id = auth.uid() OR get_user_role() = 'admin');
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (recipient_user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_admin_all" ON notifications;
CREATE POLICY "notifications_admin_all" ON notifications FOR ALL USING (get_user_role() = 'admin');

-- ---- PUSH SUBSCRIPTIONS ----
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_subs_user_all" ON push_subscriptions;
CREATE POLICY "push_subs_user_all" ON push_subscriptions FOR ALL USING (user_id = auth.uid() OR get_user_role() = 'admin');

-- ---- COMPLAINTS ----
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "complaints_select_customer" ON complaints;
CREATE POLICY "complaints_select_customer" ON complaints FOR SELECT USING (customer_id = auth.uid() OR get_user_role() IN ('admin', 'agent'));
DROP POLICY IF EXISTS "complaints_insert_customer" ON complaints;
CREATE POLICY "complaints_insert_customer" ON complaints FOR INSERT WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "complaints_agent_update" ON complaints;
CREATE POLICY "complaints_agent_update" ON complaints FOR UPDATE USING (get_user_role() IN ('admin', 'agent'));

-- ---- PAYMENT METHODS ----
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_methods_select_public" ON payment_methods;
CREATE POLICY "payment_methods_select_public" ON payment_methods FOR SELECT USING (true);
DROP POLICY IF EXISTS "payment_methods_admin_all" ON payment_methods;
CREATE POLICY "payment_methods_admin_all" ON payment_methods FOR ALL USING (get_user_role() = 'admin');

-- ---- AGENT PAYOUTS ----
ALTER TABLE agent_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_payouts_select_agent" ON agent_payouts;
CREATE POLICY "agent_payouts_select_agent" ON agent_payouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_payouts.agent_id AND agents.user_id = auth.uid()) OR get_user_role() = 'admin'
);
DROP POLICY IF EXISTS "agent_payouts_admin_all" ON agent_payouts;
CREATE POLICY "agent_payouts_admin_all" ON agent_payouts FOR ALL USING (get_user_role() = 'admin');

-- ============================================================
-- 7. Chat Messages (Driver ↔ Customer messaging)
-- ============================================================

-- 7.1 Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  is_saved_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  saved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours')
);

-- 7.2 Chat Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_order_id ON chat_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_expires_at ON chat_messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- 7.3 Chat RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Customer & Driver of the order can read chat messages
DROP POLICY IF EXISTS "chat_select_order_participants" ON chat_messages;
CREATE POLICY "chat_select_order_participants" ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = chat_messages.order_id
      AND (
        orders.customer_id = auth.uid()
        OR orders.driver_id = get_driver_id()
      )
    )
  );

-- Admin can read ALL chat messages
DROP POLICY IF EXISTS "chat_select_admin" ON chat_messages;
CREATE POLICY "chat_select_admin" ON chat_messages FOR SELECT
  USING (get_user_role() = 'admin');

-- Agent can read chat messages in their region
DROP POLICY IF EXISTS "chat_select_agent" ON chat_messages;
CREATE POLICY "chat_select_agent" ON chat_messages FOR SELECT
  USING (
    get_user_role() = 'agent' AND
    EXISTS (
      SELECT 1 FROM orders
      JOIN drivers ON drivers.id = orders.driver_id
      WHERE orders.id = chat_messages.order_id
      AND drivers.region_id = get_agent_region_id()
    )
  );

-- Customer & Driver of accepted/in_progress order can send messages
DROP POLICY IF EXISTS "chat_insert_order_participants" ON chat_messages;
CREATE POLICY "chat_insert_order_participants" ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = chat_messages.order_id
      AND orders.status IN ('accepted', 'in_progress')
      AND (
        orders.customer_id = auth.uid()
        OR orders.driver_id = get_driver_id()
      )
    )
  );

-- Admin can update (save messages from deletion)
DROP POLICY IF EXISTS "chat_update_admin" ON chat_messages;
CREATE POLICY "chat_update_admin" ON chat_messages FOR UPDATE
  USING (get_user_role() = 'admin');

-- 7.4 Cleanup expired chat messages function
-- Call this via Supabase cron or Edge Function every hour
CREATE OR REPLACE FUNCTION cleanup_expired_chat_messages()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired messages that admin hasn't saved
  DELETE FROM chat_messages
  WHERE expires_at < NOW()
    AND is_saved_by_admin = FALSE;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log the cleanup
  INSERT INTO audit_logs (action, entity_type, new_data)
  VALUES (
    'chat_cleanup',
    'chat_messages',
    jsonb_build_object('deleted_count', v_deleted_count, 'cleaned_at', NOW())
  );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7.5 Supabase Storage Buckets & Policies
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('chat-images', 'chat-images', true),
  ('payment-proofs', 'payment-proofs', false),
  ('avatars', 'avatars', true),
  ('id-documents', 'id-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read for id documents
DO $$ BEGIN
  CREATE POLICY "Public Read for ID Documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'id-documents');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow uploads to id documents
DO $$ BEGIN
  CREATE POLICY "Allow ID Documents Uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'id-documents');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow public read for chat images
DO $$ BEGIN
  CREATE POLICY "Public Read for Chat Images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow uploads to chat images
DO $$ BEGIN
  CREATE POLICY "Allow Chat Image Uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow public read for avatars
DO $$ BEGIN
  CREATE POLICY "Public Read for Avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow avatar uploads
DO $$ BEGIN
  CREATE POLICY "Allow Avatar Uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow payment proofs upload (drivers)
DO $$ BEGIN
  CREATE POLICY "Allow Payment Proof Uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow payment proofs read (admin, agents, owner)
DO $$ BEGIN
  CREATE POLICY "Allow Payment Proof Read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 8. Seed Data (Safe Defaults)
-- ============================================================

-- Default pricing settings
INSERT INTO pricing_settings (base_delivery_fee, base_distance_km, additional_km_fee, default_search_radius_km, radius_expansion_step_km, max_search_radius_km, commission_block_threshold, currency)
VALUES (25.00, 4.00, 3.00, 2.00, 2.00, 10.00, 200.00, 'EGP')
ON CONFLICT DO NOTHING;

-- Default distance tiers
INSERT INTO pricing_distance_tiers (min_distance_km, max_distance_km, additional_fee, sort_order) VALUES
  (0, 2, 0, 1),
  (2, 4, 5, 2),
  (4, 6, 10, 3),
  (6, 8, 15, 4),
  (8, 10, 20, 5)
ON CONFLICT DO NOTHING;

-- Default commission tiers
INSERT INTO commission_tiers (min_orders, max_orders, commission_type, commission_value, sort_order) VALUES
  (1, 3, 'fixed', 0, 1),
  (4, 10, 'fixed', 4, 2),
  (11, NULL, 'percentage', 10, 3)
ON CONFLICT DO NOTHING;

-- Default region
INSERT INTO regions (name, name_ar, description) VALUES
  ('Default Region', 'المنطقة الافتراضية', 'المنطقة الرئيسية')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. Admin User Setup
-- ============================================================
-- Promote existing auth user to admin role.
-- The user must already exist in auth.users (i.e. have logged in once).
-- This upserts into public.users and sets role = 'admin'.
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  '210d0538-6fcb-4a59-b343-4d8320175aa5',
  'admin@engz.shop',      -- update if different
  'مدير النظام',
  'admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_active = true;
