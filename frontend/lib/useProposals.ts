"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { keccak256, toBytes, type Address, type Hash, type Hex } from "viem";
import { abis, chain, ProposalState, START_BLOCK } from "./contracts";

export type Proposal = {
  id: bigint;
  proposer: Address;
  targets: readonly Address[];
  values: readonly bigint[];
  calldatas: readonly Hex[];
  description: string;
  descriptionHash: Hash;
  snapshot: bigint;
  deadline: bigint;
  txHash: Hash;
  state: number;
  against: bigint;
  forVotes: bigint;
  abstain: bigint;
  quorum: bigint | undefined;
  /** Fracciones emitidas en el snapshot (base de la participación). */
  supply: bigint | undefined;
  /** Solo si hay una cuenta conectada. */
  hasVoted: boolean | undefined;
  /** Poder de voto de la cuenta conectada en el snapshot (undefined mientras está Pendiente). */
  votingPower: bigint | undefined;
};

/**
 * Pide los logs de [from, to]; si el RPC rechaza el rango (límite de bloques o de resultados),
 * lo parte a la mitad y reintenta.
 */
export async function getLogsChunked<T>(
  fetch: (from: bigint, to: bigint) => Promise<T[]>,
  from: bigint,
  to: bigint,
): Promise<T[]> {
  try {
    return await fetch(from, to);
  } catch (error) {
    if (to <= from) throw error;
    const mid = (from + to) / 2n;
    const left = await getLogsChunked(fetch, from, mid);
    const right = await getLogsChunked(fetch, mid + 1n, to);
    return [...left, ...right];
  }
}

/** Propuestas de `governor` (eventos ProposalCreated) con su estado y votos actuales. */
export function useProposals(governor: Address | undefined) {
  const client = usePublicClient({ chainId: chain.id });
  const { address } = useAccount();

  return useQuery({
    queryKey: ["proposals", governor, address],
    enabled: Boolean(client && governor),
    queryFn: async (): Promise<Proposal[]> => {
      if (!client || !governor) return [];
      const latest = await client.getBlockNumber();
      const logs = await getLogsChunked(
        (fromBlock, toBlock) =>
          client.getContractEvents({
            address: governor,
            abi: abis.governor,
            eventName: "ProposalCreated",
            fromBlock,
            toBlock,
          }),
        START_BLOCK,
        latest,
      );
      const [clock, votes] = await Promise.all([
        client.readContract({ address: governor, abi: abis.governor, functionName: "clock" }),
        client.readContract({ address: governor, abi: abis.governor, functionName: "token" }),
      ]);

      const proposals = await Promise.all(
        logs.map(async (log): Promise<Proposal> => {
          const { proposalId, proposer, targets, values, calldatas, voteStart, voteEnd, description } = log.args;
          const id = proposalId!;
          const read = { address: governor, abi: abis.governor } as const;
          const started = voteStart! < BigInt(clock);

          const [state, tally, quorum, supply, hasVoted, votingPower] = await Promise.all([
            client.readContract({ ...read, functionName: "state", args: [id] }),
            client.readContract({ ...read, functionName: "proposalVotes", args: [id] }),
            started ? client.readContract({ ...read, functionName: "quorum", args: [voteStart!] }) : undefined,
            started
              ? client.readContract({
                  address: votes,
                  abi: abis.votes,
                  functionName: "getPastTotalSupply",
                  args: [voteStart!],
                })
              : undefined,
            address ? client.readContract({ ...read, functionName: "hasVoted", args: [id, address] }) : undefined,
            address && started
              ? client.readContract({ ...read, functionName: "getVotes", args: [address, voteStart!] })
              : undefined,
          ]);

          return {
            id,
            proposer: proposer!,
            targets: targets!,
            values: values!,
            calldatas: calldatas!,
            description: description!,
            descriptionHash: keccak256(toBytes(description!)),
            snapshot: voteStart!,
            deadline: voteEnd!,
            txHash: log.transactionHash,
            state,
            against: tally[0],
            forVotes: tally[1],
            abstain: tally[2],
            quorum,
            supply,
            hasVoted,
            votingPower,
          };
        }),
      );

      return proposals.reverse();
    },
  });
}

/** Si una propuesta se puede votar desde la UI. */
export function isOpen(p: Proposal): boolean {
  return p.state === ProposalState.Active;
}
