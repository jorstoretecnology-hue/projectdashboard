# 🛡️ Guía de QA y Seguridad Multi-tenant

Esta guía establece los protocolos para validar el aislamiento de datos y la integridad del motor de industrias en Dashboard Universal.

## 1. Auditoría de Aislamiento (RLS)

El riesgo de que un cliente vea datos de otro se mitiga mediante **Row Level Security (RLS)** en Supabase. 

### Script de Verificación RLS
Ejecuta este SQL en el Editor de Supabase para confirmar que las tablas críticas tienen RLS activo:

```sql
SELECT 
    tablename, 
    rowsecurity 
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND tablename IN ('sales', 'customers', 'inventory_items', 'profiles', 'tenants');
```
*Si `rowsecurity` es `false` para alguna tabla, es un riesgo crítico.*

### Simulación de Ataque (Prueba de Humo)
Para verificar que el aislamiento funciona, intenta insertar un registro forzando un `tenant_id` ajeno desde el cliente:

```typescript
// Prueba de QA en consola / código
const testLeak = async () => {
  const { data, error } = await supabase
    .from('customers')
    .insert({ 
      first_name: 'Infiltrado',
      tenant_id: 'ID_DE_OTRO_NEGOCIO' // Intento de inyección
    });
  
  if (error) console.log("✅ Bloqueado por RLS");
  else console.error("❌ ERROR: Fuga de datos detectada");
}
```

## 2. Integridad de Metadatos JSONB

El riesgo de pérdida de información en los campos dinámicos se maneja mediante:

1.  **Validación en Frontend**: Zod garantiza que los datos coincidan con el tipo (string, number, date) antes de enviar.
2.  **Esquemas en Metadata**: Los campos se guardan bajo llaves únicas (`key`) definidas en la configuración de la industria.

### QA de Persistencia
1. Crea un cliente en la industria **Taller**.
2. Cambia la industria del tenant a **Restaurante**.
3. Verifica que los datos del taller sigan en la base de datos (columna `metadata`) aunque el formulario de restaurante no los muestre. *Esto garantiza que el cambio de industria no borre datos previos.*

## 3. Checklist de QA para Nuevas Industrias

Al anexar una nueva industria, sigue estos pasos:
- [ ] Definir `customerFields` en `src/config/industries/`.
- [ ] Verificar que las `keys` no colisionen con campos base (ej: no usar `email` como key de metadata).
- [ ] Probar la creación de un registro con campos vacíos (opcionales) y campos llenos (requeridos).
- [ ] Validar que los errores de Zod se muestren correctamente en la UI.

---
**Documento de referencia para auditorías de seguridad.**  
*Última revisión: 2026-03-01*
