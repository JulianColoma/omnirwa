# OmniRWA — Plan del Proyecto Final (Blockchain / Web3)

> Documento de trabajo del grupo (3 integrantes). Resume todas las decisiones técnicas, el porqué de cada una, la arquitectura, el reparto de tareas y el checklist de entrega.
> **Entrega:** martes **27/10 hasta las 23:59 h** · **Mentorías:** 20/10 y 22/10.
> Stack: **Solidity 0.8.24 + Foundry + OpenZeppelin v5.x**, red **Sepolia**.

---

## Índice

1. [Qué es OmniRWA](#1-qué-es-omnirwa)
2. [Requisitos de la consigna que condicionan el diseño](#2-requisitos-de-la-consigna-que-condicionan-el-diseño)
3. [Por qué ERC-1155 (comparación con ERC-20 y ERC-721)](#3-por-qué-erc-1155-comparación-con-erc-20-y-erc-721)
4. [Historial de decisiones (qué cambiamos y por qué)](#4-historial-de-decisiones-qué-cambiamos-y-por-qué)
5. [Arquitectura final](#5-arquitectura-final)
6. [Contratos a crear (con código de referencia)](#6-contratos-a-crear-con-código-de-referencia)
7. [Riesgos de seguridad y mitigaciones](#7-riesgos-de-seguridad-y-mitigaciones)
8. [Alcance del MVP y guion de la demo](#8-alcance-del-mvp-y-guion-de-la-demo)
9. [Reparto de trabajo entre los 3](#9-reparto-de-trabajo-entre-los-3)
10. [Cronograma día por día](#10-cronograma-día-por-día)
11. [Plan de pruebas (Foundry)](#11-plan-de-pruebas-foundry)
12. [Deploy, verificación y Slither](#12-deploy-verificación-y-slither)
13. [README, whitepaper y video](#13-readme-whitepaper-y-video)
14. [Limitaciones del MVP y roadmap](#14-limitaciones-del-mvp-y-roadmap)
15. [Preguntas para la mentoría del 20/10](#15-preguntas-para-la-mentoría-del-2010)
16. [Checklist final de entrega](#16-checklist-final-de-entrega)

---

## 1. Qué es OmniRWA

Plataforma para **fraccionar activos reales** (un departamento en pozo, un lote de soja, una cosechadora), **vender las fracciones** a cambio de stablecoins, **repartir las ganancias** entre los titulares y **votar decisiones** entre los dueños.

Flujo en 4 pasos:

1. **Creación y fraccionamiento:** un emisor registra un activo y define en cuántas fracciones se divide y a qué precio (ej. 1.000 fracciones a 10 USDT).
2. **Inversión:** los usuarios compran fracciones pagando con `MockUSDT`; el dinero va al creador y el inversor recibe tokens ERC-1155.
3. **Dividendos:** el creador deposita las ganancias reales (alquiler, venta de la cosecha) y cada titular **retira** su parte proporcional cuando quiere (*pull over push*).
4. **Junta de inversores:** se vota con peso proporcional a las fracciones, con snapshot, quórum y mayoría calificada; lo aprobado se **ejecuta on-chain**.

### Por qué tiene sentido usar blockchain (lo pide la consigna)

- Propiedad fraccionada y transferible sin intermediarios.
- Reparto de ganancias transparente y auditable por cualquiera.
- Votación que no se puede manipular, con reglas en el código.
- Acceso a inversores chicos (tickets de 10 USDT).

**Limitación honesta:** el vínculo legal con el activo y la veracidad de las ganancias depositadas dependen de confiar en el creador (el "problema del oráculo"). Va en limitaciones.

---

## 2. Requisitos de la consigna que condicionan el diseño

Extraído del PDF `TT2026-S2-N2_Proyecto Final.pdf`:

| Requisito | Impacto en nuestro proyecto |
|---|---|
| Carpeta **`/contracts`** con NatSpec | Foundry usa `src/` por defecto → en `foundry.toml` poner `src = "contracts"` |
| **Frontend** (checklist E) | El punto B dice que alcanzan scripts, pero el checklist pide frontend → hacer uno mínimo y **confirmarlo en la mentoría** |
| Al menos **una interacción entre contratos** | Tenemos varias: Tokenizer ↔ MockUSDT, AssetVotes → Tokenizer, Governor → AssetVotes, Governor → Tokenizer |
| **Todos** los contratos propios desplegados **y verificados**, con URL al código en el README | 4 contratos en Sepolia: MockUSDT, RWATokenizer1155, AssetVotes, OmniGovernor |
| Los contratos desplegados = el código del repo | **Congelar el código** antes del deploy final |
| Interacción **on-chain real** del flujo principal | Ejecutar la demo en Sepolia y guardar los hashes de las transacciones |
| Tests: 100% pasan, al menos un caso exitoso y uno de error, **coverage > 40% en todas las métricas** | Ver sección 11 |
| **Slither** con hallazgos corregidos o justificados | Ver sección 12 |
| Custom errors, eventos, CEI, SafeERC20, `constant`/`immutable`, `unchecked` seguro, control de acceso documentado | Aplicado en todo el código de referencia |
| Repo **público**; **cada integrante con al menos un commit propio**; sin secretos; `.env.example` | Primer commit de cada uno el día 1 |
| **Video ≤ 5 min** con evidencia real | Ver guion, sección 8 |
| **Whitepaper** y video a la carpeta de Drive, con el apellido de quien registró el grupo en el nombre del archivo | Ver sección 13 |

---

## 3. Por qué ERC-1155 (comparación con ERC-20 y ERC-721)

### Qué es ERC-1155

Es un estándar **multi-token**: un solo contrato maneja muchos tokens, cada uno identificado por un `id`. Dentro de un mismo `id` las unidades son **fungibles** (intercambiables entre sí); entre ids distintos, no.

```solidity
mapping(uint256 id => mapping(address account => uint256)) private _balances;
```

| Función | Para qué sirve |
|---|---|
| `balanceOf(account, id)` / `balanceOfBatch` | Saldo de un id / de varios a la vez |
| `safeTransferFrom(from, to, id, amount, data)` | Transferir unidades de un id |
| `safeBatchTransferFrom(...)` | Transferir varios ids en una sola transacción |
| `setApprovalForAll(operator, bool)` | Autorizar a un operador. **Todo o nada**: no hay approve por id ni por cantidad |
| `uri(id)` | Metadata off-chain; `{id}` se reemplaza por el id en hexadecimal |

Dos detalles importantes:

- **Todas las transferencias son "safe":** si el destino es un contrato, se llama a `onERC1155Received` y, si no responde bien, revierte. **Esto también pasa en `_mint`**, o sea que cada compra le cede el control a código externo → posible **reentrancy** (lo mitigamos, ver sección 7).
- **No hay `name`, `symbol` ni `decimals`** en el estándar: una fracción es una unidad entera.

### Comparación

| | ERC-20 | ERC-721 | **ERC-1155** |
|---|---|---|---|
| Modelo | 1 contrato = 1 token fungible | 1 contrato = colección de piezas únicas | 1 contrato = muchos tokens, fungibles dentro de cada id |
| Agregar un activo nuevo | Desplegar otro contrato (necesita factory) | Mintear un NFT | **Crear un id nuevo, sin desplegar nada** |
| 1.000 fracciones de un depto | 1 contrato con supply 1.000 | 1.000 NFTs distintos (absurdo: las fracciones son intercambiables) | **id 1 con supply 1.000** |
| Aprobaciones | Por cantidad | Por token o para todos | Solo para todos |
| Transferencias en lote | No | No | Sí, nativas |
| Soporte en DeFi (DEX, lending) | Total | Marketplaces de NFT | Limitado |
| Gobernanza ya hecha en OZ | `ERC20Votes` | `ERC721Votes` | **No existe** → hacemos un adaptador propio (sección 6) |

### Ejemplos del dominio

- **Departamento en pozo en Rosario:** `id = 1`, 1.000 fracciones a 10 USDT (1 fracción = 0,1% del activo).
- **Lote de soja, campaña 25/26:** `id = 2`, 500 fracciones (1 fracción = 1 tonelada); la venta de la cosecha se deposita como dividendo.
- **Cosechadora para alquiler:** `id = 3`, 200 fracciones; los alquileres a contratistas son los dividendos.

Con ERC-20 serían 3 contratos más una factory; con ERC-721, 1.700 NFTs que no tienen nada de "no fungibles"; con **ERC-1155, un contrato y tres ids**.

### Veredicto

**ERC-1155 encaja**: es una plataforma de muchos activos con fracciones intercambiables, y nos ahorra la factory de tokens. Costos que hay que declarar (muestran criterio):

- No hay votación con snapshots ya hecha → hicimos checkpoints y un adaptador.
- `setApprovalForAll` es muy amplio (aprobar a un operador le da acceso a todos los activos del usuario).
- Billeteras y DEX lo soportan peor que a ERC-20.
- Los RWA en producción suelen usar ERC-20 con controles de cumplimiento (ERC-3643) → roadmap.

---

## 4. Historial de decisiones (qué cambiamos y por qué)

Esta sección es clave para la presentación: muestra **criterio de diseño**.

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| D1 | Usar **ERC-1155**, un id por activo | ERC-20 por activo / ERC-721 | Ver sección 3 |
| D2 | **Dividendos dentro del tokenizer** (o como contrato abstracto que el tokenizer hereda), no como contrato desplegado aparte | Contrato `RWADividends` separado | El cálculo debe actualizarse en **cada cambio de saldo**. Si estuviera aparte, cada transferencia haría una llamada externa: más gas, más superficie de ataque, más casos borde |
| D3 | Dividendos **pull over push** con acumulador por fracción | Recorrer titulares y transferir a cada uno | *Push* se queda sin gas con muchos titulares, y un receptor que revierte bloquea a todos |
| D4 | Fracciones **se mintean al comprarse** | Pre-mintear todo al creador | `totalSupply(id)` = lo vendido; los dividendos se reparten solo entre compradores |
| D5 | ~~Bloquear las fracciones del votante hasta que cierre la votación~~ → **reemplazado por snapshot** | Bloqueo (idea original del Word) | El bloqueo evitaba el doble voto, pero **no evitaba comprar fracciones justo antes de votar** para dar vuelta el resultado. Con snapshot, el peso es el saldo **al crearse la propuesta**: lo comprado después no vota, y lo transferido después de votar tampoco (el receptor tenía 0 en el snapshot). Además, los inversores pueden vender en cualquier momento |
| D6 | **Mayoría calificada 2/3 exacto + quórum 20%** (fracción entera `a favor × 3 >= (a favor + en contra) × 2`, ponderada por fracciones) | Mayoría simple / 2/3 en puntos básicos (`6667` rechaza un 2/3 exacto; `6666` deja pasar un 66,66%) | Alguien con 50%+1 legítimo no decide solo. **No se puede evitar del todo** que un tenedor mayoritario real tenga poder (un tope por billetera se esquiva con varias billeteras, salvo con KYC), pero sí proteger a la minoría. Y como lo recaudado se reparte siempre pro-rata, la mayoría decide pero **no puede quedarse con la parte de los demás** |
| D7 | **OpenZeppelin Governor** + adaptador `AssetVotes` propio | Gobernanza 100% casera | Código auditado: estados, snapshot, quórum y ejecución on-chain ya resueltos. Hay que adaptarlo porque el Governor es de **un solo token** (`IVotes` no recibe `id`) → **un adaptador y un Governor por activo** |
| D8 | **Sin delegación** (cada titular vota con su saldo) | Delegación estilo `ERC20Votes` | En `ERC20Votes`, si no te auto-delegás tus votos son 0: error clásico en las demos. Delegación → roadmap |
| D9 | `votingDelay = 0` | Delay de 1 día (habitual en ejemplos) | El delay abre una ventana para ver la propuesta, comprar y votar. Con 0, quedaba la compra en el mismo bloque (*front-running* desde el mempool): **cerrado en `AssetVotes`**, que mide los votos en `t` como el saldo al cierre de `t - 1`, así que lo comprado en el bloque de la propuesta no vota |
| D10 | El Governor **ejecuta** acciones reales sobre su activo: `setSaleActive(id, bool)` y `recordResolution(id, hash)` | Votación que solo registra un resultado | El Governor ejecuta llamadas; además da una demo visual ("cerramos la venta" → se ejecuta → la venta queda cerrada). Cada Governor solo puede tocar **su** activo |
| D11 | El USDT de la compra va **directo al creador** | Escrow con devolución si no se vende todo | Simplicidad del MVP; escrow → roadmap |
| D12 | Metadata del activo en IPFS; on-chain solo un `bytes32 docHash` | Strings on-chain | La consigna pide evitar strings largos (gas) |
| D13 | `claimDividends` **no se pausa** | Pausar todo | Los usuarios siempre pueden retirar lo que ya es suyo |
| D14 | Reloj por **timestamp** (`mode=timestamp`) | Número de bloque | Períodos en segundos, más fáciles de razonar en testnet y en tests (`vm.warp`) |

---

## 5. Arquitectura final

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
│  - ganchos ejecutables por el Governor del activo:            │
│      setSaleActive(id, bool), recordResolution(id, hash)      │
└──────────▲─────────────────────────────────▲──────────────────┘
           │ balanceOfAt / totalSupplyAt     │ execute() → setSaleActive / recordResolution
┌──────────┴──────────┐   getPastVotes   ┌───┴──────────────────────────┐
│ AssetVotes (id = 1) │◄─────────────────│ OmniGovernor (activo 1)      │
│ adaptador IERC5805  │  getPastTotal-   │ Governor + Settings +        │
│ (IVotes + clock)    │  Supply          │ CountingSimple (2/3) +       │
└─────────────────────┘                  │ Votes + QuorumFraction (20%) │
                                         └──────────────────────────────┘
```

### Roles y permisos (documentarlos en NatSpec)

| Rol / permiso | Quién lo tiene | Qué permite |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | Quien despliega | Otorgar y revocar roles; vincular el Governor a un activo (`setAssetGovernor`, una sola vez) |
| `ISSUER_ROLE` | Emisores habilitados (supuesto: pasarían KYC) | Registrar activos |
| `PAUSER_ROLE` | Admin | Pausar compras y depósitos ante una emergencia |
| Creador del activo | Quien lo registró | Depositar dividendos de su activo |
| `assetGovernor[id]` | El `OmniGovernor` de ese activo | `setSaleActive` y `recordResolution` sobre **ese** id |
| Proponer | Cualquiera con al menos 1 fracción en el snapshot | Crear propuestas |

### Estructura del repositorio

```
omnirwa/
├── contracts/
│   ├── RWATokenizer1155.sol
│   ├── RWADividends.sol            (opcional: contrato abstracto con la lógica de dividendos)
│   ├── governance/
│   │   ├── AssetVotes.sol
│   │   └── OmniGovernor.sol
│   ├── interfaces/
│   │   └── IRWATokenizer.sol
│   └── mocks/
│       └── MockUSDT.sol
├── test/
│   ├── RWATokenizer1155.t.sol
│   ├── OmniGovernor.t.sol
│   ├── Integration.t.sol
│   └── mocks/
│       ├── ReentrantBuyer.sol      (atacante para el test de reentrancy)
│       └── MockTokenizer.sol       (para que B avance sin esperar a A)
├── script/
│   ├── Deploy.s.sol
│   └── Demo.s.sol
├── frontend/                       (Next.js + wagmi/viem)
├── foundry.toml
├── .env.example
└── README.md
```

> Si usamos **Scaffold-ETH 2** (versión Foundry), los contratos quedan en `packages/foundry/contracts`. Consultar en la mentoría si ese layout se acepta; si no, Foundry en la raíz y el frontend en `/frontend`.

### `foundry.toml`

```toml
[profile.default]
src = "contracts"          # la consigna exige /contracts
test = "test"
script = "script"
libs = ["lib"]
solc_version = "0.8.24"
optimizer = true
optimizer_runs = 200       # si el Governor supera 24 KB, bajar (ej. 1)
remappings = ["@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/"]

[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

```bash
forge install OpenZeppelin/openzeppelin-contracts
```

---

## 6. Contratos a crear (con código de referencia)

> El código es **de referencia** para entender el diseño: hay que completarlo (constructor, `registerAsset`, NatSpec en todo, eventos que falten) y probarlo. Las decisiones de seguridad están marcadas con 🔒 y las de gas con ⛽.

### 6.0 Interfaz compartida (acordarla el día 1)

```solidity
// contracts/interfaces/IRWATokenizer.sol
interface IRWATokenizer {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function balanceOfAt(address account, uint256 id, uint48 timepoint) external view returns (uint256);
    function totalSupplyAt(uint256 id, uint48 timepoint) external view returns (uint256);
}
```

Con esta interfaz, B puede desarrollar y testear la gobernanza contra un `MockTokenizer` mientras A termina el tokenizer real.

### 6.1 `MockUSDT` (A)

ERC-20 de OpenZeppelin con `decimals() = 6` y una función `mint` (solo el owner) para darles saldo a las billeteras de la demo. Es código propio: va con NatSpec y tests.

### 6.2 `RWATokenizer1155` (A)

**Estado y compra:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Checkpoints} from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title RWATokenizer1155
/// @notice Fracciona activos reales: cada activo es un id ERC-1155 y cada unidad es una fracción.
contract RWATokenizer1155 is ERC1155Supply, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Checkpoints for Checkpoints.Trace208;

    /// @notice Rol de emisores habilitados para registrar activos.
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    /// @notice Rol que puede pausar compras y depósitos.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 private constant PRECISION = 1e18;

    /// @notice Stablecoin usada para pagos y dividendos.
    IERC20 public immutable paymentToken;              // 🔒 immutable: no se puede cambiar tras el deploy

    struct Asset {
        address creator;          // 20 bytes ┐
        uint64  maxFractions;     //  8 bytes ├ slot 0  ⛽ empaquetado
        bool    saleActive;       //  1 byte  ┘
        uint128 pricePerFraction; // 16 bytes ┐ slot 1 (unidades de USDT, 6 decimales)
        uint64  soldFractions;    //  8 bytes ┘
        bytes32 docHash;          // slot 2: hash del legajo legal en IPFS
    }

    /// @notice Próximo id a asignar (arranca en 1; el 0 significa "no existe").
    uint256 public nextAssetId = 1;
    /// @notice Datos de cada activo.
    mapping(uint256 id => Asset) public assets;
    /// @notice Governor autorizado para cada activo (se fija una sola vez).
    mapping(uint256 id => address) public assetGovernor;

    error SaleNotActive(uint256 id);
    error ZeroAmount();
    error ExceedsAvailable(uint256 id, uint64 available);

    event FractionsPurchased(uint256 indexed id, address indexed buyer, uint64 amount, uint256 cost);

    /// @notice Compra `amount` fracciones del activo `id` pagando con paymentToken.
    function buyFractions(uint256 id, uint64 amount) external nonReentrant whenNotPaused {
        Asset storage a = assets[id];
        // CHECKS
        if (!a.saleActive) revert SaleNotActive(id);
        if (amount == 0) revert ZeroAmount();
        uint64 sold = a.soldFractions;                  // ⛽ una sola lectura de storage
        uint64 max = a.maxFractions;
        if (sold + amount > max) {
            unchecked { revert ExceedsAvailable(id, max - sold); } // seguro: sold <= max siempre
        }
        uint256 cost = uint256(amount) * a.pricePerFraction;

        // EFFECTS
        a.soldFractions = sold + amount;
        emit FractionsPurchased(id, msg.sender, amount, cost);

        // INTERACTIONS (al final, con nonReentrant)  🔒 CEI
        paymentToken.safeTransferFrom(msg.sender, a.creator, cost);
        _mint(msg.sender, id, amount, "");  // ⚠️ dispara onERC1155Received si el comprador es un contrato
    }

    /// @inheritdoc ERC1155
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC1155, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

**Dividendos *pull over push*** (acumulador por fracción, el patrón de MasterChef y los "dividend tokens"):

- Al depositar `D` USDT con supply `S`: `accPerShare[id] += D × 1e18 / S`.
- Cada cuenta guarda el valor del acumulador en su última liquidación (`paidPerShare`).
- Lo pendiente es `saldo × (accPerShare − paidPerShare) / 1e18`.
- **Clave:** antes de cada cambio de saldo se liquida lo pendiente **con el saldo viejo** (por eso `_accrue` se llama dentro de `_update`, antes de `super._update`). Un comprador nuevo no cobra dividendos pasados sin necesidad de código especial: `_accrue` corre con saldo 0, así que su `paidPerShare` queda igual al acumulador actual.

```solidity
mapping(uint256 id => uint256) public accDividendPerShare;
mapping(uint256 id => mapping(address => uint256)) private _paidPerShare;
mapping(uint256 id => mapping(address => uint256)) private _owed;

/// @notice El creador deposita ganancias del activo `id` para repartir entre los titulares.
function depositDividends(uint256 id, uint256 amount) external nonReentrant whenNotPaused {
    if (msg.sender != assets[id].creator) revert NotAssetCreator(id, msg.sender);
    uint256 supply = totalSupply(id);
    if (supply == 0) revert NoHolders(id);                    // 🔒 evita la división por cero
    uint256 increment = amount * PRECISION / supply;
    if (increment == 0) revert DepositTooSmall(amount);

    accDividendPerShare[id] += increment;                     // EFFECTS
    emit DividendsDeposited(id, amount, increment);
    paymentToken.safeTransferFrom(msg.sender, address(this), amount); // INTERACTION
}

/// @notice Retira los dividendos acumulados del activo `id`.
function claimDividends(uint256 id) external nonReentrant {   // sin whenNotPaused, a propósito (D13)
    _accrue(id, msg.sender);
    uint256 amount = _owed[id][msg.sender];
    if (amount == 0) revert NothingToClaim(id);
    _owed[id][msg.sender] = 0;                                // 🔒 poner en cero ANTES de transferir
    emit DividendsClaimed(id, msg.sender, amount);
    paymentToken.safeTransfer(msg.sender, amount);
}

function _accrue(uint256 id, address account) internal {
    uint256 acc = accDividendPerShare[id];
    uint256 paid = _paidPerShare[id][account];
    if (acc == paid) return;                                  // ⛽ evita escrituras inútiles
    _owed[id][account] += balanceOf(account, id) * (acc - paid) / PRECISION;
    _paidPerShare[id][account] = acc;
}
```

**Checkpoints (snapshot) y el `_update`**, que es el punto por donde pasa *todo* cambio de saldo en OZ v5:

```solidity
/// @dev Historial de saldos por activo y cuenta: (timestamp => saldo).
mapping(uint256 id => mapping(address account => Checkpoints.Trace208)) private _balanceHistory;
/// @dev Historial del supply por activo (para el quórum).
mapping(uint256 id => Checkpoints.Trace208) private _supplyHistory;

error FutureLookup(uint48 timepoint, uint48 current);

function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
    internal override(ERC1155, ERC1155Supply)
{
    uint256 len = ids.length;
    // 1) Liquidar dividendos con los saldos VIEJOS
    for (uint256 i = 0; i < len; ) {
        if (from != address(0)) _accrue(ids[i], from);
        if (to != address(0)) _accrue(ids[i], to);
        unchecked { ++i; }
    }
    // 2) Mover saldos
    super._update(from, to, ids, values);
    // 3) Registrar los saldos NUEVOS en el historial
    uint48 now_ = SafeCast.toUint48(block.timestamp);
    for (uint256 i = 0; i < len; ) {
        uint256 id = ids[i];
        if (from != address(0)) _balanceHistory[id][from].push(now_, SafeCast.toUint208(balanceOf(from, id)));
        if (to != address(0))   _balanceHistory[id][to].push(now_, SafeCast.toUint208(balanceOf(to, id)));
        if (from == address(0) || to == address(0)) {
            _supplyHistory[id].push(now_, SafeCast.toUint208(totalSupply(id)));
        }
        unchecked { ++i; }
    }
}

/// @notice Saldo de `account` en el activo `id` en el instante `timepoint` (que tiene que estar en el pasado).
function balanceOfAt(address account, uint256 id, uint48 timepoint) external view returns (uint256) {
    if (timepoint >= block.timestamp) revert FutureLookup(timepoint, uint48(block.timestamp));
    return _balanceHistory[id][account].upperLookupRecent(timepoint);
}

/// @notice Supply del activo `id` en el instante `timepoint` (en el pasado). Lo usa el quórum.
function totalSupplyAt(uint256 id, uint48 timepoint) external view returns (uint256) {
    if (timepoint >= block.timestamp) revert FutureLookup(timepoint, uint48(block.timestamp));
    return _supplyHistory[id].upperLookupRecent(timepoint);
}
```

**Ganchos que ejecuta el Governor:**

```solidity
error NotAssetGovernor(uint256 id, address caller);
error GovernorAlreadySet(uint256 id);
event ResolutionApproved(uint256 indexed id, bytes32 resolutionHash);

/// @dev Restringe la función al Governor del activo `id`.
modifier onlyAssetGovernor(uint256 id) {
    if (msg.sender != assetGovernor[id]) revert NotAssetGovernor(id, msg.sender);
    _;
}

/// @notice Vincula un Governor a un activo. Solo el admin, y solo una vez.
function setAssetGovernor(uint256 id, address governor) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if (assetGovernor[id] != address(0)) revert GovernorAlreadySet(id);   // 🔒 inmutable una vez fijado
    assetGovernor[id] = governor;
}

/// @notice Ejecutable por votación: abrir o cerrar la venta del activo.
function setSaleActive(uint256 id, bool active) external onlyAssetGovernor(id) {
    assets[id].saleActive = active;
    emit SaleStatusChanged(id, active);
}

/// @notice Ejecutable por votación: deja constancia on-chain de una decisión que se ejecuta off-chain
/// (por ejemplo, "vender el depto a 120.000"). `resolutionHash` es el hash del acta en IPFS.
function recordResolution(uint256 id, bytes32 resolutionHash) external onlyAssetGovernor(id) {
    emit ResolutionApproved(id, resolutionHash);
}
```

> **Ya no existen** `lockFractions`, `lockedUntil` ni `LOCKER_ROLE` (decisión D5).

### 6.3 `AssetVotes` (B): adaptador `IVotes` para un activo

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC5805} from "@openzeppelin/contracts/interfaces/IERC5805.sol"; // IVotes + IERC6372 (clock)
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Time} from "@openzeppelin/contracts/utils/types/Time.sol";
import {IRWATokenizer} from "../interfaces/IRWATokenizer.sol";

/// @title AssetVotes
/// @notice Expone las fracciones de UN activo ERC-1155 como poder de voto IVotes para un Governor.
/// @dev Sin delegación: cada titular vota con su propio saldo histórico.
contract AssetVotes is IERC5805 {
    /// @notice Tokenizer que guarda saldos y checkpoints.
    IRWATokenizer public immutable tokenizer;
    /// @notice Id del activo que representa este adaptador.
    uint256 public immutable assetId;

    /// @notice La delegación de votos no está soportada.
    error DelegationDisabled();
    error ZeroAddress();
    error InvalidAssetId();                                   // 🔒 el id 0 significa "no existe" en el tokenizer
    error ERC5805FutureLookup(uint256 timepoint, uint48 clock); // misma firma que `Votes` de OZ

    constructor(IRWATokenizer tokenizer_, uint256 assetId_) {
        if (address(tokenizer_) == address(0)) revert ZeroAddress();
        if (assetId_ == 0) revert InvalidAssetId();
        tokenizer = tokenizer_;
        assetId = assetId_;
    }

    /// @notice Reloj por timestamp (los períodos van en segundos).
    function clock() public view returns (uint48) { return Time.timestamp(); } // 🔒 downcast con SafeCast
    /// @notice Modo de reloj según ERC-6372.
    function CLOCK_MODE() external pure returns (string memory) { return "mode=timestamp"; }

    function getVotes(address account) external view returns (uint256) {
        return tokenizer.balanceOf(account, assetId);
    }
    /// 🔒 Votos en `t` = saldo al cierre de `t - 1`: lo comprado en el bloque de la propuesta no vota (D9).
    function getPastVotes(address account, uint256 timepoint) external view returns (uint256) {
        return tokenizer.balanceOfAt(account, assetId, _previousTimepoint(timepoint));
    }
    function getPastTotalSupply(uint256 timepoint) external view returns (uint256) {
        return tokenizer.totalSupplyAt(assetId, _previousTimepoint(timepoint));
    }

    function _previousTimepoint(uint256 timepoint) private view returns (uint48) {
        uint48 currentTimepoint = clock();
        if (timepoint >= currentTimepoint) revert ERC5805FutureLookup(timepoint, currentTimepoint);
        return timepoint == 0 ? 0 : SafeCast.toUint48(timepoint - 1);
    }

    /// @notice Cada cuenta se "delega" a sí misma, de forma implícita.
    function delegates(address account) external pure returns (address) { return account; }
    function delegate(address) external pure { revert DelegationDisabled(); }
    function delegateBySig(address, uint256, uint256, uint8, bytes32, bytes32) external pure {
        revert DelegationDisabled();
    }
}
```

### 6.4 `OmniGovernor` (B): Governor con mayoría calificada

Partir del [OpenZeppelin Wizard](https://wizard.openzeppelin.com/#governor) y agregar `_voteSucceeded`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

/// @title OmniGovernor
/// @notice Junta de inversores de un activo: voto ponderado con snapshot, quórum 20% y mayoría 2/3.
contract OmniGovernor is
    Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction
{
    /// @notice Mayoría calificada, ponderada por fracciones: a favor / (a favor + en contra) >= 2/3 (exacto).
    uint256 public constant SUPERMAJORITY_NUMERATOR = 2;
    uint256 public constant SUPERMAJORITY_DENOMINATOR = 3;

    error ZeroAddress();

    /// @param votes Adaptador AssetVotes del activo.
    /// @param name_ Nombre del Governor (ej. "OmniRWA Depto Rosario").
    /// @param votingPeriod_ Duración de la votación en segundos.
    constructor(IVotes votes, string memory name_, uint32 votingPeriod_)
        Governor(name_)
        GovernorSettings(0, votingPeriod_, 1) // delay 0 s (D9), período configurable, umbral: 1 fracción
        GovernorVotes(_nonZeroVotes(votes))   // 🔒 se valida antes de que QuorumFraction llame a token().clock()
        GovernorVotesQuorumFraction(20)       // 20% del supply en el snapshot
    {}

    /// @dev Reemplaza la mayoría simple por mayoría calificada de 2/3 exacto (D6).
    ///      Las abstenciones cuentan para el quórum pero no para la proporción.
    function _voteSucceeded(uint256 proposalId)
        internal view override(Governor, GovernorCountingSimple) returns (bool)
    {
        (uint256 againstVotes, uint256 forVotes, ) = proposalVotes(proposalId);
        return forVotes > 0
            && forVotes * SUPERMAJORITY_DENOMINATOR >= (forVotes + againstVotes) * SUPERMAJORITY_NUMERATOR;
    }

    function _nonZeroVotes(IVotes votes) private pure returns (IVotes) {
        if (address(votes) == address(0)) revert ZeroAddress();
        return votes;
    }

    // Overrides obligatorios por herencia múltiple (los genera el Wizard):
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) { return super.votingDelay(); }
    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) { return super.votingPeriod(); }
    function quorum(uint256 t) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) { return super.quorum(t); }
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) { return super.proposalThreshold(); }
}
```

### 6.5 Cómo funciona una votación con Governor

1. **Proponer:** `propose(targets, values, calldatas, description)` → devuelve `proposalId`.
   Ejemplo: `targets = [tokenizer]`, `values = [0]`, `calldatas = [abi.encodeCall(RWATokenizer1155.setSaleActive, (1, false))]`.
2. **Snapshot:** se toma en `momento de la propuesta + votingDelay` (= ahora, porque el delay es 0). `AssetVotes` mide los votos al cierre del segundo anterior, así que lo comprado en el mismo bloque de la propuesta o después no vota.
3. **Votar:** `castVote(proposalId, support)`, con `0` = en contra, `1` = a favor, `2` = abstención.
   - ⚠️ El Governor **no revierte** si alguien vota con peso 0: registra el voto y suma 0.
   - ⚠️ El quórum de `GovernorCountingSimple` cuenta **a favor + abstención**, no los votos en contra.
4. **Estado:** `state(proposalId)` → `Pending → Active → Succeeded / Defeated`. Para aprobarse necesita quórum **y** 2/3.
5. **Ejecutar:** cualquiera llama a `execute(targets, values, calldatas, keccak256(bytes(description)))` con **los mismos** parámetros. Guardar la descripción exacta (está en el evento `ProposalCreated`).

---

## 7. Riesgos de seguridad y mitigaciones

### Compra y tokens

| Riesgo | Mitigación |
|---|---|
| Reentrancy por el callback `onERC1155Received` en `_mint` | `nonReentrant` + el estado se actualiza antes de las llamadas externas (CEI). **Test con un contrato atacante** |
| Tokens que no devuelven `bool` en `transfer` | `SafeERC20` |
| Comprar más fracciones de las que existen | Chequeo `sold + amount > max` |
| `setApprovalForAll` demasiado amplio | Limitación del estándar; documentar |
| Tokens con comisión por transferencia | Supuesto: el token no cobra comisión (MockUSDT/USDC); documentar |

### Dividendos

| Riesgo | Mitigación |
|---|---|
| Reentrancy en el retiro | `_owed = 0` antes de transferir + `nonReentrant` |
| Redondeo | Las divisiones redondean hacia abajo → **nunca se paga más de lo depositado**. Queda un sobrante mínimo de USDT en el contrato (documentado; `sweepDust` en el roadmap). `PRECISION = 1e18` vuelve el error despreciable |
| Depósito con supply 0 | `NoHolders` |
| Depósito tan chico que el incremento da 0 | `DepositTooSmall` |
| Transferir fracciones para cobrar dos veces | Imposible: `_accrue` liquida al emisor y al receptor antes de mover el saldo |
| *Push* que se queda sin gas o un receptor que revierte | Usamos *pull* |

### Gobernanza

| Riesgo | Mitigación |
|---|---|
| Doble voto con la misma cuenta | Lo controla el Governor (`GovernorAlreadyCastVote`) |
| Votar, transferir a otra billetera y votar de nuevo | Snapshot: el receptor tenía 0 en el snapshot |
| **Comprar justo antes de votar para dar vuelta el resultado** | Snapshot al crear la propuesta + `votingDelay = 0` |
| *Front-running* (comprar en el mismo bloque que la propuesta) | `AssetVotes` mide los votos al cierre del segundo anterior al snapshot: esa compra pesa 0. Test `test_BuyInProposalBlockDoesNotVote`. Queda el caso de un `propose` que tarda varios bloques en el mempool → limitación declarada (§14) |
| Tenedor legítimo con 50%+1 | Mayoría 2/3 + quórum 20%; reparto siempre pro-rata. Topes por billetera + KYC → roadmap |
| Un Governor que toque otro activo | `onlyAssetGovernor(id)`; `setAssetGovernor` se fija una sola vez |
| Uso de `block.timestamp` | Un validador solo puede correrlo unos segundos y los períodos son de minutos o días → aceptado |

---

## 8. Alcance del MVP y guion de la demo

### Alcance

- Los contratos soportan **varios activos** (ids), pero la demo usa **uno**, con su `AssetVotes` y su `OmniGovernor`.
- *Opcional:* registrar un segundo activo (el lote de soja) sin Governor, para mostrar que conviven dos activos en el mismo contrato (justifica haber elegido ERC-1155).
- **3 billeteras** con ETH de Sepolia: **Creador/Admin**, **Inversor A**, **Inversor B**. El script de deploy les mintea MockUSDT a A y B.

### Números de la demo

| Paso | Valores |
|---|---|
| Activo | "Depto Rosario": 1.000 fracciones a 10 USDT |
| Compras | **A: 500**, **B: 300** → supply = 800 (quedan 200 sin vender) |
| Dividendos | El creador deposita **800 USDT** → A retira **500**, B retira **300** |
| Propuesta 1: "¿Cerramos la venta?" | A y B a favor → **Succeeded** → `execute` → `saleActive = false` |
| Propuesta 2: "¿Vendemos a 120.000?" (`recordResolution`) | A a favor, B en contra → 62,5% < 2/3 → **Defeated** (muestra que el mayoritario no decide solo) |

### Orden de la demo

La votación dura 10 minutos en testnet, así que los dividendos se hacen **mientras corre**:

1. Deploy y verificación (antes de grabar).
2. El creador registra el activo.
3. A y B aprueban USDT y compran sus fracciones.
4. A (o B) crea las dos propuestas.
5. A y B votan.
6. **Mientras corren los 10 minutos:** el creador deposita los dividendos; A y B los retiran (se ven los saldos de USDT cambiar).
7. Termina la votación: la propuesta 1 queda `Succeeded` → `execute` → venta cerrada. La propuesta 2 queda `Defeated`.
8. *Opcional:* alguien intenta comprar → revierte con `SaleNotActive`.

> **Todo tiene que pasar de verdad en Sepolia** y hay que **guardar el hash de cada transacción** para el README.
> El caso "B compra después de la propuesta y no suma votos" no hace falta mostrarlo en el video; queda **cubierto por test** y se menciona en la narración.

### Fuera del MVP

Varios Governors con factory, escrow con devolución, timelock, delegación, KYC/topes, mercado secundario.

---

## 9. Reparto de trabajo entre los 3

| | **A: Tokenizer y dividendos** | **B: Gobernanza y calidad** | **C: Integración, frontend y entrega** |
|---|---|---|---|
| Contratos | `MockUSDT`, `RWATokenizer1155` (registro, compra, dividendos, checkpoints, ganchos del Governor) | `IRWATokenizer`, `AssetVotes`, `OmniGovernor`, `MockTokenizer` (para tests) | — |
| Tests | Tests del tokenizer, fuzz de dividendos, test de reentrancy | Tests del Governor, tests de integración | Tests de los scripts (opcional) |
| Calidad | NatSpec de sus contratos | **Coverage y Slither** (reporte + tabla de hallazgos), NatSpec de sus contratos | Revisión cruzada del NatSpec |
| Infra | — | — | Repo, `foundry.toml`, `.env.example`, billeteras y faucets, `Deploy.s.sol`, `Demo.s.sol`, deploy y verificación |
| Frontend | — | — | Next.js + wagmi/viem (o Scaffold-ETH 2): comprar, mis fracciones + retirar, votar |
| Docs | Sección de dividendos en el README | Secciones de tests, coverage, Slither y seguridad | README (estructura), whitepaper, guion y edición del video |

**Reglas del grupo:**

- **Cada uno hace al menos un commit con su propia cuenta desde el día 1** (lo exige la consigna).
- Trabajar en ramas y hacer *pull requests* cortos; otro integrante revisa antes de mergear.
- La interfaz `IRWATokenizer` se acuerda **hoy** y no se cambia sin avisar.
- **Nunca** subir private keys ni API keys: usar `cast wallet import` y `.env` (en `.gitignore`).
- A y B se cubren mutuamente para entender todo el código (en la mentoría o en el video pueden preguntarle a cualquiera).

---

## 10. Cronograma día por día

| Día | A | B | C | Hito |
|---|---|---|---|---|
| **Dom 18/10** | `MockUSDT` + `registerAsset` | `IRWATokenizer` + `MockTokenizer` | Crear el repo, `foundry.toml`, OZ, `.env.example`, invitar a todos | **Primer commit de cada uno** |
| **Lun 19/10** | `buyFractions` + tests | `AssetVotes` + `OmniGovernor` contra el mock | Billeteras + ETH de Sepolia (faucets: ¡hacerlo temprano!), `Deploy.s.sol` en anvil, esqueleto del frontend | |
| **Mar 20/10 (mentoría)** | | | | Mostrar compra + Governor en tests. Hacer las preguntas de la sección 15 |
| **Mié 21/10** | Dividendos + checkpoints + tests | Tests del Governor (éxito y error) | Frontend: conectar billetera + comprar | |
| **Jue 22/10 (mentoría)** | Integrar con el Governor real | Tests de integración | **Primer deploy de prueba en Sepolia** | Flujo completo en testnet |
| **Vie 23/10** | Ganchos del Governor + fuzz | Coverage > 40% | Frontend: retirar dividendos y votar | |
| **Sáb 24/10** | NatSpec completo | **Slither** + correcciones | `Demo.s.sol` | |
| **Dom 25/10** | | | | **Congelar el código → deploy final + verificación + demo on-chain + guardar hashes** |
| **Lun 26/10** | Revisar README | Revisar README | README, whitepaper, **grabar el video** | |
| **Mar 27/10** | | | | Margen de seguridad. **Entregar antes de las 23:59** |

> **Plan B:** si el 22/10 la compra y los dividendos no andan en tests, se recorta la propuesta 2 y el frontend se reduce a la página de debug; la demo se hace con `Demo.s.sol` (la consigna acepta scripts en el punto B).

---

## 11. Plan de pruebas (Foundry)

### Tokenizer

**Casos de éxito**
- Registrar un activo: guarda los datos y emite el evento.
- Comprar: descuenta USDT al comprador, lo acredita al creador, mintea, actualiza `soldFractions` y `totalSupply`.
- Comprar el máximo exacto disponible.
- Depósito y retiro con 2 titulares (500/300): cada uno cobra en proporción.
- Transferencia a mitad de camino: el depósito anterior queda para el emisor y el siguiente se reparte con los saldos nuevos.
- Un comprador que llega después de un depósito no cobra ese depósito.
- `claimDividends` funciona con el contrato pausado.
- `balanceOfAt` y `totalSupplyAt` devuelven los valores históricos correctos.

**Casos de error** (con `vm.expectRevert(abi.encodeWithSelector(Error.selector, args))`)
- `registerAsset` sin `ISSUER_ROLE`.
- Comprar con la venta inactiva / con cantidad 0 / por encima del supply / sin approve de USDT / con el contrato pausado.
- `depositDividends` de alguien que no es el creador / con supply 0 / con un monto demasiado chico.
- `claimDividends` sin nada pendiente.
- `balanceOfAt` con un timepoint futuro → `FutureLookup`.
- `setSaleActive` / `recordResolution` desde alguien que no es el Governor → `NotAssetGovernor`.
- `setAssetGovernor` dos veces → `GovernorAlreadySet`.
- **Reentrancy:** `ReentrantBuyer` vuelve a llamar a `buyFractions` desde `onERC1155Received` → revierte con `ReentrancyGuardReentrantCall`.

### Governor

**Casos de éxito**
- Ciclo completo: proponer → votar → `vm.warp` → `Succeeded` → `execute` → `saleActive == false`.
- `recordResolution` emite su evento al ejecutarse.
- Transferir después de votar está permitido y el receptor no suma votos.
- **B compra después de la propuesta y su peso en el snapshot es 0**: `getVotes(bob, snapshot) == 0` y el recuento no cambia aunque vote.
- **B compra en el mismo bloque que la propuesta** (*front-running*) y su peso también es 0.

**Casos de error**
- Proponer sin fracciones → `GovernorInsufficientProposerVotes`.
- 62,5% a favor → `Defeated` (mayoría calificada).
- Sin quórum → `Defeated`.
- Votar dos veces → `GovernorAlreadyCastVote`.
- Ejecutar antes de tiempo o una propuesta derrotada → `GovernorUnexpectedProposalState`.
- `delegate` → `DelegationDisabled`.

### Fuzz

```solidity
function testFuzz_DividendsNeverExceedDeposit(uint64 a, uint64 b, uint96 deposit) public {
    a = uint64(bound(a, 1, 500));
    b = uint64(bound(b, 1, 500));
    deposit = uint96(bound(deposit, 1e6, 1e12));
    _buy(alice, a); _buy(bob, b);
    _deposit(deposit);
    uint256 pa = tokenizer.pendingDividends(id, alice);
    uint256 pb = tokenizer.pendingDividends(id, bob);
    assertLe(pa + pb, deposit);                                   // nunca se paga de más
    assertApproxEqAbs(pa, uint256(deposit) * a / (a + b), 1);     // proporcional, ±1 unidad
}
```

También: un fuzz que compare `balanceOfAt` con el saldo real en distintos puntos del historial.

### Comandos

```bash
forge build
forge test -vvv
forge coverage --report summary --no-match-coverage "(script|test|lib)"
```

Poner una **captura de la tabla de coverage** en el README. La métrica que suele quedar más baja es la de **ramas**: por eso cada `revert` tiene que tener su test.

---

## 12. Deploy, verificación y Slither

### Deploy en Sepolia

1. **Conseguir ETH de Sepolia hoy** para las 3 billeteras (algunos faucets piden saldo en mainnet o tardan).
2. Claves: `cast wallet import deployer --interactive` (keystore cifrado). **Nada de private keys en `.env`.**
   `.env.example`:
   ```
   SEPOLIA_RPC_URL=
   ETHERSCAN_API_KEY=
   ```
3. `script/Deploy.s.sol`:
   1. Desplegar `MockUSDT` y `RWATokenizer1155(usdt, uri, admin)`.
   2. Otorgar `ISSUER_ROLE` al creador y mintear USDT a A y B.
   3. Registrar el activo 1.
   4. Desplegar `AssetVotes(tokenizer, 1)` y `OmniGovernor(adapter, "OmniRWA Depto Rosario", 600)` (10 minutos).
   5. `tokenizer.setAssetGovernor(1, governor)`.
4. Ejecutar:
   ```bash
   forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --broadcast --verify
   ```
   `--verify` verifica los 4 contratos. Si el Governor supera 24 KB, bajar `optimizer_runs`.
5. Correr la demo (`Demo.s.sol` o el frontend) y **guardar los hashes**.
6. ⚠️ **Si se cambia una línea después del deploy final, hay que volver a desplegar, verificar y correr la demo.** Por eso se congela el código el 25/10.

### Slither

```bash
pip install slither-analyzer      # o: pipx install slither-analyzer
slither . --filter-paths "lib/|test/|script/"
slither . --filter-paths "lib/|test/|script/" --checklist > slither-report.md
```

Tabla en el README: **Detector · Contrato · Estado (corregido / falso positivo / aceptado / externo) · Justificación**. Hallazgos esperables:

| Detector | Justificación probable |
|---|---|
| `timestamp` | **Aceptado:** las ventanas son de minutos o días; un validador solo puede manipular el tiempo unos segundos |
| `divide-before-multiply` (acumulador de dividendos) | **Aceptado:** es el patrón intencional; el error está acotado por `PRECISION` y lo cubre el test de fuzz |
| `unused-return` (`Checkpoints.push` devuelve valores que no usamos) | **Aceptado:** el valor de retorno (saldo anterior y nuevo) no es necesario |
| `reentrancy-*` en `buyFractions` / `claimDividends` | Revisar que eventos y estado estén antes de las llamadas externas; justificación: `nonReentrant` + CEI |
| Hallazgos en `lib/` (OpenZeppelin) | **Externo**, fuera de alcance |

---

## 13. README, whitepaper y video

### README.md (mínimo según el checklist F)

1. Qué es OmniRWA, por qué usar blockchain y la arquitectura (diagrama de la sección 5).
2. Decisiones de diseño (resumen de la sección 4).
3. Roles y permisos.
4. Instalación y compilación: `forge install`, `forge build`.
5. Tests y coverage: comandos + captura.
6. Slither: comando + tabla de hallazgos.
7. Uso: scripts y frontend, paso a paso.
8. Red (Sepolia), direcciones y **URL directa al código verificado** de cada contrato (`https://sepolia.etherscan.io/address/0x...#code`).
9. **Hashes / links de las transacciones** del flujo principal.
10. Limitaciones del MVP.
11. Roadmap.

### Whitepaper

El PDF pide subirlo a Drive, pero no detalla el formato → **confirmar en la mentoría**. Contenido propuesto:

- Problema y solución.
- Por qué blockchain.
- Arquitectura y decisiones (ERC-1155, dividendos pull, Governor + snapshot + 2/3).
- Seguridad.
- Limitaciones y roadmap.

### Video (máximo 5 minutos)

| Tiempo | Contenido |
|---|---|
| 0:00–0:40 | Problema, solución y por qué blockchain |
| 0:40–1:30 | Arquitectura y decisiones (ERC-1155, snapshot en lugar de bloqueo, 2/3) |
| 1:30–4:00 | Demo real en Sepolia (guion de la sección 8), mostrando el explorer |
| 4:00–4:40 | Tests + coverage + Slither (capturas) |
| 4:40–5:00 | Limitaciones y roadmap |

---

## 14. Limitaciones del MVP y roadmap

### Limitaciones conocidas

- Se confía en el creador: tanto en el vínculo legal con el activo como en la veracidad de las ganancias que deposita.
- Un Governor por activo, desplegado a mano por script (sin factory).
- Sin delegación de votos.
- Sin timelock: lo aprobado se ejecuta apenas termina la votación.
- El snapshot excluye lo comprado en el bloque de la propuesta, pero si la transacción del `propose` queda varios bloques pendiente en el mempool, una compra anterior a su inclusión sí vota (mitigación: enviarla con gas suficiente o por RPC privado).
- Un tenedor legítimo de la mayoría tiene peso real (mitigado con 2/3 + quórum + reparto pro-rata).
- Las decisiones off-chain (vender el depto) solo quedan registradas (`recordResolution`), no se ejecutan on-chain.
- Sobrante de redondeo en los dividendos.
- El USDT va directo al creador; no hay devolución si no se vende todo.
- Supuesto: el token de pago no cobra comisión por transferencia.

### Roadmap

**Fase 2 (funcionalidad)**
- Factory que despliega `AssetVotes` + `OmniGovernor` al registrar cada activo.
- Escrow con objetivo de recaudación y devolución si no se alcanza.
- Ejecución on-chain de la liquidación del activo (vender y repartir).
- Mercado secundario de fracciones.
- Oráculo o auditor que certifique las ganancias depositadas.
- Tipos de propuesta con umbrales distintos (simple / calificada).
- Delegación de votos.
- `sweepDust` para el sobrante de redondeo.

**Seguridad y escalabilidad**
- `GovernorTimelockControl` (ventana para que la minoría salga antes de la ejecución).
- Whitelist con KYC y topes por billetera, o migración a ERC-3643 para cumplimiento.
- Multisig (Safe) para los roles de administrador.
- Auditoría externa.
- Despliegue en una L2 (Base o Arbitrum) por costos.

---

## 15. Preguntas para la mentoría del 20/10

1. ¿El **frontend es obligatorio** (checklist E) o alcanzan los scripts de Foundry (punto B)?
2. ¿Qué formato y contenido espera el **whitepaper**?
3. Si usamos Scaffold-ETH, ¿se acepta que los contratos queden en `packages/foundry/contracts` en lugar de `/contracts`?
4. ¿Está bien **un Governor por activo** desplegado por script, o prefieren ver la factory?
5. Avisar que **reemplazamos el bloqueo de fracciones** de la idea original **por snapshot + mayoría calificada** (y explicar por qué), para que no parezca que dejamos afuera una parte de la idea.

---

## 16. Checklist final de entrega

**Smart contracts**
- [ ] Los 4 contratos están desplegados en Sepolia y **verificados**, con URL en el README.
- [ ] Lo desplegado coincide con el código del repo.
- [ ] La demo se ejecutó on-chain y los hashes están en el README.
- [ ] Hay interacción entre contratos (Tokenizer ↔ MockUSDT, Governor ↔ AssetVotes ↔ Tokenizer).

**Código**
- [ ] NatSpec completo: variables de estado, eventos y sus parámetros, errores y sus parámetros, funciones (descripción, parámetros, returns), modifiers.
- [ ] Custom errors, eventos, CEI, SafeERC20, `immutable`/`constant`, `unchecked` solo donde es seguro.
- [ ] Roles documentados en NatSpec.
- [ ] Sin `tx.origin`, `delegatecall`, `selfdestruct` ni assembly.
- [ ] Compila sin warnings relevantes.

**Testing**
- [ ] El 100% de los tests pasa.
- [ ] Hay casos de éxito y de error.
- [ ] Coverage > 40% en **todas** las métricas (captura en el README).

**Slither**
- [ ] Se ejecutó, los hallazgos están corregidos o justificados, y la tabla está en el README.

**Frontend y demo**
- [ ] El frontend interactúa con los contratos y muestra el flujo principal.

**Repositorio**
- [ ] Es público.
- [ ] Cada integrante tiene commits con su propia cuenta.
- [ ] No hay secretos; hay `.env.example`.
- [ ] El README tiene todas las secciones de la sección 13.

**Entrega**
- [ ] Video ≤ 5 minutos con evidencia real.
- [ ] Whitepaper.
- [ ] Ambos subidos a la carpeta de Drive con el apellido de quien registró el grupo en el nombre del archivo.
- [ ] Entregado antes del **martes 27/10 a las 23:59 h**.
