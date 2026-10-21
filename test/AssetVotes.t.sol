// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {AssetVotes} from "../contracts/governance/AssetVotes.sol";
import {IRWATokenizer} from "../contracts/interfaces/IRWATokenizer.sol";
import {MockTokenizer} from "./mocks/MockTokenizer.sol";

/// @notice Tests del adaptador de votos contra MockTokenizer (integrante B).
contract AssetVotesTest is Test {
    uint256 internal constant ID = 1;
    MockTokenizer internal mock;
    AssetVotes internal votes;
    address internal alice = makeAddr("alice");

    function setUp() public {
        vm.warp(1_700_000_000);
        mock = new MockTokenizer();
        votes = new AssetVotes(mock, ID);
    }

    function test_Clock() public view {
        assertEq(votes.clock(), uint48(block.timestamp));
        assertEq(votes.CLOCK_MODE(), "mode=timestamp");
    }

    function test_GetVotesIsCurrentBalance() public {
        mock.setBalance(alice, ID, 500);
        assertEq(votes.getVotes(alice), 500);
    }

    function test_DelegatesIsSelf() public view {
        assertEq(votes.delegates(alice), alice);
    }

    function test_RevertWhen_Delegate() public {
        vm.expectRevert(AssetVotes.DelegationDisabled.selector);
        votes.delegate(alice);
        vm.expectRevert(AssetVotes.DelegationDisabled.selector);
        votes.delegateBySig(alice, 0, 0, 0, 0, 0);
    }

    function test_RevertWhen_ZeroTokenizer() public {
        vm.expectRevert(AssetVotes.ZeroAddress.selector);
        new AssetVotes(IRWATokenizer(address(0)), ID);
    }

    function test_RevertWhen_ZeroAssetId() public {
        vm.expectRevert(AssetVotes.InvalidAssetId.selector);
        new AssetVotes(mock, 0);
    }

    function test_GetPastVotes() public {
        uint48 t = uint48(block.timestamp - 1);
        mock.setBalanceAt(alice, ID, t, 300);
        assertEq(votes.getPastVotes(alice, t), 300);
    }

    function test_GetPastVotes_UnknownAccountIsZero() public {
        assertEq(votes.getPastVotes(makeAddr("nobody"), block.timestamp - 1), 0);
    }

    function test_GetPastTotalSupply() public {
        uint48 t = uint48(block.timestamp - 1);
        mock.setSupplyAt(ID, t, 800);
        assertEq(votes.getPastTotalSupply(t), 800);
    }

    function test_RevertWhen_TimepointOverflowsUint48() public {
        uint256 t = type(uint256).max;
        bytes memory err = abi.encodeWithSelector(SafeCast.SafeCastOverflowedUintDowncast.selector, 48, t);
        vm.expectRevert(err);
        votes.getPastVotes(alice, t);
        vm.expectRevert(err);
        votes.getPastTotalSupply(t);
    }

    function test_RevertWhen_FutureLookup() public {
        uint48 t = uint48(block.timestamp);
        bytes memory err = abi.encodeWithSelector(MockTokenizer.FutureLookup.selector, t, t);
        vm.expectRevert(err);
        votes.getPastVotes(alice, t);
        vm.expectRevert(err);
        votes.getPastTotalSupply(t);
    }
}
