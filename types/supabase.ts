export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_payout_requests: {
        Row: {
          admin_notes: string | null
          agent_id: string
          amount: number
          created_at: string
          id: string
          payout_phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          agent_id: string
          amount: number
          created_at?: string
          id?: string
          payout_phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          agent_id?: string
          amount?: number
          created_at?: string
          id?: string
          payout_phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_payout_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_payout_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_payouts: {
        Row: {
          agent_id: string
          amount: number
          created_at: string
          created_by: string
          id: string
          notes: string
          payment_method: string
          reference: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          agent_id: string
          amount: number
          created_at?: string
          created_by: string
          id?: string
          notes?: string
          payment_method?: string
          reference?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string
          amount?: number
          created_at?: string
          created_by?: string
          id?: string
          notes?: string
          payment_method?: string
          reference?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_payouts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_payouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_payouts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          commission_balance: number
          created_at: string
          id: string
          is_active: boolean
          payout_phone: string | null
          region_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_balance?: number
          created_at?: string
          id?: string
          is_active?: boolean
          payout_phone?: string | null
          region_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_balance?: number
          created_at?: string
          id?: string
          is_active?: boolean
          payout_phone?: string | null
          region_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          image_url: string | null
          is_saved_by_admin: boolean
          message_text: string | null
          order_id: string
          saved_by: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          is_saved_by_admin?: boolean
          message_text?: string | null
          order_id: string
          saved_by?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          is_saved_by_admin?: boolean
          message_text?: string | null
          order_id?: string
          saved_by?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_saved_by_fkey"
            columns: ["saved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_tiers: {
        Row: {
          commission_type: Database["public"]["Enums"]["commission_type"]
          commission_value: number
          created_at: string
          id: string
          is_active: boolean
          max_orders: number | null
          min_orders: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          commission_type?: Database["public"]["Enums"]["commission_type"]
          commission_value?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_orders?: number | null
          min_orders: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          commission_type?: Database["public"]["Enums"]["commission_type"]
          commission_value?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_orders?: number | null
          min_orders?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      commission_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          driver_id: string
          id: string
          notes: string | null
          order_id: string | null
          tier_snapshot: Json | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          driver_id: string
          id?: string
          notes?: string | null
          order_id?: string | null
          tier_snapshot?: Json | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          driver_id?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          tier_snapshot?: Json | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "commission_transactions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          admin_action: string | null
          admin_action_at: string | null
          agent_action: string | null
          agent_action_at: string | null
          agent_id: string | null
          category: string
          created_at: string
          customer_id: string
          description: string
          driver_id: string | null
          escalated_at: string | null
          escalated_by: string | null
          id: string
          order_id: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_action?: string | null
          admin_action_at?: string | null
          agent_action?: string | null
          agent_action_at?: string | null
          agent_id?: string | null
          category?: string
          created_at?: string
          customer_id: string
          description: string
          driver_id?: string | null
          escalated_at?: string | null
          escalated_by?: string | null
          id?: string
          order_id: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_action?: string | null
          admin_action_at?: string | null
          agent_action?: string | null
          agent_action_at?: string | null
          agent_id?: string | null
          category?: string
          created_at?: string
          customer_id?: string
          description?: string
          driver_id?: string | null
          escalated_at?: string | null
          escalated_by?: string | null
          id?: string
          order_id?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_escalated_by_fkey"
            columns: ["escalated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_applications: {
        Row: {
          address: string
          age: number
          created_at: string
          created_user_id: string | null
          full_name: string
          id: string
          id_card_back_metadata: Json | null
          id_card_back_url: string
          id_card_front_metadata: Json | null
          id_card_front_url: string
          personal_photo_url: string | null
          phone: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          address: string
          age: number
          created_at?: string
          created_user_id?: string | null
          full_name: string
          id?: string
          id_card_back_metadata?: Json | null
          id_card_back_url: string
          id_card_front_metadata?: Json | null
          id_card_front_url: string
          personal_photo_url?: string | null
          phone: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          address?: string
          age?: number
          created_at?: string
          created_user_id?: string | null
          full_name?: string
          id?: string
          id_card_back_metadata?: Json | null
          id_card_back_url?: string
          id_card_front_metadata?: Json | null
          id_card_front_url?: string
          personal_photo_url?: string | null
          phone?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_applications_created_user_id_fkey"
            columns: ["created_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          address: string | null
          age: number | null
          agent_id: string | null
          commission_balance: number
          created_at: string
          current_lat: number | null
          current_lng: number | null
          id: string
          id_card_back_url: string | null
          id_card_front_url: string | null
          is_active: boolean
          is_blocked: boolean
          personal_photo_url: string | null
          region_id: string | null
          registration_code: string | null
          status: Database["public"]["Enums"]["driver_status"]
          total_completed_orders: number
          updated_at: string
          user_id: string
          vehicle_type: string | null
          verification_complete: boolean
          verification_id_card_back_url: string
          verification_id_card_front_url: string
          verification_personal_photo_url: string
          verification_required: boolean
        }
        Insert: {
          address?: string | null
          age?: number | null
          agent_id?: string | null
          commission_balance?: number
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          is_active?: boolean
          is_blocked?: boolean
          personal_photo_url?: string | null
          region_id?: string | null
          registration_code?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_completed_orders?: number
          updated_at?: string
          user_id: string
          vehicle_type?: string | null
          verification_complete?: boolean
          verification_id_card_back_url?: string
          verification_id_card_front_url?: string
          verification_personal_photo_url?: string
          verification_required?: boolean
        }
        Update: {
          address?: string | null
          age?: number | null
          agent_id?: string | null
          commission_balance?: number
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          is_active?: boolean
          is_blocked?: boolean
          personal_photo_url?: string | null
          region_id?: string | null
          registration_code?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_completed_orders?: number
          updated_at?: string
          user_id?: string
          vehicle_type?: string | null
          verification_complete?: boolean
          verification_id_card_back_url?: string
          verification_id_card_front_url?: string
          verification_personal_photo_url?: string
          verification_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "drivers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json
          id: string
          is_read: boolean
          recipient_role: Database["public"]["Enums"]["user_role"] | null
          recipient_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          recipient_role?: Database["public"]["Enums"]["user_role"] | null
          recipient_user_id?: string | null
          title: string
          type?: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          recipient_role?: Database["public"]["Enums"]["user_role"] | null
          recipient_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          notes: string | null
          order_id: string
          quantity: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          order_id: string
          quantity?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          created_at: string
          customer_id: string
          customer_notes: string | null
          customer_rating: number | null
          customer_review: string | null
          delivered_at: string | null
          delivery_fee: number
          driver_id: string | null
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          id: string
          order_number: number
          picked_up_at: string | null
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          pricing_snapshot: Json | null
          rated_at: string | null
          route_distance_km: number | null
          route_duration_minutes: number | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          customer_rating?: number | null
          customer_review?: string | null
          delivered_at?: string | null
          delivery_fee?: number
          driver_id?: string | null
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          id?: string
          order_number?: number
          picked_up_at?: string | null
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          pricing_snapshot?: Json | null
          rated_at?: string | null
          route_distance_km?: number | null
          route_duration_minutes?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          customer_rating?: number | null
          customer_review?: string | null
          delivered_at?: string | null
          delivery_fee?: number
          driver_id?: string | null
          dropoff_address?: string
          dropoff_lat?: number
          dropoff_lng?: number
          id?: string
          order_number?: number
          picked_up_at?: string | null
          pickup_address?: string
          pickup_lat?: number
          pickup_lng?: number
          pricing_snapshot?: Json | null
          rated_at?: string | null
          route_distance_km?: number | null
          route_duration_minutes?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_confirmations: {
        Row: {
          amount: number
          created_at: string
          driver_id: string
          id: string
          notes: string | null
          payment_method: string
          proof_image_url: string | null
          reference: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          driver_id: string
          id?: string
          notes?: string | null
          payment_method?: string
          proof_image_url?: string | null
          reference?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          driver_id?: string
          id?: string
          notes?: string | null
          payment_method?: string
          proof_image_url?: string | null
          reference?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_confirmations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_confirmations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_name: string
          account_number: string
          created_at: string
          id: string
          instructions: string
          is_active: boolean
          method_key: string
          method_name: string
          updated_at: string
        }
        Insert: {
          account_name?: string
          account_number?: string
          created_at?: string
          id?: string
          instructions?: string
          is_active?: boolean
          method_key: string
          method_name: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          created_at?: string
          id?: string
          instructions?: string
          is_active?: boolean
          method_key?: string
          method_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_distance_tiers: {
        Row: {
          additional_fee: number
          created_at: string
          id: string
          is_active: boolean
          max_distance_km: number
          min_distance_km: number
          sort_order: number
        }
        Insert: {
          additional_fee?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_distance_km: number
          min_distance_km: number
          sort_order?: number
        }
        Update: {
          additional_fee?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_distance_km?: number
          min_distance_km?: number
          sort_order?: number
        }
        Relationships: []
      }
      pricing_settings: {
        Row: {
          additional_fee_per_km: number
          additional_km_fee: number
          agent_share_per_order: number
          base_delivery_fee: number
          base_distance_km: number
          commission_block_threshold: number
          created_at: string
          currency: string
          default_search_radius_km: number
          driver_commission_per_order: number
          free_orders: number
          id: string
          is_active: boolean
          max_search_radius_km: number
          platform_share_per_agent_order: number
          radius_expansion_step_km: number
          updated_at: string
        }
        Insert: {
          additional_fee_per_km?: number
          additional_km_fee?: number
          agent_share_per_order?: number
          base_delivery_fee?: number
          base_distance_km?: number
          commission_block_threshold?: number
          created_at?: string
          currency?: string
          default_search_radius_km?: number
          driver_commission_per_order?: number
          free_orders?: number
          id?: string
          is_active?: boolean
          max_search_radius_km?: number
          platform_share_per_agent_order?: number
          radius_expansion_step_km?: number
          updated_at?: string
        }
        Update: {
          additional_fee_per_km?: number
          additional_km_fee?: number
          agent_share_per_order?: number
          base_delivery_fee?: number
          base_distance_km?: number
          commission_block_threshold?: number
          created_at?: string
          currency?: string
          default_search_radius_km?: number
          driver_commission_per_order?: number
          free_orders?: number
          id?: string
          is_active?: boolean
          max_search_radius_km?: number
          platform_share_per_agent_order?: number
          radius_expansion_step_km?: number
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instagram: string | null
          is_active: boolean
          name: string
          name_ar: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          name: string
          name_ar?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          name?: string
          name_ar?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_order: {
        Args: { p_driver_id: string; p_order_id: string }
        Returns: Json
      }
      cleanup_expired_chat_messages: { Args: never; Returns: number }
      complete_order_with_commission: {
        Args: { p_order_id: string }
        Returns: Json
      }
      confirm_payment: {
        Args: {
          p_payment_id: string
          p_review_notes?: string
          p_reviewer_id: string
        }
        Returns: Json
      }
      get_agent_region_id: { Args: never; Returns: string }
      get_driver_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      commission_type: "fixed" | "percentage"
      driver_status: "online" | "offline" | "busy"
      order_status:
        | "pending"
        | "accepted"
        | "in_progress"
        | "delivered"
        | "cancelled"
      payment_status: "pending" | "confirmed" | "rejected"
      transaction_type: "commission" | "payment"
      user_role: "customer" | "driver" | "agent" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      commission_type: ["fixed", "percentage"],
      driver_status: ["online", "offline", "busy"],
      order_status: [
        "pending",
        "accepted",
        "in_progress",
        "delivered",
        "cancelled",
      ],
      payment_status: ["pending", "confirmed", "rejected"],
      transaction_type: ["commission", "payment"],
      user_role: ["customer", "driver", "agent", "admin"],
    },
  },
} as const
