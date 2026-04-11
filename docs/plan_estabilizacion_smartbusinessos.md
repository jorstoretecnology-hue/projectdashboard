__SMART BUSINESS OS__

Plan de Estabilización y Proceso

Versión 1\.0  ·  Marzo 2026

*Documento para Antigravity \+ Equipo de Desarrollo*

# __1\. Contexto y Diagnóstico__

El proyecto tiene una base técnica sólida pero acumuló deuda de proceso durante el desarrollo acelerado de las primeras 14 fases\. Este plan establece el proceso correcto para llegar al primer cliente real con confianza\.

## __1\.1 Lo que está bien — no tocar__

__Activo__

__Valor__

30,324 líneas de código TypeScript

Lógica de negocio real, no scaffolding

13 módulos completos

Sales, Inventory, Billing, CRM, etc\.

Sistema multi\-tenant con RLS

Aislamiento verificado y funcional

Integración MercadoPago

Webhooks, SDK, handler implementados

Documentación técnica

API Spec, Permissions Matrix, Business Flows

Motor de industrias

Flexible para retail, hostelería, talleres

## __1\.2 Lo que falló — causa raíz__

__Causa raíz: velocidad sin proceso__

102 migraciones en 2 meses = 1\.5 por día hábil

Migraciones aplicadas sin aprobación explícita

Brecha IDOR activa: v\_sales\_tracking con GRANT a anon

Roles duplicados en 4 capas distintas \(ya corregido\)

Schema creciendo sin Definition of Done

La buena noticia: no hay clientes reales\. Esto significa margen para limpiar sin riesgo de pérdida de datos\. El código es el activo — el proceso es lo que hay que cambiar\.

# __2\. Protocolo Inmutable con Antigravity__

__REGLA \#0 — Nunca autoejecutar__

Antigravity NUNCA puede darse APROBADO a sí mismo\.

La única aprobación válida es que el usuario escriba literalmente 'APROBADO'\.

Si hay duda: PREGUNTAR, nunca ejecutar\.

Violación = detener sesión y reportar\.

## __2\.1 Flujo obligatorio para cada sesión__

__Paso__

__Responsable__

__Acción__

1\. Leer contexto

Antigravity

Leer PROGRESS\_TRACKER\.md antes de empezar

2\. Proponer

Antigravity

Mostrar SQL o código completo sin ejecutar

3\. Aprobar

Usuario

Escribir APROBADO explícitamente

4\. Ejecutar

Antigravity

Solo después del APROBADO del usuario

5\. Verificar

Ambos

Query de verificación en Supabase

6\. Documentar

Antigravity

Actualizar PROGRESS\_TRACKER \+ CHANGELOG

## __2\.2 Una sesión = una tarea__

- Una sesión tiene exactamente un objetivo definido antes de empezar
- Cero 'migraciones de emergencia' — si algo se rompe: parar y reportar
- Máximo una migración por sesión, nunca en batch sin pausa
- npm run type\-check debe pasar con 0 errores antes de cerrar
- Query de verificación en Supabase antes de marcar como done

# __3\. Plan de 3 Semanas hacia Producción__

## __Semana 1 — Freeze y Limpieza \(Hoy al 6 de abril\)__

__Regla de la semana 1__

CERO features nuevas\. Solo estabilizar lo existente\.

El schema debe quedar determinístico: supabase db reset produce siempre el mismo resultado\.

### __Sesiones pendientes esta semana__

__Sesión__

__Tarea__

__Entregable verificable__

S1 — Auditoria DB

Revisar todas las funciones SECURITY DEFINER del inventario

Lista aprobada/eliminada por función

S2 — Tracking

Verificar get\_safe\_tracking\_data sin dependencia de vista

Test de URL de tracking real funcionando

S3 — Schema limpio

Resolver webhook\_logs, feature\_flags no aprobado

supabase db reset sin errores

S4 — Indices FK

Crear índices en FKs críticas \(sales, customers, payments\)

Query de explain sin Seq Scan en JOINs

S5 — RLS performance

Convertir policies con auth\.\*\(\) a funciones LANGUAGE sql

Advisor de Supabase sin warnings de auth por fila

## __Semana 2 — Deuda Técnica Planificada \(7\-13 de abril\)__

__Prioridad__

__Tarea__

__Principio__

__Impacto__

P1

Unificar tenants\.plan → subscriptions como fuente única

Uncle Bob DRY

Billing correcto al cancelar

P2

Deprecar tenants\.active\_modules → tenant\_modules

Uncle Bob SRP

Una fuente de verdad para módulos

P3

Agregar tenant\_id a sale\_items

Clean Architecture

RLS simple, performance a escala

P4

Tests de integración billing y onboarding

Cohn — pirámide correcta

Detectar regresiones antes de deploy

P5

Eliminar profiles\.role \(columna legacy\)

Uncle Bob DRY

Un sistema de roles, sin ambigüedad

## __Semana 3 — Primer Cliente Real \(14\-20 de abril\)__

- Smoke test completo del flujo: registro → onboarding → primer tenant → primera venta
- Pruebas E2E con sandbox de MercadoPago \(Fase 11e del roadmap\)
- Revisión de seguridad final con el agente de Supabase
- Definition of Done para 'listo para producción' firmado por el equipo

# __4\. Definition of Done \(Cohn\)__

Una tarea NO está terminada hasta que cumple TODOS estos criterios:

__Criterio__

__Verificación__

SQL revisado antes de ejecutar

Usuario escribió APROBADO en el chat

Migración tiene query de verificación

Query ejecutada y resultado pasado al consultor

npm run type\-check pasa con 0 errores

Output mostrado en el cierre de sesión

PROGRESS\_TRACKER\.md actualizado

Fecha, logros y próximo paso registrados

CHANGELOG\.md con entrada descriptiva

Versión incrementada y cambios listados

No se crearon archivos fuera del plan

Inventario de archivos nuevos revisado

No hay migraciones no aprobadas en supabase\_migrations

Query a schema\_migrations verificada

# __5\. Cómo Documentar Este Plan__

Antigravity debe mantener estos documentos vivos\. Cada uno tiene un propósito específico — no duplicar información entre ellos\.

__Archivo__

__Propósito__

__Cuándo actualizar__

docs/PROGRESS\_TRACKER\.md

Estado actual, última sesión, próximo paso

Al cerrar cada sesión

CHANGELOG\.md

Historial de versiones con cambios técnicos

Al cerrar cada sesión

docs/strategy/ROADMAP\_12M\.md

Fases del producto a 12 meses

Al completar una fase

docs/technical/DATABASE\_SCHEMA\.md

Schema actualizado de la DB

Al aplicar una migración nueva

docs/security/SECURITY\_CHECKLIST\.md

Estado de controles de seguridad

Al cerrar cada semana

\.antigravity/rules/database\-rules\.md

Protocolo inmutable de migraciones

Solo con aprobación explícita

docs/operations/TASK\_HANDOFF\_TEMPLATE\.md

Template de cierre de sesión

Referencia — no modificar

## __5\.1 Template de cierre de sesión__

Al finalizar cada sesión, Antigravity debe actualizar PROGRESS\_TRACKER\.md con esta estructura:

__Template obligatorio de cierre__

Fecha: \[fecha\]

Sesión: \[número y nombre\]

Logros: \[lista de cambios aplicados con verificación\]

Migraciones aplicadas: \[lista con timestamps\]

Verificaciones en Supabase: \[queries ejecutadas y resultado\]

npm run type\-check: \[número de errores\]

Próximo paso: \[tarea específica, no vaga\]

Deuda identificada: \[problemas vistos pero no resueltos esta sesión\]

## __5\.2 Cómo nombrar migraciones__

__Patrón__

__Ejemplo__

__Uso__

YYYYMMDDNNNNNN\_verbo\_entidad\.sql

20260401000001\_add\_tenant\_id\_sale\_items\.sql

Cambio planificado

YYYYMMDDNNNNNN\_fix\_descripcion\.sql

20260401000002\_fix\_products\_sku\_unique\.sql

Corrección de bug

YYYYMMDDNNNNNN\_drop\_tabla\.sql

20260401000003\_drop\_webhook\_events\.sql

Eliminación

__Prohibido__

Nombres como: emergency\_fix, total\_reset, master\_repair, nuke\_conflict

Timestamps duplicados en el mismo día

Más de una migración por sesión sin pausa de revisión

# __6\. Métricas de Salud del Proyecto__

Estas métricas deben revisarse al inicio de cada semana\. Si alguna está en rojo, es prioridad antes de avanzar features\.

__Métrica__

__Objetivo__

__Cómo verificar__

__Estado hoy__

TypeScript errors

0

npm run type\-check

0 ✓

Migraciones con timestamp duplicado

0

ls migrations/ | sort | uniq \-d

0 ✓

GRANT a anon en tablas operativas

0

pg\_policies WHERE roles @> '\{anon\}'

0 ✓

Funciones SECURITY DEFINER sin search\_path

0

pg\_proc WHERE prosecdef AND proconfig IS NULL

Pendiente

Policies con auth\.\*\(\) por fila

0

pg\_policies WHERE qual LIKE '%auth\.uid\(\)%'

Pendiente

Cobertura de tests

>20%

npm run test \-\- \-\-coverage

~5%

FKs sin índice

0 críticas

Supabase advisor

Pendiente

# __7\. Prompt de Inicio para Antigravity__

Pega este prompt al inicio de cada sesión de trabajo:

__Prompt de inicio de sesión \(copiar y pegar\)__

Lee docs/PROGRESS\_TRACKER\.md completo\.

Lee \.antigravity/rules/database\-rules\.md completo\.

Reporta: \(1\) qué se hizo en la última sesión, \(2\) cuál es el próximo paso, \(3\) si hay deuda crítica pendiente\.

No ejecutes nada hasta que yo confirme la tarea de esta sesión\.

Recuerda: APROBADO debe venir de mí, nunca de ti mismo\.

__Y este prompt al cerrar cada sesión:__

__Prompt de cierre de sesión \(copiar y pegar\)__

Actualiza docs/PROGRESS\_TRACKER\.md con el template de cierre\.

Actualiza CHANGELOG\.md con los cambios de esta sesión\.

Muestra la lista de archivos nuevos o modificados\.

Muestra el output de npm run type\-check\.

Si hubo migraciones, muestra la query de verificación y su resultado\.

No cierres la sesión hasta que yo confirme que el cierre está completo\.

*Smart Business OS — Plan de Estabilización v1\.0*

*Elaborado con base en principios de Robert C\. Martin y Mike Cohn*

