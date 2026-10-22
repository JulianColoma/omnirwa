"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { Address, Hash } from "viem";
import { abis, addresses, ASSET_ID, chain, START_BLOCK } from "./contracts";
import { getLogsChunked } from "./useProposals";

export type ActivityItem =
  | { kind: "registered"; account: Address; amount: bigint; price: bigint }
  | { kind: "purchase"; account: Address; amount: bigint; cost: bigint }
  | { kind: "deposit"; amount: bigint }
  | { kind: "claim"; account: Address; amount: bigint }
  | { kind: "sale"; active: boolean }
  | { kind: "resolution"; hash: Hash }
  | { kind: "vote"; account: Address; support: number; weight: bigint };

export type ActivityEntry = ActivityItem & { txHash: Hash; blockNumber: bigint; logIndex: number };

const LIMIT = 12;

/** Últimos eventos del activo (tokenizer filtrado por id + votos del Governor), del más nuevo al más viejo. */
export function useActivity() {
  const client = usePublicClient({ chainId: chain.id });
  const { tokenizer, governor } = addresses;

  return useQuery({
    queryKey: ["activity", tokenizer, governor],
    enabled: Boolean(client && tokenizer && governor),
    queryFn: async (): Promise<ActivityEntry[]> => {
      if (!client || !tokenizer || !governor) return [];
      const latest = await client.getBlockNumber();

      const [tokenizerLogs, voteLogs] = await Promise.all([
        getLogsChunked(
          (fromBlock, toBlock) =>
            client.getContractEvents({ address: tokenizer, abi: abis.tokenizer, fromBlock, toBlock }),
          START_BLOCK,
          latest,
        ),
        getLogsChunked(
          (fromBlock, toBlock) =>
            client.getContractEvents({
              address: governor,
              abi: abis.governor,
              eventName: "VoteCast",
              fromBlock,
              toBlock,
            }),
          START_BLOCK,
          latest,
        ),
      ]);

      const entries: ActivityEntry[] = [];
      const meta = (log: { transactionHash: Hash; blockNumber: bigint; logIndex: number }) => ({
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
      });

      for (const log of tokenizerLogs) {
        const args = log.args as Record<string, unknown>;
        if (args.id !== ASSET_ID) continue;
        switch (log.eventName) {
          case "AssetRegistered":
            entries.push({
              kind: "registered",
              account: args.creator as Address,
              amount: args.maxFractions as bigint,
              price: args.pricePerFraction as bigint,
              ...meta(log),
            });
            break;
          case "FractionsPurchased":
            entries.push({
              kind: "purchase",
              account: args.buyer as Address,
              amount: args.amount as bigint,
              cost: args.cost as bigint,
              ...meta(log),
            });
            break;
          case "DividendsDeposited":
            entries.push({ kind: "deposit", amount: args.amount as bigint, ...meta(log) });
            break;
          case "DividendsClaimed":
            entries.push({
              kind: "claim",
              account: args.account as Address,
              amount: args.amount as bigint,
              ...meta(log),
            });
            break;
          case "SaleStatusChanged":
            entries.push({ kind: "sale", active: args.active as boolean, ...meta(log) });
            break;
          case "ResolutionApproved":
            entries.push({ kind: "resolution", hash: args.resolutionHash as Hash, ...meta(log) });
            break;
        }
      }

      for (const log of voteLogs) {
        entries.push({
          kind: "vote",
          account: log.args.voter!,
          support: log.args.support!,
          weight: log.args.weight!,
          ...meta(log),
        });
      }

      return entries
        .sort((a, b) =>
          a.blockNumber === b.blockNumber ? b.logIndex - a.logIndex : a.blockNumber > b.blockNumber ? -1 : 1,
        )
        .slice(0, LIMIT);
    },
  });
}
