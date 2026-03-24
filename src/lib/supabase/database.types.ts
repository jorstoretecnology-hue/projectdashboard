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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          automation_rule_id: string
          domain_event_id: string
          error_message: string | null
          executed_at: string | null
          id: string
          provider_response: Json | null
          status: string
          tenant_id: string
        }
        Insert: {
          automation_rule_id: string
          domain_event_id: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          provider_response?: Json | null
          status: string
          tenant_id: string
        }
        Update: {
          automation_rule_id?: string
          domain_event_id?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          provider_response?: Json | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_domain_event_id_fkey"
            columns: ["domain_event_id"]
            isOneToOne: false
            referencedRelation: "domain_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          condition_json: Json | null
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          action_config: Json
          action_type: string
          condition_json?: Json | null
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          action_config?: Json
          action_type?: string
          condition_json?: Json | null
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      customers: {
        Row: {
          city: string | null
          company_name: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          first_name: string | null
          id: string
          identification_number: string | null
          identification_type: string | null
          last_name: string | null
          location_id: string | null
          metadata: Json | null
          name: string | null
          phone: string | null
          tax_id: string | null
          tenant_id: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          identification_number?: string | null
          identification_type?: string | null
          last_name?: string | null
          location_id?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          tax_id?: string | null
          tenant_id: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          identification_number?: string | null
          identification_type?: string | null
          last_name?: string | null
          location_id?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          tax_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      domain_events: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          payload: Json | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          payload?: Json | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          payload?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      industries: {
        Row: {
          created_at: string | null
          description: string | null
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      industry_pricing: {
        Row: {
          created_at: string | null
          id: string
          industry_type: string
          plan_slug: string
          price_monthly: number
          price_yearly: number
          pricing_tier: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry_type: string
          plan_slug: string
          price_monthly: number
          price_yearly: number
          pricing_tier: string
        }
        Update: {
          created_at?: string | null
          id?: string
          industry_type?: string
          plan_slug?: string
          price_monthly?: number
          price_yearly?: number
          pricing_tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "industry_pricing_plan_slug_fkey"
            columns: ["plan_slug"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["slug"]
          },
        ]
      }
      industry_specialties: {
        Row: {
          created_at: string | null
          description: string | null
          extra_fields: Json | null
          icon: string | null
          id: string
          industry_slug: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          extra_fields?: Json | null
          icon?: string | null
          id?: string
          industry_slug: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          extra_fields?: Json | null
          icon?: string | null
          id?: string
          industry_slug?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "industry_specialties_industry_slug_fkey"
            columns: ["industry_slug"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["slug"]
          },
        ]
      }
      inventory_items: {
        Row: {
          cost_price: number | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          images: string[] | null
          location_id: string | null
          name: string
          price: number
          sku: string | null
          stock: number
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          cost_price?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          location_id?: string | null
          name: string
          price?: number
          sku?: string | null
          stock?: number
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          cost_price?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          location_id?: string | null
          name?: string
          price?: number
          sku?: string | null
          stock?: number
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          reason: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          quantity: number
          reason?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inv_movements_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inv_movements_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inv_movements_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      invitations: {
        Row: {
          app_role: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          status: string | null
          tenant_id: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          app_role: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          status?: string | null
          tenant_id?: string | null
          token?: string
          updated_at?: string | null
        }
        Update: {
          app_role?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          status?: string | null
          tenant_id?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          is_main: boolean | null
          name: string
          opening_hours: Json | null
          phone: string | null
          settings: Json | null
          tenant_id: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_main?: boolean | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          settings?: Json | null
          tenant_id: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_main?: boolean | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          settings?: Json | null
          tenant_id?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      modules_catalog: {
        Row: {
          compatible_types: string[] | null
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          name: string
          slug: string
          version: string | null
        }
        Insert: {
          compatible_types?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          slug: string
          version?: string | null
        }
        Update: {
          compatible_types?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          slug?: string
          version?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          channel: string
          created_at: string | null
          event_type: string
          id: string
          is_active: boolean | null
          template_body: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          channel?: string
          created_at?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          template_body: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          template_body?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          provider: string | null
          provider_payment_id: string | null
          refunded_at: string | null
          status: string
          subscription_id: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          refunded_at?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          refunded_at?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      plan_modules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          module_slug: string
          plan_slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          module_slug: string
          plan_slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          module_slug?: string
          plan_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_modules_module_slug_fkey"
            columns: ["module_slug"]
            isOneToOne: false
            referencedRelation: "modules_catalog"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "plan_modules_plan_slug_fkey"
            columns: ["plan_slug"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["slug"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          included_modules: string[] | null
          is_active: boolean | null
          max_customers: number | null
          max_inventory: number | null
          max_locations: number | null
          max_users: number | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          included_modules?: string[] | null
          is_active?: boolean | null
          max_customers?: number | null
          max_inventory?: number | null
          max_locations?: number | null
          max_users?: number | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          included_modules?: string[] | null
          is_active?: boolean | null
          max_customers?: number | null
          max_inventory?: number | null
          max_locations?: number | null
          max_users?: number | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          image: string | null
          industry_type: string
          is_blocked: boolean | null
          location_id: string | null
          metadata: Json | null
          name: string
          price: number
          sku: string | null
          state: string | null
          stock: number | null
          tax_rate: number | null
          tax_type: string | null
          tenant_id: string
          threshold_critical: number | null
          threshold_low: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          industry_type: string
          is_blocked?: boolean | null
          location_id?: string | null
          metadata?: Json | null
          name: string
          price: number
          sku?: string | null
          state?: string | null
          stock?: number | null
          tax_rate?: number | null
          tax_type?: string | null
          tenant_id: string
          threshold_critical?: number | null
          threshold_low?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          industry_type?: string
          is_blocked?: boolean | null
          location_id?: string | null
          metadata?: Json | null
          name?: string
          price?: number
          sku?: string | null
          state?: string | null
          stock?: number | null
          tax_rate?: number | null
          tax_type?: string | null
          tenant_id?: string
          threshold_critical?: number | null
          threshold_low?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_industry_type_fkey"
            columns: ["industry_type"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "products_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          app_role: string | null
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          full_name: string | null
          id: string
          last_login: string | null
          role: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          app_role?: string | null
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_login?: string | null
          role?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          app_role?: string | null
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          role?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          location_id: string | null
          state: string
          supplier_id: string
          tenant_id: string
          total: number | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          state?: string
          supplier_id: string
          tenant_id: string
          total?: number | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          state?: string
          supplier_id?: string
          tenant_id?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          product_id: string
          product_name: string | null
          product_sku: string | null
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          product_id: string
          product_name?: string | null
          product_sku?: string | null
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          product_id?: string
          product_name?: string | null
          product_sku?: string | null
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          discount: number | null
          id: string
          location_id: string | null
          metadata: Json | null
          notes: string | null
          payment_method: string | null
          state: string
          subtotal: number | null
          tax: number | null
          tenant_id: string
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          discount?: number | null
          id?: string
          location_id?: string | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          state?: string
          subtotal?: number | null
          tax?: number | null
          tenant_id: string
          total?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          discount?: number | null
          id?: string
          location_id?: string | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          state?: string
          subtotal?: number | null
          tax?: number | null
          tenant_id?: string
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "sales_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          base_price: number | null
          created_at: string | null
          id: string
          location_id: string | null
          name: string
          state: string
          tenant_id: string
        }
        Insert: {
          base_price?: number | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          name: string
          state?: string
          tenant_id: string
        }
        Update: {
          base_price?: number | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          name?: string
          state?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      state_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          duration_minutes: number | null
          entity_id: string
          entity_type: string
          from_state: string | null
          id: string
          metadata: Json | null
          tenant_id: string
          to_state: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          duration_minutes?: number | null
          entity_id: string
          entity_type: string
          from_state?: string | null
          id?: string
          metadata?: Json | null
          tenant_id: string
          to_state: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          duration_minutes?: number | null
          entity_id?: string
          entity_type?: string
          from_state?: string | null
          id?: string
          metadata?: Json | null
          tenant_id?: string
          to_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "state_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_slug: string
          provider: string | null
          provider_customer_id: string | null
          provider_sub_id: string | null
          status: string
          tenant_id: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_slug: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_sub_id?: string | null
          status?: string
          tenant_id: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_slug?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_sub_id?: string | null
          status?: string
          tenant_id?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_slug_fkey"
            columns: ["plan_slug"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_modules: {
        Row: {
          activated_at: string | null
          config: Json | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          module_slug: string
          tenant_id: string
        }
        Insert: {
          activated_at?: string | null
          config?: Json | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          module_slug: string
          tenant_id: string
        }
        Update: {
          activated_at?: string | null
          config?: Json | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          module_slug?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_modules_module_slug_fkey"
            columns: ["module_slug"]
            isOneToOne: false
            referencedRelation: "modules_catalog"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "tenant_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_quotas: {
        Row: {
          current_usage: number
          max_limit: number
          resource_key: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          current_usage?: number
          max_limit?: number
          resource_key: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          current_usage?: number
          max_limit?: number
          resource_key?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_quotas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_quotas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_tags: {
        Row: {
          created_at: string | null
          id: string
          tag: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tag?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenants: {
        Row: {
          active_modules: string[] | null
          branding: Json | null
          created_at: string | null
          custom_domain: string | null
          id: string
          industry_type: string
          is_active: boolean | null
          logo_url: string | null
          max_users: number | null
          name: string
          plan: string
          settings: Json | null
          specialty_slug: string | null
          updated_at: string | null
        }
        Insert: {
          active_modules?: string[] | null
          branding?: Json | null
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          industry_type: string
          is_active?: boolean | null
          logo_url?: string | null
          max_users?: number | null
          name: string
          plan?: string
          settings?: Json | null
          specialty_slug?: string | null
          updated_at?: string | null
        }
        Update: {
          active_modules?: string[] | null
          branding?: Json | null
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          industry_type?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_users?: number | null
          name?: string
          plan?: string
          settings?: Json | null
          specialty_slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenant_specialty"
            columns: ["industry_type", "specialty_slug"]
            isOneToOne: false
            referencedRelation: "industry_specialties"
            referencedColumns: ["industry_slug", "slug"]
          },
          {
            foreignKeyName: "tenants_industry_type_fkey"
            columns: ["industry_type"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "tenants_plan_fkey"
            columns: ["plan"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_groups: {
        Row: {
          assigned_at: string | null
          group_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          group_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "security_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_locations: {
        Row: {
          accepted_at: string | null
          can_read_sibling_locations: boolean | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          location_id: string
          role: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          can_read_sibling_locations?: boolean | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          location_id: string
          role?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          can_read_sibling_locations?: boolean | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          location_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          id: string
          location_id: string | null
          model: string | null
          plate: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          model?: string | null
          plate: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          model?: string | null
          plate?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      webhook_debug_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: number
          response_content: string | null
          status_code: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          response_content?: string | null
          status_code?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          response_content?: string | null
          status_code?: string | null
          url?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json
          request_id: number | null
          response_body: string | null
          response_status_code: number | null
          status: string | null
          subscription_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload: Json
          request_id?: number | null
          response_body?: string | null
          response_status_code?: number | null
          status?: string | null
          subscription_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          request_id?: number | null
          response_body?: string | null
          response_status_code?: number | null
          status?: string | null
          subscription_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "webhook_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      webhook_subscriptions: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          is_active: boolean | null
          secret: string | null
          tenant_id: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          secret?: string | null
          tenant_id: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          secret?: string | null
          tenant_id?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
    }
    Views: {
      v_dashboard_stats: {
        Row: {
          active_service_orders: number | null
          avg_lead_time_minutes: number | null
          daily_sales_count: number | null
          daily_sales_total: number | null
          tenant_id: string | null
        }
        Insert: {
          active_service_orders?: never
          avg_lead_time_minutes?: never
          daily_sales_count?: never
          daily_sales_total?: never
          tenant_id?: string | null
        }
        Update: {
          active_service_orders?: never
          avg_lead_time_minutes?: never
          daily_sales_count?: never
          daily_sales_total?: never
          tenant_id?: string | null
        }
        Relationships: []
      }
      view_saas_health: {
        Row: {
          last_activity: string | null
          plan: string | null
          quota_alerts: number | null
          tenant_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_fkey"
            columns: ["plan"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["slug"]
          },
        ]
      }
    }
    Functions: {
      activate_modules_for_tenant: {
        Args: { p_plan_slug?: string; p_tenant_id: string }
        Returns: Json
      }
      build_domain_event_payload: {
        Args: {
          created_at: string
          entity_id: string
          entity_type: string
          event_id: string
          event_type: string
          payload: Json
          tenant_id: string
        }
        Returns: Json
      }
      cancel_sale_transaction: {
        Args: { p_sale_id: string; p_user_id: string }
        Returns: Json
      }
      complete_service_transaction: {
        Args: {
          p_new_state: string
          p_service_id: string
          p_tenant_id: string
          p_user_id: string
        }
        Returns: Json
      }
      create_location: {
        Args: {
          p_address?: string
          p_city?: string
          p_name: string
          p_phone?: string
        }
        Returns: string
      }
      create_purchase_transaction: {
        Args: {
          p_delivery_date: string
          p_items: Json
          p_notes: string
          p_supplier_id: string
          p_tenant_id: string
          p_user_id: string
        }
        Returns: Json
      }
      create_sale_transaction:
        | {
            Args: {
              p_customer_id: string
              p_items: Json
              p_tenant_id: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_customer_id: string
              p_discount: number
              p_items: Json
              p_metadata?: Json
              p_notes: string
              p_payment_method: string
              p_tax_rate: number
              p_tenant_id: string
              p_user_id: string
            }
            Returns: Json
          }
      get_current_user_app_role: { Args: never; Returns: string }
      get_current_user_tenant_id: { Args: never; Returns: string }
      get_sibling_location_ids: {
        Args: { p_location_id: string }
        Returns: string[]
      }
      get_tenant_price: {
        Args: {
          p_billing_cycle?: string
          p_plan_slug: string
          p_tenant_id: string
        }
        Returns: number
      }
      get_user_authorized_locations: {
        Args: never
        Returns: {
          loc_id: string
        }[]
      }
      get_user_location_ids: { Args: never; Returns: string[] }
      initialize_new_organization:
        | {
            Args: {
              p_industry?: string
              p_modules?: string[]
              p_name: string
              p_plan?: string
              p_specialty?: string
              p_user_id?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_industry: string
              p_modules?: string[]
              p_name: string
              p_plan: string
              p_user_id: string
            }
            Returns: string
          }
      is_super_admin: { Args: { user_id?: string }; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      is_tenant_manager: { Args: never; Returns: boolean }
      purge_old_logs: { Args: never; Returns: undefined }
      receive_purchase_transaction: {
        Args: {
          p_items: Json
          p_notes?: string
          p_purchase_id: string
          p_tenant_id: string
          p_user_id: string
        }
        Returns: Json
      }
      rename_constraint_if_exists: {
        Args: { new_name: string; old_name: string; t_name: string }
        Returns: undefined
      }
      restore_record: {
        Args: {
          record_id: string
          target_table: string
          target_tenant_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
