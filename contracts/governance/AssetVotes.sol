// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC5805} from "@openzeppelin/contracts/interfaces/IERC5805.sol";
import {IRWATokenizer} from "../interfaces/IRWATokenizer.sol";

/// @title AssetVotes
/// @notice Expone las fracciones de UN activo ERC-1155 como poder de voto (IVotes + ERC-6372) para un Governor.
/// @dev Sin delegación (D8): cada titular vota con su propio saldo histórico. Reloj por timestamp (D14).
///      No tiene roles: es un adaptador de solo lectura.
///
///      ESTADO: ESQUELETO. Las funciones marcadas con `TODO(B)` las implementa el integrante B
///      siguiendo la sección 6.3 del plan.
contract AssetVotes is IERC5805 {
    /// @notice Tokenizer que guarda saldos y checkpoints.
    IRWATokenizer public immutable tokenizer;
    /// @notice Id del activo que representa este adaptador.
    uint256 public immutable assetId;

    /// @notice La delegación de votos no está soportada.
    error DelegationDisabled();
    /// @notice La dirección del tokenizer es cero.
    error ZeroAddress();

    /// @notice Crea el adaptador para un activo.
    /// @param tokenizer_ Tokenizer ERC-1155.
    /// @param assetId_ Id del activo.
    constructor(IRWATokenizer tokenizer_, uint256 assetId_) {
        if (address(tokenizer_) == address(0)) revert ZeroAddress();
        tokenizer = tokenizer_;
        assetId = assetId_;
    }

    /// @notice Reloj actual (timestamp del bloque).
    /// @return Timestamp en segundos.
    function clock() public view returns (uint48) {
        return uint48(block.timestamp);
    }

    /// @notice Modo de reloj según ERC-6372.
    /// @return "mode=timestamp".
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() external pure returns (string memory) {
        return "mode=timestamp";
    }

    /// @notice Votos actuales de `account` (= su saldo actual de fracciones).
    /// @param account Cuenta consultada.
    /// @return Poder de voto actual.
    function getVotes(address account) external view returns (uint256) {
        return tokenizer.balanceOf(account, assetId);
    }

    /// @notice Votos de `account` en `timepoint` (snapshot de la propuesta).
    /// @param account Cuenta consultada.
    /// @param timepoint Timestamp pasado.
    /// @return Poder de voto en ese instante.
    function getPastVotes(address account, uint256 timepoint) external view returns (uint256) {
        // TODO(B): tokenizer.balanceOfAt(account, assetId, SafeCast.toUint48(timepoint)).
        account;
        timepoint;
        return tokenizer.balanceOf(address(0), assetId);
    }

    /// @notice Supply del activo en `timepoint` (lo usa el quórum).
    /// @param timepoint Timestamp pasado.
    /// @return Fracciones emitidas en ese instante.
    function getPastTotalSupply(uint256 timepoint) external view returns (uint256) {
        // TODO(B): tokenizer.totalSupplyAt(assetId, SafeCast.toUint48(timepoint)).
        timepoint;
        return tokenizer.balanceOf(address(0), assetId);
    }

    /// @notice Cada cuenta se "delega" a sí misma de forma implícita.
    /// @param account Cuenta consultada.
    /// @return La misma `account`.
    function delegates(address account) external pure returns (address) {
        return account;
    }

    /// @notice No soportado.
    /// @dev Siempre revierte con `DelegationDisabled`.
    function delegate(address) external pure {
        revert DelegationDisabled();
    }

    /// @notice No soportado.
    /// @dev Siempre revierte con `DelegationDisabled`.
    function delegateBySig(address, uint256, uint256, uint8, bytes32, bytes32) external pure {
        revert DelegationDisabled();
    }
}
