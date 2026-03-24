# 🤖 AI Coordination

Documentación para coordinación de agentes de IA - Roles, protocolos y prompts.

---

## 📚 Archivos en Esta Carpeta

| Archivo | Propósito | Cuándo Leer |
|---------|-----------|-------------|
| **PROMPT_ANTIGRAVITY.md** | Prompt especializado para Antigravity | Al usar Antigravity IDE |
| **PROMPT_MAESTRO_COORDINACION.md** | Protocolo de coordinación entre agentes | Al coordinar múltiples IAs |

---

## 🔄 Flujo de Coordinación

```
┌─────────────────────────────────────────────────────────┐
│ 1. Qwen (CLI)                                           │
│    - Ejecuta validaciones automáticas                  │
│    - Genera reportes de seguridad (JSON + MD)          │
│    - Publica en #security-pipeline                     │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│ 2. Antigravity Agents (Nativos)                         │
│    - Aplican reglas de seguridad en runtime            │
│    - Monitorean intentos sospechosos                   │
│    - Consultan SECURITY_QUICK_REFERENCE.md             │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│ 3. Ambos → Sincronización                               │
│    - Consultan protocolo común                          │
│    - Comparten hallazgos en #security-pipeline         │
│    - Garantizan cumplimiento de estándares             │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Roles de Agentes

### Qwen (CLI Agent)
- **Misión:** Validaciones automáticas y reportes de seguridad
- **Herramientas:** CLI, terminal, scripts SQL
- **Responsable:** `npm run check`, `npm audit`, migraciones DB

### Antigravity (IDE Agent)
- **Misión:** Desarrollo activo, refactorización, UI
- **Herramientas:** IDE, system files, web search
- **Responsable:** Componentes React, arquitectura, documentación

---

## 📋 Protocolo de Handoff

Al finalizar cada sesión:

1. **Actualizar PROGRESS_TRACKER.md**
   - Qué se hizo
   - Próximos pasos
   - Decisiones técnicas

2. **Crear SESSION_HANDOFF_*.md** (en `archive/`)
   - Contexto específico de la sesión
   - Problemas encontrados
   - Soluciones aplicadas

3. **Ejecutar validaciones**
   ```bash
   npm run check
   npm run security:audit
   npm run security:validate
   ```

4. **Publicar en #security-pipeline**
   - Reporte JSON
   - Resumen de cambios

---

## 🔗 Relacionados

- **[00-START-HERE.md](../00-START-HERE.md)** - Índice principal
- **[operations/AI_QUICKSTART.md](../operations/AI_QUICKSTART.md)** - Guía para IAs nuevas
- **[operations/TASK_HANDOFF_TEMPLATE.md](../operations/TASK_HANDOFF_TEMPLATE.md)** - Plantilla de handoff
