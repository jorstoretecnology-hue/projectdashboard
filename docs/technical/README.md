# 📁 Technical Documentation

Documentación técnica del proyecto - El "cómo" se construye el sistema.

---

## 📚 Archivos en Esta Carpeta

| Archivo | Propósito | Cuándo Leer |
|---------|-----------|-------------|
| **MODULE_BLUEPRINT.md** | Patrón estándar para crear módulos | Al desarrollar features nuevas |
| **DATABASE_SCHEMA.md** | Esquema completo de Supabase | Al escribir queries SQL |
| **API_SPECIFICATION.md** | Contrato de endpoints REST | Al crear/consumir APIs |
| **BUSINESS_FLOWS.md** | Flujos de negocio end-to-end | Al implementar lógica de negocio |
| **PERMISSIONS_MATRIX.md** | Matriz de roles y permisos | Al validar acceso/autorización |
| **INDUSTRIES_ENGINE.md** | Motor de configuración por industria | Al adaptar módulos por vertical |
| **DOMAIN_STATES.md** | Estados de dominio y transiciones | Al implementar máquinas de estado |
| **AUTOMATION_ENGINE.md** | Motor de automatización | Al crear triggers automáticos |
| **COMMUNICATION_SYSTEM.md** | Sistema multi-proveedor | Al integrar WhatsApp/Email |
| **INTEGRATION_GUIDE.md** | Integraciones externas | Al conectar proveedores |

---

## 🎯 Ruta de Lectura Recomendada

### Para Desarrollar un Módulo Nuevo
```
1. MODULE_BLUEPRINT.md           ← Patrón a seguir
2. DATABASE_SCHEMA.md            ← Verificar tablas existentes
3. API_SPECIFICATION.md          ← Contratos de API
4. PERMISSIONS_MATRIX.md         ← Permisos necesarios
5. BUSINESS_FLOWS.md             ← Flujos relacionados
```

### Para Debuggear un Problema
```
1. DATABASE_SCHEMA.md            ← Verificar estructura de tablas
2. API_SPECIFICATION.md          ← Verificar contratos
3. BUSINESS_FLOWS.md             ← Entender flujo esperado
```

---

## 🔗 Relacionados

- **[00-START-HERE.md](../00-START-HERE.md)** - Índice principal
- **[CONTEXTO_DEL_PROYECTO.md](../CONTEXTO_DEL_PROYECTO.md)** - Contexto general
- **[PROGRESS_TRACKER.md](../PROGRESS_TRACKER.md)** - Estado actual
