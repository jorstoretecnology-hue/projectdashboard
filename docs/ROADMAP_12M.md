# 📅 Hoja de Ruta: 12 Meses (ROADMAP_12M.md)

## Fase 0: QA & Estabilización de Flujos (Mes 1)
**Objetivo**: Asegurar que los flujos críticos (Tenants, Usuarios, Permisos) funcionen sin fisuras en producción.
- [x] **End-to-End Testing**: Validación manual y automatizada de flujos de registro, login y onboarding. (Fixed Onboarding Loop)
- [x] **Role Validation**: Auditoría de permisos (Owner vs Admin vs User) para garantizar aislamiento de datos. (Fixed SuperAdmin/Owner roles)
- [x] **Dashboard Visibility**: Corrección de módulos y KPIs vacíos según el plan del tenant.
- [ ] **Cross-Tenant Isolation**: Pruebas de estrés para confirmar que NUNCA se cruzan datos entre tenants.
- [ ] **UI/UX Polish**: Corrección de inconsistencias visuales y feedback de usuario en tiempo real.

## Fase 1: Consolidación Operativa (Mes 2-3)
**Objetivo**: Cimentar el inventario y la automatización base sobre una plataforma estable.
- [ ] **Inventory Core**: Implementación de bloqueo de stock negativo y sistema de override auditado.
- [ ] **Automation Engine**: Ejecución confiable de las primeras 5 plantillas industriales.
- [ ] **Audit Trail**: Registro inmutable de acciones críticas en DB.
- [ ] **Performance Tuning**: Optimización de queries y renderizado para dashboards con alta carga de datos.

## Fase 2: Multicanalidad y Resiliencia (Mes 4-6)
**Objetivo**: Comunicación masiva y segura.
- [ ] **Multi-provider Support**: Integración nativa Meta + Resend con mecanismo de failover.
- [ ] **Communication Service**: Orquestación centralizada con rate-limiting y retry backoff.
- [ ] **Dead Letter Queue**: Manejo de fallos críticos de comunicación para evitar pérdida de datos.
- [ ] **Automated Regression Testing**: Suite de pruebas para evitar regresiones en cada deploy.

## Fase 3: Conectividad y Ecosistema (Mes 7-9)
**Objetivo**: Apertura a integraciones externas.
- [ ] **Fiscal Integration Layer**: Preparación de la arquitectura para conectar con facturadores externos.
- [ ] **Webhooks Entrantes**: Capacidad de recibir estados de proveedores de comunicación.
- [ ] **API de Automatización**: Permite a otros servicios disparar las plantillas del OS.

## Fase 4: Inteligencia y Especialización (Mes 10-12)
**Objetivo**: Diferenciación tecnológica (Visión futura).
- [ ] **IA de Asistencia**: Recomendaciones operativas basadas en el historial del tenant.
- [ ] **Agentes de Voz (Beta)**: Automatización de citas telefónicas.
- [ ] **Nuevas Verticales**: Apertura masiva de industrias adicionales.

---

### Decisión de Diseño Especial
- **QA First Approach**: No se avanza de fase sin aprobar los tests de regresión de la fase anterior.
- Se elimina cualquier mención a "Facturación Electrónica Propia" del roadmap para evitar distracciones regulatorias. La Fase 3 se centra exclusivamente en el **Conector Externo**.
- La IA no es el motor del MVP, es el acelerador de la Fase 4.
