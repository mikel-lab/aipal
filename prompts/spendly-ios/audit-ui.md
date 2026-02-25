Trabaja en el workspace local del repo Spendly-iOS.

Objetivo: realizar un UI quality audit (SwiftUI + UX de producto financiero) y publicar mejoras como issues en GitHub del repo `mikel-lab/spendly`.

Usa explícitamente estas skills si están disponibles:
- `swiftui-code-review`
- `swiftui-expert-skill`
- `Financial Dashboard Design`
- `Risk First Layout System`
- `Financial Data Viz`

Reglas:
- Evalúa calidad visual, jerarquía de información, claridad de métricas, accesibilidad, consistencia de spacing/typography, estados vacíos/error/loading, y patrones SwiftUI que afecten UX.
- Prioriza hallazgos con impacto real en comprensión, confianza y usabilidad (no solo estilo cosmético).
- Antes de crear una issue, busca issues abiertas similares en GitHub para evitar duplicados.
- Si ya existe una issue abierta equivalente, comenta/actualiza esa issue.
- Crea como máximo 5 issues atómicas.
- Solo añade `agent:ready` si la mejora está bien acotada y es implementable sin decisiones de producto ambiguas.
- Usa `agent:needs-human` cuando implique decisiones visuales amplias o cambios de dirección de producto.

Etiquetas recomendadas por issue:
- Siempre: `audit:ui`, `type:ui`
- Prioridad: `priority:high|medium|low`
- Automatización: `agent:ready` o `agent:needs-human`

Formato de issue:
- Título corto y específico
- Problema observado + evidencia (pantalla/componente/ruta)
- Riesgo UX (confusión, mala legibilidad, baja confianza, accesibilidad, etc.)
- Criterios de aceptación verificables

Respuesta final en este topic:
- Resumen corto del audit UI
- Issues creadas
- Issues actualizadas por deduplicación
- Hallazgos descartados y motivo
