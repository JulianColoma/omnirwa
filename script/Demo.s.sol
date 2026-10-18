// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockUSDT} from "../contracts/mocks/MockUSDT.sol";
import {RWATokenizer1155} from "../contracts/RWATokenizer1155.sol";
import {OmniGovernor} from "../contracts/governance/OmniGovernor.sol";

/// @notice Ejecuta el flujo principal de la demo on-chain, en pasos separados (cada uno firmado por su actor).
/// @dev Lee las direcciones de deployments/<chainid>.json. Ejemplos:
///      forge script script/Demo.s.sol --sig "register()"      --rpc-url sepolia --account creator   --broadcast
///      forge script script/Demo.s.sol --sig "buy(uint64)" 500 --rpc-url sepolia --account investorA --broadcast
///      forge script script/Demo.s.sol --sig "buy(uint64)" 300 --rpc-url sepolia --account investorB --broadcast
///      forge script script/Demo.s.sol --sig "deposit(uint256)" 800000000 --rpc-url sepolia --account creator --broadcast
///      forge script script/Demo.s.sol --sig "claim()"         --rpc-url sepolia --account investorA --broadcast
///      forge script script/Demo.s.sol --sig "proposeCloseSale()" --rpc-url sepolia --account investorA --broadcast
///      forge script script/Demo.s.sol --sig "vote(uint256,uint8)" <id> 1 --rpc-url sepolia --account investorA --broadcast
///      forge script script/Demo.s.sol --sig "executeCloseSale()" --rpc-url sepolia --account investorA --broadcast
///      Guardar el hash de cada transacción para el README.
///
///      ESTADO: ESQUELETO (TODO(C)). Los pasos dependen de que el tokenizer esté implementado.
contract Demo is Script {
    uint256 internal constant ASSET_ID = 1;
    uint64 internal constant MAX_FRACTIONS = 1_000;
    uint128 internal constant PRICE = 10e6;
    string internal constant CLOSE_SALE_DESC = "Propuesta 1: cerrar la venta del Depto Rosario";

    MockUSDT internal usdt;
    RWATokenizer1155 internal tokenizer;
    OmniGovernor internal governor;

    function _load() internal {
        string memory json = vm.readFile(string.concat("./deployments/", vm.toString(block.chainid), ".json"));
        usdt = MockUSDT(vm.parseJsonAddress(json, ".MockUSDT"));
        tokenizer = RWATokenizer1155(vm.parseJsonAddress(json, ".RWATokenizer1155"));
        governor = OmniGovernor(payable(vm.parseJsonAddress(json, ".OmniGovernor")));
    }

    function register() external {
        _load();
        vm.broadcast();
        uint256 id = tokenizer.registerAsset(MAX_FRACTIONS, PRICE, keccak256("ipfs://depto-rosario"));
        console2.log("Asset id", id);
    }

    function buy(uint64 amount) external {
        _load();
        vm.startBroadcast();
        usdt.approve(address(tokenizer), uint256(amount) * PRICE);
        tokenizer.buyFractions(ASSET_ID, amount);
        vm.stopBroadcast();
    }

    function deposit(uint256 amount) external {
        _load();
        vm.startBroadcast();
        usdt.approve(address(tokenizer), amount);
        tokenizer.depositDividends(ASSET_ID, amount);
        vm.stopBroadcast();
    }

    function claim() external {
        _load();
        vm.broadcast();
        tokenizer.claimDividends(ASSET_ID);
    }

    function proposeCloseSale() external {
        _load();
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.broadcast();
        uint256 proposalId = governor.propose(t, v, c, CLOSE_SALE_DESC);
        console2.log("Proposal id");
        console2.log(proposalId);
    }

    function vote(uint256 proposalId, uint8 support) external {
        _load();
        vm.broadcast();
        governor.castVote(proposalId, support);
    }

    function executeCloseSale() external {
        _load();
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.broadcast();
        governor.execute(t, v, c, keccak256(bytes(CLOSE_SALE_DESC)));
    }

    // TODO(C): proposeResolution / executeResolution para la propuesta 2 (recordResolution, debe quedar Defeated).

    function _closeSaleCall() internal view returns (address[] memory t, uint256[] memory v, bytes[] memory c) {
        t = new address[](1);
        v = new uint256[](1);
        c = new bytes[](1);
        t[0] = address(tokenizer);
        c[0] = abi.encodeCall(RWATokenizer1155.setSaleActive, (ASSET_ID, false));
    }
}
