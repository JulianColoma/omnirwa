# Análisis estático con Slither

## Cómo correrlo

```bash
pipx install slither-analyzer        # o: uv tool install slither-analyzer / pip install slither-analyzer
slither .                            # usa slither.config.json (filtra lib/, test/, script/)
slither . --checklist > docs/slither-report.md
```

> Slither llama a `forge`: el primero en el `PATH` tiene que ser el de Foundry (`~/.foundry/bin`). Si hay otro
> `forge` antes, falla con `The --build-info option does not exist`.
> El código de salida 255 solo indica que hay hallazgos.

## Hallazgos

Slither 0.11.6 sobre el código final: **7 resultados en 4 detectores**, ninguno de severidad alta.
Reporte completo: [slither-report.md](slither-report.md).
Estados posibles: **Corregido** · **Falso positivo** · **Aceptado** (con justificación) · **Externo** (OpenZeppelin).

| Detector | Impacto | Contrato / función | Estado | Justificación |
|---|---|---|---|---|
| `unused-return` (×3) | Medium | `RWATokenizer1155._update` (`Checkpoints.push`) | Aceptado | `push` devuelve el saldo anterior y el nuevo, que no se necesitan: el valor nuevo ya se calculó antes. |
| `timestamp` (×2) | Low | `RWATokenizer1155.balanceOfAt` / `totalSupplyAt` | Aceptado | Solo se compara para rechazar consultas a futuro (`FutureLookup`). Las ventanas de votación son de minutos o días un validador solo puede mover el timestamp unos segundos. |
| `naming-convention` | Informational | `AssetVotes.CLOCK_MODE()` | Falso positivo | El nombre lo exige ERC-6372 (`IERC6372.CLOCK_MODE`); el Governor de OZ lo llama asi. |
| `unimplemented-functions` | Informational | `RWATokenizer1155` / `IRWATokenizer.balanceOf` | Falso positivo | Está implementada con `override(ERC1155, IRWATokenizer)`, si no, el contrato no compilaría. |
| varios | — | `lib/openzeppelin-contracts` | Externo | Fuera de alcance (filtrado por `slither.config.json`). |

Detectores que se esperaban y **no aparecen** en la corrida final: `reentrancy-*` (`nonReentrant` + CEI en
`buyFractions`, `depositDividends` y `claimDividends`) y `divide-before-multiply` (el acumulador de dividendos
multiplica por `PRECISION` antes de dividir).
