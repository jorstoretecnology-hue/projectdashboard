-- 1. Insertar la empresa en la tabla tenants (con columnas reales)
INSERT INTO public.tenants (name, plan, industry_type, is_active)
SELECT 'Agencia Demo Pro', 'professional', 'glamping', true
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE name = 'Agencia Demo Pro');

-- 2. Consultar el ID generado para confirmación
SELECT id, name FROM public.tenants WHERE name = 'Agencia Demo Pro';

-- 3. (PARA PRUEBA INTERNA) Mover al usuario de prueba a esta empresa
DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE name = 'Agencia Demo Pro' LIMIT 1;
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'test-user@agencia.com' LIMIT 1;
    
    IF v_user_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET tenant_id = v_tenant_id 
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Usuario test-user@agencia.com movido a Agencia Demo Pro exitosamente.';
    ELSE
        RAISE NOTICE 'No se pudo realizar la prueba: Usuario o Empresa no encontrados (Email: test-user@agencia.com).';
    END IF;
END $$;
