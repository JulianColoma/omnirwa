// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MockUSDT} from "../contracts/mocks/MockUSDT.sol";

contract MockUSDTTest is Test {
    MockUSDT internal usdt;
    address internal owner = makeAddr("owner");
    address internal user = makeAddr("user");

    function setUp() public {
        usdt = new MockUSDT(owner);
    }

    function test_Metadata() public view {
        assertEq(usdt.name(), "Mock USDT");
        assertEq(usdt.symbol(), "mUSDT");
        assertEq(usdt.decimals(), 6);
        assertEq(usdt.owner(), owner);
    }

    function test_OwnerCanMint() public {
        vm.prank(owner);
        usdt.mint(user, 1_000e6);
        assertEq(usdt.balanceOf(user), 1_000e6);
        assertEq(usdt.totalSupply(), 1_000e6);
    }

    function test_RevertWhen_NonOwnerMints() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        usdt.mint(user, 1);
    }
}
