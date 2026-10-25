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

Slither 0.11.6 sobre el código desplegado en Sepolia (commit `b242d0f`, con el nombre del activo on-chain):
**7 resultados en 4 detectores**, ninguno de severidad alta. 59 contratos analizados con 102 detectores.
Reporte completo: [slither-report.md](slither-report.md).
Estados posibles: **Corregido** · **Falso positivo** · **Aceptado** (con justificación) · **Externo** (OpenZeppelin).

| Detector | Impacto | Contrato / función | Estado | Justificación |
|---|---|---|---|---|
| `unused-return` (×3) | Medium | `RWATokenizer1155._update` (`Checkpoints.push`) | Aceptado | `push` devuelve el saldo anterior y el nuevo, que no se necesitan: el valor nuevo ya se calculó antes. |
| `timestamp` (×2) | Low | `RWATokenizer1155.balanceOfAt` / `totalSupplyAt` | Aceptado | Solo se compara para rechazar consultas a futuro (`FutureLookup`). Las ventanas de votación son de minutos o días; un validador solo puede mover el timestamp unos segundos. |
| `naming-convention` | Informational | `AssetVotes.CLOCK_MODE()` | Falso positivo | El nombre lo exige ERC-6372 (`IERC6372.CLOCK_MODE`); el Governor de OZ lo llama así. |
| `unimplemented-functions` | Informational | `RWATokenizer1155` / `IRWATokenizer.balanceOf` | Falso positivo | Está implementada con `override(ERC1155, IRWATokenizer)`; si no, el contrato no compilaría. |
| `reentrancy-*` | — | `buyFractions`, `depositDividends`, `claimDividends` | Corregido (por diseño) | Slither no lo reporta: las tres funciones son `nonReentrant` y siguen CEI (estado y eventos antes de las llamadas a `SafeERC20`). Lo cubre el test con `ReentrantBuyer`. |
| `divide-before-multiply` | — | `RWATokenizer1155._accrue` / `depositDividends` | Corregido (por diseño) | Slither no lo reporta: el acumulador multiplica por `PRECISION = 1e18` antes de dividir. El redondeo lo cubre `testFuzz_DividendsNeverExceedDeposit`. |
| varios | — | `lib/openzeppelin-contracts` | Externo | Fuera de alcance (filtrado por `slither.config.json`). |

## Warnings del linter de `forge build`

`forge build` (Foundry 1.8) corre el linter de Foundry y deja 7 avisos. Ninguno se silencia en el código: agregar
comentarios `forge-lint: disable-next-line` en `contracts/` cambiaría el bytecode y el código desplegado y verificado
dejaría de coincidir con el del repo. `screaming-snake-case-immutable` y `mixed-case-function` están excluidos en
`foundry.toml` por los motivos que se explican ahí.

| Lint | Ubicación | Estado | Justificación |
|---|---|---|---|
| `block-timestamp` (×2) | `RWATokenizer1155.balanceOfAt` / `totalSupplyAt` (`timepoint >= block.timestamp`) | Aceptado | Es el mismo caso que el detector `timestamp` de Slither: la comparación solo rechaza consultas a futuro, igual que `Votes` de OpenZeppelin. Con reloj por timestamp (ERC-6372, D14) no hay alternativa, y el margen de manipulación de un validador (segundos) es despreciable frente a votaciones de 10 minutos o más. |
| `unsafe-typecast` (×2) | `RWATokenizer1155.balanceOfAt` / `totalSupplyAt` (`uint48(block.timestamp)`) | Aceptado | `uint48` llega hasta 2^48 − 1 segundos (unos 8,9 millones de años), así que el cast no trunca. Es el mismo tipo que usa `Time.timestamp()` de OpenZeppelin, y el valor solo se usa como argumento del error `FutureLookup`. |
| `missing-events-access-control` | `RWATokenizer1155.setSaleActive` (`assets[id].saleActive = active`) | Falso positivo | La función emite `SaleStatusChanged(id, active)` en la línea siguiente. Además, `saleActive` no controla permisos: solo habilita o no la compra, y solo lo puede cambiar el Governor del activo. |
| `environment-read-across-mutation` (×2) | `test/RWATokenizer1155.t.sol` (tests de checkpoints) | Fuera de alcance | Está en los tests, no en los contratos. El valor de `block.timestamp` se guarda a propósito antes de `vm.warp` para consultar ese instante después. |
