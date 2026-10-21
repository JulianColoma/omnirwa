// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IRWATokenizer} from "../../contracts/interfaces/IRWATokenizer.sol";

/// @title MockTokenizer
/// @notice Implementación trivial de IRWATokenizer para testear la gobernanza sin el tokenizer real.
/// @dev Los saldos "históricos" se cargan a mano con `setBalanceAt` / `setSupplyAt` y se guardan por
///      timestamp EXACTO (no busca el checkpoint anterior). Igual que el tokenizer real, las consultas
///      históricas revierten con `FutureLookup` si `timepoint` no está estrictamente en el pasado.
///      Los ganchos `setSaleActive` / `recordResolution` solo los puede llamar el governor vinculado.
contract MockTokenizer is IRWATokenizer {
    mapping(address account => mapping(uint256 id => uint256)) public currentBalance;
    mapping(address account => mapping(uint256 id => mapping(uint48 t => uint256))) public pastBalance;
    mapping(uint256 id => mapping(uint48 t => uint256)) public pastSupply;
    mapping(uint256 id => bool) public saleActive;
    mapping(uint256 id => address) public assetGovernor;

    // Mismas firmas que en RWATokenizer1155, para que los tests sirvan igual contra el real
    event SaleStatusChanged(uint256 indexed id, bool active);
    event ResolutionApproved(uint256 indexed id, bytes32 resolutionHash);

    error FutureLookup(uint48 timepoint, uint48 current);
    error NotAssetGovernor(uint256 id, address caller);

    modifier onlyAssetGovernor(uint256 id) {
        if (msg.sender != assetGovernor[id]) revert NotAssetGovernor(id, msg.sender);
        _;
    }

    function setAssetGovernor(uint256 id, address governor) external {
        assetGovernor[id] = governor;
    }

    function setSaleActive(uint256 id, bool active) external onlyAssetGovernor(id) {
        saleActive[id] = active;
        emit SaleStatusChanged(id, active);
    }

    function recordResolution(uint256 id, bytes32 resolutionHash) external onlyAssetGovernor(id) {
        emit ResolutionApproved(id, resolutionHash);
    }

    function setBalance(address account, uint256 id, uint256 amount) external {
        currentBalance[account][id] = amount;
    }

    function setBalanceAt(address account, uint256 id, uint48 t, uint256 amount) external {
        pastBalance[account][id][t] = amount;
    }

    function setSupplyAt(uint256 id, uint48 t, uint256 amount) external {
        pastSupply[id][t] = amount;
    }

    function balanceOf(address account, uint256 id) external view returns (uint256) {
        return currentBalance[account][id];
    }

    function balanceOfAt(address account, uint256 id, uint48 timepoint) external view returns (uint256) {
        _checkPast(timepoint);
        return pastBalance[account][id][timepoint];
    }

    function totalSupplyAt(uint256 id, uint48 timepoint) external view returns (uint256) {
        _checkPast(timepoint);
        return pastSupply[id][timepoint];
    }

    function _checkPast(uint48 timepoint) private view {
        if (timepoint >= block.timestamp) revert FutureLookup(timepoint, uint48(block.timestamp));
    }
}
