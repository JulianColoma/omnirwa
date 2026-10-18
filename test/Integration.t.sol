// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BaseTest} from "./BaseTest.sol";
import {AssetVotes} from "../contracts/governance/AssetVotes.sol";
import {OmniGovernor} from "../contracts/governance/OmniGovernor.sol";

/// @notice Flujo completo con los contratos reales (sin mocks): compra → dividendos → votación → ejecución.
/// @dev Replica el guion de la demo (plan §8).
contract IntegrationTest is BaseTest {
    uint256 internal constant ID = 1;
    AssetVotes internal votes;
    OmniGovernor internal governor;

    function setUp() public override {
        super.setUp();
        votes = new AssetVotes(tokenizer, ID);
        governor = new OmniGovernor(votes, "OmniRWA Depto Rosario", 600);
        vm.prank(admin);
        tokenizer.setAssetGovernor(ID, address(governor));
    }

    function test_Wiring() public view {
        assertEq(tokenizer.assetGovernor(ID), address(governor));
        assertEq(address(votes.tokenizer()), address(tokenizer));
        assertEq(address(governor.token()), address(votes));
    }

    function test_DemoFlow() public {
        vm.skip(true); // TODO(B): registrar → A compra 500, B 300 → depósito 800 → claims
        //             → propuesta 1 (cerrar venta) Succeeded + execute → propuesta 2 Defeated (62,5%).
    }

    function test_BuyAfterProposalDoesNotVote() public {
        vm.skip(true); // TODO(B): snapshot — lo comprado después de la propuesta pesa 0.
    }
}
