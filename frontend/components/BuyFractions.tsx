"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { abis, addresses } from "@/lib/contracts";
import { formatInt, formatUsdt } from "@/lib/format";
import { useAsset, useCanWrite, usePosition } from "@/lib/useAsset";
import { useTx } from "@/lib/useTx";
import { TxStatus } from "./TxStatus";

const MAX_UINT64 = 2n ** 64n - 1n;

function parseAmount(value: string): bigint | undefined {
  if (!/^\d+$/.test(value)) return undefined;
  const amount = BigInt(value);
  return amount > 0n && amount <= MAX_UINT64 ? amount : undefined;
}

/**
 * Compra de fracciones. Si el allowance no alcanza, primero aprueba el costo exacto y espera el recibo;
 * después llama a `buyFractions`.
 */
export function BuyFractions() {
  const { assetId, asset, paused, governorStatus } = useAsset();
  const { usdtBalance, allowance } = usePosition();
  const { canWrite, gate } = useCanWrite();
  const { writeContractAsync } = useWriteContract();
  const tx = useTx();
  const [input, setInput] = useState("10");

  if (!asset || assetId === undefined) return null;

  const amount = parseAmount(input);
  const remaining = asset.maxFractions - asset.soldFractions;
  const cost = amount !== undefined ? amount * asset.pricePerFraction : 0n;
  const needsApproval = allowance !== undefined && allowance < cost;
  const open = asset.saleActive && !paused;

  let problem: string | undefined;
  if (!open) problem = paused ? "Las compras están pausadas." : "La venta está cerrada.";
  else if (governorStatus === "invalid") problem = "La junta vinculada a este activo no es un Governor válido.";
  else if (input !== "" && amount === undefined) problem = "Ingresá una cantidad entera mayor a cero.";
  else if (amount !== undefined && amount > remaining) problem = `Solo quedan ${formatInt(remaining)} fracciones.`;
  else if (amount !== undefined && usdtBalance !== undefined && usdtBalance < cost) problem = "No tenés USDT suficiente.";

  const buy = () =>
    amount !== undefined &&
    tx.run(async (step) => {
      if (needsApproval) {
        await step("aprobación de USDT", (fees) =>
          writeContractAsync({
            ...fees,
            address: addresses.usdt!,
            abi: abis.usdt,
            functionName: "approve",
            args: [addresses.tokenizer!, cost],
          }),
        );
      }
      await step(`compra de ${formatInt(amount)} fracciones`, (fees) =>
        writeContractAsync({
          ...fees,
          address: addresses.tokenizer!,
          abi: abis.tokenizer,
          functionName: "buyFractions",
          args: [assetId, amount],
        }),
      );
    });

  return (
    <section className="orwa-card">
      <h2 className="card-title">Comprar fracciones</h2>
      <label className="field">
        <span>Fracciones</span>
        <input
          inputMode="numeric"
          value={input}
          onChange={(e) => {
            setInput(e.target.value.replace(/\D/g, ""));
            tx.reset();
          }}
          disabled={!open}
        />
      </label>
      <div className="line">
        <span>Total</span>
        <span className="num">{formatUsdt(cost)} USDT</span>
      </div>
      <div className="line">
        <span>Tu saldo</span>
        <span className="num">{usdtBalance !== undefined ? `${formatUsdt(usdtBalance)} USDT` : "—"}</span>
      </div>
      <button
        className="orwa-btn orwa-btn--primary"
        disabled={!canWrite || !open || governorStatus === "invalid" || amount === undefined || Boolean(problem) || tx.busy}
        onClick={buy}
      >
        {needsApproval ? "Aprobar y comprar fracciones" : "Comprar fracciones"}
      </button>
      {needsApproval && !problem && (
        <p className="hint">Se firman dos transacciones: la aprobación del monto exacto y la compra.</p>
      )}
      {problem && <p className="hint">{problem}</p>}
      {governorStatus === "none" && !problem && (
        <p className="hint">Este activo todavía no tiene junta de inversores: por ahora no se puede votar.</p>
      )}
      {gate && <p className="hint">{gate}</p>}
      <TxStatus state={tx.state} />
    </section>
  );
}
