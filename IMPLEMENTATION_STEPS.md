# 📋 INSTRUCCIONES DE IMPLEMENTACIÓN

## Plan: Activación Automática de Módulos por Tenant
**Fecha:** Marzo 2026
**Prioridad:** CRÍTICA (P0)
**Estado:** ✅ **COMPLETADO** (Marzo 15, 2026)

---

## ✅ RESUMEN DE EJECUCIÓN

| Migración | Estado | Resultado |
|-----------|--------|-----------|
| `activate_modules_for_tenant` | ✅ Completado | Función y trigger creados |
| `get_tenant_price` | ✅ Completado | Función creada |
| Backfill tenants existentes | ✅ Completado | 9 tenants procesados |
| Prueba de trigger | ✅ Completado | Trigger funciona correctamente |

**Tenants activados:** ACME Corporation, Agencia Demo Pro, Demo Client, Empresa Debug, Global Solutions Ltd, jaomart, Retail Plus, Taller Servicel, TechStart Inc

---

## 🚀 PASOS PARA IMPLEMENTAR (Referencia)

### **PASO 1: Ejecutar Migraciones en Supabase**

1. Abre [Supabase SQL Editor](https://app.supabase.com/project/_sql)
2. Copia y pega el contenido de `supabase/migrations/20260314000000_activate_modules_for_tenants.sql`
3. Ejecuta TODO el script (Click en "Run" o Ctrl+Enter)
4. Verifica que no haya errores

**Resultado esperado:**
- ✅ Mensaje: "Activación completada. Total de tenants procesados: X"
- ✅ Tabla con resumen de módulos por tenant

---

### **PASO 2: Ejecutar RPC de Pricing**

1. En el mismo SQL Editor
2. Copia y pega `supabase/migrations/20260314000001_get_tenant_price.sql`
3. Ejecuta el script

**Resultado esperado:**
- ✅ Función `get_tenant_price()` creada exitosamente

---

### **PASO 3: Verificar Datos en Supabase**

Ejecuta esta consulta para verificar que los módulos se activaron correctamente:

```sql
SELECT 
  t.name AS tenant,
  t.industry_type AS industria,
  s.plan_slug AS plan,
  COUNT(tm.id) AS modulos_activos,
  STRING_AGG(tm.module_slug, ', ' ORDER BY tm.module_slug) AS modulos
FROM public.tenants t
LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
LEFT JOIN public.tenant_modules tm ON tm.tenant_id = t.id AND tm.is_active = true
GROUP BY t.name, t.industry_type, s.plan_slug
ORDER BY t.name;
```

**Resultado esperado:**

| Tenant | Industria | Plan | Módulos Activos |
|--------|-----------|------|-----------------|
| ACME Corporation | taller | enterprise | 15 (dashboard, inventory, work_orders, vehicles, etc.) |
| Demo Client | gym | free | 3 (dashboard, inventory, sales) |
| jaomart | taller | free | 3 (dashboard, inventory, sales) |

---

### **PASO 4: Verificar Código TypeScript**

Los siguientes archivos ya fueron actualizados:

- ✅ `src/lib/pricing.ts` - Creado (funciones de pricing)
- ✅ `src/app/onboarding/actions.ts` - Actualizado (llama a `activate_modules_for_tenant`)
- ✅ `supabase/migrations/20260314000000_activate_modules_for_tenants.sql` - Creado
- ✅ `supabase/migrations/20260314000001_get_tenant_price.sql` - Creado

---

### **PASO 5: Probar en Desarrollo**

1. Ejecuta `npm run dev`
2. Ve a `/onboarding`
3. Crea un tenant nuevo de prueba
4. Verifica en Supabase que:
   - El tenant se creó correctamente
   - La suscripción se creó (plan free por defecto)
   - Los módulos se activaron automáticamente (dashboard, inventory, sales)

---

### **PASO 6: Limpieza de Datos Duplicados (OPCIONAL)**

**Solo si hay tenants duplicados en tu DB:**

1. Ejecuta esta consulta para identificar duplicados:

```sql
SELECT name, COUNT(*) as total, ARRAY_AGG(id::text) as ids
FROM public.tenants
GROUP BY LOWER(name)
HAVING COUNT(*) > 1;
```

2. Verifica cuál tiene suscripción activa:

```sql
SELECT t.id, t.name, t.created_at, s.plan_slug
FROM public.tenants t
LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
WHERE LOWER(t.name) IN ('jaomart', 'the garage')
ORDER BY t.name, t.created_at;
```

3. Elimina el duplicado huérfano (sin suscripción):

```sql
-- REEMPLAZA 'UUID_DEL_DUPLICADO' con el ID real
DELETE FROM public.tenants WHERE id = 'UUID_DEL_DUPLICADO';
```

⚠️ **ADVERTENCIA:** No elimines tenants que ya tienen datos de producción.

---

## 🔍 VERIFICACIÓN FINAL

### En Supabase Dashboard

1. Ve a **Authentication → Users**
2. Verifica que los usuarios existan
3. Ve a **Table Editor → tenants**
4. Verifica que los tenants tengan `industry_type` correcto
5. Ve a **Table Editor → tenant_modules**
6. Verifica que haya módulos activos para cada tenant

### En la Aplicación

1. Inicia sesión como SuperAdmin
2. Ve a `/console/dashboard`
3. Verifica que puedas ver todos los tenants
4. Haz clic en un tenant y verifica que tenga módulos activos
5. Ve al dashboard del tenant y verifica que los módulos funcionen

---

## 🐛 TROUBLESHOOTING

### Error: "function activate_modules_for_tenant does not exist"

**Solución:** Ejecuta nuevamente la migración `20260314000000_activate_modules_for_tenants.sql`

### Error: "relation modules_catalog does not exist"

**Solución:** Necesitas ejecutar primero las migraciones base del proyecto. Busca archivos SQL anteriores que crean `modules_catalog` y `plans`.

### Tenant se crea pero sin módulos

**Posibles causas:**
1. El trigger no se creó correctamente
2. El RPC `activate_modules_for_tenant` falla silenciosamente

**Solución:**
```sql
-- Verificar si el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'trigger_activate_modules';

-- Verificar si la función existe
SELECT * FROM pg_proc WHERE proname = 'activate_modules_for_tenant';

-- Probar la función manualmente
SELECT activate_modules_for_tenant('UUID_DEL_TENIENTE', 'free');
```

---

## 📞 SOPORTE

Si encuentras errores:

1. Revisa los logs de Supabase (Database → Logs)
2. Ejecuta la migración paso a paso (copia y pega por secciones)
3. Verifica que las tablas `modules_catalog`, `plans`, `tenants` existan

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Migración `20260314000000` ejecutada sin errores
- [ ] Migración `20260314000001` ejecutada sin errores
- [ ] Verificación de datos en Supabase completada
- [ ] Tenant de prueba creado exitosamente
- [ ] Módulos se activan automáticamente
- [ ] Dashboard muestra módulos correctamente

---

**Fin de las instrucciones**
