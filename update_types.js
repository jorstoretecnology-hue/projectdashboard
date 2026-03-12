const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase/database.types.ts', 'utf8');

// Insert location_id into tables
const tablesToUpdate = ['inventory_items', 'sales', 'service_orders', 'purchase_orders', 'customers', 'products', 'vehicles'];

tablesToUpdate.forEach(table => {
  const tableRegex = new RegExp(`(\\b${table}: \\{\\s*Row: \\{\\s*[\\s\\S]*?)(\\s*\\})\\s*(Insert: \\{\\s*[\\s\\S]*?)(\\s*\\})\\s*(Update: \\{\\s*[\\s\\S]*?)(\\s*\\})`, 'g');
  
  code = code.replace(tableRegex, (match, rowStart, rowEnd, insertStart, insertEnd, updateStart, updateEnd) => {
    const newRow = `${rowStart}\n          location_id: string | null${rowEnd}`;
    const newInsert = `${insertStart}\n          location_id?: string | null${insertEnd}`;
    const newUpdate = `${updateStart}\n          location_id?: string | null${updateEnd}`;
    return `${newRow}\n        ${newInsert}\n        ${newUpdate}`;
  });
});

const newTables = `
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
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          address?: string | null
          city?: string | null
          country?: string | null
          phone?: string | null
          timezone?: string | null
          opening_hours?: Json | null
          settings?: Json | null
          is_main?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
      user_locations: {
        Row: {
          id: string
          user_id: string
          location_id: string
          role: string
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
          role?: string
          can_read_sibling_locations?: boolean | null
          is_active?: boolean | null
          invited_by?: string | null
          invited_at?: string | null
          accepted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          location_id?: string
          role?: string
          can_read_sibling_locations?: boolean | null
          is_active?: boolean | null
          invited_by?: string | null
          invited_at?: string | null
          accepted_at?: string | null
        }
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
          created_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          compatible_types?: string[] | null
          is_available?: boolean | null
          version?: string | null
          created_at?: string | null
        }
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
          activated_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          module_slug?: string
          is_active?: boolean | null
          config?: Json | null
          activated_at?: string | null
          expires_at?: string | null
        }
      }
      plans: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          price_monthly: number | null
          price_yearly: number | null
          currency: string | null
          max_locations: number | null
          max_users: number | null
          max_customers: number | null
          max_inventory: number | null
          included_modules: string[] | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          price_monthly?: number | null
          price_yearly?: number | null
          currency?: string | null
          max_locations?: number | null
          max_users?: number | null
          max_customers?: number | null
          max_inventory?: number | null
          included_modules?: string[] | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          price_monthly?: number | null
          price_yearly?: number | null
          currency?: string | null
          max_locations?: number | null
          max_users?: number | null
          max_customers?: number | null
          max_inventory?: number | null
          included_modules?: string[] | null
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          tenant_id: string
          plan_slug: string
          status: string
          billing_cycle: string | null
          current_period_start: string | null
          current_period_end: string | null
          trial_ends_at: string | null
          cancelled_at: string | null
          cancel_reason: string | null
          provider: string | null
          provider_sub_id: string | null
          provider_customer_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          plan_slug: string
          status?: string
          billing_cycle?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          trial_ends_at?: string | null
          cancelled_at?: string | null
          cancel_reason?: string | null
          provider?: string | null
          provider_sub_id?: string | null
          provider_customer_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          plan_slug?: string
          status?: string
          billing_cycle?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          trial_ends_at?: string | null
          cancelled_at?: string | null
          cancel_reason?: string | null
          provider?: string | null
          provider_sub_id?: string | null
          provider_customer_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          subscription_id: string | null
          amount: number
          currency: string | null
          status: string
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
          currency?: string | null
          status?: string
          provider?: string | null
          provider_payment_id?: string | null
          description?: string | null
          failure_reason?: string | null
          paid_at?: string | null
          refunded_at?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          subscription_id?: string | null
          amount?: number
          currency?: string | null
          status?: string
          provider?: string | null
          provider_payment_id?: string | null
          description?: string | null
          failure_reason?: string | null
          paid_at?: string | null
          refunded_at?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
      }
`;

code = code.replace(/    \}\r?\n    Views:/, `${newTables}    }\n    Views:`);

fs.writeFileSync('src/lib/supabase/database.types.ts', code);
console.log('Types updated manually!');
