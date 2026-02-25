Trabaja en el workspace local del repo Spendly-iOS con autonomía total para resolver issues de GitHub.

Objetivo: gestionar 1 issue por ejecución (máximo), priorizando PRs ya abiertas del agente y haciendo merge manual cuando el CI esté en verde.

Reglas globales:
- Repo GitHub: `mikel-lab/spendly`
- Rama base: `dev_agents`
- Ramas de trabajo: prefijo `codex/` y formato `codex/issue-<numero>-<slug>`
- Método de merge: `merge commit`
- No pedir validación manual al usuario durante el flujo.
- Usa `git-workflow` siempre.
- Si falla CI, usa `ci-feedback-driven-development`.
- Si el fallo es de build/test iOS, usa `ios-build-review`.

Flujo (orden obligatorio):

1) Retomar PRs abiertas gestionadas por el agente (prioridad)
- Busca PRs abiertas contra `dev_agents` relacionadas con el agente (preferentemente con label `agent:managed`).
- Si hay una PR abierta:
  - revisa estado del CI/checks
  - si está `pending`/`in_progress`: termina run con resumen corto (no cojas issue nueva)
  - si está `failed`: analiza el primer fallo relevante, corrige en la misma rama, push y deja la PR para la siguiente ronda
  - si está `success`: haz merge con `merge commit`, borra rama remota y local si aplica, actualiza/cierra issue enlazada, limpia labels (`agent:in-progress`, `agent:ci-failed`)

2) Si no hay PR abierta del agente
- Busca issues abiertas con label `agent:ready`
- Excluye issues con `agent:blocked` o `agent:needs-human`
- Elige solo 1 issue (prioridad alta > media > baja; luego más antigua)
- Marca issue como `agent:in-progress`
- Crea rama desde `dev_agents`
- Implementa el cambio
- Valida localmente con la comprobación mínima útil
- Commit con formato `type: short summary`
- Push y crea PR contra `dev_agents`
- Añade/asegura label `agent:managed` en la PR
- Deja la issue enlazada

3) Si no hay trabajo elegible
- no-op limpio y resumen corto

Política de CI/reparación:
- No esperes indefinidamente en un solo run
- En cada run prioriza retomar PRs abiertas del agente
- Si CI falla repetidamente por flakiness o bloqueo externo, comenta evidencia y marca `agent:blocked` o `agent:needs-human`

Respuesta final en este topic:
- Estado de PRs retomadas (si hubo)
- Issue trabajada (si hubo)
- Acciones realizadas (branch/commit/PR/merge/delete)
- Próximo paso esperado en la siguiente ronda
