// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockUSDT} from "../contracts/mocks/MockUSDT.sol";
import {RWATokenizer1155} from "../contracts/RWATokenizer1155.sol";
import {AssetVotes} from "../contracts/governance/AssetVotes.sol";
import {OmniGovernor} from "../contracts/governance/OmniGovernor.sol";

/// @notice Despliega los 4 contratos, asigna roles, fondea a los inversores y vincula el Governor del activo 1.
/// @dev Uso (Sepolia, con keystore cifrado — nunca private keys en .env):
///      forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --broadcast --verify
///      Uso local (anvil, cuentas desbloqueadas):
///      forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --unlocked --sender <cuenta 0> --broadcast
///      Variables: CREATOR_ADDRESS, INVESTOR_A_ADDRESS, INVESTOR_B_ADDRESS, TOKEN_URI (ver .env.example).
///      En anvil son opcionales: por defecto se usan las cuentas 1, 2 y 3 de anvil.
///      Escribe deployments/<chainid>.json con las direcciones y el bloque inicial (lo usa el frontend
///      para leer eventos sin recorrer toda la cadena).
contract Deploy is Script {
    uint64 internal constant MAX_FRACTIONS = 1_000;
    uint128 internal constant PRICE = 10e6; // 10 USDT
    uint32 internal constant VOTING_PERIOD = 600; // 10 minutos
    uint256 internal constant FUND_AMOUNT = 10_000e6; // 10.000 USDT por inversor
    address internal constant ANVIL_CREATOR = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address internal constant ANVIL_INVESTOR_A = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    address internal constant ANVIL_INVESTOR_B = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;

    function run() external {
        // en anvil (31337) usa por defecto las cuentas 1, 2 y 3; en cualquier otra red son obligatorias
        bool local = block.chainid == 31337;
        address creator = local ? vm.envOr("CREATOR_ADDRESS", ANVIL_CREATOR) : vm.envAddress("CREATOR_ADDRESS");
        address investorA =
            local ? vm.envOr("INVESTOR_A_ADDRESS", ANVIL_INVESTOR_A) : vm.envAddress("INVESTOR_A_ADDRESS");
        address investorB =
            local ? vm.envOr("INVESTOR_B_ADDRESS", ANVIL_INVESTOR_B) : vm.envAddress("INVESTOR_B_ADDRESS");
        string memory uri = vm.envOr("TOKEN_URI", string("ipfs://omnirwa/{id}.json"));
        uint256 startBlock = block.number;

        vm.startBroadcast();
        address deployer = msg.sender;

        // 1) Token de pago y tokenizer
        MockUSDT usdt = new MockUSDT(deployer);
        RWATokenizer1155 tokenizer = new RWATokenizer1155(usdt, uri, deployer);

        // 2) Roles y fondos
        tokenizer.grantRole(tokenizer.ISSUER_ROLE(), creator);
        usdt.mint(investorA, FUND_AMOUNT);
        usdt.mint(investorB, FUND_AMOUNT);

        // 3) Gobernanza del activo 1
        //    El registro del activo lo hace el CREADOR (ISSUER_ROLE) en Demo.s.sol o desde el frontend;
        //    el Governor se puede vincular antes porque `setAssetGovernor` solo guarda la dirección.
        uint256 assetId = tokenizer.nextAssetId();
        AssetVotes votes = new AssetVotes(tokenizer, assetId);
        OmniGovernor governor = new OmniGovernor(votes, "OmniRWA Depto Rosario", VOTING_PERIOD);
        tokenizer.setAssetGovernor(assetId, address(governor));

        vm.stopBroadcast();

        console2.log("MockUSDT        ", address(usdt));
        console2.log("RWATokenizer1155", address(tokenizer));
        console2.log("AssetVotes      ", address(votes));
        console2.log("OmniGovernor    ", address(governor));

        // Guarda las direcciones para Demo.s.sol y el frontend
        string memory json = "deploy";
        vm.serializeAddress(json, "MockUSDT", address(usdt));
        vm.serializeAddress(json, "RWATokenizer1155", address(tokenizer));
        vm.serializeAddress(json, "AssetVotes", address(votes));
        vm.serializeAddress(json, "OmniGovernor", address(governor));
        vm.serializeUint(json, "assetId", assetId);
        string memory out = vm.serializeUint(json, "startBlock", startBlock);
        vm.writeJson(out, string.concat("./deployments/", vm.toString(block.chainid), ".json"));
    }
}
