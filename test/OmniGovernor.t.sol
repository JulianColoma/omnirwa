// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {AssetVotes} from "../contracts/governance/AssetVotes.sol";
import {OmniGovernor} from "../contracts/governance/OmniGovernor.sol";
import {MockTokenizer} from "./mocks/MockTokenizer.sol";

/// @notice Tests del Governor (integrante B).
/// @dev Los tests con `vm.skip(true)` son TODO. Plan de casos: sección 11 del documento del proyecto.
contract OmniGovernorTest is Test {
    uint256 internal constant ID = 1;
    uint32 internal constant VOTING_PERIOD = 600; // 10 minutos

    MockTokenizer internal mock;
    AssetVotes internal votes;
    OmniGovernor internal governor;

    function setUp() public {
        vm.warp(1_700_000_000);
        mock = new MockTokenizer();
        votes = new AssetVotes(mock, ID);
        governor = new OmniGovernor(votes, "OmniRWA Depto Rosario", VOTING_PERIOD);
    }

    function test_Settings() public view {
        assertEq(governor.name(), "OmniRWA Depto Rosario");
        assertEq(governor.votingDelay(), 0);
        assertEq(governor.votingPeriod(), VOTING_PERIOD);
        assertEq(governor.proposalThreshold(), 1);
        assertEq(governor.quorumNumerator(), 20);
        assertEq(governor.SUPERMAJORITY_BPS(), 6_667);
        assertEq(address(governor.token()), address(votes));
        assertEq(governor.CLOCK_MODE(), "mode=timestamp");
    }

    // ───────────────────────── TODO(B) ─────────────────────────

    function test_FullCycle_ProposeVoteExecute() public {
        vm.skip(true); // TODO(B): propose → castVote → vm.warp → Succeeded → execute → saleActive == false
    }

    function test_SupermajorityNotReached_Defeated() public {
        vm.skip(true); // TODO(B): 62,5% a favor → Defeated
    }

    function test_NoQuorum_Defeated() public {
        vm.skip(true); // TODO(B)
    }

    function test_RevertWhen_ProposeWithoutFractions() public {
        vm.skip(true); // TODO(B): GovernorInsufficientProposerVotes
    }

    function test_RevertWhen_VoteTwice() public {
        vm.skip(true); // TODO(B): GovernorAlreadyCastVote
    }

    function test_RevertWhen_ExecuteEarly() public {
        vm.skip(true); // TODO(B): GovernorUnexpectedProposalState
    }
}
