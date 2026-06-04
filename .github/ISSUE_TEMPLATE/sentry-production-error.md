---
name: Sentry production error
about: Error real de produccion capturado por Sentry
title: "[Sentry][P1] "
labels: ["sentry", "production", "needs-triage"]
assignees: ""
---

## Sentry

- Issue URL:
- Issue ID:
- Event URL:
- Environment: production
- Release:
- Level:
- Events/users affected:

## Impacto

- Flujo afectado:
- Organizacion/tenant afectado, si aplica y esta anonimizado:
- P0/P1/P2:
- Primer evento:
- Ultimo evento:

## Contexto tecnico

- Route/transaction:
- Runtime:
- Stacktrace relevante:

```txt
Pegar solo el fragmento necesario. No incluir tokens, cookies, Authorization headers ni service role keys.
```

- Breadcrumbs/replay:
- Tags utiles:

## Redaccion

- [ ] No contiene secretos.
- [ ] No contiene cookies ni headers sensibles.
- [ ] No contiene PII innecesaria.
- [ ] Si se filtro un secreto por error, ya fue rotado.

## Instruccion para Codex

Seguir `AGENTS.md`, `docs/ORCHESTRATOR.md`, `docs/SKILLS_ROUTING.md` y `docs/MONITORING_REPAIR_FLOW.md`.

Codex debe reproducir, corregir localmente, agregar test de regresion cuando aplique, ejecutar checks y esperar aprobacion humana antes de commit, push, PR o deploy.
