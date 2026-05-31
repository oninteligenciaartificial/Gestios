# Evals — Flujos críticos GestiOS

Fixtures de evaluación para flujos de negocio críticos. Complementan los 386 tests unitarios/integración (vitest) con casos end-to-end documentados que NO deben romperse nunca.

## Flujos cubiertos

Ver `critical-flows.json` para los casos canónicos y resultados esperados.

| Flujo | Por qué crítico | Invariante |
|-------|-----------------|------------|
| Checkout tienda | Ingresos directos | Stock atómico, sin negativos, sin precio manipulado |
| Aislamiento tenant | Seguridad multi-tenant | Toda query filtra `organizationId` |
| Auth cron | Superficie de ataque | `verifyCronSecret` timing-safe, 401 si falta |
| Notificaciones | Engagement | Scope por org, no fuga cross-tenant |

## Uso

Estos fixtures son la fuente de verdad para QA manual y futuros tests E2E (`e2e-testing` skill). Antes de release, validar cada flujo contra su resultado esperado.
