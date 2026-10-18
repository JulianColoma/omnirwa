// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IRWATokenizer
/// @notice Interfaz mínima del tokenizer que consume la capa de gobernanza (AssetVotes).
/// @dev Acordada el día 1 entre A y B: NO cambiarla sin avisar al grupo.
///      Permite que la gobernanza se desarrolle y testee contra `MockTokenizer`.
interface IRWATokenizer {
    /// @notice Saldo actual de fracciones de `account` en el activo `id`.
    /// @param account Cuenta consultada.
    /// @param id Id del activo (token ERC-1155).
    /// @return Cantidad de fracciones.
    function balanceOf(address account, uint256 id) external view returns (uint256);

    /// @notice Saldo de `account` en el activo `id` en el instante `timepoint`.
    /// @dev Debe revertir si `timepoint` no está estrictamente en el pasado.
    /// @param account Cuenta consultada.
    /// @param id Id del activo.
    /// @param timepoint Timestamp (segundos) a consultar.
    /// @return Cantidad de fracciones en ese instante.
    function balanceOfAt(address account, uint256 id, uint48 timepoint) external view returns (uint256);

    /// @notice Supply total del activo `id` en el instante `timepoint`. Lo usa el quórum.
    /// @dev Debe revertir si `timepoint` no está estrictamente en el pasado.
    /// @param id Id del activo.
    /// @param timepoint Timestamp (segundos) a consultar.
    /// @return Fracciones emitidas en ese instante.
    function totalSupplyAt(uint256 id, uint48 timepoint) external view returns (uint256);
}
