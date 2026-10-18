# Cómo trabajamos

## Reglas del grupo

- **Cada integrante hace al menos un commit con su propia cuenta de GitHub** (lo exige la consigna). Hacerlo el día 1.
- Trabajar en ramas cortas (`feat/tokenizer-buy`, `feat/governor-supermajority`, `test/dividends`…) y abrir un PR; otro integrante revisa antes de mergear a `main`.
- La interfaz [`IRWATokenizer`](contracts/interfaces/IRWATokenizer.sol) **no se cambia sin avisar** al grupo.
- **Nunca** subir private keys, mnemonics ni API keys. Usar `cast wallet import <nombre> --interactive` y `.env` (ignorado por git).
- Antes de pushear: `forge fmt`, `forge build` sin warnings nuevos y `forge test` en verde.

## Reparto (ver plan del proyecto, §9)

| Integrante | Área | Archivos | Busca los `TODO(...)` |
|---|---|---|---|
| **A** | Tokenizer y dividendos | `contracts/RWATokenizer1155.sol`, `contracts/mocks/MockUSDT.sol`, `test/RWATokenizer1155.t.sol` | `TODO(A)` |
| **B** | Gobernanza, coverage y Slither | `contracts/governance/*`, `test/OmniGovernor.t.sol`, `test/AssetVotes.t.sol`, `test/Integration.t.sol`, `docs/SLITHER.md` | `TODO(B)` |
| **C** | Integración, frontend y entrega | `script/*`, `frontend/*`, `README.md`, deploy y verificación | `TODO(C)` |

```bash
# encontrar lo que falta
grep -rn "TODO(A)" contracts test script frontend --include=*.sol --include=*.ts --include=*.tsx
```

## Definición de "terminado" para un TODO

1. La función está implementada siguiendo CEI y con NatSpec completo.
2. El test correspondiente ya **no** tiene `vm.skip(true)` y pasa.
3. Se agregó al menos un test de revert por cada `revert` nuevo (la métrica de ramas del coverage es la que más cuesta).
4. Cuando no quede ningún `TODO(A)`, borrar el error `NotImplemented` del tokenizer.
