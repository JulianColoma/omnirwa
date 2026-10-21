// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC5805} from "@openzeppelin/contracts/interfaces/IERC5805.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Time} from "@openzeppelin/contracts/utils/types/Time.sol";
import {IRWATokenizer} from "../interfaces/IRWATokenizer.sol";

/// @title AssetVotes
/// @notice Expone las fracciones de UN activo ERC-1155 como poder de voto (IVotes + ERC-6372) para un Governor
/// @dev Sin delegación: cada titular vota con su propio saldo histórico. Reloj por timestamp
///      No tiene roles ni estado mutable: es un adaptador de solo lectura sobre `IRWATokenizer`
///      Los votos en `t` son el saldo al cierre de `t - 1`: lo comprado en el mismo segundo (el bloque de la
///      propuesta, con `votingDelay = 0`) no vota, así no se puede front-runnear un `propose` desde el mempool
contract AssetVotes is IERC5805 {
    /// @notice Tokenizer que guarda saldos y checkpoints
    IRWATokenizer public immutable tokenizer;
    /// @notice Id del activo que representa este adaptador
    uint256 public immutable assetId;

    /// @notice La delegación de votos no está soportada
    error DelegationDisabled();
    /// @notice La dirección del tokenizer es cero
    error ZeroAddress();
    /// @notice Id inválido (0) para el activo
    error InvalidAssetId();
    /// @notice Se consultó un instante que no está en el pasado (misma firma que `Votes` de OZ)
    /// @param timepoint Timestamp consultado
    /// @param clock Timestamp actual
    error ERC5805FutureLookup(uint256 timepoint, uint48 clock);

    /// @notice Crea el adaptador para un activo
    /// @param tokenizer_ Tokenizer ERC-1155 que guarda los saldos y checkpoints
    /// @param assetId_ Id del activo (> 0)
    constructor(IRWATokenizer tokenizer_, uint256 assetId_) {
        if (address(tokenizer_) == address(0)) revert ZeroAddress();
        if (assetId_ == 0) revert InvalidAssetId();
        tokenizer = tokenizer_;
        assetId = assetId_;
    }

    /// @notice Reloj actual (timestamp del bloque)
    /// @dev `Time.timestamp()` hace el downcast a uint48 con SafeCast
    /// @return Timestamp en segundos
    function clock() public view returns (uint48) {
        return Time.timestamp();
    }

    /// @notice Modo de reloj según ERC-6372
    /// @return "mode=timestamp"
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() external pure returns (string memory) {
        return "mode=timestamp";
    }

    /// @notice Votos actuales de `account` (= su saldo actual de fracciones)
    /// @param account Cuenta consultada
    /// @return Poder de voto actual
    function getVotes(address account) external view returns (uint256) {
        return tokenizer.balanceOf(account, assetId);
    }

    /// @notice Votos de `account` en `timepoint` (snapshot de la propuesta)
    /// @dev Saldo al cierre de `timepoint - 1`. Revierte con `ERC5805FutureLookup` si `timepoint >= clock()`
    /// @param account Cuenta consultada
    /// @param timepoint Timestamp pasado
    /// @return Poder de voto en ese instante
    function getPastVotes(address account, uint256 timepoint) external view returns (uint256) {
        return tokenizer.balanceOfAt(account, assetId, _previousTimepoint(timepoint));
    }

    /// @notice Supply del activo en `timepoint` (lo usa el quórum)
    /// @dev Supply al cierre de `timepoint - 1`. Revierte con `ERC5805FutureLookup` si `timepoint >= clock()`
    /// @param timepoint Timestamp pasado
    /// @return Fracciones emitidas en ese instante
    function getPastTotalSupply(uint256 timepoint) external view returns (uint256) {
        return tokenizer.totalSupplyAt(assetId, _previousTimepoint(timepoint));
    }

    /// @notice Cada cuenta se "delega" a sí misma de forma implícita
    /// @param account Cuenta consultada
    /// @return La misma `account`
    function delegates(address account) external pure returns (address) {
        return account;
    }

    /// @notice No soportado
    /// @dev Siempre revierte con `DelegationDisabled`
    function delegate(address) external pure {
        revert DelegationDisabled();
    }

    /// @notice No soportado
    /// @dev Siempre revierte con `DelegationDisabled`
    function delegateBySig(address, uint256, uint256, uint8, bytes32, bytes32) external pure {
        revert DelegationDisabled();
    }

    /// @dev Último instante cerrado antes de `timepoint`: lo que pasa en el mismo segundo no vota
    ///      El cast a uint48 no puede fallar porque `timepoint < clock()`
    /// @param timepoint Timestamp pasado
    /// @return `timepoint - 1`, o 0 si `timepoint` es 0 (no hay saldos antes del epoch)
    function _previousTimepoint(uint256 timepoint) private view returns (uint48) {
        uint48 currentTimepoint = clock();
        if (timepoint >= currentTimepoint) revert ERC5805FutureLookup(timepoint, currentTimepoint);
        return timepoint == 0 ? 0 : SafeCast.toUint48(timepoint - 1);
    }
}
