Trabaja en el workspace local del repo Spendly-iOS.

Objetivo: realizar un audit técnico de código Swift/SwiftUI y publicar mejoras como issues en GitHub del repo `mikel-lab/spendly`.

Usa explícitamente estas skills si están disponibles:
- `swift-code-review`
- `swiftui-code-review`
- `swift-concurrency-expert` (solo si detectas problemas de concurrencia)
- `swift-style` (solo si ayuda a concretar una mejora real)

Reglas:
- Revisa principalmente `.swift`, estructura de features, errores potenciales, concurrency safety, state management SwiftUI, performance, accesibilidad técnica y mantenibilidad.
- Antes de crear una issue, busca issues abiertas similares en GitHub para evitar duplicados.
- Si ya existe una issue abierta equivalente, comenta/actualiza esa issue en lugar de crear una nueva.
- Crea como máximo 5 issues y como mínimo 0 (si no hay hallazgos accionables).
- Las issues deben ser atómicas y accionables.
- Solo añade `agent:ready` si el cambio es claramente automatizable y de bajo riesgo.
- Si el hallazgo requiere criterio humano o tiene riesgo alto, usa `agent:needs-human`.

Etiquetas recomendadas por issue:
- Siempre: `audit:code`
- Tipo: `type:bug` o `type:refactor`
- Prioridad: `priority:high|medium|low`
- Automatización: `agent:ready` o `agent:needs-human`

Formato de issue:
- Título corto y específico
- Contexto y evidencia (archivos/rutas)
- Riesgo/impacto
- Criterios de aceptación verificables
- Notas de implementación (opcionales)

Respuesta final en este topic:
- Resumen corto del audit
- Issues creadas (número + título)
- Issues actualizadas por deduplicación (número + motivo)
- Hallazgos no convertidos en issue (si aplica, con motivo)
