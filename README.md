# OmniRWA

> Fraccionamiento de activos reales (RWA) con ERC-1155, dividendos *pull over push* y gobernanza on-chain con snapshot, quórum y mayoría calificada.
> Proyecto Final — Blockchain / Web3 · Stack: **Solidity 0.8.24 · Foundry · OpenZeppelin v5.1 · Next.js + wagmi/viem** · Red: **Sepolia**.

> **El frontend está desplegado en Vercel: <https://omnirwa-frontend.vercel.app/>**, conectado a los contratos verificados en Sepolia ([§10](#10-red-y-contratos-desplegados)). Para usarlo solo hace falta MetaMask en la red Sepolia ([§9.8](#98-conectar-metamask)). 

Recomendamos probar en Local primero, sin Vercel, para mejorar la velocidad de aprobacion de Transacciones. Al estar en Vercel se obtienen mas warnings innecesarios por parte de Metamask.

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
| D12 | Metadata en IPFS, on-chain solo `bytes32` (hash del legajo y nombre corto de hasta 32 bytes) | Evitar strings largos (gas) |
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

| Herramienta | Versión | Cómo verificar |
|---|---|---|
| [Foundry](https://book.getfoundry.sh/getting-started/installation) | **≥ 1.8** | `forge --version` |
| Node.js | ≥ 24 (npm 11; con npm 10 `npm ci` rechaza el lockfile) | `node --version` |
| Chrome o Edge + [MetaMask](https://metamask.io/download) | — | Ícono del zorro en la barra |
| Cuenta de [Etherscan](https://etherscan.io/register) | — | Solo para deployar: API key de verificación |
| Python 3 | — | Opcional, para Slither |

> **Foundry 1.5 o anterior no sirve para Sepolia.** Desde el hardfork Glamsterdam (octubre 2026) crear contratos cuesta mucho más gas, y las versiones viejas lo estiman mal. En Windows, actualizar descargando `foundry_vX.Y.Z_win32_amd64.zip` de [las releases](https://github.com/foundry-rs/foundry/releases) y reemplazando los `.exe` de `%USERPROFILE%\.foundry\bin` (cerrar antes cualquier `anvil` o `cast` abierto).

```bash
git clone --recurse-submodules https://github.com/JulianColoma/omnirwa.git
cd omnirwa
forge install          # si se clonó sin --recurse-submodules
forge build
cd frontend && npm install && npm run abis
```

## 7. Tests y coverage

```bash
forge test -vvv
forge coverage --report summary --no-match-coverage "(script|test|lib)"
```

79 tests (unitarios, fuzz e integración con los contratos reales), todos en verde. Coverage final:

| Archivo | % Líneas | % Statements | % Ramas | % Funciones |
|---|---|---|---|---|
| `contracts/RWATokenizer1155.sol` | 100,00% (93/93) | 99,15% (116/117) | 95,24% (20/21) | 100,00% (19/19) |
| `contracts/governance/AssetVotes.sol` | 100,00% (25/25) | 100,00% (24/24) | 100,00% (5/5) | 100,00% (10/10) |
| `contracts/governance/OmniGovernor.sol` | 100,00% (17/17) | 100,00% (20/20) | 100,00% (1/1) | 100,00% (7/7) |
| `contracts/mocks/MockUSDT.sol` | 100,00% (5/5) | 100,00% (2/2) | N/A (0/0) | 100,00% (3/3) |
| **Total** | **100,00% (140/140)** | **99,39% (162/163)** | **96,30% (26/27)** | **100,00% (39/39)** |

## 8. Slither

```bash
pipx install slither-analyzer        # o: uv tool install slither-analyzer
slither .
```

Slither llama a `forge`: el primero en el `PATH` tiene que ser el de Foundry (`~/.foundry/bin`).

Slither 0.11.6 sobre el código desplegado (commit `b242d0f`, con el nombre del activo): **7 resultados en 4 detectores, ninguno de severidad alta**.

| Detector | Impacto | Contrato / función | Estado | Justificación |
|---|---|---|---|---|
| `unused-return` (×3) | Medium | `RWATokenizer1155._update` (`Checkpoints.push`) | Aceptado | `push` devuelve el saldo anterior y el nuevo, que no se necesitan. |
| `timestamp` (×2) | Low | `RWATokenizer1155.balanceOfAt` / `totalSupplyAt` | Aceptado | Solo rechaza consultas a futuro (`FutureLookup`); un validador mueve el timestamp segundos y las votaciones duran minutos o días. |
| `naming-convention` | Informational | `AssetVotes.CLOCK_MODE()` | Falso positivo | El nombre lo exige ERC-6372. |
| `unimplemented-functions` | Informational | `RWATokenizer1155` / `IRWATokenizer.balanceOf` | Falso positivo | Implementada con `override(ERC1155, IRWATokenizer)`. |

No aparecen `reentrancy-*` (`nonReentrant` + CEI) ni `divide-before-multiply`. Detalle completo: [docs/SLITHER.md](docs/SLITHER.md).

`forge build` compila sin errores y el linter de Foundry deja 7 avisos, todos analizados en [docs/SLITHER.md](docs/SLITHER.md#warnings-del-linter-de-forge-build):

| Lint | Dónde | Estado |
|---|---|---|
| `block-timestamp` (×2), `unsafe-typecast` (×2) | `balanceOfAt` / `totalSupplyAt` (`uint48(block.timestamp)`) | Aceptado: solo rechazan consultas a futuro y `uint48` no trunca hasta dentro de millones de años |
| `missing-events-access-control` | `setSaleActive` | Falso positivo: la función emite `SaleStatusChanged` |
| `environment-read-across-mutation` (×2) | `test/RWATokenizer1155.t.sol` | Fuera de alcance: está en los tests |

## 9. Uso: deploy, demo y frontend

La forma más rápida de probar el proyecto es el **frontend público en <https://omnirwa-frontend.vercel.app/>**, que ya apunta al deploy de [§10](#10-red-y-contratos-desplegados): basta con configurar MetaMask ([§9.8](#98-conectar-metamask)) y seguir el guion ([§9.9](#99-guion-de-la-demo)). El resto de la sección explica cómo hacer un deploy propio en Sepolia, correr el frontend localmente y ensayar en anvil.

Los comandos de Sepolia son para **PowerShell** (Windows) y se corren desde la raíz del repo salvo que se indique otra carpeta.

### 9.1 Cuentas del deploy actual

Los roles del deploy de [§10](#10-red-y-contratos-desplegados) quedaron asignados a estas cuentas, así que la demo completa (registrar, depositar dividendos, comprar con el USDT de prueba minteado) solo se puede hacer con ellas. Con otras billeteras hay que hacer un deploy propio (9.2 a 9.6).

| Rol | Dirección |
|---|---|
| Creador (deployer, emisor) | [`0x2b9613629EC05e382D578bbAb8D34835F04F3bbb`](https://sepolia.etherscan.io/address/0x2b9613629EC05e382D578bbAb8D34835F04F3bbb) |
| Inversor A | [`0x4fd7728a667D564Fc4F81B942E862DB32e6cB4f4`](https://sepolia.etherscan.io/address/0x4fd7728a667D564Fc4F81B942E862DB32e6cB4f4) |
| Inversor B | [`0xfE8357a84522E5268d11899D0855753ee05Adc8E`](https://sepolia.etherscan.io/address/0xfE8357a84522E5268d11899D0855753ee05Adc8E) |

Los activos 2 a 5 se registraron desde el frontend, cada uno con su propio Governor ([§10](#10-red-y-contratos-desplegados)), así que el guion de [§9.9](#99-guion-de-la-demo) se puede repetir registrando un activo nuevo.

### 9.2 Billeteras de prueba

Hacen falta **3 cuentas**: Creador (también firma el deploy), Inversor A e Inversor B.

> **No usar las cuentas de anvil** (`0x7099…`, `0x3C44…`, `0x90F7…`). Sus claves privadas son públicas y hay bots que se llevan en segundos cualquier ETH que reciban, también en Sepolia.
>
> **No usar billeteras con fondos reales**, ni cuentas creadas con *Agregar cuenta* sobre una frase semilla que tenga fondos: más adelante se importa la clave del Creador en un keystore.

Generar 3 claves nuevas con Foundry (correr 3 veces; muestra `Address` y `Private key`):

```powershell
cast wallet new
```

Importar cada una en MetaMask: nombre de la cuenta arriba a la izquierda → **Agregar billetera** → **Importar una cuenta** → pegar la clave. Renombrarlas (⋮ → *Editar nombre*) como **SepoliaC**, **SepoliaA** y **SepoliaB**. Al terminar, limpiar la terminal (`cls`): las claves no se guardan en ningún archivo del repo.

### 9.3 ETH de Sepolia

1. En el [faucet de Google Cloud](https://cloud.google.com/application/web3/faucet/ethereum/sepolia), pedir **0,05 ETH** para **SepoliaC**.
2. Desde MetaMask, con la red **Sepolia** y la cuenta **SepoliaC** → **Enviar** → **0,01 ETH** a SepoliaA y **0,01 ETH** a SepoliaB.

Para ver los saldos en MetaMask hay que elegir la red Sepolia (si no aparece: ☰ → *Configuración* → *Avanzado* → **Mostrar redes de prueba**). Referencia de costos: el deploy completo usó ~50 M de gas, **≈0,0025 ETH** a 0,05 gwei.

```powershell
cast balance <dirección> --ether --rpc-url https://ethereum-sepolia-rpc.publicnode.com
```

### 9.4 Variables de entorno y keystore

```powershell
copy .env.example .env
```

```dotenv
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHERSCAN_API_KEY=<key de etherscan.io/myapikey>
CREATOR_ADDRESS=<dirección de SepoliaC>
INVESTOR_A_ADDRESS=<dirección de SepoliaA>
INVESTOR_B_ADDRESS=<dirección de SepoliaB>
TOKEN_URI=ipfs://omnirwa/{id}.json
```

`.env` está en `.gitignore`: **nunca** poner private keys ni frases semilla ahí. La clave del deployer va a un keystore cifrado, fuera del repo (`%USERPROFILE%\.foundry\keystores`):

```powershell
cast wallet import deployer --interactive   # pide la private key de SepoliaC y una contraseña
cast wallet list                            # tiene que aparecer "deployer (Local)"
```

Simulación opcional (no firma nada; confirma que el `.env` se lee bien):

```powershell
forge script script/Deploy.s.sol --rpc-url sepolia --sender <dirección de SepoliaC>
```

Tiene que terminar en `SIMULATION COMPLETE`. El gas que estima **no es confiable en Sepolia** (ver 9.5), y escribe `deployments/11155111.json`: borrarlo después para no confundirlo con un deploy real.

### 9.5 Deploy y verificación

```powershell
forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --broadcast --verify --skip-simulation --slow
```

| Flag | Por qué |
|---|---|
| `--account deployer` | Firma con el keystore cifrado; ninguna clave pasa por la línea de comandos |
| `--verify` | Publica el código en Etherscan (y Sourcify) |
| `--skip-simulation` | El gas lo estima el nodo de Sepolia. La simulación local usa `evm_version = cancun` y subestima 5–7 veces la creación de contratos: sin este flag las creaciones fallan por falta de gas |
| `--slow` | Manda cada transacción cuando la anterior ya está confirmada, así la estimación de la siguiente ve los contratos desplegados |

El script ([script/Deploy.s.sol](script/Deploy.s.sol)) manda 8 transacciones: despliega `MockUSDT` y `RWATokenizer1155`, le da `ISSUER_ROLE` al Creador, mintea 10.000 USDT de prueba a cada inversor y despliega `AssetVotes` y `OmniGovernor` para el activo 1, vinculándolos al tokenizer. Tarda 2–3 minutos y termina con:

```
ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
...
All (4) contracts were verified!
```

Se generan `deployments/11155111.json` (direcciones + bloque inicial) y `broadcast/Deploy.s.sol/11155111/run-latest.json` (las transacciones). Si la verificación falla por un timeout de Etherscan, reintentar sin volver a deployar:

```powershell
forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --resume --verify
```

### 9.6 Controles después del deploy

```powershell
$r = "https://ethereum-sepolia-rpc.publicnode.com"
$d = Get-Content deployments/11155111.json -Raw | ConvertFrom-Json

# el Creador tiene ISSUER_ROLE → true
$role = cast call $d.RWATokenizer1155 "ISSUER_ROLE()(bytes32)" --rpc-url $r
cast call $d.RWATokenizer1155 "hasRole(bytes32,address)(bool)" $role <dirección de SepoliaC> --rpc-url $r

# cada inversor tiene 10.000 USDT → 10000000000
cast call $d.MockUSDT "balanceOf(address)(uint256)" <dirección de SepoliaA> --rpc-url $r

# el Governor del activo 1 es el desplegado → igual a $d.OmniGovernor
cast call $d.RWATokenizer1155 "assetGovernor(uint256)(address)" 1 --rpc-url $r
```

Y abrir los 4 links `https://sepolia.etherscan.io/address/<dirección>#code`: la pestaña *Contract* tiene que mostrar el ✓ de verificado.

### 9.7 Frontend

Next.js 14 + wagmi v2 + viem. Desplegado en **<https://omnirwa-frontend.vercel.app/>**. Una sola página con todo el flujo:

- **Activo:** avance de la venta, precio, recaudado, emisor y hash del legajo.
- **Comprar:** calcula el costo, aprueba **el monto exacto** solo si el allowance no alcanza, espera el recibo y recién ahí compra.
- **Tu posición:** fracciones, participación, saldo de USDT, dividendos pendientes y retiro (*pull*).
- **Emisor:** si la cuenta tiene `ISSUER_ROLE` y el activo no existe, lo registra; si es el creador, deposita dividendos (approve + depósito).
- **Junta de inversores:** lista las propuestas a partir de los eventos `ProposalCreated`, muestra votos, mayoría 2/3, quórum, cuenta regresiva (con la hora de la cadena) y el poder de voto de la cuenta en el snapshot. Permite crear propuestas (abrir/cerrar la venta o registrar una resolución), votar y ejecutar.
- **Actividad:** últimos eventos del activo con link a cada transacción en Etherscan.

Los reverts se decodifican con los custom errors de los contratos (`SaleNotActive`, `GovernorAlreadyCastVote`, etc.) y se muestran en castellano.

Para correrlo localmente contra Sepolia:

```powershell
forge build
cd frontend
npm install
npm run abis                 # genera lib/abis/*.ts desde ../out
npm run sync                 # copia direcciones y bloque inicial de ../deployments/11155111.json a .env.local
```

Agregar el RPC de lectura al final de `frontend/.env.local` (ver `frontend/.env.example`):

```dotenv
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

```powershell
npm run dev                  # http://localhost:3000
```

La lectura de eventos usa `eth_getLogs` desde el bloque del deploy; si el RPC limita el rango, el frontend lo parte en tramos automáticamente. Next.js lee `.env.local` solo al arrancar: cerrar cualquier `npm run dev` anterior antes de iniciar uno nuevo (si el puerto 3000 está ocupado, Next arranca en 3001).

### 9.8 Conectar MetaMask

1. Abrir <https://omnirwa-frontend.vercel.app/> (o la URL local que imprime `npm run dev`) en el Chrome/Edge donde está MetaMask. No funciona en el navegador integrado de VS Code.
2. En MetaMask elegir la red **Sepolia** y la cuenta **SepoliaC**.
3. **Conectar billetera** → marcar **SepoliaC, SepoliaA y SepoliaB** → **Conectar**.
4. Comprobar: arriba a la derecha la dirección del Creador y, en el pie, "Contratos · Sepolia" con las direcciones de [§10](#10-red-y-contratos-desplegados).

**Cambiar de actor:** cambiar de cuenta en MetaMask. Si la página muestra `Connector already connected`, recargar con **F5** y, si aparece, tocar *Conectar billetera*.

### 9.9 Guion de la demo

Números: activo "Depto Rosario", **1.000 fracciones a 10 USDT**. A compra 500, B compra 300. El creador reparte 800 USDT. Quórum 20%, mayoría 2/3, votación de **10 minutos reales**.

| # | Cuenta | Acción en la página | Resultado esperado |
|---|---|---|---|
| 1 | SepoliaC | **Registrar activo**: `1000` fracciones, `10` USDT, legajo `ipfs://depto-rosario` → *Registrar* | "0 de 1.000 fracciones vendidas", **venta abierta** |
| 2 | SepoliaA | *Comprar* → `500` → **Aprobar y comprar** (2 firmas: approve exacto + compra) | 500 fracciones, 5.000 USDT menos |
| 3 | SepoliaB | *Comprar* → `300` → **Aprobar y comprar** | "800 de 1.000 vendidas" |
| — | — | **Esperar ~15 s** | Las fracciones tienen que estar en un bloque anterior al de la propuesta |
| 4 | SepoliaA | **Nueva propuesta** → "Cerrar la venta" → título `Cerrar la venta del Depto Rosario` → *Proponer* | Propuesta 1 creada |
| 5 | SepoliaA | **Resolución** → título `Vender el Depto Rosario a 120.000 USDT` + texto → *Proponer* | Propuesta 2 creada |
| — | — | Esperar el bloque siguiente (~12 s) y recargar | Ambas **Activas**, "Tu voto pesa 500 fracciones". **Empiezan los 10 minutos** |
| 6 | SepoliaA | **A favor** en las dos | |
| 7 | SepoliaB | **A favor** en la 1, **En contra** en la 2 | Propuesta 2: "62,5% a favor (necesita 66,7%)" |
| 8 | SepoliaC | **Depositar dividendos** → `800` → *Aprobar y depositar* | "1 USDT por fracción" |
| 9 | SepoliaA | **Retirar dividendos** | +500 USDT |
| 10 | SepoliaB | **Retirar dividendos** | +300 USDT |
| — | — | Esperar a que terminen los 10 minutos y recargar | Propuesta 1 **Aprobada**, propuesta 2 **Rechazada** |
| 11 | Cualquiera | Propuesta 1 → **Ejecutar** | Propuesta 1 **Ejecutada**, activo con **venta cerrada** |
| 12 | Cualquiera | Intentar comprar | Botón deshabilitado: "La venta está cerrada." |

Hacer los pasos 6 a 10 **mientras corre la votación**: el voto solo se acepta mientras la propuesta está *Activa*. Si el activo se registró con otra cantidad de fracciones, escalar los números: con **100 fracciones**, A compra **50**, B compra **30** y el depósito es de **80 USDT**; la gobernanza da lo mismo (62,5% < 2/3).

**Tarifas:** el frontend le pasa a MetaMask tarifas calculadas con el bloque actual (2 × base fee + propina mínima), así que MetaMask debería mostrar *Sitio sugerido*. Si muestra *Mercado* con una tarifa que supera ~0,002 ETH, usar *Editar tarifa* → **Sitio sugerido** (o **Baja**).

Qué muestra cada bloque:

- **1–3:** tokenización ERC-1155 y pago en stablecoin con `SafeERC20` (el USDT va directo al creador). El frontend aprueba el monto exacto, nunca un allowance infinito.
- **4–7:** gobernanza con snapshot: el voto pesa las fracciones que se tenían al crear la propuesta. La propuesta 2 tiene mayoría simple pero no llega a 2/3: el inversor mayoritario no decide solo.
- **8–10:** dividendos *pull* con acumulador por fracción: cada uno retira su parte cuando quiere.
- **11–12:** el Governor ejecuta on-chain `setSaleActive(1, false)` sobre el tokenizer, la única acción que tiene permitida sobre su activo.

Seguir el estado desde la terminal (opcional):

```powershell
$r = "https://ethereum-sepolia-rpc.publicnode.com"
$t = "0x207896BC9c47A105D5A6D01C53b5F036263950bf"

# activo 1: creador, maxFractions, saleActive, precio, vendidas, legajo, nombre
cast call $t "assets(uint256)(address,uint64,bool,uint128,uint64,bytes32,bytes32)" 1 --rpc-url $r
```

Estados de una propuesta en el Governor (`state(proposalId)`): 0 Pendiente, 1 Activa, 3 Rechazada, 4 Aprobada, 7 Ejecutada.

### 9.10 Demo por scripts

Alternativa al frontend: cada paso lo firma su actor (`creator`, `investorA`, `investorB`, importados con `cast wallet import`). El guion completo está en la cabecera de [script/Demo.s.sol](script/Demo.s.sol); los votos se emiten por propuesta sin copiar el id (`voteCloseSale(uint8)`, `voteResolution(uint8)`) y `status()` imprime el estado del activo y de las dos propuestas.

```bash
forge script script/Demo.s.sol --sig "register()"            --rpc-url sepolia --account creator   --broadcast
forge script script/Demo.s.sol --sig "buy(uint64)" 500       --rpc-url sepolia --account investorA --broadcast
forge script script/Demo.s.sol --sig "proposeCloseSale()"    --rpc-url sepolia --account investorA --broadcast
forge script script/Demo.s.sol --sig "voteCloseSale(uint8)" 1 --rpc-url sepolia --account investorA --broadcast
forge script script/Demo.s.sol --sig "status()"              --rpc-url sepolia
```

### 9.11 Entorno local (anvil)

Para ensayar sin testnet. Las cuentas de anvil están desbloqueadas, así que no hace falta ninguna clave:

```bash
anvil                                            # terminal 1
# terminal 2: cuentas 0 = deployer, 1 = creador, 2 = inversor A, 3 = inversor B
export CREATOR_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
export INVESTOR_A_ADDRESS=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
export INVESTOR_B_ADDRESS=0x90F79bf6EB2c4f870365E785982E1f101E93b906
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast   --unlocked --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
cd frontend && npm run sync -- 31337 && npm run dev
```

En MetaMask: agregar la red `http://127.0.0.1:8545` (chainId 31337) e importar las cuentas de anvil que se quieran usar. Para cerrar una votación sin esperar 10 minutos: `cast rpc evm_increaseTime 600 && cast rpc evm_mine`.

### 9.12 Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| El ETH del faucet no aparece en MetaMask | El filtro está en "Todas las redes predeterminadas" (solo mainnets) | Elegir la red **Sepolia** en *Inicio*; activar *Mostrar redes de prueba* si no aparece |
| `vm.envAddress: environment variable "CREATOR_ADDRESS" not found` | Falta `.env`, no está guardado o se corrió fuera de la raíz del repo | Completar y guardar `.env` (9.4); correr desde `omnirwa/` |
| `Mac Mismatch` / `Failed to decrypt keystore` | Contraseña del keystore incorrecta | Reintentar; no se ve mientras se escribe |
| `Transaction Failure: 0x…` en las creaciones de contratos | La simulación local subestimó el gas | Usar `--skip-simulation --slow` y Foundry ≥ 1.8 (9.5). Borrar `deployments/11155111.json` y volver a deployar |
| No se puede reemplazar `anvil.exe` / `cast.exe` al actualizar Foundry | Hay un `anvil` o `cast` corriendo | Cerrarlos, o renombrar el `.exe` en uso y copiar el nuevo |
| `localhost:3000` se queda cargando | Sigue vivo un `npm run dev` viejo y el nuevo arrancó en 3001 | Cerrar el servidor viejo y usar la URL que imprime `npm run dev` |
| Arriba a la derecha aparece `0x7099…` y no está el panel de registro | Está conectada una cuenta de anvil | *Salir* → en MetaMask conectar SepoliaC/A/B (9.8) |
| `Connector already connected` al cambiar de cuenta | Estado viejo del conector en la página | **F5** y, si aparece, *Conectar billetera* |
| "Para proponer necesitás al menos una fracción comprada antes de este bloque" | Se propuso en el mismo bloque de la compra | Esperar ~15 s y reintentar |
| "No tenías fracciones cuando se creó esta propuesta" | La cuenta compró después de la propuesta (snapshot) | Comportamiento esperado |
| No aparecen propuestas ni actividad | El RPC rechaza `eth_getLogs` | Revisar `NEXT_PUBLIC_RPC_URL` en `frontend/.env.local` y reiniciar `npm run dev` |
| Falla `--verify` | `ETHERSCAN_API_KEY` vacía o timeout de Etherscan | Revisar `.env` y reintentar con `--resume --verify` |

## 10. Red y contratos desplegados

Red: **Sepolia** (chainId `11155111`). Bloque inicial del deploy: `11988458`. Las direcciones también están en [`deployments/11155111.json`](deployments/11155111.json).

### Contratos del deploy (script `Deploy.s.sol`)

| Contrato | Dirección | Código verificado |
|---|---|---|
| MockUSDT | `0xa41686cC85a839d288bf35816FFC6E2d27DDc1e0` | [Etherscan](https://sepolia.etherscan.io/address/0xa41686cC85a839d288bf35816FFC6E2d27DDc1e0#code) |
| RWATokenizer1155 | `0x207896BC9c47A105D5A6D01C53b5F036263950bf` | [Etherscan](https://sepolia.etherscan.io/address/0x207896BC9c47A105D5A6D01C53b5F036263950bf#code) |
| AssetVotes (activo 1) | `0x35bCc99bE269cDcD1c2161308425b3a7C90095A9` | [Etherscan](https://sepolia.etherscan.io/address/0x35bCc99bE269cDcD1c2161308425b3a7C90095A9#code) |
| OmniGovernor (activo 1) | `0x1BB6c9469bdE84Bee3925d365255b47F0f0c5d38` | [Etherscan](https://sepolia.etherscan.io/address/0x1BB6c9469bdE84Bee3925d365255b47F0f0c5d38#code) |

### Governors desplegados desde el frontend

Al registrar un activo desde `/crear`, el frontend despliega su `AssetVotes` y su `OmniGovernor` y los vincula con `setAssetGovernor` ([CreateAsset.tsx](frontend/components/CreateAsset.tsx)). Etherscan los muestra como verificados por coincidencia de bytecode (*Similar Match*) con el `OmniGovernor` ya verificado, porque es el mismo código con otros argumentos de constructor.

| Activo | Contrato | Dirección | Código verificado |
|---|---|---|---|
| 2 "Lote de Prueba" | OmniGovernor | `0xCb1C8aE5E6952c2ab4A2a60f244B29875eFf24b5` | [Etherscan](https://sepolia.etherscan.io/address/0xCb1C8aE5E6952c2ab4A2a60f244B29875eFf24b5#code) |
| 2 "Lote de Prueba" | AssetVotes | `0x4340E257d02e0d789faf7Cb0d01f256A84634861` | [Etherscan](https://sepolia.etherscan.io/address/0x4340E257d02e0d789faf7Cb0d01f256A84634861#code) |
| 5 "Lote de Soja de Prueba" | OmniGovernor | `0x7A48635B014Ae612fAd56a3182b4DD0A10890A75` | [Etherscan](https://sepolia.etherscan.io/address/0x7A48635B014Ae612fAd56a3182b4DD0A10890A75#code) |
| 5 "Lote de Soja de Prueba" | AssetVotes | `0x5e075E27B68C14131B4C4C39583ce6D83adC6fdc` | [Etherscan](https://sepolia.etherscan.io/address/0x5e075E27B68C14131B4C4C39583ce6D83adC6fdc#code) |

Cuenta del Creador / deployer: [`0x2b9613629EC05e382D578bbAb8D34835F04F3bbb`](https://sepolia.etherscan.io/address/0x2b9613629EC05e382D578bbAb8D34835F04F3bbb).

### Deploy anterior (obsoleto)

Primer deploy, hecho con la versión del tokenizer previa al nombre del activo on-chain (`bytes32 name`). Quedó reemplazado por el de arriba y **no corresponde al código actual del repo**; se lista solo porque sus contratos siguen verificados y el `OmniGovernor` es la referencia del *Similar Match*.

| Contrato | Dirección | Código verificado |
|---|---|---|
| MockUSDT | `0x470d4dbeD74ADB07ddB913f6809d23F354c24f9B` | [Etherscan](https://sepolia.etherscan.io/address/0x470d4dbeD74ADB07ddB913f6809d23F354c24f9B#code) |
| RWATokenizer1155 | `0x6010Bc1953f0c158A66C7d2a2498149De7E5879C` | [Etherscan](https://sepolia.etherscan.io/address/0x6010Bc1953f0c158A66C7d2a2498149De7E5879C#code) |
| OmniGovernor | `0x95a0EDEf0f720aAd42e425C5d131751AA9045205` | [Etherscan](https://sepolia.etherscan.io/address/0x95a0EDEf0f720aAd42e425C5d131751AA9045205#code) |

## 11. Transacciones del flujo principal

Transacciones reales en Sepolia sobre el deploy de [§10](#10-red-y-contratos-desplegados).

### Activo 5 "Lote de Soja de Prueba": registro, compra y gobernanza ejecutada

Registrado desde el frontend con 1.000 fracciones a 10 USDT. La propuesta para cerrar la venta se aprobó y el Governor la ejecutó on-chain: hoy el activo tiene la **venta cerrada** (`saleActive = false`).

| Paso | Actor | Tx |
|---|---|---|
| Registrar el activo 5 (1.000 × 10 USDT) | Creador | [`0x327e2def…b3c6c1`](https://sepolia.etherscan.io/tx/0x327e2def60ad75b09ad51d2f5f6dfdc0d11f4c54a67a160e492ff9c4d6b3c6c1) |
| `setAssetGovernor(5, 0x7A48…0A75)` | Creador | [`0x03bd2d71…9721c4`](https://sepolia.etherscan.io/tx/0x03bd2d7142ff94788e080062f7e3b4b0aa18ca12bd42e0597ab3cb029b9721c4) |
| Compra de 12 fracciones (120 USDT) | Inversor A | [`0x960cb6a3…80cda6`](https://sepolia.etherscan.io/tx/0x960cb6a3091ff7439b7574ec5aad8b9be69cc7f4a82d7729507094dcd280cda6) |
| Compra de 15 fracciones (150 USDT) | Inversor B | [`0x28289673…f7ffec`](https://sepolia.etherscan.io/tx/0x28289673041339e3d84e9bf92d9c0af364ae3d7d6ae70a307e63773a86f7ffec) |
| Propuesta 1 "Cerrar el lote de Prueba" (`setSaleActive(5, false)`) | Inversor A | [`0xfe42393b…b96e0d`](https://sepolia.etherscan.io/tx/0xfe42393b4c9dc485c81ad76222851ac4e5809570df64ab1dde0de2dc8db96e0d) |
| Voto a favor en la propuesta 1 (15 votos de 27, supera el quórum del 20%) | Inversor B | [`0x92234d0e…fdf2dd45`](https://sepolia.etherscan.io/tx/0x92234d0e5831a85eebeefa09d908b8c4be71d1abab0fc5478ebfeabdfef2dd45) |
| Propuesta 2 "Votacion Fallida": sin votos, quedó **Rechazada** por falta de quórum | Inversor A | [`0xdcbb1247…3ca7f614`](https://sepolia.etherscan.io/tx/0xdcbb1247b676b75b92876cbd0e87bfc96ebe9495dc8380ce4142a8e03ca7f614) |
| Ejecución de la propuesta 1: el Governor cierra la venta (`SaleStatusChanged(5, false)`) | Inversor A | [`0xd9e900b9…403612`](https://sepolia.etherscan.io/tx/0xd9e900b95f7795781c5dc28fff0621ea68fcf8aa96119a25dbfe6d6b71403612) |

### Deploy y activo 1 "Lote de SOja": dividendos

Activo registrado por script con 10 fracciones a 10 USDT (nombre tal como quedó on-chain).

| Paso | Actor | Tx |
|---|---|---|
| Deploy: `MockUSDT` | Deployer | [`0xd8ac55f2…107481`](https://sepolia.etherscan.io/tx/0xd8ac55f20403f6438c25ad1f760ae773f761eb1dbc16179dd524801bbf107481) |
| Deploy: `RWATokenizer1155` | Deployer | [`0x21c4b0e6…ef32c5`](https://sepolia.etherscan.io/tx/0x21c4b0e6068912f712931012e31151eb7d01dc98510d0f3f4b8795e10def32c5) |
| `ISSUER_ROLE` al creador | Deployer | [`0x3c5bca01…225e1b`](https://sepolia.etherscan.io/tx/0x3c5bca01c8016404dbd4a6ecdcd33b825d9abbb2f06ed7f5049bff15e0225e1b) |
| Mint de 10.000 USDT de prueba a cada inversor | Deployer | [`0x3b43c4a0…af217e`](https://sepolia.etherscan.io/tx/0x3b43c4a0b117f97c4f176e43bc396c8043e4455ab3c0e8efd4e9741728af217e) · [`0x5d4873d1…5b4cc4`](https://sepolia.etherscan.io/tx/0x5d4873d125b289a795108e40ce7842988d8a393f5dc5bae5826299f1695b4cc4) |
| Deploy: `AssetVotes` (activo 1) | Deployer | [`0xa8d6b07c…5372cb`](https://sepolia.etherscan.io/tx/0xa8d6b07c499e2ed1b71473742a85bef31d298856dafa7aff832f596f5b5372cb) |
| Deploy: `OmniGovernor` (delay 0, período 600 s, umbral 1, quórum 20%) | Deployer | [`0x7d3e6516…fdf2ca`](https://sepolia.etherscan.io/tx/0x7d3e65165f4c8089687c4a5b95a58d48d9d895dabe4086df9c6f7ceaeefdf2ca) |
| `setAssetGovernor(1, OmniGovernor)` | Deployer | [`0x09a0a3fe…65d3fe`](https://sepolia.etherscan.io/tx/0x09a0a3fe8e8d2b0e45fc997fd123e97360ce093aa59cf56e2bb3ec399765d3fe) |
| Registrar el activo 1 "Lote de SOja" (10 × 10 USDT) | Creador | [`0x9a60fd89…7c6183`](https://sepolia.etherscan.io/tx/0x9a60fd8990ca84c4690e7c49c27d299d072d0f6190f482fd8e8b44d0c07c6183) |
| Compra de las 10 fracciones (100 USDT al creador) | Inversor B | [`0x5b0f7d49…8e8733`](https://sepolia.etherscan.io/tx/0x5b0f7d498442f992dc699d54377d6bdd3a74aea990ee1b3a84d958f4bb8e8733) |
| Depósito de 1 USDT de renta (0,1 USDT por fracción) | Creador | [`0x55c3449f…bb19eb`](https://sepolia.etherscan.io/tx/0x55c3449f3fcf0a4440bbdc320bb8a49f7b056e89e9d3d5043eaff85473bb19eb) |

## 12. Limitaciones conocidas del MVP

- Se confía en el creador: vínculo legal con el activo y veracidad de las ganancias depositadas.
- Un Governor por activo: lo despliega el frontend al registrar el activo (3 transacciones firmadas por el admin), sin factory on-chain.
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
| Julián Valentín Coloma Visconti | A — Tokenizer y dividendos | [@JulianColoma](https://github.com/JulianColoma) |
| Sofia Goszko | B — Gobernanza, tests de integración, coverage y Slither | [@sofiagoszko](https://github.com/sofiagoszko) |
| Nahuel Hernandez Ulanio | C — Scripts, frontend y entrega | [@NahueelHernandezUlanio](https://github.com/NahueelHernandezUlanio) |
