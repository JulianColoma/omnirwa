// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {BaseTest} from "./BaseTest.sol";
import {RWATokenizer1155} from "../contracts/RWATokenizer1155.sol";
import {AssetVotes} from "../contracts/governance/AssetVotes.sol";
import {OmniGovernor} from "../contracts/governance/OmniGovernor.sol";

/// @notice Flujo completo con los contratos reales (sin mocks): compra → dividendos → votación → ejecución.
/// @dev Tiempos:
///      - `propose` lee el umbral en `clock() - 1`, que AssetVotes mide al cierre de `clock() - 2`:
///        entre la compra y el `propose` hace falta `vm.warp(+2)`
///      - el snapshot es el momento de la propuesta (delay 0) y ahí está Pending: se vota desde `snapshot + 1`
///      - la votación termina en `snapshot + VOTING_PERIOD`; en `snapshot + VOTING_PERIOD + 1` ya está resuelta
contract IntegrationTest is BaseTest {
    uint256 internal constant ID = 1;
    uint32 internal constant VOTING_PERIOD = 600; // 10 minutos
    string internal constant CLOSE_SALE_DESC = "Propuesta 1: cerrar la venta del Depto Rosario";
    string internal constant RESOLUTION_DESC = "Propuesta 2: vender el Depto Rosario a 120.000";
    bytes32 internal constant RESOLUTION_HASH = keccak256("ipfs://acta-venta-120000");

    uint8 internal constant AGAINST = 0;
    uint8 internal constant FOR = 1;

    AssetVotes internal votes;
    OmniGovernor internal governor;

    function setUp() public override {
        super.setUp();
        votes = new AssetVotes(tokenizer, ID);
        governor = new OmniGovernor(votes, "OmniRWA Depto Rosario", VOTING_PERIOD);
        vm.prank(admin);
        tokenizer.setAssetGovernor(ID, address(governor));
    }

    // ───────────────────────── Helpers ─────────────────────────

    /// @dev Registra el activo, alice compra 500 y bob 300, y avanza lo necesario para poder proponer
    function _registerAndBuy() internal {
        assertEq(_register(), ID);
        _buy(alice, ID, 500);
        _buy(bob, ID, 300);
        vm.warp(block.timestamp + 2);
    }

    function _closeSaleCall() internal view returns (address[] memory t, uint256[] memory v, bytes[] memory c) {
        t = new address[](1);
        v = new uint256[](1);
        c = new bytes[](1);
        t[0] = address(tokenizer);
        c[0] = abi.encodeCall(RWATokenizer1155.setSaleActive, (ID, false));
    }

    function _resolutionCall() internal view returns (address[] memory t, uint256[] memory v, bytes[] memory c) {
        t = new address[](1);
        v = new uint256[](1);
        c = new bytes[](1);
        t[0] = address(tokenizer);
        c[0] = abi.encodeCall(RWATokenizer1155.recordResolution, (ID, RESOLUTION_HASH));
    }

    /// @dev Alice propone el cierre de la venta, devuelve el id y el snapshot
    function _proposeCloseSale() internal returns (uint256 proposalId, uint256 snapshot) {
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.prank(alice);
        proposalId = governor.propose(t, v, c, CLOSE_SALE_DESC);
        snapshot = governor.proposalSnapshot(proposalId);
    }

    function _vote(address who, uint256 proposalId, uint8 support) internal {
        vm.prank(who);
        governor.castVote(proposalId, support);
    }

    function _endVoting(uint256 proposalId) internal {
        vm.warp(governor.proposalDeadline(proposalId) + 1);
    }

    function _saleActive() internal view returns (bool active) {
        (,, active,,,,) = tokenizer.assets(ID);
    }

    function _assertState(uint256 proposalId, IGovernor.ProposalState expected) internal view {
        assertEq(uint8(governor.state(proposalId)), uint8(expected));
    }

    // ───────────────────────── Tests ─────────────────────────

    function test_Wiring() public view {
        assertEq(tokenizer.assetGovernor(ID), address(governor));
        assertEq(address(votes.tokenizer()), address(tokenizer));
        assertEq(address(governor.token()), address(votes));
    }

    function test_DemoFlow() public {
        _registerAndBuy();

        // Dividendos: 800 USDT entre 800 fracciones → 500 y 300
        _deposit(ID, 800e6);
        uint256 aliceBefore = usdt.balanceOf(alice);
        uint256 bobBefore = usdt.balanceOf(bob);
        vm.prank(alice);
        tokenizer.claimDividends(ID);
        vm.prank(bob);
        tokenizer.claimDividends(ID);
        assertEq(usdt.balanceOf(alice) - aliceBefore, 500e6);
        assertEq(usdt.balanceOf(bob) - bobBefore, 300e6);

        // Propuesta 1: cerrar la venta, los dos a favor → Succeeded → execute
        (uint256 closeId, uint256 snapshot) = _proposeCloseSale();
        _assertState(closeId, IGovernor.ProposalState.Pending);
        vm.warp(snapshot + 1);
        _vote(alice, closeId, FOR);
        _vote(bob, closeId, FOR);
        _endVoting(closeId);
        _assertState(closeId, IGovernor.ProposalState.Succeeded);

        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        governor.execute(t, v, c, keccak256(bytes(CLOSE_SALE_DESC)));
        _assertState(closeId, IGovernor.ProposalState.Executed);
        assertFalse(_saleActive());

        // Propuesta 2: alice a favor, bob en contra → 500 / 800 = 62,5% < 2/3 → Defeated
        (t, v, c) = _resolutionCall();
        vm.prank(alice);
        uint256 resolutionId = governor.propose(t, v, c, RESOLUTION_DESC);
        vm.warp(governor.proposalSnapshot(resolutionId) + 1);
        _vote(alice, resolutionId, FOR);
        _vote(bob, resolutionId, AGAINST);
        _endVoting(resolutionId);
        _assertState(resolutionId, IGovernor.ProposalState.Defeated);
    }

    function test_BuyAfterProposalDoesNotVote() public {
        _registerAndBuy();
        (uint256 proposalId, uint256 snapshot) = _proposeCloseSale();

        vm.warp(snapshot + 1);
        _buy(carol, ID, 200);
        assertEq(votes.getPastVotes(carol, snapshot), 0);
        assertEq(votes.getPastTotalSupply(snapshot), 800);

        _vote(alice, proposalId, FOR);
        _vote(carol, proposalId, AGAINST);
        (uint256 againstVotes, uint256 forVotes,) = governor.proposalVotes(proposalId);
        assertEq(againstVotes, 0);
        assertEq(forVotes, 500);
    }

    function test_BuyInProposalBlockDoesNotVote() public {
        _registerAndBuy();
        (uint256 proposalId, uint256 snapshot) = _proposeCloseSale();
        _buy(carol, ID, 200); // mismo timestamp que el propose

        vm.warp(snapshot + 1);
        assertEq(votes.getPastVotes(carol, snapshot), 0);
        assertEq(votes.getPastTotalSupply(snapshot), 800);

        _vote(carol, proposalId, AGAINST);
        (uint256 againstVotes,,) = governor.proposalVotes(proposalId);
        assertEq(againstVotes, 0);
    }

    function test_TransferAfterVote_ReceiverHasNoWeight() public {
        _registerAndBuy();
        (uint256 proposalId, uint256 snapshot) = _proposeCloseSale();

        vm.warp(snapshot + 1);
        _vote(alice, proposalId, FOR);
        vm.prank(alice);
        tokenizer.safeTransferFrom(alice, carol, ID, 500, "");
        _vote(carol, proposalId, AGAINST);

        (uint256 againstVotes, uint256 forVotes,) = governor.proposalVotes(proposalId);
        assertEq(againstVotes, 0);
        assertEq(forVotes, 500);
    }

    function test_RecordResolution_EmitsEvent() public {
        _registerAndBuy();
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _resolutionCall();
        vm.prank(alice);
        uint256 proposalId = governor.propose(t, v, c, RESOLUTION_DESC);

        vm.warp(governor.proposalSnapshot(proposalId) + 1);
        _vote(alice, proposalId, FOR);
        _vote(bob, proposalId, FOR);
        _endVoting(proposalId);

        vm.expectEmit(address(tokenizer));
        emit RWATokenizer1155.ResolutionApproved(ID, RESOLUTION_HASH);
        governor.execute(t, v, c, keccak256(bytes(RESOLUTION_DESC)));
    }

    function test_RevertWhen_BuyAfterSaleClosed() public {
        _registerAndBuy();
        (uint256 proposalId, uint256 snapshot) = _proposeCloseSale();
        vm.warp(snapshot + 1);
        _vote(alice, proposalId, FOR);
        _vote(bob, proposalId, FOR);
        _endVoting(proposalId);
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        governor.execute(t, v, c, keccak256(bytes(CLOSE_SALE_DESC)));

        vm.startPrank(carol);
        usdt.approve(address(tokenizer), PRICE);
        vm.expectRevert(abi.encodeWithSelector(RWATokenizer1155.SaleNotActive.selector, ID));
        tokenizer.buyFractions(ID, 1);
        vm.stopPrank();
    }
}
