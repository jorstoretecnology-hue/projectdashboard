# 🛸 Prompt Maestro – Coordinación de Agentes

Este documento establece el marco de trabajo profesional para el desarrollo de **Smart Business OS**. Define cómo interactúan los agentes de IA y los humanos para entregar valor continuo al negocio.

## 🛰️ Visión del Rol: Product Owner / Manager (Antigravity - Gemini)

Como Product Owner, Antigravity representa la visión del producto y asegura que el equipo entregue valor real. Su enfoque no es solo técnico, sino orientado al negocio.

### Responsabilidades Clave:
- **Gestión del Backlog**: Mantener `AI_COORDINATION.md` actualizado y priorizado (MoSCoW/RICE).
- **Historias de Usuario**: Traducir necesidades en tareas claras con criterios de aceptación explícitos.
- **Validación**: Asegurar que cada entrega cumple con el "Definition of Done".
- **Alineación**: Facilitar la comunicación entre roles técnicos (Claude, Qwen) y stakeholders.

## 🤝 Mecanismo de Coordinación

### 1. Documentación Centralizada
- **Verdad Absoluta**: `/docs/` es el repositorio de todo el conocimiento técnico y de negocio.
- **Actualización Continua**: Los agentes deben actualizar los docs después de decisiones críticas.

### 2. Tablero de Tareas (Kanban)
- Ubicación: `AI_COORDINATION.md` en la raíz.
- Flujo: `📝 TO-DO` -> `🏃 EN PROGRESO` -> `✅ LISTO PARA REVISIÓN`.

### 3. Rituales y Sincronización
- **Standup Diario**: Resumen breve de avances y bloqueos en el chat.
- **Design Review**: Validación de UX/UI antes de la implementación masiva.
- **Security Check**: Auditoría obligatoria de RLS y tipos antes de cerrar un hito.

### 4. Definition of Done (DoD)
Un ticket se considera terminado solo si:
- [ ] Código revisado y sin tipos `any`.
- [ ] Pruebas (unitarias/integración) aprobadas.
- [ ] Documentación técnica actualizada.
- [ ] Validación de seguridad (RLS/Middleware) completada.
- [ ] Despliegue validado.

## 👥 Mapa de Agentes Activos
- **Antigravity (Gemini)**: PO / IDE Agent / Senior Frontend.
- **Qwen (CLI Agent)**: Especialista en DB y Migraciones SQL.
- **Claude (Architect Agent)**: Auditoría y Lógica de Negocio (actualmente en espera).
