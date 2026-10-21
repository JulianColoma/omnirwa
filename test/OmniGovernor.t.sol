// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {AssetVotes} from "../contracts/governance/AssetVotes.sol";
import {OmniGovernor} from "../contracts/governance/OmniGovernor.sol";
import {MockTokenizer} from "./mocks/MockTokenizer.sol";

/// @notice Tests del Governor (integrante B)
/// @dev Detalles de OZ v5.1 que condicionan los tests:
///      - `propose` lee el poder del proponente en `clock() - 1`
///      - el snapshot es el momento de la propuesta (delay 0) y ahí está Pending: se vota desde `snapshot + 1`
///      - la votación termina en `snapshot + VOTING_PERIOD`; en `snapshot + VOTING_PERIOD + 1` ya está resuelta
///      - el mock guarda por timestamp exacto, así que se carga `snapshot - 1` (umbral) y `snapshot` (votos y supply)
contract OmniGovernorTest is Test {
    uint256 internal constant ID = 1;
    uint32 internal constant VOTING_PERIOD = 600; // 10 minutos
    string internal constant CLOSE_SALE_DESC = "Propuesta 1: cerrar la venta del Depto Rosario";

    uint8 internal constant AGAINST = 0;
    uint8 internal constant FOR = 1;
    uint8 internal constant ABSTAIN = 2;

    MockTokenizer internal mock;
    AssetVotes internal votes;
    OmniGovernor internal governor;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    /// @dev Momento en que se crea la propuesta (= snapshot, porque votingDelay es 0)
    uint48 internal snapshot;

    function setUp() public {
        vm.warp(1_700_000_000);
        mock = new MockTokenizer();
        votes = new AssetVotes(mock, ID);
        governor = new OmniGovernor(votes, "OmniRWA Depto Rosario", VOTING_PERIOD);

        mock.setAssetGovernor(ID, address(governor));
        vm.prank(address(governor));
        mock.setSaleActive(ID, true);

        snapshot = uint48(block.timestamp);
    }

    // ───────────────────────── Helpers ─────────────────────────

    function _setVotes(address who, uint256 amount) internal {
        mock.setBalanceAt(who, ID, snapshot - 1, amount); // umbral de propose
        mock.setBalanceAt(who, ID, snapshot, amount); // peso en el snapshot
    }

    function _setSnapshot(uint256 aliceVotes, uint256 bobVotes, uint256 supply) internal {
        _setVotes(alice, aliceVotes);
        _setVotes(bob, bobVotes);
        mock.setSupplyAt(ID, snapshot, supply);
    }

    /// @dev Mismo helper que en Demo.s.sol, con el mock como target
    function _closeSaleCall() internal view returns (address[] memory t, uint256[] memory v, bytes[] memory c) {
        t = new address[](1);
        v = new uint256[](1);
        c = new bytes[](1);
        t[0] = address(mock);
        c[0] = abi.encodeCall(MockTokenizer.setSaleActive, (ID, false));
    }

    function _startVoting() internal {
        vm.warp(snapshot + 1);
    }

    function _endVoting() internal {
        vm.warp(snapshot + VOTING_PERIOD + 1);
    }

    function _executableStates() internal pure returns (bytes32) {
        return bytes32(
            (uint256(1) << uint8(IGovernor.ProposalState.Succeeded))
                | (uint256(1) << uint8(IGovernor.ProposalState.Queued))
        );
    }

    // ───────────────────────── Configuración ─────────────────────────

    function test_Settings() public view {
        assertEq(governor.name(), "OmniRWA Depto Rosario");
        assertEq(governor.votingDelay(), 0);
        assertEq(governor.votingPeriod(), VOTING_PERIOD);
        assertEq(governor.proposalThreshold(), 1);
        assertEq(governor.quorumNumerator(), 20);
        assertEq(governor.SUPERMAJORITY_NUMERATOR(), 2);
        assertEq(governor.SUPERMAJORITY_DENOMINATOR(), 3);
        assertEq(address(governor.token()), address(votes));
        assertEq(governor.CLOCK_MODE(), "mode=timestamp");
    }

    function test_QuorumIsTwentyPercentOfSupply() public {
        // El numerador del quórum tiene checkpoint desde el deploy (= snapshot): antes de eso vale 0
        mock.setSupplyAt(ID, snapshot, 800);
        _startVoting();
        assertEq(governor.quorum(snapshot), 160);
    }

    function test_RevertWhen_ZeroVotesAddress() public {
        vm.expectRevert(OmniGovernor.ZeroAddress.selector);
        new OmniGovernor(IVotes(address(0)), "OmniRWA", VOTING_PERIOD);
    }

    function test_RevertWhen_ZeroVotingPeriod() public {
        vm.expectRevert(abi.encodeWithSelector(IGovernor.GovernorInvalidVotingPeriod.selector, 0));
        new OmniGovernor(votes, "OmniRWA", 0);
    }

    // ───────────────────────── Ciclo completo ─────────────────────────

    function test_FullCycle_ProposeVoteExecute() public {
        _setSnapshot(500, 300, 800);
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.prank(alice);
        uint256 proposalId = governor.propose(t, v, c, CLOSE_SALE_DESC);
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Pending));

        _startVoting();
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Active));
        vm.prank(alice);
        governor.castVote(proposalId, FOR);
        vm.prank(bob);
        governor.castVote(proposalId, FOR);

        _endVoting();
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Succeeded));

        vm.expectEmit(address(mock));
        emit MockTokenizer.SaleStatusChanged(ID, false);
        governor.execute(t, v, c, keccak256(bytes(CLOSE_SALE_DESC)));

        assertFalse(mock.saleActive(ID));
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Executed));
    }

    // ───────────────────────── Mayoría y quórum ─────────────────────────

    function test_SupermajorityNotReached_Defeated() public {
        _setSnapshot(500, 300, 800);
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.prank(alice);
        uint256 proposalId = governor.propose(t, v, c, CLOSE_SALE_DESC);

        _startVoting();
        vm.prank(alice);
        governor.castVote(proposalId, FOR);
        vm.prank(bob);
        governor.castVote(proposalId, AGAINST); // 500 / 800 = 62,5% < 2/3

        _endVoting();
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Defeated));
    }

    function test_ExactTwoThirds_Succeeded() public {
        _setSnapshot(1, 1, 3);
        _setVotes(carol, 1);
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.prank(alice);
        uint256 proposalId = governor.propose(t, v, c, CLOSE_SALE_DESC);

        _startVoting();
        vm.prank(alice);
        governor.castVote(proposalId, FOR);
        vm.prank(bob);
        governor.castVote(proposalId, FOR);
        vm.prank(carol);
        governor.castVote(proposalId, AGAINST); // 2 * 3 >= 3 * 2

        _endVoting();
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Succeeded));
    }

    function test_JustBelowTwoThirds_Defeated() public {
        _setSnapshot(666, 334, 1_000);
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.prank(alice);
        uint256 proposalId = governor.propose(t, v, c, CLOSE_SALE_DESC);

        _startVoting();
        vm.prank(alice);
        governor.castVote(proposalId, FOR);
        vm.prank(bob);
        governor.castVote(proposalId, AGAINST); // 666 * 3 = 1998 < 2000

        _endVoting();
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Defeated));
    }

    function test_NoQuorum_Defeated() public {
        _setSnapshot(100, 700, 800); // quórum = 160
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.prank(alice);
        uint256 proposalId = governor.propose(t, v, c, CLOSE_SALE_DESC);

        _startVoting();
        vm.prank(alice);
        governor.castVote(proposalId, FOR);

        _endVoting();
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Defeated));
    }

    function test_OnlyAbstain_Defeated() public {
        _setSnapshot(500, 300, 800);
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.prank(alice);
        uint256 proposalId = governor.propose(t, v, c, CLOSE_SALE_DESC);

        _startVoting();
        vm.prank(alice);
        governor.castVote(proposalId, ABSTAIN); // hay quórum (500 >= 160) pero forVotes == 0

        _endVoting();
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Defeated));
    }

    // ───────────────────────── Errores ─────────────────────────

    function test_RevertWhen_ProposeWithoutFractions() public {
        _setSnapshot(500, 300, 800); // carol no tiene nada en snapshot - 1
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.expectRevert(abi.encodeWithSelector(IGovernor.GovernorInsufficientProposerVotes.selector, carol, 0, 1));
        vm.prank(carol);
        governor.propose(t, v, c, CLOSE_SALE_DESC);
    }

    function test_RevertWhen_VoteTwice() public {
        _setSnapshot(500, 300, 800);
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.prank(alice);
        uint256 proposalId = governor.propose(t, v, c, CLOSE_SALE_DESC);

        _startVoting();
        vm.prank(alice);
        governor.castVote(proposalId, FOR);
        vm.expectRevert(abi.encodeWithSelector(IGovernor.GovernorAlreadyCastVote.selector, alice));
        vm.prank(alice);
        governor.castVote(proposalId, FOR);
    }

    function test_RevertWhen_ExecuteEarly() public {
        _setSnapshot(500, 300, 800);
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.prank(alice);
        uint256 proposalId = governor.propose(t, v, c, CLOSE_SALE_DESC);

        _startVoting();
        vm.prank(alice);
        governor.castVote(proposalId, FOR);
        vm.prank(bob);
        governor.castVote(proposalId, FOR);

        vm.expectRevert(
            abi.encodeWithSelector(
                IGovernor.GovernorUnexpectedProposalState.selector,
                proposalId,
                IGovernor.ProposalState.Active,
                _executableStates()
            )
        );
        governor.execute(t, v, c, keccak256(bytes(CLOSE_SALE_DESC)));
    }

    function test_RevertWhen_ExecuteDefeated() public {
        _setSnapshot(500, 300, 800);
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.prank(alice);
        uint256 proposalId = governor.propose(t, v, c, CLOSE_SALE_DESC);

        _startVoting();
        vm.prank(alice);
        governor.castVote(proposalId, FOR);
        vm.prank(bob);
        governor.castVote(proposalId, AGAINST);
        _endVoting();

        vm.expectRevert(
            abi.encodeWithSelector(
                IGovernor.GovernorUnexpectedProposalState.selector,
                proposalId,
                IGovernor.ProposalState.Defeated,
                _executableStates()
            )
        );
        governor.execute(t, v, c, keccak256(bytes(CLOSE_SALE_DESC)));
    }

    function test_RevertWhen_HookCalledByNonGovernor() public {
        vm.expectRevert(abi.encodeWithSelector(MockTokenizer.NotAssetGovernor.selector, ID, alice));
        vm.prank(alice);
        mock.setSaleActive(ID, false);
    }
}
