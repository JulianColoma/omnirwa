// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {AssetVotes} from "../contracts/governance/AssetVotes.sol";
import {IRWATokenizer} from "../contracts/interfaces/IRWATokenizer.sol";
import {MockTokenizer} from "./mocks/MockTokenizer.sol";

/// @notice Tests del adaptador de votos contra MockTokenizer (integrante B)
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
        mock.setBalanceAt(alice, ID, t - 1, 300);
        assertEq(votes.getPastVotes(alice, t), 300);
    }

    function test_GetPastVotes_IgnoresSameSecond() public {
        uint48 t = uint48(block.timestamp - 1);
        mock.setBalanceAt(alice, ID, t - 1, 300);
        mock.setBalanceAt(alice, ID, t, 999); // compra en el mismo segundo que la propuesta
        assertEq(votes.getPastVotes(alice, t), 300);
    }

    function test_GetPastVotes_UnknownAccountIsZero() public {
        assertEq(votes.getPastVotes(makeAddr("nobody"), block.timestamp - 1), 0);
    }

    function test_GetPastVotes_AtZero() public view {
        assertEq(votes.getPastVotes(alice, 0), 0);
        assertEq(votes.getPastTotalSupply(0), 0);
    }

    function test_GetPastTotalSupply() public {
        uint48 t = uint48(block.timestamp - 1);
        mock.setSupplyAt(ID, t - 1, 800);
        assertEq(votes.getPastTotalSupply(t), 800);
    }

    function test_GetPastTotalSupply_IgnoresSameSecond() public {
        uint48 t = uint48(block.timestamp - 1);
        mock.setSupplyAt(ID, t - 1, 800);
        mock.setSupplyAt(ID, t, 1_800); // compra en el mismo segundo que la propuesta
        assertEq(votes.getPastTotalSupply(t), 800);
    }

    function test_RevertWhen_FutureLookup() public {
        uint48 t = uint48(block.timestamp);
        bytes memory err = abi.encodeWithSelector(AssetVotes.ERC5805FutureLookup.selector, t, t);
        vm.expectRevert(err);
        votes.getPastVotes(alice, t);
        vm.expectRevert(err);
        votes.getPastTotalSupply(t);
    }

    function test_RevertWhen_HugeTimepoint() public {
        uint256 t = type(uint256).max;
        bytes memory err = abi.encodeWithSelector(AssetVotes.ERC5805FutureLookup.selector, t, uint48(block.timestamp));
        vm.expectRevert(err);
        votes.getPastVotes(alice, t);
        vm.expectRevert(err);
        votes.getPastTotalSupply(t);
    }
}
