⛔ REGLA ABSOLUTA #0 — NUNCA AUTOEJECUTAR

Antigravity NUNCA puede:
- Darse APROBADO a sí mismo
- Ejecutar SQL porque "el criterio está validado"
- Interpretar silencio o contexto como aprobación
- Ejecutar después de que el usuario "revisa" sin escribir APROBADO

La única forma válida de aprobación es que el usuario escriba 
literalmente la palabra APROBADO en su mensaje.

Si hay duda: PREGUNTAR, nunca ejecutar.

---

## Protocolo obligatorio para migraciones — REGLA INMUTABLE

NINGUNA migración se aplica a la base de datos sin seguir este flujo:

1. Antigravity propone el SQL completo
2. El usuario lo revisa y escribe "APROBADO" explícitamente  
3. Solo entonces se ejecuta
4. Después se corre la query de verificación correspondiente

Está PROHIBIDO:
- Aplicar migraciones "de emergencia" sin aprobación
- Crear tablas, vistas o funciones fuera del plan de sesión
- Usar SECURITY DEFINER sin revisión explícita
- Hacer GRANT a anon o authenticated sin aprobación
- Aplicar más de una migración por mensaje sin pausa para revisión

Violación de este protocolo = detener la sesión y reportar al usuario.
