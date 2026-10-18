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
/// @notice Junta de inversores de UN activo: voto ponderado con snapshot, quórum 20% y mayoría calificada 2/3.
/// @dev Un Governor por activo (D7). Puede ejecutar sobre el tokenizer solo los ganchos de su activo
///      (`setSaleActive`, `recordResolution`), porque el tokenizer valida `assetGovernor[id]`.
///      Permisos: proponer requiere >= 1 fracción en el snapshot; votar, saldo en el snapshot;
///      ejecutar, cualquiera (una vez aprobada). Los parámetros solo cambian por votación (onlyGovernance).
///
///      ESTADO: ESQUELETO. `_voteSucceeded` (TODO(B)) todavía usa mayoría simple.
contract OmniGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    /// @notice Proporción mínima de votos a favor sobre (a favor + en contra), en puntos básicos (2/3).
    uint256 public constant SUPERMAJORITY_BPS = 6_667;
    /// @notice Denominador de los puntos básicos.
    uint256 private constant BPS = 10_000;
    /// @notice Quórum: porcentaje del supply en el snapshot que debe votar a favor o abstenerse.
    uint256 private constant QUORUM_PERCENT = 20;

    /// @notice Despliega el Governor de un activo.
    /// @param votes Adaptador AssetVotes del activo.
    /// @param name_ Nombre del Governor (ej. "OmniRWA Depto Rosario").
    /// @param votingPeriod_ Duración de la votación en segundos.
    constructor(IVotes votes, string memory name_, uint32 votingPeriod_)
        Governor(name_)
        GovernorSettings(0, votingPeriod_, 1) // delay 0 s (D9), período configurable, umbral: 1 fracción
        GovernorVotes(votes)
        GovernorVotesQuorumFraction(QUORUM_PERCENT)
    {}

    /// @dev Mayoría calificada de 2/3 sobre (a favor + en contra) (D6).
    /// @param proposalId Id de la propuesta.
    /// @return Si la votación alcanzó la mayoría requerida.
    function _voteSucceeded(uint256 proposalId)
        internal
        view
        override(Governor, GovernorCountingSimple)
        returns (bool)
    {
        // TODO(B): forVotes > 0 && forVotes * BPS >= (forVotes + againstVotes) * SUPERMAJORITY_BPS.
        return super._voteSucceeded(proposalId);
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
