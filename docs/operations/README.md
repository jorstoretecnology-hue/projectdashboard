# ⚙️ Operations Documentation

Documentación operativa - Guías para el día a día del desarrollo.

---

## 📚 Archivos en Esta Carpeta

| Archivo | Propósito | Cuándo Leer |
|---------|-----------|-------------|
| **AI_QUICKSTART.md** | Guía de inicio rápido para IAs | **PRIMERO** - Si eres IA nueva |
| **TASK_HANDOFF_TEMPLATE.md** | Plantilla para handoffs | Al finalizar sesión |
| **DEBUG_BYPASSES.md** | Bypasses para desarrollo | Al testear flujos |
| **QA_GUIDE.md** | Guía de control de calidad | Al escribir tests |
| **walkthrough.md** | Walkthrough completo del proyecto | Al iniciar en el proyecto |

---

## 🎯 Ruta de Lectura Recomendada

### Si Eres una IA Nueva
```
1. AI_QUICKSTART.md              ← Guía de inicio rápido (5 min)
2. TASK_HANDOFF_TEMPLATE.md      ← Cómo dejar contexto
3. ../00-START-HERE.md           ← Índice general
```

### Al Finalizar una Sesión
```
1. TASK_HANDOFF_TEMPLATE.md      ← Llenar plantilla
2. Actualizar ../PROGRESS_TRACKER.md  ← Estado del proyecto
```

### Para Debuggear
```
1. DEBUG_BYPASSES.md             ← Bypasses disponibles
2. ../technical/DATABASE_SCHEMA.md ← Verificar estructura DB
3. ../security/SECURITY_QUICK_REFERENCE.md ← Reglas de seguridad
```

---

## 🧪 Comandos de Operaciones

```bash
# Verificación completa
npm run check            # type-check + lint + test

# Auditoría de código
npx ts-prune             # Código muerto TypeScript
npx knip                 # Imports no usados

# Debugging
npm run dev 2>&1 | grep -E "\[PostAuth\]|\[TenantContext\]|\[Middleware\]"
```

---

## 📋 Checklist de Inicio de Sesión

- [ ] Leer `../PROGRESS_TRACKER.md` - Estado actual
- [ ] Leer handoff anterior (si existe) - `archive/SESSION_HANDOFF_*.md`
- [ ] Verificar `git status` - Cambios pendientes
- [ ] Ejecutar `npm run dev` - Servidor de desarrollo
- [ ] Identificar tarea inmediata - Ver `../00-START-HERE.md`

---

## ✅ Checklist de Fin de Sesión

- [ ] Hacer commit de todos los cambios
- [ ] Tests en verde: `npm test`
- [ ] Sin console.log: `npm run lint`
- [ ] Actualizar `TASK_HANDOFF_TEMPLATE.md`
- [ ] Actualizar `../PROGRESS_TRACKER.md` (si aplica)
- [ ] Dejar código compilable: `npm run build`

---

## 🔗 Relacionados

- **[00-START-HERE.md](../00-START-HERE.md)** - Índice principal
- **[../PROGRESS_TRACKER.md](../PROGRESS_TRACKER.md)** - Estado actual
- **[../ai-coordination/](../ai-coordination/)** - Coordinación de agentes IA
