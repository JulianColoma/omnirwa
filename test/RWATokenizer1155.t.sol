// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {BaseTest} from "./BaseTest.sol";
import {RWATokenizer1155} from "../contracts/RWATokenizer1155.sol";

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

    // ───────────────────────── TODO(A): registro y compra ─────────────────────────

    function test_RegisterAsset() public {
        vm.skip(true); // TODO(A)
        uint256 id = _register();
        assertEq(id, 1);
        assertEq(tokenizer.nextAssetId(), 2);
    }

    function test_RevertWhen_RegisterWithoutIssuerRole() public {
        vm.skip(true); // TODO(A)
    }

    function test_BuyFractions() public {
        vm.skip(true); // TODO(A): verificar USDT comprador→creador, mint, soldFractions y totalSupply.
        uint256 id = _register();
        _buy(alice, id, 500);
        assertEq(tokenizer.balanceOf(alice, id), 500);
        assertEq(usdt.balanceOf(creator), INITIAL_USDT + 500 * PRICE);
    }

    function test_RevertWhen_BuyZero() public {
        vm.skip(true); // TODO(A): ZeroAmount
    }

    function test_RevertWhen_BuyExceedsAvailable() public {
        vm.skip(true); // TODO(A): ExceedsAvailable
    }

    function test_RevertWhen_BuyPaused() public {
        vm.skip(true); // TODO(A): Pausable.EnforcedPause
        Pausable.EnforcedPause.selector;
    }

    function test_RevertWhen_Reentrancy() public {
        vm.skip(true); // TODO(A): usar test/mocks/ReentrantBuyer.sol → ReentrancyGuardReentrantCall
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

    // ───────────────────────── TODO(A): checkpoints ─────────────────────────

    function test_BalanceOfAtAndTotalSupplyAt() public {
        vm.skip(true); // TODO(A)
    }

    // ───────────────────────── TODO(A): fuzz ─────────────────────────

    function testFuzz_DividendsNeverExceedDeposit(uint64 a, uint64 b, uint96 deposit) public {
        vm.skip(true); // TODO(A): ver plan §11
        a;
        b;
        deposit;
    }
}
