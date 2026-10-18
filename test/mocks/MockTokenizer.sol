// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IRWATokenizer} from "../../contracts/interfaces/IRWATokenizer.sol";

/// @title MockTokenizer
/// @notice Implementación trivial de IRWATokenizer para testear la gobernanza sin el tokenizer real.
/// @dev Los saldos "históricos" se cargan a mano con `setBalanceAt` / `setSupplyAt`.
contract MockTokenizer is IRWATokenizer {
    mapping(address account => mapping(uint256 id => uint256)) public currentBalance;
    mapping(address account => mapping(uint256 id => mapping(uint48 t => uint256))) public pastBalance;
    mapping(uint256 id => mapping(uint48 t => uint256)) public pastSupply;

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
        return pastBalance[account][id][timepoint];
    }

    function totalSupplyAt(uint256 id, uint48 timepoint) external view returns (uint256) {
        return pastSupply[id][timepoint];
    }
}
