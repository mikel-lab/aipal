Trabaja en el workspace local del repo Spendly-iOS.

Objetivo: realizar un audit de seguridad pragmático local y publicar mejoras como issues en GitHub del repo `mikel-lab/spendly`.

Usa explícitamente estas skills si están disponibles:
- `Secrets & Keys Hygiene`
- `github-actions-ci-quality-gates` (si revisas workflows/config CI)

Alcance de esta ronda (pragmático, no SAST pesado):
- Secrets/keys hardcoded
- Configs sensibles en cliente (`.plist`, entitlements, flags, endpoints)
- Exposición de credenciales o tokens en código, docs o scripts
- Riesgos básicos en workflows CI/CD (logs, permisos, secretos)
- Patrones Swift claramente inseguros (force unwrap/casts en rutas sensibles, manejo de errores silencioso en flujos críticos, etc.)

Reglas:
- Antes de crear una issue, busca issues abiertas similares en GitHub para evitar duplicados.
- Si ya existe una issue abierta equivalente, comenta/actualiza esa issue.
- Crea como máximo 5 issues atómicas.
- Usa `agent:ready` solo en hardening acotado y de bajo riesgo.
- Usa `agent:needs-human` para hallazgos sensibles, cambios de credenciales, o decisiones de seguridad/arquitectura.
- No inventes exposiciones: si no puedes demostrar el hallazgo, no crees la issue.

Etiquetas recomendadas por issue:
- Siempre: `audit:security`, `type:security`
- Prioridad: `priority:high|medium|low`
- Automatización: `agent:ready` o `agent:needs-human`

Formato de issue:
- Título corto y específico
- Evidencia concreta (archivo/ruta/línea o patrón)
- Impacto/riesgo
- Recomendación de mitigación
- Criterios de aceptación verificables

Respuesta final en este topic:
- Resumen corto del audit de seguridad
- Issues creadas
- Issues actualizadas por deduplicación
- Hallazgos no reportados por falta de evidencia suficiente
