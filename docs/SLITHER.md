# Análisis estático con Slither

## Cómo correrlo

```bash
pipx install slither-analyzer        # o: pip install slither-analyzer
slither .                            # usa slither.config.json (filtra lib/, test/, script/)
slither . --checklist > docs/slither-report.md
```

## Hallazgos

> TODO(B): completar después de correr Slither sobre el código final (antes del deploy del 25/10).
> Estados posibles: **Corregido** · **Falso positivo** · **Aceptado** (con justificación) · **Externo** (OpenZeppelin).

| Detector | Contrato / función | Estado | Justificación |
|---|---|---|---|
| `timestamp` | `RWATokenizer1155.balanceOfAt/totalSupplyAt`, Governor | Aceptado (esperado) | Las ventanas son de minutos o días; un validador solo puede correr el timestamp unos segundos. |
| `divide-before-multiply` | `RWATokenizer1155._accrue` / `depositDividends` | Aceptado (esperado) | Patrón intencional del acumulador; error acotado por `PRECISION = 1e18` y cubierto por el fuzz test. |
| `unused-return` | `Checkpoints.push` en `_update` | Aceptado (esperado) | El valor de retorno (saldo anterior/nuevo) no se necesita. |
| `reentrancy-*` | `buyFractions`, `claimDividends`, `depositDividends` | A revisar | `nonReentrant` + CEI: estado y eventos antes de las llamadas externas. |
| varios | `lib/openzeppelin-contracts` | Externo | Fuera de alcance. |
