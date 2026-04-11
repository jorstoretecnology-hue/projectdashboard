---
name: documentation
description: >
  Documentación técnica, changelogs, READMEs, guías de usuario y
  documentación de API. Usar cuando el usuario quiera: escribir
  documentación, crear un README, documentar una API, generar un
  changelog, escribir guías de instalación, documentar decisiones
  técnicas, o crear materiales de onboarding para desarrolladores.
  Activar con: documentación, README, changelog, guía, API docs,
  comentario, docstring, wiki, manual, instrucciones.
---

# Documentación del Proyecto

## 1. Principio Fundamental
**Regla:** "El código que no está documentado no existe para quien viene después."

- No escribir código oculto; siempre actualizar el `README.md` o `PROJECT_STATE.md` tras cambios estructurales.
- No dejar código comentado; usar la posteridad del `Git` si es necesario recuperar algo.

---

## 2. README del Proyecto (Root)
El `README.md` es la cara del proyecto. Debe incluir:
- **Stack Tecnológico:** Versiones exactas (Next.js 16, Supabase, etc.).
- **Configuración Local:** Requisitos y pasos de instalación (`npm install`, `.env`).
- **Estructura de Carpetas:** Mapa visual del proyecto.
- **Roles de Agentes IA:** Quién hace qué (Claude, Antigravity, Qwen).

---

## 3. CHANGELOG (Keep a Changelog)
**Formato:** Basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).
- **Añadido:** Nuevas funcionalidades.
- **Cambiado:** Actualizaciones de lógica o UI.
- **Depreciado:** Próximo a eliminar.
- **Eliminado:** Removido del sistema.
- **Arreglado:** Correcciones de bugs.
- **Seguridad:** Vulnerabilidades mitigadas.

---

## 4. Documentación de API (JSDoc / OpenAPI)
**Regla:** Los endpoints críticos deben estar documentados internamente.
- Usar `JSDoc` para describir funciones públicas y sus parámetros/retornos.
- Mantener un `openapi.json` actualizado para integraciones externas.

---

## 5. Decisiones Técnicas (DECISIONS.md)
Documentar el **POR QUÉ** de decisiones controversiales o grandes cambios de arquitectura.
- Contexto del problema.
- Decisión tomada.
- Alternativas descartadas.
- Consecuencias esperadas.

---

## 6. Guías de Usuario
**Regla:** Manuales sencillos en `Markdown` dentro de `docs/user-manuals/`.
- ¿Cómo crear mi primer factura?
- ¿Cómo configurar mis sedes?
- ¿Cómo actualizar mi plan?

---

## checklist de documentación
[ ] README.md actualizado.
[ ] CHANGELOG.md refleja cambios recientes.
[ ] Funciones core con JSDoc.
[ ] Sin código muerto o comentado.
