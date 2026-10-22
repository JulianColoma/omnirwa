"use client";

import { useEffect, useMemo, useState } from "react";
import { useBlock, useWriteContract } from "wagmi";
import { decodeFunctionData, encodeFunctionData, keccak256, toBytes } from "viem";
import {
  abis,
  addresses,
  ASSET_ID,
  chain,
  PROPOSAL_STATES,
  ProposalState,
  txUrl,
  VoteType,
} from "@/lib/contracts";
import { describeError } from "@/lib/errors";
import { formatInt, formatRemaining, percent, shortAddress, shortHash } from "@/lib/format";
import { useAsset, useCanWrite, usePosition } from "@/lib/useAsset";
import { useProposals, type Proposal } from "@/lib/useProposals";
import { useTx } from "@/lib/useTx";
import { TxStatus } from "./TxStatus";

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
  const { asset, votingPeriod, governorLinked } = useAsset();
  const { data: proposals, isLoading, error } = useProposals();

  if (!asset) return null;

  return (
    <section className="section">
      <div className="section-head">
        <h2>Junta de inversores</h2>
        <p className="hint">
          Cada fracción es un voto, medido en el momento en que se crea la propuesta. Para aprobarse necesita quórum
          del 20% del supply y dos tercios de los votos a favor
          {votingPeriod !== undefined && <> · la votación dura {formatRemaining(Number(votingPeriod))}</>}.
        </p>
        {governorLinked === false && (
          <p className="hint status-error">
            Este Governor no está vinculado al activo: las propuestas no podrán ejecutarse sobre el tokenizer.
          </p>
        )}
      </div>

      <NewProposal saleActive={asset.saleActive} />

      {error && <p className="status status-error">No se pudieron leer las propuestas: {describeError(error)}</p>}
      {isLoading && <p className="hint">Buscando propuestas…</p>}
      {proposals && proposals.length === 0 && <p className="empty">Todavía no hay propuestas.</p>}
      <ol className="proposals">
        {proposals?.map((p) => <ProposalItem key={p.id.toString()} proposal={p} />)}
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
    if (call.functionName === "recordResolution") return `Registrar la resolución ${shortHash(call.args[1])}`;
    return call.functionName;
  } catch {
    return "Llamada al tokenizer";
  }
}

function ProposalItem({ proposal: p }: { proposal: Proposal }) {
  const now = useChainNow();
  const { canWrite, gate } = useCanWrite();
  const { writeContractAsync } = useWriteContract();
  const tx = useTx();

  const [title, ...rest] = p.description.split("\n");
  const body = rest.join("\n").trim();
  const cast = p.forVotes + p.against;
  const participation = p.forVotes + p.abstain;
  const remaining = Number(p.deadline) - now;
  const active = p.state === ProposalState.Active;
  const canVote = active && p.hasVoted === false && (p.votingPower ?? 0n) > 0n;
  const createdUrl = txUrl(p.txHash);

  const vote = (support: number, label: string) =>
    tx.run((step) =>
      step(`voto ${label}`, () =>
        writeContractAsync({
          address: addresses.governor!,
          abi: abis.governor,
          functionName: "castVote",
          args: [p.id, support],
        }),
      ),
    );

  const execute = () =>
    tx.run((step) =>
      step("ejecución de la propuesta", () =>
        writeContractAsync({
          address: addresses.governor!,
          abi: abis.governor,
          functionName: "execute",
          args: [p.targets, p.values, p.calldatas, p.descriptionHash],
        }),
      ),
    );

  return (
    <li className="proposal">
      <div className="proposal-head">
        <h3>{title}</h3>
        <span className={`tag tag-state-${p.state}`}>{PROPOSAL_STATES[p.state] ?? "Desconocido"}</span>
      </div>
      {body && <p className="proposal-body">{body}</p>}
      <p className="meta">
        {describeAction(p)} · propuesta por <span className="mono">{shortAddress(p.proposer)}</span>
        {createdUrl && (
          <>
            {" "}
            ·{" "}
            <a href={createdUrl} target="_blank" rel="noreferrer">
              ver tx
            </a>
          </>
        )}
        {active && remaining > 0 && <> · cierra en {formatRemaining(remaining)}</>}
        {active && remaining <= 0 && <> · cerrando…</>}
      </p>

      <div className="votes">
        <VoteRow label="A favor" value={p.forVotes} total={cast + p.abstain} />
        <VoteRow label="En contra" value={p.against} total={cast + p.abstain} />
        <VoteRow label="Abstención" value={p.abstain} total={cast + p.abstain} />
      </div>
      <p className="meta">
        Mayoría: {percent(p.forVotes, cast)}% a favor de {formatInt(cast)} votos (necesita 66,7%)
        {p.quorum !== undefined && (
          <>
            {" "}
            · quórum {formatInt(participation)} / {formatInt(p.quorum)}
          </>
        )}
      </p>

      {active && (
        <div className="actions">
          {p.hasVoted ? (
            <p className="hint">Ya votaste esta propuesta.</p>
          ) : p.votingPower === 0n ? (
            <p className="hint">No tenías fracciones cuando se creó esta propuesta, así que no podés votarla.</p>
          ) : (
            <>
              <span className="hint">
                Tu voto pesa {p.votingPower !== undefined ? formatInt(p.votingPower) : "—"} fracciones
              </span>
              <div className="button-row">
                <button className="button-small" disabled={!canWrite || !canVote || tx.busy} onClick={() => vote(VoteType.For, "a favor")}>
                  A favor
                </button>
                <button className="button-small button-ghost" disabled={!canWrite || !canVote || tx.busy} onClick={() => vote(VoteType.Against, "en contra")}>
                  En contra
                </button>
                <button className="button-small button-ghost" disabled={!canWrite || !canVote || tx.busy} onClick={() => vote(VoteType.Abstain, "abstención")}>
                  Abstención
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {p.state === ProposalState.Succeeded && (
        <div className="actions">
          <span className="hint">Aprobada. Cualquiera puede ejecutarla.</span>
          <button className="button-small" disabled={!canWrite || tx.busy} onClick={execute}>
            Ejecutar
          </button>
        </div>
      )}

      {(active || p.state === ProposalState.Succeeded) && gate && <p className="hint">{gate}</p>}
      <TxStatus state={tx.state} />
    </li>
  );
}

function VoteRow({ label, value, total }: { label: string; value: bigint; total: bigint }) {
  const width = total === 0n ? 0 : Number((value * 1000n) / total) / 10;
  return (
    <div className="vote-row">
      <span>{label}</span>
      <div className="vote-track">
        <div className="vote-fill" style={{ width: `${width}%` }} />
      </div>
      <span className="num">{formatInt(value)}</span>
    </div>
  );
}

type Kind = "sale" | "resolution";

function NewProposal({ saleActive }: { saleActive: boolean }) {
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
      <div className="new-proposal-toggle">
        <button className="button-small button-ghost" onClick={() => setOpen(true)}>
          Nueva propuesta
        </button>
      </div>
    );
  }

  const submit = () =>
    tx.run(async (step) => {
      const calldata =
        kind === "sale"
          ? encodeFunctionData({ abi: abis.tokenizer, functionName: "setSaleActive", args: [ASSET_ID, !saleActive] })
          : encodeFunctionData({
              abi: abis.tokenizer,
              functionName: "recordResolution",
              args: [ASSET_ID, keccak256(toBytes(text.trim()))],
            });
      const description = kind === "resolution" ? `${title.trim()}\n${text.trim()}` : title.trim();
      await step("creación de la propuesta", () =>
        writeContractAsync({
          address: addresses.governor!,
          abi: abis.governor,
          functionName: "propose",
          args: [[addresses.tokenizer!], [0n], [calldata], description],
        }),
      );
      setTitle("");
      setText("");
    });

  return (
    <div className="new-proposal">
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
          ? `Si se aprueba, el Governor llama a setSaleActive(${ASSET_ID}, ${!saleActive}) en el tokenizer.`
          : "Para decisiones que se ejecutan fuera de la cadena (vender el activo, contratar una obra). Si se aprueba, queda registrado on-chain el hash del texto."}
      </p>
      <label className="field">
        <span>Título</span>
        <input
          placeholder={kind === "sale" ? `${saleLabel} del activo` : "Vender el departamento a 120.000 USDT"}
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
        <button className="button-small" disabled={!canWrite || !hasFractions || !valid || tx.busy} onClick={submit}>
          Proponer
        </button>
        <button className="link-button" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
      {canWrite && !hasFractions && <p className="hint">Necesitás al menos una fracción para proponer.</p>}
      {gate && <p className="hint">{gate}</p>}
      <TxStatus state={tx.state} />
    </div>
  );
}
