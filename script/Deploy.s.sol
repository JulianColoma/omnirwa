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
///      Variables: CREATOR_ADDRESS, INVESTOR_A_ADDRESS, INVESTOR_B_ADDRESS, TOKEN_URI (ver .env.example).
contract Deploy is Script {
    uint64 internal constant MAX_FRACTIONS = 1_000;
    uint128 internal constant PRICE = 10e6; // 10 USDT
    uint32 internal constant VOTING_PERIOD = 600; // 10 minutos
    uint256 internal constant FUND_AMOUNT = 10_000e6; // 10.000 USDT por inversor

    function run() external {
        address creator = vm.envAddress("CREATOR_ADDRESS");
        address investorA = vm.envAddress("INVESTOR_A_ADDRESS");
        address investorB = vm.envAddress("INVESTOR_B_ADDRESS");
        string memory uri = vm.envOr("TOKEN_URI", string("ipfs://omnirwa/{id}.json"));

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
        string memory out = vm.serializeAddress(json, "OmniGovernor", address(governor));
        vm.writeJson(out, string.concat("./deployments/", vm.toString(block.chainid), ".json"));
    }
}
