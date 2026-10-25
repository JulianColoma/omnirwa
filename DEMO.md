# OmniRWA — Deploy y demo paso a paso

Guía para levantar el proyecto y recorrer el flujo principal: registro del activo → compra de fracciones → propuestas y votos → dividendos → ejecución de lo aprobado.

Hay dos caminos:

- **[A. Local con anvil](#a-local-con-anvil)**: blockchain en tu máquina, sin faucets ni esperas. Ideal para ensayar.
- **[B. Sepolia](#b-sepolia-entrega)**: la red pública de prueba donde quedan los contratos verificados y las transacciones de la entrega.

Los comandos están para **PowerShell** (Windows). Donde cambia la sintaxis en Bash (Git Bash, macOS, Linux) se indica aparte.

---------------

## Índice

1. [Requisitos](#1-requisitos)
2. [Instalación](#2-instalación)
3. [A. Local con anvil](#a-local-con-anvil)
4. [B. Sepolia (entrega)](#b-sepolia-entrega)
5. [Configurar MetaMask](#5-configurar-metamask)
6. [Guion de la demo](#6-guion-de-la-demo)
7. [Problemas frecuentes](#7-problemas-frecuentes)

---

## 1. Requisitos

| Herramienta | Para qué | Cómo verificar |
|---|---|---|
| [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`, `anvil`) | Compilar, testear, deployar y correr la blockchain local | `forge --version` |
| [Node.js](https://nodejs.org) ≥ 24 | Frontend | `node --version` |
| Git | Clonar el repo con submódulos | `git --version` |
| Chrome o Edge + [MetaMask](https://metamask.io/download) | Firmar transacciones desde el frontend | Ícono del zorro en la barra |

> El frontend **no funciona dentro del navegador integrado de VS Code**: no tiene extensiones, así que no hay MetaMask ("Provider not found"). Abrilo siempre en el mismo Chrome/Edge donde está instalado MetaMask.

---

## 2. Instalación

```powershell
git clone --recurse-submodules https://github.com/JulianColoma/omnirwa.git
cd omnirwa
forge build

cd frontend
npm install
npm run abis        # genera lib/abis/*.ts a partir de ../out
cd ..
```

Si se clonó sin `--recurse-submodules`, correr `git submodule update --init --recursive` antes de `forge build`.

Opcional, para confirmar que todo está bien:

```powershell
forge test
```

---

## A. Local con anvil

Se necesitan **dos terminales abiertas a la vez**: una con anvil y otra para todo lo demás.

### A.1 Terminal 1: blockchain local

```powershell
anvil
```

Esperar a que termine con `Listening on 127.0.0.1:8545` y **dejar esa terminal abierta**. Si se cierra, se borra la cadena.

Anvil imprime 10 cuentas con 10.000 ETH cada una y sus *private keys*. La demo usa estas:

| Índice | Rol en la demo | Dirección |
|---|---|---|
| (0) | Deployer / admin | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| (1) | **Creador** (emisor del activo) | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| (2) | **Inversor A** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| (3) | **Inversor B** | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |

### A.2 Terminal 2: deploy

```powershell
cd C:\ruta\a\omnirwa
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --unlocked --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

Tiene que terminar con `ONCHAIN EXECUTION COMPLETE & SUCCESSFUL`. El script:

1. Despliega `MockUSDT` y `RWATokenizer1155`.
2. Le da `ISSUER_ROLE` al creador y mintea 10.000 USDT a cada inversor.
3. Despliega `AssetVotes` y `OmniGovernor` para el activo 1 y los vincula al tokenizer.
4. Guarda las direcciones y el bloque inicial en `deployments/31337.json`.

En anvil no hace falta definir variables de entorno: por defecto toma las cuentas (1), (2) y (3) de la tabla.

#### Opción: usar tus propias cuentas de MetaMask

En lugar de importar las claves de anvil, se pueden usar 3 cuentas que ya tengas en MetaMask (Creador, Inversor A e Inversor B). Es más simple y no hace falta copiar ninguna clave privada. Antes del deploy, en la terminal 2:

```powershell
$env:CREATOR_ADDRESS="0x..."      # dirección de tu cuenta Creador
$env:INVESTOR_A_ADDRESS="0x..."
$env:INVESTOR_B_ADDRESS="0x..."

# cargarles 10.000 ETH de anvil a cada una para pagar el gas
cast rpc anvil_setBalance $env:CREATOR_ADDRESS 0x21e19e0c9bab2400000
cast rpc anvil_setBalance $env:INVESTOR_A_ADDRESS 0x21e19e0c9bab2400000
cast rpc anvil_setBalance $env:INVESTOR_B_ADDRESS 0x21e19e0c9bab2400000
```

En Bash: `export CREATOR_ADDRESS=0x...` y `cast rpc anvil_setBalance $CREATOR_ADDRESS 0x21e19e0c9bab2400000`.

Después correr el deploy de arriba en la **misma terminal** (las variables duran mientras esté abierta). El deploy sigue firmándolo la cuenta (0) de anvil; tus cuentas reciben el rol de emisor y los USDT de prueba. Con esta opción se saltea la importación de claves de [5.3](#53-importar-las-cuentas): solo hace falta [agregar la red Anvil](#52-agregar-la-red-anvil-solo-para-la-opción-a). Si se reinicia anvil, hay que repetir el `anvil_setBalance`.

### A.3 Terminal 2: frontend

```powershell
cd frontend
npm run sync -- 31337     # copia las direcciones de deployments/31337.json a .env.local
npm run dev
```

Abrir **http://localhost:3000** en Chrome. Tiene que aparecer "Depto Rosario — El activo todavía no fue registrado".

### A.4 Siguiente paso

[Configurar MetaMask](#5-configurar-metamask) y seguir el [guion de la demo](#6-guion-de-la-demo).

### A.5 Adelantar el tiempo (solo en anvil)

En anvil los bloques se minan solo cuando hay transacciones, y la votación dura 10 minutos. Para no esperar, en una tercera terminal:

```powershell
# avanzar 2 segundos (para que una propuesta recién creada pase a "Activa")
cast rpc evm_increaseTime 2; cast rpc evm_mine

# avanzar 10 minutos (para cerrar la votación)
cast rpc evm_increaseTime 600; cast rpc evm_mine
```

Después de cada uno, recargar la página.

### A.6 Si se reinicia anvil

Al cerrar anvil se pierde todo. Para volver a empezar:

1. `anvil` en la terminal 1.
2. Repetir el deploy (A.2).
3. `npm run sync -- 31337` y reiniciar `npm run dev` (Ctrl + C y de nuevo). Next.js lee `.env.local` solo al arrancar.
4. En MetaMask, borrar la actividad de cada cuenta (ver [problemas frecuentes](#7-problemas-frecuentes)).

---

## B. Sepolia (entrega)

> Guía completa, con el deploy actual, los controles posteriores y los problemas reales que aparecieron: **[DEMO_SEPOLIA.md](DEMO_SEPOLIA.md)**.

### B.1 Qué se necesita

- **3 billeteras** de MetaMask: Creador (también hace de deployer), Inversor A, Inversor B. **No usar billeteras con fondos reales.**
- **ETH de Sepolia** en las 3 (≈ 0,05 cada una). Faucets: [Google Cloud](https://cloud.google.com/application/web3/faucet/ethereum/sepolia), [Alchemy](https://www.alchemy.com/faucets/ethereum-sepolia). Conseguirlo con anticipación: algunos tardan o piden saldo en mainnet.
- **RPC de Sepolia**: [Infura](https://infura.io), [Alchemy](https://alchemy.com) o el público `https://ethereum-sepolia-rpc.publicnode.com`.
- **API key de Etherscan** para verificar: [etherscan.io/myapikey](https://etherscan.io/myapikey).

### B.2 Variables de entorno

```powershell
copy .env.example .env
```

Completar `.env` (Foundry lo lee solo al correr `forge script`):

```dotenv
SEPOLIA_RPC_URL=https://...
ETHERSCAN_API_KEY=...
CREATOR_ADDRESS=0x...       # dirección del Creador
INVESTOR_A_ADDRESS=0x...
INVESTOR_B_ADDRESS=0x...
TOKEN_URI=ipfs://omnirwa/{id}.json
```

> **Nunca** poner private keys ni frases semilla en `.env` ni en ningún archivo del repo. `.env` está en `.gitignore`; `.env.example` es el único que se sube.

### B.3 Importar las claves en Foundry (keystore cifrado)

El deploy lo firma la cuenta del Creador. El comando pide su *private key* (MetaMask → cuenta → ⋮ → *Detalles de la cuenta* → *Mostrar clave privada*) y una contraseña para cifrarla:

```powershell
cast wallet import deployer --interactive
cast wallet list                          # verificar
```

La clave queda cifrada en `~/.foundry/keystores`, fuera del repo.

### B.4 Deploy y verificación

```powershell
forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --broadcast --verify --skip-simulation --slow
```

Pide la contraseña del keystore. Requiere Foundry ≥ 1.8 (`forge --version`).

- `--skip-simulation`: el gas de cada transacción lo estima el nodo de Sepolia. La simulación local de Foundry usa el `evm_version` del proyecto (`cancun`) y desde el hardfork Glamsterdam (octubre 2026) subestima mucho el costo de crear contratos: sin este flag las creaciones fallan por falta de gas.
- `--slow`: manda cada transacción recién cuando la anterior está confirmada, así la estimación de la siguiente ve los contratos ya desplegados.

Al terminar:

- Las direcciones quedan en `deployments/11155111.json` (se commitea).
- Los 4 contratos quedan verificados en Etherscan: `https://sepolia.etherscan.io/address/<dirección>#code`.

Si la verificación falla por un timeout de Etherscan, se puede reintentar sin volver a deployar:

```powershell
forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --resume --verify
```

### B.5 Frontend contra Sepolia

```powershell
cd frontend
npm run sync               # usa deployments/11155111.json
```

Abrir `frontend/.env.local` y completar el RPC (el frontend lee eventos con `eth_getLogs`; los RPC públicos limitan el rango de bloques):

```dotenv
NEXT_PUBLIC_RPC_URL=https://...
```

```powershell
npm run dev
```

En MetaMask, elegir la red **Sepolia** (en *Redes de prueba*) y seguir el [guion de la demo](#6-guion-de-la-demo). Diferencias con anvil:

- No hay que adelantar el tiempo: Sepolia mina un bloque cada ~12 s.
- La votación dura **10 minutos reales**. Hacer el depósito y los retiros de dividendos mientras corre.
- Después de comprar, esperar ~15 s antes de proponer (las fracciones tienen que estar en un bloque anterior).

### B.6 Después de la demo

Completar en el [README](README.md):

- **§10**: direcciones y links `#code` de los 4 contratos.
- **§11**: hash de cada transacción. Están en la sección **Actividad** del frontend (cada `#bloque` abre la tx en Etherscan) o en *Actividad* de MetaMask.

> Si se cambia cualquier línea de `contracts/` después del deploy final, hay que volver a deployar, verificar y correr la demo: lo desplegado tiene que coincidir con el código del repo.

---

## 5. Configurar MetaMask

### 5.1 Instalar

1. Desde **[metamask.io/download](https://metamask.io/download)** (único sitio oficial) → *Instalar para Chrome*.
2. Fijar la extensión: ícono 🧩 → 📌 en MetaMask.
3. *Crear una billetera nueva* → contraseña → guardar la frase de 12 palabras.

### 5.2 Agregar la red Anvil (solo para la opción A)

Con anvil corriendo:

1. En MetaMask, tocar **"Todas las redes predeterminadas"** (filtro sobre la lista de tokens) → pestaña **Personalizado** → **Agregar una red personalizada**.
   En otras versiones: menú ☰ → **Redes** → **Agregar una red personalizada**.
2. Completar:

   | Campo | Valor |
   |---|---|
   | Nombre de la red | `Anvil` |
   | URL de RPC | `http://127.0.0.1:8545` |
   | ID de cadena | `31337` |
   | Símbolo de moneda | `ETH` |
   | Explorador de bloques | *(vacío)* |

3. **Guardar**. Si avisa que el símbolo o el ID no coinciden con otra red, ignorarlo.

Para Sepolia no hace falta agregar nada: ya viene en *Redes de prueba* (activar "Mostrar redes de prueba" si no aparece).

### 5.3 Importar las cuentas

**Para anvil:** si usaste [tus propias cuentas](#opción-usar-tus-propias-cuentas-de-metamask), saltear este paso. Si no, copiar de la salida de `anvil` las *private keys* de las cuentas **(1)**, **(2)** y **(3)**. Son claves de prueba públicas, iguales en cualquier instalación de anvil: **nunca mandarles fondos reales**.

**Para Sepolia:** las claves de las billeteras de prueba propias.

Para cada una:

1. Tocar el nombre de la cuenta arriba a la izquierda (ej. "Account 1 ⌄").
2. **Agregar billetera** (botón grande abajo; *no* "Agregar cuenta", que crea una vacía).
3. **Importar una cuenta** → pegar la clave → **Importar**.

Renombrarlas (⋮ → *Editar nombre*) para no confundirse:

| Dirección empieza con | Nombre |
|---|---|
| `0x7099…` | Creador |
| `0x3C44…` | Inversor A |
| `0x90F7…` | Inversor B |

En anvil, cada una tiene que mostrar ≈ 10.000 ETH con la red **Anvil** seleccionada.

### 5.4 Conectar con la página

1. Abrir **http://localhost:3000** en el Chrome donde está MetaMask.
2. Elegir la cuenta **Creador** y la red correcta (Anvil o Sepolia).
3. **Conectar billetera** → en MetaMask marcar las 3 cuentas → **Conectar**.

Para cambiar de actor durante la demo, se cambia de cuenta en MetaMask; la página se actualiza sola. Si la cuenta nueva no está conectada al sitio, MetaMask ofrece conectarla.

---

## 6. Guion de la demo

Números del guion: activo "Depto Rosario", 1.000 fracciones a 10 USDT. A compra 500, B compra 300. El creador reparte 800 USDT. Quórum 20%, mayoría 2/3.

| # | Cuenta | Acción en la página | Resultado esperado |
|---|---|---|---|
| 1 | Creador | **Registrar activo**: 1000 fracciones, 10 USDT, legajo `ipfs://depto-rosario` → *Registrar* | "0 de 1.000 fracciones vendidas", **venta abierta** |
| 2 | Inversor A | *Comprar* → `500` → **Aprobar y comprar** (2 firmas: approve exacto + compra) | 500 fracciones, 5.000 USDT menos |
| 3 | Inversor B | *Comprar* → `300` → **Aprobar y comprar** | "800 de 1.000 vendidas" |
| 4 | Inversor A | **Nueva propuesta** → "Cerrar la venta" → título `Cerrar la venta del Depto Rosario` → *Proponer* | Propuesta 1 creada |
| 5 | Inversor A | **Resolución** → título `Vender el Depto Rosario a 120.000 USDT` + texto → *Proponer* | Propuesta 2 creada |
| — | — | *(anvil: `cast rpc evm_increaseTime 2; cast rpc evm_mine` y recargar)* | Ambas **Activas**, "Tu voto pesa 500 fracciones" |
| 6 | Inversor A | **A favor** en las dos | |
| 7 | Inversor B | **A favor** en la 1, **En contra** en la 2 | Propuesta 2: "62,5% a favor (necesita 66,7%)" |
| 8 | Creador | **Depositar dividendos** → `800` → *Aprobar y depositar* | "1 USDT por fracción" |
| 9 | Inversor A | **Retirar dividendos** | +500 USDT |
| 10 | Inversor B | **Retirar dividendos** | +300 USDT |
| — | — | *(anvil: `cast rpc evm_increaseTime 600; cast rpc evm_mine` y recargar · Sepolia: esperar el fin de la votación)* | Propuesta 1 **Aprobada**, propuesta 2 **Rechazada** |
| 11 | Cualquiera | Propuesta 1 → **Ejecutar** | Propuesta 1 **Ejecutada**, activo con **venta cerrada** |
| 12 | Cualquiera | Intentar comprar | Botón deshabilitado: "La venta está cerrada." |

Qué muestra cada paso:

- **1–3:** tokenización ERC-1155 y pago en stablecoin con `SafeERC20` (el USDT va directo al creador). El frontend aprueba **el monto exacto**, nunca un allowance infinito.
- **4–7:** gobernanza con snapshot. El voto pesa las fracciones que se tenían al crear la propuesta. La propuesta 2 tiene mayoría simple (62,5%) pero **no llega a 2/3**: el inversor mayoritario no decide solo.
- **8–10:** dividendos *pull* con acumulador por fracción: cada uno retira su parte (500 / 300) cuando quiere.
- **11–12:** el Governor ejecuta on-chain `setSaleActive(1, false)` sobre el tokenizer, la única acción que tiene permitida sobre su activo.

Al final, la sección **Actividad** lista todo el flujo con link a cada transacción, y el pie de página tiene las direcciones de los contratos (en Sepolia, con link al código verificado).

---

## 7. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `export : El término 'export' no se reconoce` | Sintaxis de Bash en PowerShell | En PowerShell: `$env:VARIABLE="valor"`. En anvil no hace falta ninguna variable |
| `error sending request for url (http://127.0.0.1:8545/)` | anvil no está corriendo | Abrir otra terminal con `anvil` y dejarla abierta |
| `vm.envAddress: environment variable "CREATOR_ADDRESS" not found` (Sepolia) | Falta `.env` o está incompleto | Completar `.env` en la raíz (B.2) |
| La página dice "No hay un contrato en la dirección configurada" | `.env.local` apunta a un deploy viejo (anvil reiniciado) o a otra red | Repetir el deploy, `npm run sync -- 31337` y reiniciar `npm run dev` |
| "No se detectó ninguna billetera" / "Provider not found" | La página está abierta en un navegador sin MetaMask (ej. el de VS Code) | Abrir `http://localhost:3000` en el Chrome con MetaMask |
| Aparece "Cambiar a Foundry" / "Cambiá la red" | MetaMask está en otra red | Tocar el botón o elegir **Anvil** (o **Sepolia**) en MetaMask |
| `nonce too high` o transacciones que no confirman | Se reinició anvil y MetaMask recuerda el estado anterior | MetaMask → ☰ → *Configuración* → *Avanzado* → **Borrar datos de actividad** (en cada cuenta) |
| *Registrar* deshabilitado | Falta la referencia del legajo | Completar el campo (ej. `ipfs://depto-rosario`) |
| *Proponer* deshabilitado | La cuenta no tiene fracciones | Comprar al menos una antes |
| "Para proponer necesitás al menos una fracción comprada antes de este bloque" | Se propuso en el mismo bloque/segundo de la compra | Esperar unos segundos (anvil: `cast rpc evm_increaseTime 2; cast rpc evm_mine`) |
| Las propuestas no muestran botones de voto | La propuesta está *Pendiente* (en anvil no se minó otro bloque) | anvil: `cast rpc evm_increaseTime 2; cast rpc evm_mine` y recargar |
| "No tenías fracciones cuando se creó esta propuesta" | La cuenta compró después de la propuesta (snapshot) | Es el comportamiento esperado: así se evita comprar votos a último momento |
| La propuesta sigue *Activa* después de los 10 min | En anvil no se minó ningún bloque nuevo | `cast rpc evm_mine` y recargar |
| No aparecen propuestas ni actividad en Sepolia | El RPC rechaza `eth_getLogs` | Configurar `NEXT_PUBLIC_RPC_URL` en `frontend/.env.local` con Infura/Alchemy/publicnode y reiniciar `npm run dev` |
| `Transaction Failure: 0x...` en las creaciones de contratos (Sepolia) | La simulación local subestimó el gas (cambio de precios de Glamsterdam) | Deployar con `--skip-simulation --slow` (B.4) y Foundry ≥ 1.8 |
| `AccessControlUnauthorizedAccount(<tu dirección>, 0x00…)` al deployar | `Deploy.s.sol` viejo que tomaba `msg.sender` en vez de la cuenta firmante | Actualizar el repo: el script usa `vm.readCallers()` |
| Falla `--verify` en el deploy | Falta `ETHERSCAN_API_KEY` o timeout de Etherscan | Revisar `.env` y reintentar con `--resume --verify` |
