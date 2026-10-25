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
import {Time} from "@openzeppelin/contracts/utils/types/Time.sol";
import {IRWATokenizer} from "./interfaces/IRWATokenizer.sol";

/// @title RWATokenizer1155
/// @notice Fracciona activos reales: cada activo es un id ERC-1155 y cada unidad es una fracción.
///         Vende fracciones a cambio de `paymentToken`, reparte dividendos (pull over push) y guarda
///         checkpoints de saldo/supply para que la gobernanza vote con snapshot.
/// @dev Roles y permisos:
///      - `DEFAULT_ADMIN_ROLE`: otorga/revoca roles y vincula el Governor de cada activo (una sola vez).
///      - `ISSUER_ROLE`: registra activos nuevos (supuesto: emisores con KYC).
///      - `PAUSER_ROLE`: pausa compras y depósitos de dividendos. `claimDividends` NUNCA se pausa (D13).
///      - Creador del activo: único que puede depositar dividendos de su activo.
///      - `assetGovernor[id]`: único que puede ejecutar `setSaleActive` / `recordResolution` sobre `id`.
///
///      Dividendos: acumulador por fracción `accDividendPerShare[id]` (escalado por 1e18). Cada cambio de
///      saldo liquida antes lo devengado con el saldo viejo (`_accrue` dentro de `_update`). Las divisiones
///      redondean hacia abajo: nunca se paga más de lo depositado y queda un sobrante mínimo en el contrato.
///      Supuesto: `paymentToken` no cobra comisión por transferencia.
contract RWATokenizer1155 is ERC1155Supply, AccessControl, Pausable, ReentrancyGuard, IRWATokenizer {
    using SafeERC20 for IERC20;
    using Checkpoints for Checkpoints.Trace208;

    // ─────────────────────────────── Tipos ───────────────────────────────

    /// @notice Datos de un activo tokenizado.
    /// @dev Empaquetado en 4 slots para ahorrar gas.
    /// @param creator Emisor del activo; recibe el pago de las compras y deposita dividendos.
    /// @param maxFractions Cantidad máxima de fracciones a vender.
    /// @param saleActive Si la venta está abierta.
    /// @param pricePerFraction Precio de una fracción en unidades de `paymentToken` (6 decimales).
    /// @param soldFractions Fracciones vendidas hasta ahora (== totalSupply(id)).
    /// @param docHash Hash del legajo legal / metadata en IPFS.
    /// @param name Nombre corto del activo (UTF-8, hasta 32 bytes, completado con ceros a la derecha).
    struct Asset {
        address creator; //        20 bytes ┐
        uint64 maxFractions; //     8 bytes ├ slot 0
        bool saleActive; //         1 byte  ┘
        uint128 pricePerFraction; // 16 bytes ┐ slot 1
        uint64 soldFractions; //    8 bytes ┘
        bytes32 docHash; //        slot 2
        bytes32 name; //           slot 3
    }

    // ─────────────────────────────── Constantes ───────────────────────────────

    /// @notice Rol de emisores habilitados para registrar activos.
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    /// @notice Rol que puede pausar compras y depósitos.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    /// @dev Escala del acumulador de dividendos por fracción.
    uint256 private constant PRECISION = 1e18;

    // ─────────────────────────────── Estado ───────────────────────────────

    /// @notice Stablecoin usada para pagos y dividendos (inmutable tras el deploy).
    IERC20 public immutable paymentToken;

    /// @notice Próximo id a asignar (arranca en 1; el 0 significa "no existe").
    uint256 public nextAssetId = 1;
    /// @notice Datos de cada activo por id.
    mapping(uint256 id => Asset) public assets;
    /// @notice Governor autorizado para cada activo (se fija una sola vez).
    mapping(uint256 id => address) public assetGovernor;

    /// @notice Dividendos acumulados por fracción (escalados por 1e18) de cada activo.
    mapping(uint256 id => uint256) public accDividendPerShare;
    /// @dev Valor del acumulador en la última liquidación de cada cuenta.
    mapping(uint256 id => mapping(address account => uint256)) private _paidPerShare;
    /// @dev Dividendos liquidados y pendientes de retiro de cada cuenta.
    mapping(uint256 id => mapping(address account => uint256)) private _owed;

    /// @dev Historial de saldos por activo y cuenta: (timestamp => saldo).
    mapping(uint256 id => mapping(address account => Checkpoints.Trace208)) private _balanceHistory;
    /// @dev Historial del supply por activo (para el quórum).
    mapping(uint256 id => Checkpoints.Trace208) private _supplyHistory;

    // ─────────────────────────────── Eventos ───────────────────────────────

    /// @notice Se registró un activo nuevo.
    /// @param id Id asignado.
    /// @param creator Emisor del activo.
    /// @param maxFractions Fracciones totales a la venta.
    /// @param pricePerFraction Precio por fracción.
    /// @param docHash Hash del legajo en IPFS.
    /// @param name Nombre corto del activo.
    event AssetRegistered(
        uint256 indexed id,
        address indexed creator,
        uint64 maxFractions,
        uint128 pricePerFraction,
        bytes32 docHash,
        bytes32 name
    );
    /// @notice Un inversor compró fracciones.
    /// @param id Id del activo.
    /// @param buyer Comprador.
    /// @param amount Fracciones compradas.
    /// @param cost Monto pagado en `paymentToken`.
    event FractionsPurchased(uint256 indexed id, address indexed buyer, uint64 amount, uint256 cost);
    /// @notice El creador depositó dividendos.
    /// @param id Id del activo.
    /// @param amount Monto depositado.
    /// @param increment Incremento del acumulador por fracción.
    event DividendsDeposited(uint256 indexed id, uint256 amount, uint256 increment);
    /// @notice Un titular retiró sus dividendos.
    /// @param id Id del activo.
    /// @param account Titular.
    /// @param amount Monto retirado.
    event DividendsClaimed(uint256 indexed id, address indexed account, uint256 amount);
    /// @notice Se vinculó un Governor a un activo.
    /// @param id Id del activo.
    /// @param governor Dirección del Governor.
    event AssetGovernorSet(uint256 indexed id, address indexed governor);
    /// @notice Cambió el estado de la venta de un activo.
    /// @param id Id del activo.
    /// @param active Nuevo estado.
    event SaleStatusChanged(uint256 indexed id, bool active);
    /// @notice La junta aprobó una resolución que se ejecuta off-chain.
    /// @param id Id del activo.
    /// @param resolutionHash Hash del acta en IPFS.
    event ResolutionApproved(uint256 indexed id, bytes32 resolutionHash);

    // ─────────────────────────────── Errores ───────────────────────────────

    /// @notice La dirección recibida es la dirección cero.
    error ZeroAddress();
    /// @notice La venta del activo no está activa.
    /// @param id Id del activo.
    error SaleNotActive(uint256 id);
    /// @notice La cantidad o el monto es cero.
    error ZeroAmount();
    /// @notice Se intentó registrar un activo sin nombre.
    error EmptyName();
    /// @notice Se pidieron más fracciones de las disponibles.
    /// @param id Id del activo.
    /// @param available Fracciones que quedan a la venta.
    error ExceedsAvailable(uint256 id, uint64 available);
    /// @notice El llamador no es el creador del activo.
    /// @param id Id del activo.
    /// @param caller Llamador.
    error NotAssetCreator(uint256 id, address caller);
    /// @notice El activo no tiene fracciones emitidas (evita división por cero).
    /// @param id Id del activo.
    error NoHolders(uint256 id);
    /// @notice El depósito es tan chico que el incremento por fracción da 0.
    /// @param amount Monto depositado.
    error DepositTooSmall(uint256 amount);
    /// @notice La cuenta no tiene dividendos pendientes.
    /// @param id Id del activo.
    error NothingToClaim(uint256 id);
    /// @notice Se consultó un checkpoint que no está en el pasado.
    /// @param timepoint Timestamp consultado.
    /// @param current Timestamp actual.
    error FutureLookup(uint48 timepoint, uint48 current);
    /// @notice El llamador no es el Governor del activo.
    /// @param id Id del activo.
    /// @param caller Llamador.
    error NotAssetGovernor(uint256 id, address caller);
    /// @notice El activo ya tiene un Governor vinculado.
    /// @param id Id del activo.
    error GovernorAlreadySet(uint256 id);

    // ─────────────────────────────── Modifiers ───────────────────────────────

    /// @dev Restringe la función al Governor del activo `id`.
    /// @param id Id del activo.
    modifier onlyAssetGovernor(uint256 id) {
        _checkAssetGovernor(id);
        _;
    }

    // ─────────────────────────────── Constructor ───────────────────────────────

    /// @notice Despliega el tokenizer.
    /// @param paymentToken_ Stablecoin de pago (ej. MockUSDT).
    /// @param uri_ URI de metadata ERC-1155 (con `{id}`).
    /// @param admin Cuenta que recibe `DEFAULT_ADMIN_ROLE` y `PAUSER_ROLE`.
    constructor(IERC20 paymentToken_, string memory uri_, address admin) ERC1155(uri_) {
        if (address(paymentToken_) == address(0) || admin == address(0)) revert ZeroAddress();
        paymentToken = paymentToken_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    // ─────────────────────────────── Activos ───────────────────────────────

    /// @notice Registra un activo nuevo y abre su venta.
    /// @dev Solo `ISSUER_ROLE`. El llamador queda como `creator`.
    /// @param maxFractions Fracciones totales a la venta (> 0).
    /// @param pricePerFraction Precio por fracción en `paymentToken` (> 0).
    /// @param docHash Hash del legajo legal en IPFS.
    /// @param name Nombre corto del activo (UTF-8, hasta 32 bytes; distinto de cero).
    /// @return id Id asignado al activo.
    function registerAsset(uint64 maxFractions, uint128 pricePerFraction, bytes32 docHash, bytes32 name)
        external
        onlyRole(ISSUER_ROLE)
        returns (uint256 id)
    {
        if (maxFractions == 0 || pricePerFraction == 0) revert ZeroAmount();
        if (name == bytes32(0)) revert EmptyName();
        id = nextAssetId;
        // seguro: haría falta registrar 2^256 activos para desbordar
        unchecked {
            nextAssetId = id + 1;
        }
        assets[id] = Asset({
            creator: msg.sender,
            maxFractions: maxFractions,
            saleActive: true,
            pricePerFraction: pricePerFraction,
            soldFractions: 0,
            docHash: docHash,
            name: name
        });
        emit AssetRegistered(id, msg.sender, maxFractions, pricePerFraction, docHash, name);
    }

    /// @notice Compra `amount` fracciones del activo `id` pagando con `paymentToken`.
    /// @dev CEI + `nonReentrant`: `_mint` dispara `onERC1155Received` si el comprador es un contrato.
    ///      El pago va directo al creador (D11). Requiere `approve` previo de `paymentToken`.
    /// @param id Id del activo.
    /// @param amount Fracciones a comprar.
    function buyFractions(uint256 id, uint64 amount) external nonReentrant whenNotPaused {
        Asset storage a = assets[id];
        // CHECKS (un id inexistente tiene saleActive == false)
        if (!a.saleActive) revert SaleNotActive(id);
        if (amount == 0) revert ZeroAmount();
        uint64 sold = a.soldFractions;
        uint64 max = a.maxFractions;
        // en uint256 para que una cantidad enorme revierta con ExceedsAvailable y no con overflow
        if (uint256(sold) + amount > max) {
            // seguro: sold <= max siempre
            unchecked {
                revert ExceedsAvailable(id, max - sold);
            }
        }
        uint256 cost = uint256(amount) * a.pricePerFraction;

        // EFFECTS
        // seguro: sold + amount <= max, que entra en uint64
        unchecked {
            a.soldFractions = sold + amount;
        }
        emit FractionsPurchased(id, msg.sender, amount, cost);

        // INTERACTIONS
        paymentToken.safeTransferFrom(msg.sender, a.creator, cost);
        _mint(msg.sender, id, amount, "");
    }

    // ─────────────────────────────── Dividendos ───────────────────────────────

    /// @notice El creador deposita ganancias del activo `id` para repartir pro-rata entre los titulares.
    /// @dev Solo el creador del activo. Requiere `approve` previo de `paymentToken`.
    ///      Se reparte entre el supply actual: quien compre después no cobra este depósito.
    /// @param id Id del activo.
    /// @param amount Monto a repartir.
    function depositDividends(uint256 id, uint256 amount) external nonReentrant whenNotPaused {
        // CHECKS
        if (msg.sender != assets[id].creator) revert NotAssetCreator(id, msg.sender);
        uint256 supply = totalSupply(id);
        if (supply == 0) revert NoHolders(id);
        uint256 increment = amount * PRECISION / supply;
        if (increment == 0) revert DepositTooSmall(amount);

        // EFFECTS
        accDividendPerShare[id] += increment;
        emit DividendsDeposited(id, amount, increment);

        // INTERACTIONS
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    /// @notice Retira los dividendos acumulados del activo `id`.
    /// @dev Sin `whenNotPaused` a propósito (D13): siempre se puede retirar lo propio.
    ///      El saldo pendiente se pone en 0 antes de transferir (CEI).
    /// @param id Id del activo.
    function claimDividends(uint256 id) external nonReentrant {
        // CHECKS + EFFECTS
        _accrue(id, msg.sender);
        uint256 amount = _owed[id][msg.sender];
        if (amount == 0) revert NothingToClaim(id);
        _owed[id][msg.sender] = 0;
        emit DividendsClaimed(id, msg.sender, amount);

        // INTERACTIONS
        paymentToken.safeTransfer(msg.sender, amount);
    }

    /// @notice Dividendos que `account` podría retirar hoy del activo `id`.
    /// @param id Id del activo.
    /// @param account Titular.
    /// @return Monto pendiente (liquidado + no liquidado), redondeado hacia abajo.
    function pendingDividends(uint256 id, address account) external view returns (uint256) {
        uint256 unsettled = accDividendPerShare[id] - _paidPerShare[id][account];
        return _owed[id][account] + balanceOf(account, id) * unsettled / PRECISION;
    }

    // ─────────────────────────────── Snapshots (IRWATokenizer) ───────────────────────────────

    /// @inheritdoc IRWATokenizer
    function balanceOfAt(address account, uint256 id, uint48 timepoint) external view returns (uint256) {
        if (timepoint >= block.timestamp) revert FutureLookup(timepoint, uint48(block.timestamp));
        return _balanceHistory[id][account].upperLookupRecent(timepoint);
    }

    /// @inheritdoc IRWATokenizer
    function totalSupplyAt(uint256 id, uint48 timepoint) external view returns (uint256) {
        if (timepoint >= block.timestamp) revert FutureLookup(timepoint, uint48(block.timestamp));
        return _supplyHistory[id].upperLookupRecent(timepoint);
    }

    // ─────────────────────────────── Gobernanza ───────────────────────────────

    /// @notice Vincula un Governor a un activo.
    /// @dev Solo `DEFAULT_ADMIN_ROLE`, y solo una vez por activo.
    /// @param id Id del activo.
    /// @param governor Dirección del OmniGovernor del activo.
    function setAssetGovernor(uint256 id, address governor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (governor == address(0)) revert ZeroAddress();
        if (assetGovernor[id] != address(0)) revert GovernorAlreadySet(id);
        assetGovernor[id] = governor;
        emit AssetGovernorSet(id, governor);
    }

    /// @notice Ejecutable por votación: abre o cierra la venta del activo.
    /// @dev Solo el Governor del activo `id`.
    /// @param id Id del activo.
    /// @param active Nuevo estado de la venta.
    function setSaleActive(uint256 id, bool active) external onlyAssetGovernor(id) {
        assets[id].saleActive = active;
        emit SaleStatusChanged(id, active);
    }

    /// @notice Ejecutable por votación: deja constancia on-chain de una decisión que se ejecuta off-chain.
    /// @dev Solo el Governor del activo `id`.
    /// @param id Id del activo.
    /// @param resolutionHash Hash del acta en IPFS.
    function recordResolution(uint256 id, bytes32 resolutionHash) external onlyAssetGovernor(id) {
        emit ResolutionApproved(id, resolutionHash);
    }

    // ─────────────────────────────── Pausa ───────────────────────────────

    /// @notice Pausa compras y depósitos de dividendos.
    /// @dev Solo `PAUSER_ROLE`.
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Reanuda compras y depósitos.
    /// @dev Solo `PAUSER_ROLE`.
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ─────────────────────────────── Overrides ───────────────────────────────

    /// @inheritdoc IRWATokenizer
    function balanceOf(address account, uint256 id) public view override(ERC1155, IRWATokenizer) returns (uint256) {
        return super.balanceOf(account, id);
    }

    /// @dev Punto por donde pasa TODO cambio de saldo (mint, burn, transfer):
    ///      1) liquida dividendos de `from` y `to` con los saldos VIEJOS;
    ///      2) mueve los saldos;
    ///      3) registra los saldos nuevos (y el supply, si es mint o burn) en el historial.
    /// @param from Origen (address(0) en mint).
    /// @param to Destino (address(0) en burn).
    /// @param ids Ids de los activos.
    /// @param values Cantidades por id.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155Supply)
    {
        uint256 len = ids.length;
        for (uint256 i = 0; i < len;) {
            if (from != address(0)) _accrue(ids[i], from);
            if (to != address(0)) _accrue(ids[i], to);
            unchecked {
                ++i;
            }
        }

        super._update(from, to, ids, values);

        uint48 now_ = Time.timestamp();
        bool supplyChanged = from == address(0) || to == address(0);
        for (uint256 i = 0; i < len;) {
            uint256 id = ids[i];
            if (from != address(0)) _balanceHistory[id][from].push(now_, SafeCast.toUint208(balanceOf(from, id)));
            if (to != address(0)) _balanceHistory[id][to].push(now_, SafeCast.toUint208(balanceOf(to, id)));
            if (supplyChanged) _supplyHistory[id].push(now_, SafeCast.toUint208(totalSupply(id)));
            unchecked {
                ++i;
            }
        }
    }

    /// @dev Liquida en `_owed` los dividendos devengados por `account` en `id` con su saldo actual.
    ///      Redondea hacia abajo: nunca se paga más de lo depositado.
    /// @param id Id del activo.
    /// @param account Titular.
    function _accrue(uint256 id, address account) private {
        uint256 acc = accDividendPerShare[id];
        uint256 paid = _paidPerShare[id][account];
        if (acc == paid) return;
        _owed[id][account] += balanceOf(account, id) * (acc - paid) / PRECISION;
        _paidPerShare[id][account] = acc;
    }

    /// @dev Lógica de `onlyAssetGovernor` (separada para reducir el tamaño del bytecode).
    /// @param id Id del activo.
    function _checkAssetGovernor(uint256 id) private view {
        if (msg.sender != assetGovernor[id]) revert NotAssetGovernor(id, msg.sender);
    }

    /// @inheritdoc ERC1155
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
