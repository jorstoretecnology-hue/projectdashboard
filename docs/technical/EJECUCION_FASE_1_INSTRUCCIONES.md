# 🚀 EJECUCIÓN FASE 1 - Instrucciones Paso a Paso

> **Importante:** Sigue estos pasos en orden exacto. No saltes ninguna verificación.

---

## 📋 Checklist de Ejecución

### ✅ Pre-Ejecución (5 minutos)

1. **Verifica que tienes acceso a Supabase**
   - Ve a: https://app.supabase.com
   - Inicia sesión en tu proyecto
   - Ve a: **SQL Editor** (en el menú izquierdo)

2. **Haz backup de seguridad (OPCIONAL PERO RECOMENDADO)**
   ```bash
   # Con Supabase CLI
   npx supabase db dump -f backup_pre_fase1.sql
   
   # O desde el Dashboard: Database → Backups → Create Backup
   ```

3. **Abre el script SQL**
   - Archivo: `supabase/migrations/20260318000001_fase1_indexes_fks.sql`
   - Copia TODO el contenido (Ctrl+C)

---

## 🔍 Paso 1: Dry-Run de Detección de Huérfanos

### 1.1 Ejecuta las Queries de Detección

En el **SQL Editor** de Supabase:

1. Pega **SOLO** la sección del PASO 1 del script (líneas 1-60)
   - Solo las queries `SELECT` que detectan huérfanos
   - **NO** ejecutes las secciones de DELETE o ALTER TABLE todavía

2. Click en **"Run"** o presiona `Ctrl+Enter`

### 1.2 Interpreta los Resultados

**Escenario A: SIN RESULTADOS** ✅
```
(0 rows)
```
- **Significa:** No hay datos huérfanos
- **Acción:** Puedes proceder al Paso 2 directamente

**Escenario B: CON RESULTADOS** ⚠️
```
 id | product_id | tenant_id | name
----|------------|-----------|------
 1  | abc-123    | xyz-789   | Producto huérfano
```
- **Significa:** Hay datos huérfanos que causarán error en las FKs
- **Acción:** Debes limpiar los datos huérfanos primero

### 1.3 Limpieza de Huérfanos (SOLO si es necesario)

Si el **Escenario B** ocurrió:

1. En el mismo script, busca la sección **PASO 2** (líneas 63-88)
2. **Descomenta** solo las queries de DELETE que necesites
   ```sql
   -- Cambia esto:
   -- DELETE FROM inventory_items ...
   
   -- Por esto:
   DELETE FROM inventory_items ...
   ```
3. Ejecuta las queries DESCOMENTADAS
4. **Vuelve al Paso 1.1** para verificar que ya no hay huérfanos

---

## 🔧 Paso 2: Ejecución del Script Completo

### 2.1 Ejecuta Todas las Migraciones

1. En el **SQL Editor**, pega el script **COMPLETO**
   - Todo el archivo `20260318000001_fase1_indexes_fks.sql`
   - Desde `BEGIN;` hasta `COMMIT;`

2. Click en **"Run"** o presiona `Ctrl+Enter`

3. **Espera** a que termine (puede tomar 10-30 segundos)

### 2.2 Interpreta los Resultados

**ÉXITO** ✅
```
NOTICE:  FK creada: inventory_items_product_id_fkey
NOTICE:  FK creada: inventory_movements_product_id_fkey
...
NOTICE:  ==========================================
NOTICE:  FASE 1 COMPLETADA EXITOSAMENTE
NOTICE:  ==========================================
```

**ERROR POR DATOS HUÉRFANOS** ❌
```
ERROR:  insert or update violates foreign key constraint
Detail: Key (product_id)=(abc-123) is not present in table "products".
```
- **Acción:** Vuelve al **Paso 1.3** y limpia los huérfanos

**ERROR DE PERMISOS** ❌
```
ERROR:  permission denied for table inventory_items
```
- **Acción:** Verifica que estás conectado como usuario con privilegios
- Usa la **service_role key** o un usuario admin

---

## ✅ Paso 3: Verificación Post-Ejecución

### 3.1 Verifica las Foreign Keys Creadas

Ejecuta esta query en el **SQL Editor**:

```sql
SELECT 
    tc.table_name AS tabla,
    kcu.column_name AS columna,
    ccu.table_name AS tabla_referencia,
    ccu.column_name AS columna_referencia,
    rc.delete_rule AS regla_delete
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('inventory_items', 'inventory_movements', 'sale_items', 'sales')
ORDER BY tc.table_name;
```

**Resultado Esperado:**
```
 tabla           | columna     | tabla_referencia | columna_referencia | regla_delete
-----------------|-------------|------------------|--------------------|--------------
 inventory_items | product_id  | products         | id                 | CASCADE
 inventory_movements | product_id  | products         | id                 | CASCADE
 sale_items      | product_id  | products         | id                 | CASCADE
 sales           | customer_id | customers        | id                 | RESTRICT
```

### 3.2 Verifica los Índices Creados

Ejecuta esta query:

```sql
SELECT 
    tablename AS tabla,
    indexname AS indice,
    indexdef AS definicion
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('inventory_items', 'inventory_movements', 'sale_items', 'sales', 'customers', 'products')
  AND indexdef LIKE '%tenant_id%'
ORDER BY tablename, indexname;
```

**Resultado Esperado:** (al menos 8 índices con tenant_id)

### 3.3 Pruebas en el Frontend (Local)

1. **Abre una terminal** en tu proyecto:
   ```bash
   cd E:\ProyectDashboard
   ```

2. **Ejecuta los tests:**
   ```bash
   npm test
   ```

3. **Verifica que todos pasen:**
   ```
   ✓ 24 tests passing
   ```

4. **Prueba la aplicación en desarrollo:**
   ```bash
   npm run dev
   ```

5. **Navega a las siguientes rutas** y verifica que funcionen:
   - `/inventory` - Listado de productos
   - `/customers` - Listado de clientes
   - `/sales` - Listado de ventas
   - Cualquier dashboard con datos

---

## 📊 Paso 4: Reportar Resultados

### 4.1 ÉXITO Total ✅

Si **TODO** funcionó correctamente:

1. **Actualiza el PROGRESS_TRACKER.md:**
   ```markdown
   ## ✅ Fase 1 Completada
   
   - [x] Script SQL ejecutado sin errores
   - [x] FKs creadas: 4
   - [x] Índices creados: 12
   - [x] Tests pasando: 24/24
   - [x] Frontend funciona correctamente
   ```

2. **Publica en Slack #security-pipeline:**
   ```
   ✅ FASE 1 COMPLETADA
   
   Foreign Keys: 4 creadas
   Índices: 12 creados (todos con tenant_id)
   Tests: 24/24 passing
   Frontend: ✅ Sin errores
   
   Next: Fase 2 - Normalización de módulos
   ```

### 4.2 ÉXITO Parcial ⚠️

Si hubo **errores menores** pero el script se ejecutó:

1. **Documenta los errores** en el `IMPLEMENTATION_PLAN.md`
2. **Continúa con las verificaciones** que sí funcionaron
3. **Reporta los errores** en #security-pipeline

### 4.3 FALLO Total ❌

Si el script **falló completamente**:

1. **NO hagas rollback** todavía
2. **Captura el error** completo (screenshot o copy-paste)
3. **Publica en #security-pipeline:**
   ```
   ❌ FASE 1 FALLÓ
   
   Error: [pega el error aquí]
   Paso donde falló: [Paso 1, 2, o 3]
   ```
4. **Espera instrucciones** del equipo antes de continuar

---

## 🆘 Troubleshooting

### Error: "relation does not exist"

**Causa:** La tabla mencionada no existe en tu DB

**Solución:**
```sql
-- Verifica qué tablas existen
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### Error: "foreign key constraint is violated"

**Causa:** Hay datos huérfanos

**Solución:** Vuelve al **Paso 1.3** y limpia los huérfanos

### Error: "permission denied"

**Causa:** No tienes privilegios suficientes

**Solución:**
- Usa la **service_role key** en tu conexión
- O conecta como usuario admin del proyecto

### La aplicación falla después de la migración

**Causa:** Posible problema de compatibilidad

**Solución:**
1. Revisa los logs del frontend
2. Ejecuta `npm run check`
3. Si hay errores de TypeScript, corrígelos
4. Si persiste, reporta en #security-pipeline

---

## 📞 Soporte

Si necesitas ayuda durante la ejecución:

1. **Revisa este documento** primero
2. **Busca en el script** comentarios relacionados
3. **Publica en #security-pipeline** con:
   - Error completo
   - Paso donde ocurrió
   - Screenshot del SQL Editor

---

## ✅ Checklist Final

Marca cada casilla al completarla:

- [ ] Leí este documento completo
- [ ] Tengo acceso a Supabase SQL Editor
- [ ] Ejecuté el dry-run de huérfanos (Paso 1)
- [ ] Limpié datos huérfanos (si fue necesario)
- [ ] Ejecuté el script completo (Paso 2)
- [ ] Verifiqué FKs creadas (Paso 3.1)
- [ ] Verifiqué índices creados (Paso 3.2)
- [ ] Ejecuté tests del frontend (Paso 3.3)
- [ ] Reporté resultados (Paso 4)
- [ ] Actualicé PROGRESS_TRACKER.md

---

**¿Listo? Comienza por el Paso 1 ahora!** 🚀

*Archivo creado: 2026-03-18*
*Versión: 1.0*
