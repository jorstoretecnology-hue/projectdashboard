# 🔄 GUÍA: Generación de Tipos TypeScript

> **Estado:** ⚠️ **ACCIÓN MANUAL REQUERIDA**  
> **Tiempo estimado:** 5 minutos

---

## ⚠️ POR QUÉ FALLÓ LA GENERACIÓN AUTOMÁTICA

El comando de Supabase CLI requiere autenticación directa con tu proyecto. Hay **3 formas** de solucionarlo:

---

## ✅ OPCIÓN 1: Usando CMD (Windows) - RECOMENDADO

### Paso 1: Abre CMD como Administrador

```
Click derecho en CMD → Ejecutar como administrador
```

### Paso 2: Navega al proyecto

```cmd
cd E:\ProyectDashboard
```

### Paso 3: Ejecuta el comando

```cmd
npx supabase gen types typescript --project-id kpdadwtxfazhtoqnttdh --schema public > src\types\supabase.ts
```

### Paso 4: Verifica el resultado

```cmd
type src\types\supabase.ts | more
```

Deberías ver algo como:
```typescript
export type Json = string | number | boolean | null | ...
export type Database = {
  public: {
    Tables: {
      tenants: {...}
      tenants_modules: {...}
      industries: {...}
      ...
    }
  }
}
```

---

## ✅ OPCIÓN 2: Usando PowerShell

### Paso 1: Abre PowerShell como Administrador

```
Click derecho en PowerShell → Ejecutar como administrador
```

### Paso 2: Navega al proyecto

```powershell
cd E:\ProyectDashboard
```

### Paso 3: Ejecuta el comando

```powershell
npx supabase gen types typescript --project-id kpdadwtxfazhtoqnttdh --schema public | Out-File -FilePath src\types\supabase.ts -Encoding utf8
```

### Paso 4: Verifica el resultado

```powershell
Get-Content src\types\supabase.ts -Head 50
```

---

## ✅ OPCIÓN 3: Usando Git Bash

### Paso 1: Abre Git Bash

```
Click derecho en la carpeta del proyecto → Git Bash Here
```

### Paso 2: Ejecuta el comando

```bash
npx supabase gen types typescript --project-id kpdadwtxfazhtoqnttdh --schema public > src/types/supabase.ts
```

### Paso 3: Verifica el resultado

```bash
head -50 src/types/supabase.ts
```

---

## 🔍 SOLUCIÓN DE PROBLEMAS

### Error: "Forbidden resource"

**Causa:** La CLI no puede autenticarse con tu proyecto

**Solución A: Login con Supabase**
```bash
npx supabase login
```
- Te abrirá el navegador
- Inicia sesión con tu cuenta de Supabase
- Vuelve a la terminal y ejecuta el comando de tipos

**Solución B: Usar la API directamente**

1. Ve a tu Dashboard de Supabase: https://app.supabase.com/project/kpdadwtxfazhtoqnttdh
2. Click en **Settings** → **API**
3. Copia la **anon public** key
4. Ejecuta:

```bash
curl -s "https://kpdadwtxfazhtoqnttdh.supabase.co/rest/v1/" \
  -H "apikey: TU_ANON_KEY_AQUI" \
  -H "Authorization: Bearer TU_ANON_KEY_AQUI"
```

---

### Error: "supabase command not found"

**Causa:** Supabase CLI no está instalada globalmente

**Solución:**
```bash
npm install -g supabase
```

O usa npx:
```bash
npx supabase gen types typescript --project-id kpdadwtxfazhtoqnttdh --schema public > src/types/supabase.ts
```

---

### Error: "Cannot write to file"

**Causa:** Permisos de escritura en la carpeta

**Solución:**
```bash
# En CMD (como administrador)
cd E:\ProyectDashboard
npx supabase gen types typescript --project-id kpdadwtxfazhtoqnttdh --schema public > src\types\supabase.ts
```

---

## 📋 VERIFICACIÓN POST-GENERACIÓN

### 1. Verifica que el archivo existe

```bash
dir src\types\supabase.ts
```

Debería mostrar algo como:
```
03/18/2026  12:00 PM    45,678    supabase.ts
```

### 2. Verifica el contenido

```bash
head -100 src\types\supabase.ts
```

Deberías ver las nuevas tablas:
```typescript
export type Tables = {
  industries: Tables["industries"]
  tenant_modules: Tables["tenant_modules"]
  plan_modules: Tables["plan_modules"]
  // ... resto de tablas
}
```

### 3. Ejecuta type-check

```bash
npm run type-check
```

**Resultado esperado:**
```
✅ 0 errors
```

**Si hay errores:**
- Revisa los mensajes de error
- Pueden ser referencias a columnas que ya no existen (como `active_modules`)
- Actualiza el código para usar `tenant_modules` en su lugar

---

## 🎯 PRÓXIMOS PASOS

Después de generar los tipos:

### 1. Ejecuta type-check
```bash
npm run type-check
```

### 2. Inicia el servidor de desarrollo
```bash
npm run dev
```

### 3. Prueba las siguientes rutas:
- http://localhost:3000/dashboard
- http://localhost:3000/customers
- http://localhost:3000/inventory
- http://localhost:3000/sales
- http://localhost:3000/settings/modules

### 4. Reporta resultados

**Si todo funciona:**
```
✅ TIPOS GENERADOS

- Tipos TypeScript: ✅ 0 errores
- Dashboard: ✅ Funciona
- Clientes: ✅ CRUD completo
- Inventario: ✅ Operaciones OK
- Ventas: ✅ Cálculos correctos
- Módulos: ✅ Coincide con tenant_modules

LISTO PARA MERCADOPAGO 🚀
```

**Si hay errores:**
```
⚠️ ERRORES ENCONTRADOS

- Tipos TypeScript: X errores
- Módulo afectado: [nombre]
- Error: [descripción del error]
- Screenshot: [adjuntar]

PRIORIDAD: Corregir antes de continuar
```

---

## 📞 SOPORTE

Si necesitas ayuda:

1. **Revisa esta guía** primero
2. **Captura el error** completo (screenshot)
3. **Publica en #security-pipeline**
4. **El equipo te ayudará inmediatamente**

---

## 🚀 COMANDOS RÁPIDOS (Copiar y Pegar)

### CMD (Windows)
```cmd
cd E:\ProyectDashboard
npx supabase gen types typescript --project-id kpdadwtxfazhtoqnttdh --schema public > src\types\supabase.ts
type src\types\supabase.ts | more
npm run type-check
npm run dev
```

### PowerShell
```powershell
cd E:\ProyectDashboard
npx supabase gen types typescript --project-id kpdadwtxfazhtoqnttdh --schema public | Out-File -FilePath src\types\supabase.ts -Encoding utf8
Get-Content src\types\supabase.ts -Head 50
npm run type-check
npm run dev
```

### Git Bash
```bash
cd E:\ProyectDashboard
npx supabase gen types typescript --project-id kpdadwtxfazhtoqnttdh --schema public > src/types/supabase.ts
head -50 src/types/supabase.ts
npm run type-check
npm run dev
```

---

*Última actualización: 18 de marzo de 2026*  
*Estado: ⏳ PENDIENTE - REQUIERE ACCIÓN MANUAL*
