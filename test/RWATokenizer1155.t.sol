// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {BaseTest} from "./BaseTest.sol";
import {RWATokenizer1155} from "../contracts/RWATokenizer1155.sol";
import {ReentrantBuyer} from "./mocks/ReentrantBuyer.sol";

/// @notice Tests del tokenizer (integrante A).
/// @dev Los tests con `vm.skip(true)` son TODO: quitar el skip a medida que se implementa cada función.
///      Plan de casos: sección 11 del documento del proyecto.
contract RWATokenizer1155Test is BaseTest {
    address internal governor = makeAddr("governor");

    // ───────────────────────── Ya implementado ─────────────────────────

    function test_Constructor_SetsRolesAndToken() public view {
        assertEq(address(tokenizer.paymentToken()), address(usdt));
        assertTrue(tokenizer.hasRole(tokenizer.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(tokenizer.hasRole(tokenizer.PAUSER_ROLE(), admin));
        assertTrue(tokenizer.hasRole(tokenizer.ISSUER_ROLE(), creator));
        assertEq(tokenizer.nextAssetId(), 1);
    }

    function test_RevertWhen_ConstructorZeroAddress() public {
        vm.expectRevert(RWATokenizer1155.ZeroAddress.selector);
        new RWATokenizer1155(usdt, "", address(0));
    }

    function test_SetAssetGovernor() public {
        vm.prank(admin);
        tokenizer.setAssetGovernor(1, governor);
        assertEq(tokenizer.assetGovernor(1), governor);
    }

    function test_RevertWhen_SetAssetGovernorTwice() public {
        vm.startPrank(admin);
        tokenizer.setAssetGovernor(1, governor);
        vm.expectRevert(abi.encodeWithSelector(RWATokenizer1155.GovernorAlreadySet.selector, 1));
        tokenizer.setAssetGovernor(1, makeAddr("other"));
        vm.stopPrank();
    }

    function test_RevertWhen_SetAssetGovernorNotAdmin() public {
        bytes32 adminRole = tokenizer.DEFAULT_ADMIN_ROLE();
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, adminRole)
        );
        tokenizer.setAssetGovernor(1, governor);
    }

    function test_GovernorHooks() public {
        vm.prank(admin);
        tokenizer.setAssetGovernor(1, governor);

        vm.startPrank(governor);
        vm.expectEmit(true, false, false, true);
        emit RWATokenizer1155.SaleStatusChanged(1, false);
        tokenizer.setSaleActive(1, false);

        vm.expectEmit(true, false, false, true);
        emit RWATokenizer1155.ResolutionApproved(1, bytes32("acta"));
        tokenizer.recordResolution(1, bytes32("acta"));
        vm.stopPrank();
    }

    function test_RevertWhen_HookCalledByNonGovernor() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(RWATokenizer1155.NotAssetGovernor.selector, 1, alice));
        tokenizer.setSaleActive(1, false);
    }

    function test_PauseUnpause() public {
        vm.startPrank(admin);
        tokenizer.pause();
        assertTrue(tokenizer.paused());
        tokenizer.unpause();
        assertFalse(tokenizer.paused());
        vm.stopPrank();
    }

    function test_RevertWhen_FutureLookup() public {
        uint48 nowTs = uint48(block.timestamp);
        vm.expectRevert(abi.encodeWithSelector(RWATokenizer1155.FutureLookup.selector, nowTs, nowTs));
        tokenizer.balanceOfAt(alice, 1, nowTs);
    }

    // ───────────────────────── Registro y compra ─────────────────────────

    function test_RegisterAsset() public {
        vm.expectEmit(true, true, false, true);
        emit RWATokenizer1155.AssetRegistered(1, creator, MAX_FRACTIONS, PRICE, DOC_HASH);
        uint256 id = _register();

        assertEq(id, 1);
        assertEq(tokenizer.nextAssetId(), 2);
        (address c, uint64 maxF, bool active, uint128 price, uint64 sold, bytes32 doc) = tokenizer.assets(id);
        assertEq(c, creator);
        assertEq(maxF, MAX_FRACTIONS);
        assertTrue(active);
        assertEq(price, PRICE);
        assertEq(sold, 0);
        assertEq(doc, DOC_HASH);
    }

    function test_RevertWhen_RegisterWithoutIssuerRole() public {
        bytes32 issuerRole = tokenizer.ISSUER_ROLE();
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, issuerRole)
        );
        tokenizer.registerAsset(MAX_FRACTIONS, PRICE, DOC_HASH);
    }

    function test_RevertWhen_RegisterZero() public {
        vm.startPrank(creator);
        vm.expectRevert(RWATokenizer1155.ZeroAmount.selector);
        tokenizer.registerAsset(0, PRICE, DOC_HASH);
        vm.expectRevert(RWATokenizer1155.ZeroAmount.selector);
        tokenizer.registerAsset(MAX_FRACTIONS, 0, DOC_HASH);
        vm.stopPrank();
    }

    function test_BuyFractions() public {
        uint256 id = _register();

        vm.startPrank(alice);
        usdt.approve(address(tokenizer), 500 * PRICE);
        vm.expectEmit(true, true, false, true);
        emit RWATokenizer1155.FractionsPurchased(id, alice, 500, 500 * PRICE);
        tokenizer.buyFractions(id, 500);
        vm.stopPrank();

        assertEq(tokenizer.balanceOf(alice, id), 500);
        assertEq(tokenizer.totalSupply(id), 500);
        (,,,, uint64 sold,) = tokenizer.assets(id);
        assertEq(sold, 500);
        assertEq(usdt.balanceOf(alice), INITIAL_USDT - 500 * PRICE);
        assertEq(usdt.balanceOf(creator), INITIAL_USDT + 500 * PRICE);
        assertEq(usdt.balanceOf(address(tokenizer)), 0);
    }

    function test_BuyExactMaxAvailable() public {
        uint256 id = _register();
        _buy(alice, id, 600);
        _buy(bob, id, MAX_FRACTIONS - 600);
        assertEq(tokenizer.totalSupply(id), MAX_FRACTIONS);
    }

    function test_RevertWhen_BuyZero() public {
        uint256 id = _register();
        vm.prank(alice);
        vm.expectRevert(RWATokenizer1155.ZeroAmount.selector);
        tokenizer.buyFractions(id, 0);
    }

    function test_RevertWhen_BuyExceedsAvailable() public {
        uint256 id = _register();
        _buy(alice, id, 800);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(RWATokenizer1155.ExceedsAvailable.selector, id, uint64(200)));
        tokenizer.buyFractions(id, 201);
    }

    function test_RevertWhen_BuyAmountOverflowsUint64() public {
        uint256 id = _register();
        _buy(alice, id, 1);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(RWATokenizer1155.ExceedsAvailable.selector, id, MAX_FRACTIONS - 1));
        tokenizer.buyFractions(id, type(uint64).max);
    }

    function test_RevertWhen_BuyPaused() public {
        uint256 id = _register();
        vm.prank(admin);
        tokenizer.pause();
        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        tokenizer.buyFractions(id, 1);
    }

    function test_RevertWhen_BuyUnknownAsset() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(RWATokenizer1155.SaleNotActive.selector, 99));
        tokenizer.buyFractions(99, 1);
    }

    function test_RevertWhen_BuySaleClosedByGovernor() public {
        uint256 id = _register();
        vm.prank(admin);
        tokenizer.setAssetGovernor(id, governor);
        vm.prank(governor);
        tokenizer.setSaleActive(id, false);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(RWATokenizer1155.SaleNotActive.selector, id));
        tokenizer.buyFractions(id, 1);
    }

    function test_RevertWhen_BuyWithoutApprove() public {
        uint256 id = _register();
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC20Errors.ERC20InsufficientAllowance.selector, address(tokenizer), 0, uint256(PRICE)
            )
        );
        tokenizer.buyFractions(id, 1);
    }

    function test_RevertWhen_Reentrancy() public {
        uint256 id = _register();
        ReentrantBuyer attacker = new ReentrantBuyer(tokenizer, id);
        vm.prank(admin);
        usdt.mint(address(attacker), INITIAL_USDT);

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        attacker.attack(1);
    }

    // ───────────────────────── TODO(A): dividendos ─────────────────────────

    function test_DividendsProRata() public {
        vm.skip(true); // TODO(A): A=500, B=300, depósito 800 → A cobra 500, B cobra 300.
    }

    function test_LateBuyerDoesNotGetPastDividends() public {
        vm.skip(true); // TODO(A)
    }

    function test_TransferSettlesDividends() public {
        vm.skip(true); // TODO(A)
    }

    function test_ClaimWorksWhilePaused() public {
        vm.skip(true); // TODO(A)
    }

    function test_RevertWhen_DepositNotCreator() public {
        vm.skip(true); // TODO(A): NotAssetCreator
    }

    function test_RevertWhen_DepositNoHolders() public {
        vm.skip(true); // TODO(A): NoHolders
    }

    function test_RevertWhen_NothingToClaim() public {
        vm.skip(true); // TODO(A): NothingToClaim
    }

    // ───────────────────────── Checkpoints ─────────────────────────

    function test_BalanceOfAtAndTotalSupplyAt() public {
        uint256 id = _register();
        uint48 t1 = uint48(block.timestamp);
        _buy(alice, id, 500);

        vm.warp(t1 + 10);
        vm.prank(alice);
        tokenizer.safeTransferFrom(alice, carol, id, 200, "");
        _buy(bob, id, 100);

        vm.warp(t1 + 20);
        assertEq(tokenizer.balanceOfAt(alice, id, t1 - 1), 0);
        assertEq(tokenizer.balanceOfAt(alice, id, t1), 500);
        assertEq(tokenizer.balanceOfAt(alice, id, t1 + 9), 500);
        assertEq(tokenizer.balanceOfAt(alice, id, t1 + 10), 300);
        assertEq(tokenizer.balanceOfAt(carol, id, t1 + 9), 0);
        assertEq(tokenizer.balanceOfAt(carol, id, t1 + 10), 200);
        assertEq(tokenizer.balanceOfAt(bob, id, t1 + 10), 100);

        assertEq(tokenizer.totalSupplyAt(id, t1 - 1), 0);
        assertEq(tokenizer.totalSupplyAt(id, t1), 500);
        assertEq(tokenizer.totalSupplyAt(id, t1 + 10), 600);
    }

    function test_RevertWhen_TotalSupplyFutureLookup() public {
        uint48 nowTs = uint48(block.timestamp);
        vm.expectRevert(abi.encodeWithSelector(RWATokenizer1155.FutureLookup.selector, nowTs + 1, nowTs));
        tokenizer.totalSupplyAt(1, nowTs + 1);
    }

    function testFuzz_BalanceOfAtMatchesHistory(uint64 first, uint64 second, uint32 gap) public {
        first = uint64(bound(first, 1, 500));
        second = uint64(bound(second, 1, 500));
        gap = uint32(bound(gap, 1, 30 days));
        uint256 id = _register();
        uint48 t1 = uint48(block.timestamp);

        _buy(alice, id, first);
        vm.warp(t1 + gap);
        _buy(alice, id, second);
        vm.warp(t1 + gap + 1);

        assertEq(tokenizer.balanceOfAt(alice, id, t1 + gap - 1), first);
        assertEq(tokenizer.balanceOfAt(alice, id, t1 + gap), uint256(first) + second);
        assertEq(tokenizer.totalSupplyAt(id, t1 + gap - 1), first);
        assertEq(tokenizer.balanceOfAt(alice, id, t1 + gap), tokenizer.balanceOf(alice, id));
    }

    // ───────────────────────── TODO(A): fuzz ─────────────────────────

    function testFuzz_DividendsNeverExceedDeposit(uint64 a, uint64 b, uint96 deposit) public {
        vm.skip(true); // TODO(A): ver plan §11
        a;
        b;
        deposit;
    }
}
