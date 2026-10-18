"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { abis, addresses } from "@/lib/contracts";

/** Estados del Governor de OpenZeppelin (enum ProposalState). */
const STATES = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];

/**
 * Votación sobre una propuesta existente (por id).
 * TODO(C): listar propuestas leyendo eventos ProposalCreated (getLogs), crear propuestas desde la UI
 *          y botón "Ejecutar" con los mismos targets/values/calldatas/descriptionHash.
 */
export function Governance() {
  const { isConnected } = useAccount();
  const [proposalId, setProposalId] = useState("");
  const id = proposalId ? BigInt(proposalId) : undefined;

  const { data: state } = useReadContract({
    address: addresses.governor,
    abi: abis.governor,
    functionName: "state",
    args: [id!],
    query: { enabled: !!addresses.governor && id !== undefined },
  });

  const { data: votes } = useReadContract({
    address: addresses.governor,
    abi: abis.governor,
    functionName: "proposalVotes",
    args: [id!],
    query: { enabled: !!addresses.governor && id !== undefined },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const vote = (support: number) =>
    writeContract({
      address: addresses.governor!,
      abi: abis.governor,
      functionName: "castVote",
      args: [id!, support],
    });

  const v = votes as readonly [bigint, bigint, bigint] | undefined;

  return (
    <section className="card">
      <h2>Junta de inversores</h2>
      <div className="row">
        <input placeholder="proposalId" value={proposalId} onChange={(e) => setProposalId(e.target.value)} />
        <span className="muted">Estado: {state !== undefined ? STATES[Number(state)] : "—"}</span>
      </div>
      {v && (
        <p className="muted">
          En contra: {v[0].toString()} · A favor: {v[1].toString()} · Abstención: {v[2].toString()}
        </p>
      )}
      <div className="row">
        <button disabled={!isConnected || !id || isPending} onClick={() => vote(1)}>
          A favor
        </button>
        <button disabled={!isConnected || !id || isPending} onClick={() => vote(0)}>
          En contra
        </button>
        <button disabled={!isConnected || !id || isPending} onClick={() => vote(2)}>
          Abstención
        </button>
      </div>
      {hash && <p className="muted">Tx: {hash}</p>}
      {error && <p className="muted">Error: {error.message.split("\n")[0]}</p>}
    </section>
  );
}
