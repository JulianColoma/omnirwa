"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { abis, addresses } from "@/lib/contracts";
import { formatInt, formatUsdt, parseUsdt } from "@/lib/format";
import { useAsset, useCanWrite, usePosition, useRoles } from "@/lib/useAsset";
import { useTx } from "@/lib/useTx";
import { SetupGovernance } from "./CreateAsset";
import { TxStatus } from "./TxStatus";

/** Herramientas del emisor: el admin arma la junta (si falta) y el creador del activo deposita la renta. */
export function IssuerPanel() {
  const { address } = useAccount();
  const { asset, governorStatus } = useAsset();
  const { isAdmin } = useRoles();

  if (!asset || !address) return null;
  const isCreator = asset.creator.toLowerCase() === address.toLowerCase();
  const canSetup = Boolean(isAdmin) && governorStatus === "none";

  return (
    <div className="section">
      {canSetup && <SetupGovernance />}
      {isCreator && governorStatus === "none" && !isAdmin && (
        <p className="hint">
          Este activo todavía no tiene junta. La despliega y vincula el administrador (<code>DEFAULT_ADMIN_ROLE</code>).
        </p>
      )}
      {isCreator && <DepositDividends />}
    </div>
  );
}

function DepositDividends() {
  const { asset, assetId } = useAsset();
  const { usdtBalance, allowance } = usePosition();
  const { canWrite, gate } = useCanWrite();
  const { writeContractAsync } = useWriteContract();
  const tx = useTx();
  const [input, setInput] = useState("");

  if (!asset || assetId === undefined) return null;

  const amount = parseUsdt(input);
  const supply = asset.soldFractions;
  const needsApproval = amount !== undefined && allowance !== undefined && allowance < amount;

  let problem: string | undefined;
  if (supply === 0n) problem = "Todavía no hay fracciones vendidas.";
  else if (input !== "" && amount === undefined) problem = "Ingresá un monto válido (hasta 6 decimales).";
  else if (amount !== undefined && usdtBalance !== undefined && usdtBalance < amount) problem = "No tenés USDT suficiente.";

  const deposit = () =>
    amount !== undefined &&
    tx.run(async (step) => {
      if (needsApproval) {
        await step("aprobación de USDT", (fees) =>
          writeContractAsync({
            ...fees,
            address: addresses.usdt!,
            abi: abis.usdt,
            functionName: "approve",
            args: [addresses.tokenizer!, amount],
          }),
        );
      }
      await step("depósito de la renta", (fees) =>
        writeContractAsync({
          ...fees,
          address: addresses.tokenizer!,
          abi: abis.tokenizer,
          functionName: "depositDividends",
          args: [assetId, amount],
        }),
      );
      setInput("");
    });

  return (
    <section className="orwa-card">
      <h2 className="card-title">Depositar renta</h2>
      <p className="hint">
        Sos el emisor de este activo. Lo que deposites se reparte entre las {formatInt(supply)} fracciones emitidas
        hoy; cada titular lo retira cuando quiere.
      </p>
      <div className="fields">
        <label className="field">
          <span>Monto (USDT)</span>
          <input inputMode="decimal" placeholder="800" value={input} onChange={(e) => setInput(e.target.value)} />
        </label>
        <div className="field">
          <span>Por fracción</span>
          <p className="num field-value">
            {amount !== undefined && supply > 0n ? `${formatUsdt(amount / supply)} USDT` : "—"}
          </p>
        </div>
        <div className="field">
          <span>Tu saldo</span>
          <p className="num field-value">{usdtBalance !== undefined ? `${formatUsdt(usdtBalance)} USDT` : "—"}</p>
        </div>
      </div>
      <button
        className="orwa-btn orwa-btn--secondary"
        disabled={!canWrite || amount === undefined || Boolean(problem) || tx.busy}
        onClick={deposit}
      >
        {needsApproval ? "Aprobar y depositar renta" : "Depositar renta"}
      </button>
      {problem && <p className="hint">{problem}</p>}
      {gate && <p className="hint">{gate}</p>}
      <TxStatus state={tx.state} />
    </section>
  );
}
