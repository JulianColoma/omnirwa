// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {
    GovernorVotesQuorumFraction
} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

/// @title OmniGovernor
/// @notice Junta de inversores de un activo: voto ponderado con snapshot, quórum 20% y mayoría calificada 2/3
/// @dev Un Governor por activo. Puede ejecutar sobre el tokenizer solo los ganchos de su activo
///      (`setSaleActive`, `recordResolution`), porque el tokenizer valida `assetGovernor[id]`
///      Permisos: proponer requiere >= 1 fracción en `clock() - 1`; votar, saldo en el snapshot;
///      ejecutar, cualquiera (una vez aprobada)
///      Solo por votación (`onlyGovernance`): `setVotingDelay`, `setVotingPeriod`, `setProposalThreshold`,
///      `updateQuorumNumerator` y `relay` (llamada arbitraria desde el Governor)
///      Sin timelock: lo aprobado se ejecuta apenas termina la votación
contract OmniGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    /// @notice Mayoría calificada, ponderada por fracciones: a favor / (a favor + en contra) >= 2/3
    uint256 public constant SUPERMAJORITY_NUMERATOR = 2;
    /// @notice Denominador de la mayoría calificada
    uint256 public constant SUPERMAJORITY_DENOMINATOR = 3;
    /// @notice Quórum: porcentaje del supply en el snapshot que debe votar a favor o abstenerse
    uint256 private constant QUORUM_PERCENT = 20;

    /// @notice La dirección del adaptador de votos es cero
    error ZeroAddress();

    /// @notice Despliega el Governor de un activo
    /// @dev `votes` se valida en el argumento de `GovernorVotes`, antes de que el constructor de
    ///      `GovernorVotesQuorumFraction` llame a `token().clock()`. Con `votingPeriod_ == 0` revierte
    ///      con `GovernorInvalidVotingPeriod`
    /// @param votes Adaptador AssetVotes del activo (no puede ser la dirección cero)
    /// @param name_ Nombre del Governor (ej. "OmniRWA Depto Rosario")
    /// @param votingPeriod_ Duración de la votación en segundos (> 0)
    constructor(IVotes votes, string memory name_, uint32 votingPeriod_)
        Governor(name_)
        GovernorSettings(0, votingPeriod_, 1) // delay 0s, período configurable, umbral: 1 fracción
        GovernorVotes(_nonZeroVotes(votes))
        GovernorVotesQuorumFraction(QUORUM_PERCENT)
    {}

    /// @dev Mayoría calificada de 2/3 exacto sobre (a favor + en contra)
    ///      Las abstenciones cuentan para el quórum pero no entran en la proporción. Un 2/3 exacto aprueba
    ///      `forVotes > 0` evita aprobar sin votos a favor (solo abstenciones, o quórum 0 por redondeo
    ///      cuando el supply es < 5). Sin overflow posible: los votos están acotados por el supply
    /// @param proposalId Id de la propuesta
    /// @return Si la votación alcanzó la mayoría requerida
    function _voteSucceeded(uint256 proposalId)
        internal
        view
        override(Governor, GovernorCountingSimple)
        returns (bool)
    {
        (uint256 againstVotes, uint256 forVotes,) = proposalVotes(proposalId);
        return
            forVotes > 0 && forVotes * SUPERMAJORITY_DENOMINATOR >= (forVotes + againstVotes) * SUPERMAJORITY_NUMERATOR;
    }

    /// @dev Valida `votes` antes de que lo use cualquier constructor base
    /// @param votes Adaptador de votos
    /// @return El mismo `votes`, si no es la dirección cero
    function _nonZeroVotes(IVotes votes) private pure returns (IVotes) {
        if (address(votes) == address(0)) revert ZeroAddress();
        return votes;
    }

    // ───────────── Overrides obligatorios por herencia múltiple ─────────────

    /// @inheritdoc Governor
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    /// @inheritdoc Governor
    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    /// @inheritdoc Governor
    function quorum(uint256 timepoint) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(timepoint);
    }

    /// @inheritdoc Governor
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}
