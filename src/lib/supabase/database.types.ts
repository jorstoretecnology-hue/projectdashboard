export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          plan: 'free' | 'starter' | 'professional' | 'enterprise'
          active_modules: string[] | null
          branding: Json | null
          industry_type: 'taller' | 'restaurante' | 'supermercado' | 'ferreteria' | 'gym' | 'glamping' | 'discoteca'
          is_active: boolean | null
          max_users: number | null
          custom_domain: string | null
          feature_flags: string[] | null
          settings: Json | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          plan?: 'free' | 'starter' | 'professional' | 'enterprise'
          active_modules?: string[] | null
          branding?: Json | null
          industry_type: 'taller' | 'restaurante' | 'supermercado' | 'ferreteria' | 'gym' | 'glamping' | 'discoteca'
          is_active?: boolean | null
          max_users?: number | null
          custom_domain?: string | null
          feature_flags?: string[] | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          plan?: 'free' | 'starter' | 'professional' | 'enterprise'
          active_modules?: string[] | null
          branding?: Json | null
          industry_type?: 'taller' | 'restaurante' | 'supermercado' | 'ferreteria' | 'gym' | 'glamping' | 'discoteca'
          is_active?: boolean | null
          max_users?: number | null
          custom_domain?: string | null
          feature_flags?: string[] | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          tenant_id: string | null
          app_role: 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER'
          full_name: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string
        }
        Insert: {
          id: string
          tenant_id?: string | null
          app_role?: 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER'
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          app_role?: 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER'
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          name: string | null
          first_name: string | null
          last_name: string | null
          email: string
          phone: string | null
          company_name: string | null
          tax_id: string | null
          address: string | null
          notes: string | null
          status: string | null
          website: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          location_id: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          name?: string | null
          first_name?: string | null
          last_name?: string | null
          email: string
          phone?: string | null
          company_name?: string | null
          tax_id?: string | null
          address?: string | null
          notes?: string | null
          status?: string | null
          website?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          location_id?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string
          phone?: string | null
          company_name?: string | null
          tax_id?: string | null
          address?: string | null
          notes?: string | null
          status?: string | null
          website?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          location_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          price: number
          stock: number | null
          category: string
          sku: string | null
          image: string | null
          industry_type: 'taller' | 'restaurante' | 'supermercado' | 'ferreteria' | 'gym' | 'glamping' | 'discoteca'
          state: 'DISPONIBLE' | 'BAJO_STOCK' | 'CRITICO' | 'AGOTADO' | 'BLOQUEADO' | null
          threshold_low: number | null
          threshold_critical: number | null
          is_blocked: boolean | null
          blocked_reason: string | null
          blocked_at: string | null
          blocked_by: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          location_id: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          price: number
          stock?: number | null
          category: string
          sku?: string | null
          image?: string | null
          industry_type: 'taller' | 'restaurante' | 'supermercado' | 'ferreteria' | 'gym' | 'glamping' | 'discoteca'
          state?: 'DISPONIBLE' | 'BAJO_STOCK' | 'CRITICO' | 'AGOTADO' | 'BLOQUEADO' | null
          threshold_low?: number | null
          threshold_critical?: number | null
          is_blocked?: boolean | null
          blocked_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          location_id?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          price?: number
          stock?: number | null
          category?: string
          sku?: string | null
          image?: string | null
          industry_type?: 'taller' | 'restaurante' | 'supermercado' | 'ferreteria' | 'gym' | 'glamping' | 'discoteca'
          state?: 'DISPONIBLE' | 'BAJO_STOCK' | 'CRITICO' | 'AGOTADO' | 'BLOQUEADO' | null
          threshold_low?: number | null
          threshold_critical?: number | null
          is_blocked?: boolean | null
          blocked_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          location_id?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          created_by: string
          state: 'COTIZACION' | 'PENDIENTE' | 'PAGADO' | 'ENTREGADO' | 'RECHAZADO' | 'CANCELADA'
          subtotal: number
          discount: number | null
          tax: number | null
          total: number
          payment_method: string | null
          approved_at: string | null
          paid_at: string | null
          delivered_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          is_override: boolean | null
          override_reason: string | null
          idempotency_key: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          location_id: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          created_by: string
          state?: 'COTIZACION' | 'PENDIENTE' | 'PAGADO' | 'ENTREGADO' | 'RECHAZADO' | 'CANCELADA'
          subtotal: number
          discount?: number | null
          tax?: number | null
          total: number
          payment_method?: string | null
          approved_at?: string | null
          paid_at?: string | null
          delivered_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          is_override?: boolean | null
          override_reason?: string | null
          idempotency_key?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          location_id?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          created_by?: string
          state?: 'COTIZACION' | 'PENDIENTE' | 'PAGADO' | 'ENTREGADO' | 'RECHAZADO' | 'CANCELADA'
          subtotal?: number
          discount?: number | null
          tax?: number | null
          total?: number
          payment_method?: string | null
          approved_at?: string | null
          paid_at?: string | null
          delivered_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          is_override?: boolean | null
          override_reason?: string | null
          idempotency_key?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          location_id?: string | null
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string
          product_name: string
          product_sku: string | null
          unit_price: number
          quantity: number
          subtotal: number
          discount: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          sale_id: string
          product_id: string
          product_name: string
          product_sku?: string | null
          unit_price: number
          quantity: number
          subtotal: number
          discount?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string
          product_name?: string
          product_sku?: string | null
          unit_price?: number
          quantity?: number
          subtotal?: number
          discount?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          id: string
          tenant_id: string
          supplier_name: string
          supplier_email: string | null
          supplier_phone: string | null
          state: 'BORRADOR' | 'ENVIADA' | 'CONFIRMADA' | 'RECIBIDA_PARCIAL' | 'RECIBIDA_COMPLETA' | 'RECHAZADA'
          subtotal: number
          tax: number | null
          total: number
          expected_date: string | null
          sent_at: string | null
          confirmed_at: string | null
          received_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
          created_by: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          location_id: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          supplier_name: string
          supplier_email?: string | null
          supplier_phone?: string | null
          state?: 'BORRADOR' | 'ENVIADA' | 'CONFIRMADA' | 'RECIBIDA_PARCIAL' | 'RECIBIDA_COMPLETA' | 'RECHAZADA'
          subtotal: number
          tax?: number | null
          total: number
          expected_date?: string | null
          sent_at?: string | null
          confirmed_at?: string | null
          received_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          created_by: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          location_id?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          supplier_name?: string
          supplier_email?: string | null
          supplier_phone?: string | null
          state?: 'BORRADOR' | 'ENVIADA' | 'CONFIRMADA' | 'RECIBIDA_PARCIAL' | 'RECIBIDA_COMPLETA' | 'RECHAZADA'
          subtotal?: number
          tax?: number | null
          total?: number
          expected_date?: string | null
          sent_at?: string | null
          confirmed_at?: string | null
          received_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          created_by?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          location_id?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          id: string
          purchase_order_id: string
          product_id: string
          quantity_ordered: number
          quantity_received: number | null
          unit_cost: number
          subtotal: number
          created_at: string | null
        }
        Insert: {
          id?: string
          purchase_order_id: string
          product_id: string
          quantity_ordered: number
          quantity_received?: number | null
          unit_cost: number
          subtotal: number
          created_at?: string | null
        }
        Update: {
          id?: string
          purchase_order_id?: string
          product_id?: string
          quantity_ordered?: number
          quantity_received?: number | null
          unit_cost?: number
          subtotal?: number
          created_at?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          brand: string
          model: string
          year: number | null
          plate: string
          vin: string | null
          color: string | null
          mileage: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          location_id: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          brand: string
          model: string
          year?: number | null
          plate: string
          vin?: string | null
          color?: string | null
          mileage?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          location_id?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          brand?: string
          model?: string
          year?: number | null
          plate?: string
          vin?: string | null
          color?: string | null
          mileage?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          location_id?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          vehicle_id: string
          state: 'RECIBIDO' | 'EN_PROCESO' | 'BLOQUEADO' | 'REPARADO' | 'ENTREGADO'
          priority: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE' | null
          assigned_to: string | null
          assigned_at: string | null
          description: string
          diagnosis: string | null
          labor_cost: number | null
          parts_cost: number | null
          total_cost: number | null
          received_at: string | null
          started_at: string | null
          blocked_at: string | null
          blocked_reason: string | null
          completed_at: string | null
          delivered_at: string | null
          created_by: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          vehicle_id: string
          state?: 'RECIBIDO' | 'EN_PROCESO' | 'BLOQUEADO' | 'REPARADO' | 'ENTREGADO'
          priority?: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE' | null
          assigned_to?: string | null
          assigned_at?: string | null
          description: string
          diagnosis?: string | null
          labor_cost?: number | null
          parts_cost?: number | null
          received_at?: string | null
          started_at?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          delivered_at?: string | null
          created_by: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          vehicle_id?: string
          state?: 'RECIBIDO' | 'EN_PROCESO' | 'BLOQUEADO' | 'REPARADO' | 'ENTREGADO'
          priority?: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE' | null
          assigned_to?: string | null
          assigned_at?: string | null
          description?: string
          diagnosis?: string | null
          labor_cost?: number | null
          parts_cost?: number | null
          received_at?: string | null
          started_at?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          delivered_at?: string | null
          created_by?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          type: string
          price: number
          stock: number
          sku: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          location_id: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          type: string
          price?: number
          stock?: number
          sku?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          location_id?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          type?: string
          price?: number
          stock?: number
          sku?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          location_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      webhook_subscriptions: {
        Row: {
          id: string
          tenant_id: string
          url: string
          event_type: string
          secret: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          url: string
          event_type: string
          secret?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          url?: string
          event_type?: string
          secret?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          id: string
          subscription_id: string | null
          tenant_id: string
          event_type: string
          payload: Json
          request_id: number | null
          status: string | null
          response_status_code: number | null
          response_body: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          subscription_id?: string | null
          tenant_id: string
          event_type: string
          payload: Json
          request_id?: number | null
          status?: string | null
          response_status_code?: number | null
          response_body?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          subscription_id?: string | null
          tenant_id?: string
          event_type?: string
          payload?: Json
          request_id?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      tenant_quotas: {
        Row: {
          tenant_id: string
          resource_key: string
          current_usage: number
          max_limit: number
          updated_at: string | null
        }
        Insert: {
          tenant_id: string
          resource_key: string
          current_usage?: number
          max_limit?: number
          updated_at?: string | null
        }
        Update: {
          tenant_id?: string
          resource_key?: string
          current_usage?: number
          max_limit?: number
          updated_at?: string | null
        }
        Relationships: []
      }

      locations: {
        Row: {
          id: string
          tenant_id: string
          name: string
          address: string | null
          city: string | null
          country: string | null
          phone: string | null
          timezone: string | null
          opening_hours: Json | null
          settings: Json | null
          is_main: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          address?: string | null
          city?: string | null
          country?: string | null
          phone?: string | null
          timezone?: string | null
          opening_hours?: Json | null
          settings?: Json | null
          is_main?: boolean | null
          is_active?: boolean | null
        }
        Update: {
          name?: string
          address?: string | null
          city?: string | null
          phone?: string | null
          timezone?: string | null
          opening_hours?: Json | null
          settings?: Json | null
          is_main?: boolean | null
          is_active?: boolean | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          id: string
          user_id: string
          location_id: string
          role: 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER'
          can_read_sibling_locations: boolean | null
          is_active: boolean | null
          invited_by: string | null
          invited_at: string | null
          accepted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          location_id: string
          role?: 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER'
          can_read_sibling_locations?: boolean | null
          is_active?: boolean | null
          invited_by?: string | null
          accepted_at?: string | null
        }
        Update: {
          role?: 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'VIEWER'
          can_read_sibling_locations?: boolean | null
          is_active?: boolean | null
          accepted_at?: string | null
        }
        Relationships: []
      }
      modules_catalog: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          compatible_types: string[] | null
          is_available: boolean | null
          version: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          compatible_types?: string[] | null
          is_available?: boolean | null
          version?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          compatible_types?: string[] | null
          is_available?: boolean | null
          version?: string | null
        }
        Relationships: []
      }
      tenant_modules: {
        Row: {
          id: string
          tenant_id: string
          module_slug: string
          is_active: boolean | null
          config: Json | null
          activated_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          module_slug: string
          is_active?: boolean | null
          config?: Json | null
          expires_at?: string | null
        }
        Update: {
          is_active?: boolean | null
          config?: Json | null
          expires_at?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          id: string
          slug: 'free' | 'starter' | 'professional' | 'enterprise'
          name: string
          description: string | null
          price_monthly: number
          price_yearly: number
          currency: string
          max_locations: number
          max_users: number
          max_customers: number
          max_inventory: number
          included_modules: string[] | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          slug: 'free' | 'starter' | 'professional' | 'enterprise'
          name: string
          price_monthly?: number
          price_yearly?: number
          currency?: string
          max_locations?: number
          max_users?: number
          max_customers?: number
          max_inventory?: number
          included_modules?: string[] | null
          is_active?: boolean | null
        }
        Update: {
          name?: string
          price_monthly?: number
          price_yearly?: number
          is_active?: boolean | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          tenant_id: string
          plan_slug: 'free' | 'starter' | 'professional' | 'enterprise'
          status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'suspended'
          billing_cycle: 'monthly' | 'yearly' | null
          current_period_start: string | null
          current_period_end: string | null
          trial_ends_at: string | null
          cancelled_at: string | null
          cancel_reason: string | null
          provider: 'mercadopago' | 'stripe' | 'manual' | null
          provider_sub_id: string | null
          provider_customer_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          plan_slug: 'free' | 'starter' | 'professional' | 'enterprise'
          status?: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'suspended'
          billing_cycle?: 'monthly' | 'yearly' | null
          provider?: 'mercadopago' | 'stripe' | 'manual' | null
          provider_sub_id?: string | null
          provider_customer_id?: string | null
        }
        Update: {
          plan_slug?: 'free' | 'starter' | 'professional' | 'enterprise'
          status?: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'suspended'
          billing_cycle?: 'monthly' | 'yearly' | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancelled_at?: string | null
          cancel_reason?: string | null
          provider_sub_id?: string | null
          provider_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          subscription_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'paid' | 'failed' | 'refunded'
          provider: string | null
          provider_payment_id: string | null
          description: string | null
          failure_reason: string | null
          paid_at: string | null
          refunded_at: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          subscription_id?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          provider?: string | null
          provider_payment_id?: string | null
          description?: string | null
          metadata?: Json | null
        }
        Update: {
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          provider_payment_id?: string | null
          failure_reason?: string | null
          paid_at?: string | null
          refunded_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      restore_record: {
        Args: {
          target_table: string
          record_id: string
          target_tenant_id: string
        }
        Returns: void
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
