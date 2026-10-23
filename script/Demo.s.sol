// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockUSDT} from "../contracts/mocks/MockUSDT.sol";
import {RWATokenizer1155} from "../contracts/RWATokenizer1155.sol";
import {OmniGovernor} from "../contracts/governance/OmniGovernor.sol";

/// @notice Ejecuta el flujo principal de la demo on-chain, en pasos separados (cada uno firmado por su actor).
/// @dev Lee las direcciones de deployments/<chainid>.json. Orden del guion (plan §8):
///      forge script script/Demo.s.sol --sig "register()"              --rpc-url sepolia --account creator   --broadcast
///      forge script script/Demo.s.sol --sig "buy(uint64)" 500         --rpc-url sepolia --account investorA --broadcast
///      forge script script/Demo.s.sol --sig "buy(uint64)" 300         --rpc-url sepolia --account investorB --broadcast
///      forge script script/Demo.s.sol --sig "proposeCloseSale()"      --rpc-url sepolia --account investorA --broadcast
///      forge script script/Demo.s.sol --sig "proposeResolution()"     --rpc-url sepolia --account investorA --broadcast
///      forge script script/Demo.s.sol --sig "voteCloseSale(uint8)" 1  --rpc-url sepolia --account investorA --broadcast
///      forge script script/Demo.s.sol --sig "voteCloseSale(uint8)" 1  --rpc-url sepolia --account investorB --broadcast
///      forge script script/Demo.s.sol --sig "voteResolution(uint8)" 1 --rpc-url sepolia --account investorA --broadcast
///      forge script script/Demo.s.sol --sig "voteResolution(uint8)" 0 --rpc-url sepolia --account investorB --broadcast
///      forge script script/Demo.s.sol --sig "deposit(uint256)" 800000000 --rpc-url sepolia --account creator --broadcast
///      forge script script/Demo.s.sol --sig "claim()"                 --rpc-url sepolia --account investorA --broadcast
///      forge script script/Demo.s.sol --sig "claim()"                 --rpc-url sepolia --account investorB --broadcast
///      (esperar el fin de la votación: 10 minutos)
///      forge script script/Demo.s.sol --sig "executeCloseSale()"      --rpc-url sepolia --account investorA --broadcast
///      forge script script/Demo.s.sol --sig "status()"                --rpc-url sepolia
///      Soporte: 0 = en contra, 1 = a favor, 2 = abstención. Guardar el hash de cada transacción para el README.
contract Demo is Script {
    uint256 internal constant ASSET_ID = 1;
    uint64 internal constant MAX_FRACTIONS = 1_000;
    uint128 internal constant PRICE = 10e6;
    bytes32 internal constant DOC_HASH = keccak256("ipfs://depto-rosario");
    string internal constant CLOSE_SALE_DESC = "Propuesta 1: cerrar la venta del Depto Rosario";
    string internal constant RESOLUTION_DESC = "Propuesta 2: vender el Depto Rosario a 120.000 USDT";
    bytes32 internal constant RESOLUTION_HASH = keccak256("ipfs://acta-venta-depto-rosario-120000");

    MockUSDT internal usdt;
    RWATokenizer1155 internal tokenizer;
    OmniGovernor internal governor;

    function _load() internal {
        // forge-lint: disable-next-line(unsafe-cheatcode)
        string memory json = vm.readFile(string.concat("./deployments/", vm.toString(block.chainid), ".json"));
        usdt = MockUSDT(vm.parseJsonAddress(json, ".MockUSDT"));
        tokenizer = RWATokenizer1155(vm.parseJsonAddress(json, ".RWATokenizer1155"));
        governor = OmniGovernor(payable(vm.parseJsonAddress(json, ".OmniGovernor")));
    }

    // ─────────────────────────────── Tokenizer ───────────────────────────────

    function register() external {
        _load();
        vm.broadcast();
        uint256 id = tokenizer.registerAsset(MAX_FRACTIONS, PRICE, DOC_HASH);
        console2.log("Asset id", id);
    }

    function buy(uint64 amount) external {
        _load();
        (,,, uint128 price,,) = tokenizer.assets(ASSET_ID);
        vm.startBroadcast();
        usdt.approve(address(tokenizer), uint256(amount) * price);
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

    // ─────────────────────────────── Gobernanza ───────────────────────────────

    function proposeCloseSale() external {
        _load();
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.broadcast();
        uint256 proposalId = governor.propose(t, v, c, CLOSE_SALE_DESC);
        console2.log("Proposal id", proposalId);
    }

    function proposeResolution() external {
        _load();
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _resolutionCall();
        vm.broadcast();
        uint256 proposalId = governor.propose(t, v, c, RESOLUTION_DESC);
        console2.log("Proposal id", proposalId);
    }

    function vote(uint256 proposalId, uint8 support) external {
        _load();
        vm.broadcast();
        governor.castVote(proposalId, support);
    }

    function voteCloseSale(uint8 support) external {
        _load();
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        uint256 proposalId = governor.hashProposal(t, v, c, keccak256(bytes(CLOSE_SALE_DESC)));
        vm.broadcast();
        governor.castVote(proposalId, support);
    }

    function voteResolution(uint8 support) external {
        _load();
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _resolutionCall();
        uint256 proposalId = governor.hashProposal(t, v, c, keccak256(bytes(RESOLUTION_DESC)));
        vm.broadcast();
        governor.castVote(proposalId, support);
    }

    function executeCloseSale() external {
        _load();
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        vm.broadcast();
        governor.execute(t, v, c, keccak256(bytes(CLOSE_SALE_DESC)));
    }

    // ─────────────────────────────── Lectura ───────────────────────────────

    /// @dev Imprime el estado del activo y de las dos propuestas de la demo (no envía transacciones).
    function status() external {
        _load();
        (address creator, uint64 maxFractions, bool saleActive, uint128 price, uint64 sold,) =
            tokenizer.assets(ASSET_ID);
        console2.log("Creator          ", creator);
        console2.log("Sold / max       ", sold, maxFractions);
        console2.log("Price (USDT 1e6) ", price);
        console2.log("Sale active      ", saleActive);

        (address[] memory t, uint256[] memory v, bytes[] memory c) = _closeSaleCall();
        _logProposal("Proposal 1", governor.hashProposal(t, v, c, keccak256(bytes(CLOSE_SALE_DESC))));
        (t, v, c) = _resolutionCall();
        _logProposal("Proposal 2", governor.hashProposal(t, v, c, keccak256(bytes(RESOLUTION_DESC))));
    }

    function _logProposal(string memory label, uint256 proposalId) internal view {
        if (governor.proposalSnapshot(proposalId) == 0) {
            console2.log(label, "not created");
            return;
        }
        (uint256 against, uint256 forVotes, uint256 abstain) = governor.proposalVotes(proposalId);
        console2.log(label, "state", uint8(governor.state(proposalId)));
        console2.log("  for / against / abstain", forVotes, against, abstain);
    }

    function _closeSaleCall() internal view returns (address[] memory t, uint256[] memory v, bytes[] memory c) {
        (t, v, c) = _singleCall(abi.encodeCall(RWATokenizer1155.setSaleActive, (ASSET_ID, false)));
    }

    function _resolutionCall() internal view returns (address[] memory t, uint256[] memory v, bytes[] memory c) {
        (t, v, c) = _singleCall(abi.encodeCall(RWATokenizer1155.recordResolution, (ASSET_ID, RESOLUTION_HASH)));
    }

    function _singleCall(bytes memory data)
        internal
        view
        returns (address[] memory t, uint256[] memory v, bytes[] memory c)
    {
        t = new address[](1);
        v = new uint256[](1);
        c = new bytes[](1);
        t[0] = address(tokenizer);
        c[0] = data;
    }
}
