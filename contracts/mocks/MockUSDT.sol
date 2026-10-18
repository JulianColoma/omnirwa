// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockUSDT
/// @notice Stablecoin de prueba (6 decimales) usada para pagar fracciones y repartir dividendos en testnet.
/// @dev Roles: solo el `owner` (quien despliega) puede mintear. NO usar en producción.
contract MockUSDT is ERC20, Ownable {
    /// @notice Cantidad de decimales del token (igual que USDT/USDC).
    uint8 private constant DECIMALS = 6;

    /// @notice Despliega el token y asigna el ownership.
    /// @param initialOwner Cuenta que podrá mintear.
    constructor(address initialOwner) ERC20("Mock USDT", "mUSDT") Ownable(initialOwner) {}

    /// @notice Mintea `amount` unidades (con 6 decimales) a `to`.
    /// @dev Solo el owner. Se usa para fondear las billeteras de la demo.
    /// @param to Destinatario.
    /// @param amount Cantidad en unidades mínimas (1 USDT = 1e6).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Decimales del token.
    /// @return Siempre 6.
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
}
