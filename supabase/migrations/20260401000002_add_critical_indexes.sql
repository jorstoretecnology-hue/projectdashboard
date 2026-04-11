-- No hay BEGIN/COMMIT
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_location_id 
  ON public.customers(location_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_items_location_id 
  ON public.inventory_items(location_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_subscription_id 
  ON public.payments(subscription_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_tenant_id 
  ON public.profiles(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_created_by 
  ON public.sales(created_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_location_id 
  ON public.sales(location_id);
