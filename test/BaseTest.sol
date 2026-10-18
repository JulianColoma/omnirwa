// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSDT} from "../contracts/mocks/MockUSDT.sol";
import {RWATokenizer1155} from "../contracts/RWATokenizer1155.sol";

/// @notice Setup compartido: actores, MockUSDT fondeado y tokenizer con roles asignados.
abstract contract BaseTest is Test {
    address internal admin = makeAddr("admin");
    address internal creator = makeAddr("creator");
    address internal alice = makeAddr("alice"); // Inversor A
    address internal bob = makeAddr("bob"); // Inversor B
    address internal carol = makeAddr("carol"); // sin fracciones

    uint64 internal constant MAX_FRACTIONS = 1_000;
    uint128 internal constant PRICE = 10e6; // 10 USDT
    bytes32 internal constant DOC_HASH = keccak256("ipfs://depto-rosario");
    uint256 internal constant INITIAL_USDT = 100_000e6;

    MockUSDT internal usdt;
    RWATokenizer1155 internal tokenizer;

    function setUp() public virtual {
        vm.warp(1_700_000_000); // timestamp realista para los checkpoints

        usdt = new MockUSDT(admin);
        tokenizer = new RWATokenizer1155(usdt, "ipfs://omnirwa/{id}.json", admin);

        vm.startPrank(admin);
        tokenizer.grantRole(tokenizer.ISSUER_ROLE(), creator);
        usdt.mint(alice, INITIAL_USDT);
        usdt.mint(bob, INITIAL_USDT);
        usdt.mint(carol, INITIAL_USDT);
        usdt.mint(creator, INITIAL_USDT);
        vm.stopPrank();
    }

    // ───────── helpers (se usan cuando el tokenizer esté implementado) ─────────

    function _register() internal returns (uint256 id) {
        vm.prank(creator);
        id = tokenizer.registerAsset(MAX_FRACTIONS, PRICE, DOC_HASH);
    }

    function _buy(address who, uint256 id, uint64 amount) internal {
        vm.startPrank(who);
        usdt.approve(address(tokenizer), uint256(amount) * PRICE);
        tokenizer.buyFractions(id, amount);
        vm.stopPrank();
    }

    function _deposit(uint256 id, uint256 amount) internal {
        vm.startPrank(creator);
        usdt.approve(address(tokenizer), amount);
        tokenizer.depositDividends(id, amount);
        vm.stopPrank();
    }
}
