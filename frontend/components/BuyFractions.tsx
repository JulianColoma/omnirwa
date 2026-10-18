"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { abis, addresses, ASSET_ID } from "@/lib/contracts";

/**
 * Compra de fracciones: 1) approve de USDT al tokenizer, 2) buyFractions.
 * TODO(C): leer el precio de `assets(id)` para calcular el approve exacto, esperar el recibo
 *          del approve antes de comprar (useWaitForTransactionReceipt) y mostrar el link a Etherscan.
 */
export function BuyFractions() {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("10");
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const approve = () =>
    writeContract({
      address: addresses.usdt!,
      abi: abis.usdt,
      functionName: "approve",
      args: [addresses.tokenizer!, BigInt(2) ** BigInt(256) - BigInt(1)], // TODO(C): approve exacto
    });

  const buy = () =>
    writeContract({
      address: addresses.tokenizer!,
      abi: abis.tokenizer,
      functionName: "buyFractions",
      args: [ASSET_ID, BigInt(amount)],
    });

  return (
    <section className="card">
      <h2>Comprar fracciones</h2>
      <div className="row">
        <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button disabled={!isConnected || isPending} onClick={approve}>
          1. Aprobar USDT
        </button>
        <button disabled={!isConnected || isPending} onClick={buy}>
          2. Comprar
        </button>
      </div>
      {hash && <p className="muted">Tx: {hash}</p>}
      {error && <p className="muted">Error: {error.message.split("\n")[0]}</p>}
    </section>
  );
}
