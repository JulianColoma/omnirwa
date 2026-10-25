# OmniRWA — Deploy y demo en Sepolia

Guía paso a paso para desplegar los contratos en la red de prueba **Sepolia**, verificarlos en Etherscan y recorrer la demo completa desde el frontend con MetaMask. Es el camino de la entrega; para ensayar en local con anvil ver [DEMO.md](DEMO.md).

Los comandos son para **PowerShell** (Windows) y se corren desde la raíz del repo (`omnirwa/`) salvo que se indique otra carpeta.

---

## Índice

1. [Deploy actual](#1-deploy-actual)
2. [Requisitos](#2-requisitos)
3. [Billeteras de prueba](#3-billeteras-de-prueba)
4. [ETH de Sepolia](#4-eth-de-sepolia)
5. [Variables de entorno y keystore](#5-variables-de-entorno-y-keystore)
6. [Deploy y verificación](#6-deploy-y-verificación)
7. [Controles después del deploy](#7-controles-después-del-deploy)
8. [Frontend contra Sepolia](#8-frontend-contra-sepolia)
9. [Conectar MetaMask](#9-conectar-metamask)
10. [Guion de la demo](#10-guion-de-la-demo)
11. [Después de la demo](#11-después-de-la-demo)
12. [Problemas frecuentes](#12-problemas-frecuentes)

---

## 1. Deploy actual

Red: **Sepolia** (chainId `11155111`). Bloque inicial: `11988458`.

| Contrato | Dirección | Código verificado |
|---|---|---|
| MockUSDT | `0xa41686cC85a839d288bf35816FFC6E2d27DDc1e0` | [Etherscan](https://sepolia.etherscan.io/address/0xa41686cC85a839d288bf35816FFC6E2d27DDc1e0#code) |
| RWATokenizer1155 | `0x207896BC9c47A105D5A6D01C53b5F036263950bf` | [Etherscan](https://sepolia.etherscan.io/address/0x207896BC9c47A105D5A6D01C53b5F036263950bf#code) |
| AssetVotes | `0x35bCc99bE269cDcD1c2161308425b3a7C90095A9` | [Etherscan](https://sepolia.etherscan.io/address/0x35bCc99bE269cDcD1c2161308425b3a7C90095A9#code) |
| OmniGovernor | `0x1BB6c9469bdE84Bee3925d365255b47F0f0c5d38` | [Etherscan](https://sepolia.etherscan.io/address/0x1BB6c9469bdE84Bee3925d365255b47F0f0c5d38#code) |

Las direcciones también están en [`deployments/11155111.json`](deployments/11155111.json).

**Para correr la demo sobre este deploy** no hace falta volver a deployar: saltar a la [sección 8](#8-frontend-contra-sepolia). Los roles quedaron asignados a estas cuentas, así que la demo solo se puede hacer con ellas:

| Rol | Dirección |
|---|---|
| Creador (deployer, emisor) | `0x2b9613629EC05e382D578bbAb8D34835F04F3bbb` |
| Inversor A | `0x4fd7728a667D564Fc4F81B942E862DB32e6cB4f4` |
| Inversor B | `0xfE8357a84522E5268d11899D0855753ee05Adc8E` |

Con otras billeteras hay que hacer un deploy propio (secciones 2 a 7).

---

## 2. Requisitos

| Herramienta | Versión | Cómo verificar |
|---|---|---|
| [Foundry](https://book.getfoundry.sh/getting-started/installation) | **≥ 1.8** | `forge --version` |
| Node.js | ≥ 24 | `node --version` |
| Chrome o Edge + [MetaMask](https://metamask.io/download) | — | Ícono del zorro en la barra |
| Cuenta de [Etherscan](https://etherscan.io/register) | — | Para la API key de verificación |

Con el repo ya clonado y compilado ([DEMO.md §2](DEMO.md#2-instalación)): `forge build` y, en `frontend/`, `npm install` y `npm run abis`.

> **Foundry 1.5 o anterior no sirve para Sepolia.** Desde el hardfork Glamsterdam (octubre 2026) crear contratos cuesta mucho más gas, y las versiones viejas lo estiman mal. En Windows, actualizar descargando `foundry_vX.Y.Z_win32_amd64.zip` de [las releases](https://github.com/foundry-rs/foundry/releases) y reemplazando los `.exe` de `%USERPROFILE%\.foundry\bin` (cerrar antes cualquier `anvil` o `cast` abierto).

---

## 3. Billeteras de prueba

Hacen falta **3 cuentas**: Creador (también firma el deploy), Inversor A e Inversor B.

> **No usar las cuentas de anvil** (`0x7099…`, `0x3C44…`, `0x90F7…`). Sus claves privadas son públicas y hay bots que se llevan en segundos cualquier ETH que reciban, también en Sepolia.
>
> **No usar billeteras con fondos reales**, ni cuentas creadas con *Agregar cuenta* sobre una frase semilla que tenga fondos: más adelante se exporta la clave del Creador.

Generar 3 claves nuevas con Foundry (correr 3 veces; muestra `Address` y `Private key`):

```powershell
cast wallet new
```

Importar cada una en MetaMask: nombre de la cuenta arriba a la izquierda → **Agregar billetera** → **Importar una cuenta** → pegar la clave. Renombrarlas (⋮ → *Editar nombre*) como **SepoliaC**, **SepoliaA** y **SepoliaB**.

Al terminar, limpiar la terminal (`cls`). Las claves no se guardan en ningún archivo del repo.

---

## 4. ETH de Sepolia

1. En el [faucet de Google Cloud](https://cloud.google.com/application/web3/faucet/ethereum/sepolia), iniciar sesión con Google y pedir **0,05 ETH** para **SepoliaC**.
2. Desde MetaMask, con la red **Sepolia** y la cuenta **SepoliaC** → **Enviar** → **0,01 ETH** a SepoliaA y **0,01 ETH** a SepoliaB.

Para ver los saldos en MetaMask hay que elegir la red Sepolia (filtro de redes en *Inicio*; si no aparece, activar ☰ → *Configuración* → *Avanzado* → **Mostrar redes de prueba**). Que la transferencia del faucet no figure en *Actividad* es normal.

Referencia de costos: el deploy completo usó ~50 M de gas, **≈0,0025 ETH** a 0,05 gwei.

Verificar desde la terminal:

```powershell
cast balance <dirección> --ether --rpc-url https://ethereum-sepolia-rpc.publicnode.com
```

---

## 5. Variables de entorno y keystore

### 5.1 `.env`

```powershell
copy .env.example .env
```

Completar:

```dotenv
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHERSCAN_API_KEY=<key de etherscan.io/myapikey>
CREATOR_ADDRESS=<dirección de SepoliaC>
INVESTOR_A_ADDRESS=<dirección de SepoliaA>
INVESTOR_B_ADDRESS=<dirección de SepoliaB>
TOKEN_URI=ipfs://omnirwa/{id}.json
```

El RPC público de publicnode alcanza; también sirve uno de [Alchemy](https://alchemy.com) o [Infura](https://infura.io). `.env` está en `.gitignore`: **nunca** poner private keys ni frases semilla ahí.

### 5.2 Keystore del deployer

```powershell
cast wallet import deployer --interactive
```

Pide la private key de **SepoliaC** (MetaMask → ⋮ → *Detalles de la cuenta* → *Mostrar clave privada*) y una contraseña para cifrarla. Queda en `%USERPROFILE%\.foundry\keystores`, fuera del repo. La salida tiene que mostrar la dirección de SepoliaC:

```
`deployer` keystore was saved successfully. Address: 0x2b96…
```

Verificar con `cast wallet list` (tiene que aparecer `deployer (Local)`).

### 5.3 Simulación opcional (no firma nada)

```powershell
forge script script/Deploy.s.sol --rpc-url sepolia --sender <dirección de SepoliaC>
```

Tiene que terminar en `SIMULATION COMPLETE`. Confirma que el `.env` se lee bien. **El gas que estima no es confiable en Sepolia** (ver sección 6). La simulación escribe `deployments/11155111.json`: borrarlo después (`del deployments\11155111.json`) para no confundirlo con un deploy real.

---

## 6. Deploy y verificación

```powershell
forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --broadcast --verify --skip-simulation --slow
```

Pide la contraseña del keystore (no se ve mientras se escribe). Tarda 2–3 minutos.

| Flag | Por qué |
|---|---|
| `--account deployer` | Firma con el keystore cifrado; ninguna clave pasa por la línea de comandos |
| `--verify` | Publica el código en Etherscan (y Sourcify) |
| `--skip-simulation` | El gas lo estima el nodo de Sepolia. La simulación local usa `evm_version = cancun` y subestima 5–7 veces la creación de contratos: sin este flag las creaciones fallan por falta de gas |
| `--slow` | Manda cada transacción cuando la anterior ya está confirmada, así la estimación de la siguiente ve los contratos desplegados |

El script ([script/Deploy.s.sol](script/Deploy.s.sol)) manda 8 transacciones:

1. Despliega `MockUSDT` y `RWATokenizer1155`.
2. Le da `ISSUER_ROLE` al Creador.
3. Mintea 10.000 USDT de prueba a cada inversor.
4. Despliega `AssetVotes` y `OmniGovernor` para el activo 1 y los vincula al tokenizer.

Salida esperada:

```
✅ Sequence #1 on sepolia | Total Paid: 0.0025 ETH ...
ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
...
All (4) contracts were verified!
```

Se generan `deployments/11155111.json` (direcciones + bloque inicial) y `broadcast/Deploy.s.sol/11155111/run-latest.json` (las transacciones). Los dos se commitean.

Si la verificación falla por un timeout de Etherscan, reintentar sin volver a deployar:

```powershell
forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --resume --verify
```

---

## 7. Controles después del deploy

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

---

## 8. Frontend contra Sepolia

```powershell
cd frontend
npm run sync          # copia deployments/11155111.json a .env.local
```

Agregar el RPC de lectura al final de `frontend/.env.local` (el frontend lee eventos con `eth_getLogs` desde el bloque del deploy):

```dotenv
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

`frontend/.env.local` tiene que quedar con `NEXT_PUBLIC_CHAIN_ID=11155111` y las direcciones de la [sección 1](#1-deploy-actual).

```powershell
npm run dev
```

> **Antes de `npm run dev`, cerrar cualquier servidor anterior** (Ctrl + C en su terminal). Next.js lee `.env.local` solo al arrancar: un servidor viejo sigue apuntando a anvil y deja la página cargando para siempre. Si el puerto 3000 está ocupado, Next arranca en **3001**: fijarse en la URL que imprime la terminal.

---

## 9. Conectar MetaMask

1. Abrir la URL del frontend (`http://localhost:3000` o la que haya impreso `npm run dev`) en el Chrome donde está MetaMask. No funciona en el navegador integrado de VS Code.
2. En MetaMask elegir la red **Sepolia** y la cuenta **SepoliaC**.
3. **Conectar billetera** → marcar **SepoliaC, SepoliaA y SepoliaB** (y desmarcar las cuentas de anvil si aparecen) → **Conectar**.
4. Comprobar:
   - Arriba a la derecha, la dirección del Creador (`0x2b96…3bbb`).
   - En el pie, "Contratos · Sepolia" con las direcciones de la sección 1.

**Cambiar de actor:** cambiar de cuenta en MetaMask. Si la página muestra `Connector already connected`, recargar con **F5** y, si aparece, tocar *Conectar billetera*.

---

## 10. Guion de la demo

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

Hacer los pasos 6 a 10 **mientras corre la votación**: el voto solo se acepta mientras la propuesta está *Activa*.

**Si el activo se registró con otra cantidad de fracciones** (el registro no se puede editar), escalar los números: con **100 fracciones**, A compra **50**, B compra **30** y el depósito es de **80 USDT** (+50 / +30 al retirar). La gobernanza da lo mismo: 50 a favor contra 30 en contra es 62,5%, menos que 2/3.

**Tarifas:** cada inversor tiene solo 0,01 ETH. El frontend le pasa a MetaMask tarifas calculadas con el bloque actual (2 × base fee + propina mínima), así que MetaMask debería mostrar *Sitio sugerido*. Si muestra *Mercado* y una tarifa que supera ~0,002 ETH, usar *Editar tarifa* → **Sitio sugerido** (o **Baja**), o mandarle más ETH desde SepoliaC.

Qué muestra cada bloque:

- **1–3:** tokenización ERC-1155 y pago en stablecoin con `SafeERC20` (el USDT va directo al creador). El frontend aprueba el monto exacto, nunca un allowance infinito.
- **4–7:** gobernanza con snapshot: el voto pesa las fracciones que se tenían al crear la propuesta. La propuesta 2 tiene mayoría simple pero no llega a 2/3: el inversor mayoritario no decide solo.
- **8–10:** dividendos *pull* con acumulador por fracción: cada uno retira su parte cuando quiere.
- **11–12:** el Governor ejecuta on-chain `setSaleActive(1, false)` sobre el tokenizer, la única acción que tiene permitida sobre su activo.

### Seguir el estado desde la terminal (opcional)

```powershell
$r = "https://ethereum-sepolia-rpc.publicnode.com"
$t = "0x207896BC9c47A105D5A6D01C53b5F036263950bf"

# activo 1: creador, maxFractions, saleActive, precio, vendidas, legajo
cast call $t "assets(uint256)(address,uint64,bool,uint128,uint64,bytes32,bytes32)" 1 --rpc-url $r
```

Estados de una propuesta en el Governor (`state(proposalId)`): 0 Pendiente, 1 Activa, 3 Rechazada, 4 Aprobada, 7 Ejecutada.

---

## 11. Después de la demo

1. **README §10**: direcciones y links `#code` de los 4 contratos (ya completado para el deploy de la sección 1).
2. **README §11**: el hash de cada transacción del guion. Están en la sección **Actividad** del frontend (cada `#bloque` abre la tx en Etherscan) o en *Actividad* de MetaMask de cada cuenta. Usar los números reales de la demo (fracciones, montos).
3. Commitear `deployments/11155111.json`, `broadcast/Deploy.s.sol/11155111/run-latest.json` y `README.md`. **Nunca** `.env` ni `frontend/.env.local` (están en `.gitignore`; confirmar con `git status` antes del commit).

> Si se cambia cualquier línea de `contracts/` después del deploy, hay que volver a deployar, verificar y correr la demo: lo desplegado tiene que coincidir con el código del repo.

---

## 12. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| El ETH del faucet no aparece en MetaMask | El filtro está en "Todas las redes predeterminadas" (solo mainnets) | Elegir la red **Sepolia** en *Inicio*; activar *Mostrar redes de prueba* si no aparece |
| `vm.envAddress: environment variable "CREATOR_ADDRESS" not found` | Falta `.env`, no está guardado o se corrió fuera de la raíz del repo | Completar y guardar `.env` (5.1); correr desde `omnirwa/` |
| `Mac Mismatch` / `Failed to decrypt keystore` | Contraseña del keystore incorrecta | Reintentar; no se ve mientras se escribe |
| `AccessControlUnauthorizedAccount(<tu dirección>, 0x00…)` | `Deploy.s.sol` viejo que usaba `msg.sender` en vez de la cuenta firmante | Actualizar el repo: el script usa `vm.readCallers()` |
| `Transaction Failure: 0x…` en las creaciones de contratos | La simulación local subestimó el gas | Usar `--skip-simulation --slow` y Foundry ≥ 1.8 (sección 6). Las tx fallidas no dejan nada útil: borrar `deployments/11155111.json` y volver a deployar |
| No se puede reemplazar `anvil.exe` / `cast.exe` al actualizar Foundry | Hay un `anvil` o `cast` corriendo | Cerrarlos, o renombrar el `.exe` en uso y copiar el nuevo |
| `localhost:3000` se queda cargando | Sigue vivo un `npm run dev` viejo (apuntando a anvil) y el nuevo arrancó en 3001 | Cerrar el servidor viejo (o el proceso `node` que escucha en 3000) y usar la URL que imprime `npm run dev` |
| Arriba a la derecha aparece `0x7099…` y no está el panel de registro | Está conectada la cuenta de anvil | *Salir* → en MetaMask conectar SepoliaC/A/B (sección 9) |
| `Connector already connected` al cambiar de cuenta | Estado viejo del conector en la página | **F5** y, si aparece, *Conectar billetera* |
| "Para proponer necesitás al menos una fracción comprada antes de este bloque" | Se propuso en el mismo bloque de la compra | Esperar ~15 s y reintentar |
| "No tenías fracciones cuando se creó esta propuesta" | La cuenta compró después de la propuesta (snapshot) | Comportamiento esperado |
| No aparecen propuestas ni actividad | El RPC rechaza `eth_getLogs` | Revisar `NEXT_PUBLIC_RPC_URL` en `frontend/.env.local` y reiniciar `npm run dev` |
| Falla `--verify` | `ETHERSCAN_API_KEY` vacía o timeout de Etherscan | Revisar `.env` y reintentar con `--resume --verify` |
