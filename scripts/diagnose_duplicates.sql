-- Script de Diagnóstico para Duplicados
SELECT id, name, email, tenant_id, created_at, deleted_at 
FROM public.customers 
WHERE email = 'juan.rpc@example.com' 
  AND tenant_id = '71bcb1fe-f1c6-4e6b-a3e7-ec66e7147e16'
ORDER BY created_at DESC;
