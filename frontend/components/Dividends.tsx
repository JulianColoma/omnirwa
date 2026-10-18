"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatUnits } from "viem";
import { abis, addresses, ASSET_ID, USDT_DECIMALS } from "@/lib/contracts";

/**
 * Mis fracciones + dividendos pendientes + retiro (pull).
 * TODO(C): refrescar lecturas al confirmarse la tx y mostrar el link a Etherscan.
 */
export function Dividends() {
  const { address, isConnected } = useAccount();
  const enabled = !!addresses.tokenizer && !!address;

  const { data: balance } = useReadContract({
    address: addresses.tokenizer,
    abi: abis.tokenizer,
    functionName: "balanceOf",
    args: [address!, ASSET_ID],
    query: { enabled },
  });

  const { data: pending } = useReadContract({
    address: addresses.tokenizer,
    abi: abis.tokenizer,
    functionName: "pendingDividends",
    args: [ASSET_ID, address!],
    query: { enabled },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  return (
    <section className="card">
      <h2>Mis fracciones y dividendos</h2>
      <p>Fracciones: {balance !== undefined ? String(balance) : "—"}</p>
      <p>
        Dividendos pendientes:{" "}
        {pending !== undefined ? formatUnits(pending as bigint, USDT_DECIMALS) : "—"} USDT
      </p>
      <button
        disabled={!isConnected || isPending}
        onClick={() =>
          writeContract({
            address: addresses.tokenizer!,
            abi: abis.tokenizer,
            functionName: "claimDividends",
            args: [ASSET_ID],
          })
        }
      >
        Retirar dividendos
      </button>
      {hash && <p className="muted">Tx: {hash}</p>}
      {error && <p className="muted">Error: {error.message.split("\n")[0]}</p>}
    </section>
  );
}
