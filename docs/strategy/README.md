# 📈 Strategy Documentation

Documentación de estrategia y producto - El "por qué" y "cuándo" del proyecto.

---

## 📚 Archivos en Esta Carpeta

| Archivo | Propósito | Cuándo Leer |
|---------|-----------|-------------|
| **PRODUCT_STRATEGY.md** | Visión, identidad y modelo de negocio | **PRIMERO** - Entender el producto |
| **ROADMAP_12M.md** | Roadmap de 12 meses | Al priorizar features |
| **IMPLEMENTATION_ROADMAP.md** | Plan de implementación detallado | Al ejecutar fases |
| **plan_modulos_planes.md** | Planes y activación de módulos | Al trabajar con pricing |
| **FISCAL_INTEGRATION_FUTURE.md** | Estrategia de integración fiscal | Al planear facturación |

---

## 🎯 Ruta de Lectura Recomendada

### Para Entender el Producto
```
1. PRODUCT_STRATEGY.md           ← Visión y modelo de negocio
2. ROADMAP_12M.md                ← Roadmap estratégico
3. IMPLEMENTATION_ROADMAP.md     ← Plan de ejecución
```

### Para Trabajar con Pricing/Módulos
```
1. plan_modulos_planes.md        ← Planes y módulos por industria
2. PRODUCT_STRATEGY.md           ← Modelo de precios
3. technical/INDUSTRIES_ENGINE.md ← Configuración por industria
```

---

## 📊 Modelo de Precios Actual

| Plan | Precio | Usuarios | Productos | Módulos Incluidos |
|------|--------|----------|-----------|-------------------|
| **Free** | $0/mes | 1 | 10 | dashboard, inventory, sales |
| **Starter** | $49k/mes | 3 | 100 | 9 módulos universales |
| **Professional** | $129k/mes | 10 | 500 | 15 módulos + industria |
| **Enterprise** | $299k/mes | ∞ | ∞ | Todos los módulos |

---

## 🗺️ Roadmap Actual

### Fase 11 - Integración Financiera (Marzo 2026)
- [ ] Conectar RPCs de pricing con MercadoPago
- [ ] Activar paso de facturación en onboarding
- [ ] Ejecutar migraciones SQL de módulos

### Próximamente
- **v4.8.0** - Módulo de Reservas (Abril 2026)
- **v4.9.0** - Facturación Electrónica Colombia (Mayo 2026)
- **v5.0.0** - Multi-sede + i18n (Junio 2026)

---

## 🔗 Relacionados

- **[00-START-HERE.md](../00-START-HERE.md)** - Índice principal
- **[technical/INDUSTRIES_ENGINE.md](../technical/INDUSTRIES_ENGINE.md)** - Motor de industrias
- **[../CHANGELOG.md](../CHANGELOG.md)** - Historial de cambios
