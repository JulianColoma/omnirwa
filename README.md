# OmniRWA

> Fraccionamiento de activos reales (RWA) con ERC-1155, dividendos *pull over push* y gobernanza on-chain con snapshot, quórum y mayoría calificada.
> Proyecto Final — Blockchain / Web3 · Stack: **Solidity 0.8.24 · Foundry · OpenZeppelin v5.1 · Next.js + wagmi/viem** · Red: **Sepolia**.

> ⚠️ **Estado: contratos y tests terminados, falta el deploy en Sepolia.** Las secciones marcadas con `TODO` (direcciones, transacciones y equipo) se completan antes de la entrega (27/10). El plan detallado está en [docs/PLAN.md](docs/PLAN.md) y el reparto en [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Índice

1. [Qué hace](#1-qué-hace)
2. [Por qué blockchain](#2-por-qué-blockchain)
3. [Arquitectura](#3-arquitectura)
4. [Decisiones de diseño](#4-decisiones-de-diseño)
5. [Roles y permisos](#5-roles-y-permisos)
6. [Instalación y compilación](#6-instalación-y-compilación)
7. [Tests y coverage](#7-tests-y-coverage)
8. [Slither](#8-slither)
9. [Uso: deploy, demo y frontend](#9-uso-deploy-demo-y-frontend)
10. [Red y contratos desplegados](#10-red-y-contratos-desplegados)
11. [Transacciones del flujo principal](#11-transacciones-del-flujo-principal)
12. [Limitaciones conocidas del MVP](#12-limitaciones-conocidas-del-mvp)
13. [Roadmap](#13-roadmap)
14. [Equipo](#14-equipo)

---

## 1. Qué hace

Plataforma para **fraccionar activos reales** (un departamento en pozo, un lote de soja, una cosechadora), **vender las fracciones** a cambio de stablecoins, **repartir las ganancias** entre los titulares y **votar decisiones** entre los dueños.

1. **Creación y fraccionamiento:** un emisor registra un activo con N fracciones a un precio fijo (ej. 1.000 fracciones a 10 USDT).
2. **Inversión:** los usuarios compran fracciones pagando con `MockUSDT`; el pago va al creador y el inversor recibe tokens ERC-1155.
3. **Dividendos:** el creador deposita las ganancias y cada titular **retira** su parte proporcional (*pull*).
4. **Junta de inversores:** se vota con peso proporcional a las fracciones (snapshot, quórum 20%, mayoría 2/3) y lo aprobado se **ejecuta on-chain**.

## 2. Por qué blockchain

- Propiedad fraccionada y transferible sin intermediarios.
- Reparto de ganancias transparente y auditable por cualquiera.
- Votación con reglas en el código, imposible de manipular a posteriori.
- Acceso a inversores chicos (tickets de 10 USDT).

**Limitación honesta:** el vínculo legal con el activo y la veracidad de las ganancias dependen de confiar en el creador (problema del oráculo). Ver [§12](#12-limitaciones-conocidas-del-mvp).

## 3. Arquitectura

```
                 ┌──────────────┐
                 │   MockUSDT   │  ERC-20 de prueba (6 decimales)
                 └──────▲───────┘
                        │ SafeERC20: compra (comprador → creador),
                        │ depósito (creador → contrato), retiro (contrato → titular)
┌───────────────────────┴───────────────────────────────────────┐
│ RWATokenizer1155                                              │
│  is ERC1155Supply, AccessControl, Pausable, ReentrancyGuard   │
│  - registro de activos (1 id por activo)                      │
│  - venta de fracciones                                        │
│  - dividendos pull (acumulador por fracción)                  │
│  - checkpoints de saldo y supply (Checkpoints.Trace208)       │
│  - ganchos ejecutables por el Governor del activo             │
└──────────▲─────────────────────────────────▲──────────────────┘
           │ balanceOfAt / totalSupplyAt     │ execute() → setSaleActive / recordResolution
┌──────────┴──────────┐   getPastVotes   ┌───┴──────────────────────────┐
│ AssetVotes (id = 1) │◄─────────────────│ OmniGovernor (activo 1)      │
│ adaptador IERC5805  │                  │ Governor + Settings +        │
│ (IVotes + clock)    │                  │ CountingSimple (2/3) +       │
└─────────────────────┘                  │ Votes + QuorumFraction (20%) │
                                         └──────────────────────────────┘
```

**Interacciones entre contratos:** Tokenizer ↔ MockUSDT · AssetVotes → Tokenizer · Governor → AssetVotes · Governor → Tokenizer.

```
omnirwa/
├── contracts/
│   ├── RWATokenizer1155.sol
│   ├── governance/{AssetVotes.sol, OmniGovernor.sol}
│   ├── interfaces/IRWATokenizer.sol
│   └── mocks/MockUSDT.sol
├── test/            (unit, integración, fuzz; mocks en test/mocks)
├── script/          (Deploy.s.sol, Demo.s.sol)
├── frontend/        (Next.js 14 + wagmi v2 + viem)
├── deployments/     (direcciones por chainId, generadas por Deploy.s.sol)
└── docs/            (PLAN.md, SLITHER.md)
```

## 4. Decisiones de diseño

| # | Decisión | Por qué |
|---|---|---|
| D1 | **ERC-1155**, un id por activo | Muchos activos con fracciones fungibles en un solo contrato, sin factory de tokens |
| D2 | Dividendos **dentro** del tokenizer | Deben liquidarse en cada cambio de saldo; aparte implicaría llamadas externas en cada transferencia |
| D3 | Dividendos **pull** con acumulador por fracción | *Push* no escala y un receptor que revierte bloquea a todos |
| D4 | Fracciones se mintean **al comprarse** | `totalSupply(id)` = lo vendido; dividendos solo entre compradores |
| D5 | **Snapshot** en lugar de bloquear fracciones | Evita comprar justo antes de votar para dar vuelta el resultado |
| D6 | **2/3 + quórum 20%** | Protege a la minoría frente a un 50%+1 |
| D7 | **OpenZeppelin Governor** + adaptador propio | Código auditado; `IVotes` no tiene `id` → un adaptador y un Governor por activo |
| D8 | Sin delegación | Evita el error clásico de "no me auto-delegué y tengo 0 votos" |
| D9 | `votingDelay = 0` | Cierra la ventana de compra entre propuesta y snapshot |
| D10 | El Governor **ejecuta** acciones reales | `setSaleActive` / `recordResolution` solo sobre su activo |
| D11 | Pago directo al creador | Simplicidad del MVP (escrow → roadmap) |
| D12 | Metadata en IPFS, on-chain solo `bytes32` | Evitar strings largos (gas) |
| D13 | `claimDividends` no se pausa | Siempre se puede retirar lo propio |
| D14 | Reloj por timestamp (ERC-6372) | Períodos en segundos; `vm.warp` en tests |

### Cómo funcionan los dividendos

Patrón de **acumulador por fracción** (el de MasterChef / "dividend tokens"), sin recorrer titulares:

- **Depósito** (`depositDividends`, solo el creador): con `D` USDT y supply `S`, `accDividendPerShare[id] += D × 1e18 / S`.
- **Cada cuenta** guarda el valor del acumulador en su última liquidación (`paidPerShare`).
- **Pendiente** (`pendingDividends`): `owed + saldo × (accDividendPerShare − paidPerShare) / 1e18`.
- **Liquidación en cada cambio de saldo:** `_update` (mint, transfer, burn) llama a `_accrue` de emisor y receptor **con el saldo viejo**, antes de mover las fracciones. Por eso quien compra después de un depósito no lo cobra, y quien transfiere conserva lo devengado hasta ese momento.
- **Retiro** (`claimDividends`, *pull*): pone `owed` en 0 **antes** de transferir (CEI + `nonReentrant`) y **no se pausa** (D13).

| Ejemplo (demo) | Alice | Bob |
|---|---|---|
| Fracciones | 500 | 300 |
| Depósito de 800 USDT → acumulador `+= 800e6 × 1e18 / 800` | **500 USDT** | **300 USDT** |

**Redondeo:** todas las divisiones redondean hacia abajo, así que **nunca se paga más de lo depositado**; queda un sobrante mínimo (unidades de 1e-6 USDT) en el contrato. Lo cubre el fuzz `testFuzz_DividendsNeverExceedDeposit` (suma ≤ depósito, proporción ±1 unidad). Supuesto: el token de pago no cobra comisión por transferencia.

## 5. Roles y permisos

| Rol / permiso | Quién | Qué permite |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | Deployer | Otorgar/revocar roles; `setAssetGovernor` (una sola vez por activo) |
| `ISSUER_ROLE` | Emisores habilitados | `registerAsset` |
| `PAUSER_ROLE` | Deployer | `pause` / `unpause` de compras y depósitos |
| Creador del activo | Quien lo registró | `depositDividends` de su activo |
| `assetGovernor[id]` | OmniGovernor del activo | `setSaleActive`, `recordResolution` sobre ese id |
| Proponer | ≥ 1 fracción en el snapshot | `propose` |

## 6. Instalación y compilación

Requisitos: [Foundry](https://book.getfoundry.sh/getting-started/installation), Node.js ≥ 20, (opcional) Python 3 para Slither.

```bash
git clone --recurse-submodules https://github.com/JulianColoma/omnirwa.git
cd omnirwa
forge install          # si se clonó sin --recurse-submodules
forge build
```

## 7. Tests y coverage

```bash
forge test -vvv
forge coverage --report summary --no-match-coverage "(script|test|lib)"
```

78 tests (unitarios, fuzz e integración con los contratos reales), todos en verde. Coverage final:

| Archivo | % Líneas | % Statements | % Ramas | % Funciones |
|---|---|---|---|---|
| `contracts/RWATokenizer1155.sol` | 100,00% (92/92) | 99,13% (114/115) | 95,00% (19/20) | 100,00% (19/19) |
| `contracts/governance/AssetVotes.sol` | 100,00% (25/25) | 100,00% (24/24) | 100,00% (5/5) | 100,00% (10/10) |
| `contracts/governance/OmniGovernor.sol` | 100,00% (17/17) | 100,00% (20/20) | 100,00% (1/1) | 100,00% (7/7) |
| `contracts/mocks/MockUSDT.sol` | 100,00% (5/5) | 100,00% (2/2) | N/A (0/0) | 100,00% (3/3) |
| **Total** | **100,00% (139/139)** | **99,38% (160/161)** | **96,15% (25/26)** | **100,00% (39/39)** |

## 8. Slither

```bash
pipx install slither-analyzer        # o: uv tool install slither-analyzer
slither .
```

Slither llama a `forge`: el primero en el `PATH` tiene que ser el de Foundry (`~/.foundry/bin`).

Tabla de hallazgos y justificaciones: [docs/SLITHER.md](docs/SLITHER.md).

## 9. Uso: deploy, demo y frontend

### Deploy en Sepolia

```bash
cp .env.example .env                       # completar RPC, API key y direcciones de la demo
cast wallet import deployer --interactive  # keystore cifrado: nunca private keys en .env
source .env
forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --broadcast --verify
```

Las direcciones quedan en `deployments/11155111.json`.

### Demo por scripts

Cada paso lo firma su actor (`creator`, `investorA`, `investorB`). Ver los comandos en la cabecera de [script/Demo.s.sol](script/Demo.s.sol).

### Frontend

```bash
cd frontend
cp .env.example .env.local   # pegar las direcciones desplegadas
npm install
npm run abis                 # copia los ABIs desde ../out (correr forge build antes)
npm run dev                  # http://localhost:3000
```

## 10. Red y contratos desplegados

Red: **Sepolia** (chainId 11155111).

| Contrato | Dirección | Código verificado |
|---|---|---|
| MockUSDT | `TODO` | `https://sepolia.etherscan.io/address/TODO#code` |
| RWATokenizer1155 | `TODO` | `https://sepolia.etherscan.io/address/TODO#code` |
| AssetVotes | `TODO` | `https://sepolia.etherscan.io/address/TODO#code` |
| OmniGovernor | `TODO` | `https://sepolia.etherscan.io/address/TODO#code` |

## 11. Transacciones del flujo principal

| Paso | Actor | Tx |
|---|---|---|
| Registrar activo "Depto Rosario" (1.000 × 10 USDT) | Creador | `TODO` |
| Compra 500 fracciones | Inversor A | `TODO` |
| Compra 300 fracciones | Inversor B | `TODO` |
| Propuesta 1: cerrar la venta | Inversor A | `TODO` |
| Propuesta 2: vender a 120.000 (`recordResolution`) | Inversor A | `TODO` |
| Votos | A / B | `TODO` |
| Depósito de 800 USDT de dividendos | Creador | `TODO` |
| Retiro de dividendos (500 / 300) | A / B | `TODO` |
| Ejecución propuesta 1 → venta cerrada | Cualquiera | `TODO` |

## 12. Limitaciones conocidas del MVP

- Se confía en el creador: vínculo legal con el activo y veracidad de las ganancias depositadas.
- Un Governor por activo, desplegado a mano por script (sin factory).
- Sin delegación de votos y sin timelock.
- El snapshot excluye lo comprado en el bloque de la propuesta, pero si la transacción del `propose` queda varios bloques pendiente en el mempool, una compra anterior a su inclusión sí vota (mitigación: enviarla con gas suficiente o por RPC privado).
- Un tenedor mayoritario legítimo tiene peso real (mitigado con 2/3 + quórum + reparto pro-rata).
- Las decisiones off-chain solo quedan registradas (`recordResolution`).
- Sobrante de redondeo en los dividendos.
- El pago va directo al creador; no hay devolución si no se vende todo.
- Supuesto: el token de pago no cobra comisión por transferencia.
- `setApprovalForAll` de ERC-1155 es todo-o-nada.

## 13. Roadmap

**Fase 2 — funcionalidad**
- Factory que despliegue `AssetVotes` + `OmniGovernor` al registrar cada activo.
- Escrow con objetivo de recaudación y devolución si no se alcanza.
- Liquidación on-chain del activo (vender y repartir).
- Mercado secundario de fracciones.
- Oráculo / auditor que certifique las ganancias.
- Tipos de propuesta con umbrales distintos; delegación de votos; `sweepDust`.

**Seguridad y escalabilidad**
- `GovernorTimelockControl` (ventana para que la minoría salga).
- KYC + topes por billetera, o migración a ERC-3643.
- Multisig (Safe) para roles de administrador.
- Auditoría externa.
- Despliegue en L2 (Base / Arbitrum).

## 14. Equipo

| Integrante | Rol | GitHub |
|---|---|---|
| TODO | A — Tokenizer y dividendos | @TODO |
| TODO | B — Gobernanza y calidad | @TODO |
| TODO | C — Integración, frontend y entrega | @TODO |
