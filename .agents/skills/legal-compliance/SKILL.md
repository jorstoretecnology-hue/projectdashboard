---
name: legal-compliance
description: >
  Cumplimiento legal, protección de datos (Habeas Data), Términos y
  Condiciones, y política fiscal en Colombia. Usar cuando el usuario
  quiera: redactar T&C, crear políticas de privacidad, cumplir con la
  Ley 1581 (Habeas Data), o definir la postura legal frente a la DIAN.
  Activar con: legal, privacidad, términos, T&C, Habeas Data, DIAN,
  fiscal, datos, protección, contrato, usuario, ley.
---

# Cumplimiento Legal y Privacidad

## 1. Protección de Datos (Ley 1581 - Habeas Data)

**Regla:** Todo tenant debe aceptar la autorización de tratamiento de datos personales antes de registrar su primer cliente.

- **Frontend:** Checkbox obligatorio en el registro de clientes.
- **Backend:** Almacenar `data_consent_at` y `ip_address` en la tabla `tenants` y `customers`.
- **Derechos:** Los usuarios finales pueden solicitar baja de datos vía `soporte@antigravity.co`.

---

## 2. Términos y Condiciones (T&C)
El core de los T&C para una plataforma SaaS B2B en Colombia debe incluir:
- **Propiedad de los Datos:** El tenant es dueño de su información; Antigravity es el procesador.
- **Disponibilidad (SLA):** Meta del 99.5% de disponibilidad mensual.
- **Limitación de Responsabilidad:** No somos responsables por errores contables o fiscales del usuario.
- **Jurisdicción:** Leyes de la República de Colombia.

---

## 3. Política Fiscal (DIAN)
**Regla:** NO somos un software contable ni facturador electrónico directo.

- **Postura:** Somos un "Cerebro Operativo" que se integra con proveedores tecnológicos autorizados por la DIAN.
- **Responsabilidad:** El usuario es responsable de su cumplimiento tributario.
- **Transparencia:** Mostrar siempre que los valores son informativos hasta que sean validados por la DIAN.

---

## 4. Auditoría de Seguridad Legal
**Regla:** Cada acción crítica (borrar venta, anular factura, cambiar stock manual) DEBE estar registrada en el `audit_log`.

- **Métrica:** Un log de auditoría debe ser inmutable y persistente por al menos 5 años según leyes comerciales.

---

## 5. Plantillas Legales (Resumen)
**Autorización Tratamiento:**
> "Autorizo a ANTIGRAVITY SAAS para tratar mis datos personales y los de mis clientes de acuerdo con su Política de Privacidad y la Ley 1581 de 2012, con el fin de gestionar la operación de mi negocio."

**Cláusula de No Garantía Fiscal:**
> "ANTIGRAVITY suministra herramientas de gestión operativa. La validez fiscal de los documentos generados depende de la configuración del usuario y su cumplimiento ante la DIAN."

---

## checklist legal
[ ] Checkbox de Habeas Data activo en registro.
[ ] T&C accesibles desde el footer.
[ ] Audit Logs funcionando para acciones críticas.
[ ] Política de Privacidad actualizada.
