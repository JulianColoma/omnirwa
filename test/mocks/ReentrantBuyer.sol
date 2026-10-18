// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RWATokenizer1155} from "../../contracts/RWATokenizer1155.sol";

/// @title ReentrantBuyer
/// @notice Atacante de prueba: al recibir fracciones intenta volver a llamar a `buyFractions`.
/// @dev El test espera que la compra revierta con `ReentrancyGuardReentrantCall`.
contract ReentrantBuyer is ERC1155Holder {
    RWATokenizer1155 public immutable tokenizer;
    uint256 public immutable assetId;
    bool private _attacked;

    constructor(RWATokenizer1155 tokenizer_, uint256 assetId_) {
        tokenizer = tokenizer_;
        assetId = assetId_;
    }

    function attack(uint64 amount) external {
        IERC20(address(tokenizer.paymentToken())).approve(address(tokenizer), type(uint256).max);
        tokenizer.buyFractions(assetId, amount);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes memory) public override returns (bytes4) {
        if (!_attacked) {
            _attacked = true;
            tokenizer.buyFractions(assetId, 1); // reentrada
        }
        return this.onERC1155Received.selector;
    }
}
