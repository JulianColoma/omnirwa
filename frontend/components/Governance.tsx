"use client";

import { useEffect, useMemo, useState } from "react";
import { useBlock, useWriteContract } from "wagmi";
import { decodeFunctionData, encodeFunctionData, keccak256, toBytes, type Address } from "viem";
import {
  abis,
  addresses,
  addressUrl,
  chain,
  PROPOSAL_STATES,
  ProposalState,
  txUrl,
  VoteType,
} from "@/lib/contracts";
import { describeError } from "@/lib/errors";
import { formatInt, formatRemaining, shortAddress } from "@/lib/format";
import { useAsset, useCanWrite, usePosition } from "@/lib/useAsset";
import { useProposals, type Proposal } from "@/lib/useProposals";
import { useTx } from "@/lib/useTx";
import { TxStatus } from "./TxStatus";
import { AddressChip, Badge, VoteTally, type BadgeTone } from "./ui";

/**
 * Hora de la cadena que avanza cada segundo, para las cuentas regresivas. Se ancla al timestamp del último
 * bloque: los plazos del Governor se miden con `block.timestamp`, no con el reloj de la máquina.
 */
function useChainNow() {
  const { data: block } = useBlock({ chainId: chain.id });
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);
  const offset = useMemo(
    () => (block ? Number(block.timestamp) - Math.floor(Date.now() / 1000) : 0),
    [block],
  );
  return now + offset;
}

/** Junta de inversores: reglas, propuestas existentes y formulario para crear una nueva. */
export function Governance() {
  const { assetId, asset, governor, linkedGovernor, governorStatus, votingPeriod } = useAsset();
  const { data: proposals, isLoading, error } = useProposals(governor);

  if (!asset || assetId === undefined) return null;

  if (!governor) {
    return (
      <section className="section">
        <div className="section-head">
          <h2>Junta de inversores</h2>
          {governorStatus === "none" && (
            <p className="hint">
              Este activo todavía no tiene junta. La despliega y vincula el administrador de la plataforma.
            </p>
          )}
          {governorStatus === "invalid" && (
            <p className="hint status-error">
              La dirección vinculada como junta ({linkedGovernor && shortAddress(linkedGovernor)}) no es un OmniGovernor
              de este activo: sus propuestas no se muestran.
            </p>
          )}
          {governorStatus === "checking" && <p className="hint">Verificando la junta…</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2>Junta de inversores</h2>
        <p className="hint">
          Cada fracción es un voto, medido cuando se crea la propuesta. Se aprueba con 2/3 a favor y al menos 20 % de
          participación
          {votingPeriod !== undefined && <>. La votación dura {formatRemaining(Number(votingPeriod))}</>}.
        </p>
      </div>

      <NewProposal assetId={assetId} governor={governor} saleActive={asset.saleActive} />

      {error && <p className="status status-error">No se pudieron leer las propuestas: {describeError(error)}</p>}
      {isLoading && <p className="hint">Buscando propuestas…</p>}
      {proposals && proposals.length === 0 && <p className="empty">Todavía no hay propuestas.</p>}
      <ol className="proposals">
        {proposals?.map((p) => <ProposalItem key={p.id.toString()} governor={governor} proposal={p} />)}
      </ol>
    </section>
  );
}

function describeAction(p: Proposal): string {
  if (p.targets.length !== 1) return `${p.targets.length} llamadas`;
  const target = p.targets[0];
  if (target.toLowerCase() !== addresses.tokenizer?.toLowerCase()) return `Llamada a ${shortAddress(target)}`;
  try {
    const call = decodeFunctionData({ abi: abis.tokenizer, data: p.calldatas[0] });
    if (call.functionName === "setSaleActive") return call.args[1] ? "Abrir la venta" : "Cerrar la venta";
    if (call.functionName === "recordResolution") return `Registrar la resolución ${shortAddress(call.args[1])}`;
    return call.functionName;
  } catch {
    return "Llamada al tokenizer";
  }
}

const STATE_TONES: Record<number, BadgeTone> = {
  [ProposalState.Active]: "warning",
  [ProposalState.Succeeded]: "positive",
  [ProposalState.Executed]: "positive",
  [ProposalState.Defeated]: "danger",
};

function ProposalItem({ governor, proposal: p }: { governor: Address; proposal: Proposal }) {
  const now = useChainNow();
  const { canWrite, gate } = useCanWrite();
  const { writeContractAsync } = useWriteContract();
  const tx = useTx();

  const [title, ...rest] = p.description.split("\n");
  const body = rest.join("\n").trim();
  const remaining = Number(p.deadline) - now;
  const active = p.state === ProposalState.Active;
  const canVote = active && p.hasVoted === false && (p.votingPower ?? 0n) > 0n;
  const closing = active ? (remaining > 0 ? `Cierra en ${formatRemaining(remaining)}` : "Cerrando…") : undefined;

  const vote = (support: number, label: string) =>
    tx.run((step) =>
      step(`voto ${label}`, (fees) =>
        writeContractAsync({
          ...fees,
          address: governor,
          abi: abis.governor,
          functionName: "castVote",
          args: [p.id, support],
        }),
      ),
    );

  const execute = () =>
    tx.run((step) =>
      step("ejecución de la propuesta", (fees) =>
        writeContractAsync({
          ...fees,
          address: governor,
          abi: abis.governor,
          functionName: "execute",
          args: [p.targets, p.values, p.calldatas, p.descriptionHash],
        }),
      ),
    );

  return (
    <li className="orwa-card">
      <div className="proposal-head">
        <div>
          <h3 className="orwa-card__title">{title}</h3>
          <p className="meta">
            {describeAction(p)} · propone <AddressChip value={p.proposer} href={addressUrl(p.proposer)} />
            <AddressChip value={p.txHash} href={txUrl(p.txHash)} label="tx" />
          </p>
        </div>
        <Badge tone={STATE_TONES[p.state] ?? "plain"}>{PROPOSAL_STATES[p.state] ?? "Desconocido"}</Badge>
      </div>
      {body && <p className="proposal-body">{body}</p>}

      <VoteTally
        forVotes={p.forVotes}
        against={p.against}
        abstain={p.abstain}
        quorum={p.quorum}
        supply={p.supply}
        closing={closing}
      />

      {active && (
        <div className="actions">
          {p.hasVoted ? (
            <p className="hint">Ya votaste esta propuesta.</p>
          ) : p.votingPower === 0n ? (
            <p className="hint">No tenías fracciones cuando se creó esta propuesta, así que no podés votarla.</p>
          ) : (
            <>
              <span className="hint">
                Tu voto pesa{" "}
                <span className="num">{p.votingPower !== undefined ? formatInt(p.votingPower) : "—"}</span> fracciones
              </span>
              <div className="button-row">
                <button
                  className="orwa-btn orwa-btn--secondary orwa-btn--sm"
                  disabled={!canWrite || !canVote || tx.busy}
                  onClick={() => vote(VoteType.For, "a favor")}
                >
                  Votar a favor
                </button>
                <button
                  className="orwa-btn orwa-btn--secondary orwa-btn--sm"
                  disabled={!canWrite || !canVote || tx.busy}
                  onClick={() => vote(VoteType.Against, "en contra")}
                >
                  Votar en contra
                </button>
                <button
                  className="orwa-btn orwa-btn--ghost orwa-btn--sm"
                  disabled={!canWrite || !canVote || tx.busy}
                  onClick={() => vote(VoteType.Abstain, "abstención")}
                >
                  Abstenerme
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {p.state === ProposalState.Succeeded && (
        <div className="actions">
          <span className="hint">Aprobada. Cualquiera puede ejecutarla.</span>
          <button className="orwa-btn orwa-btn--secondary orwa-btn--sm" disabled={!canWrite || tx.busy} onClick={execute}>
            Ejecutar propuesta
          </button>
        </div>
      )}

      {(active || p.state === ProposalState.Succeeded) && gate && <p className="hint">{gate}</p>}
      <TxStatus state={tx.state} />
    </li>
  );
}

type Kind = "sale" | "resolution";

function NewProposal({ assetId, governor, saleActive }: { assetId: bigint; governor: Address; saleActive: boolean }) {
  const { fractions } = usePosition();
  const { canWrite, gate } = useCanWrite();
  const { writeContractAsync } = useWriteContract();
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("sale");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  const hasFractions = fractions !== undefined && fractions > 0n;
  const saleLabel = saleActive ? "Cerrar la venta" : "Reabrir la venta";
  const valid = title.trim() !== "" && (kind === "sale" || text.trim() !== "");

  if (!open) {
    return (
      <div>
        <button className="orwa-btn orwa-btn--secondary" onClick={() => setOpen(true)}>
          Nueva propuesta
        </button>
      </div>
    );
  }

  const submit = () =>
    tx.run(async (step) => {
      const calldata =
        kind === "sale"
          ? encodeFunctionData({ abi: abis.tokenizer, functionName: "setSaleActive", args: [assetId, !saleActive] })
          : encodeFunctionData({
              abi: abis.tokenizer,
              functionName: "recordResolution",
              args: [assetId, keccak256(toBytes(text.trim()))],
            });
      const description = kind === "resolution" ? `${title.trim()}\n${text.trim()}` : title.trim();
      await step("creación de la propuesta", (fees) =>
        writeContractAsync({
          ...fees,
          address: governor,
          abi: abis.governor,
          functionName: "propose",
          args: [[addresses.tokenizer!], [0n], [calldata], description],
        }),
      );
      setTitle("");
      setText("");
    });

  return (
    <div className="orwa-card">
      <h3 className="orwa-card__title">Nueva propuesta</h3>
      <div className="segmented" role="radiogroup">
        <button role="radio" aria-checked={kind === "sale"} className={kind === "sale" ? "active" : ""} onClick={() => setKind("sale")}>
          {saleLabel}
        </button>
        <button
          role="radio"
          aria-checked={kind === "resolution"}
          className={kind === "resolution" ? "active" : ""}
          onClick={() => setKind("resolution")}
        >
          Resolución
        </button>
      </div>
      <p className="hint">
        {kind === "sale"
          ? `Si se aprueba, la junta llama a setSaleActive(${assetId}, ${!saleActive}) en el tokenizer.`
          : "Para decisiones que se ejecutan fuera de la cadena (vender el activo, contratar una obra). Si se aprueba, queda registrado on-chain el hash del texto."}
      </p>
      <label className="field">
        <span>Título</span>
        <input
          placeholder={kind === "sale" ? `${saleLabel} del activo` : "Vender el activo a 120.000 USDT"}
          value={title}
          onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
        />
      </label>
      {kind === "resolution" && (
        <label className="field">
          <span>Texto de la resolución</span>
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
      )}
      <div className="button-row">
        <button
          className="orwa-btn orwa-btn--secondary"
          disabled={!canWrite || !hasFractions || !valid || tx.busy}
          onClick={submit}
        >
          Proponer
        </button>
        <button className="orwa-btn orwa-btn--ghost" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
      {canWrite && !hasFractions && <p className="hint">Necesitás al menos una fracción para proponer.</p>}
      {gate && <p className="hint">{gate}</p>}
      <TxStatus state={tx.state} />
    </div>
  );
}
