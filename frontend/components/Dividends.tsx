"use client";

import { useAccount, useWriteContract } from "wagmi";
import { abis, addresses } from "@/lib/contracts";
import { formatInt, formatUsdt, percent } from "@/lib/format";
import { useAsset, useCanWrite, usePosition } from "@/lib/useAsset";
import { useTx } from "@/lib/useTx";
import { TxStatus } from "./TxStatus";

/** Posición de la cuenta conectada: fracciones, participación y dividendos pendientes (retiro pull). */
export function Dividends() {
  const { isConnected } = useAccount();
  const { assetId, asset } = useAsset();
  const { fractions, pending, usdtBalance } = usePosition();
  const { canWrite, gate } = useCanWrite();
  const { writeContractAsync } = useWriteContract();
  const tx = useTx();

  if (!asset || assetId === undefined) return null;

  const claim = () =>
    tx.run((step) =>
      step("retiro de la renta", (fees) =>
        writeContractAsync({
          ...fees,
          address: addresses.tokenizer!,
          abi: abis.tokenizer,
          functionName: "claimDividends",
          args: [assetId],
        }),
      ),
    );

  return (
    <section className="orwa-card">
      <h2 className="card-title">Tu posición</h2>
      {!isConnected ? (
        <p className="hint">Conectá tu wallet para ver tus fracciones y tu renta.</p>
      ) : (
        <>
          <div className="line">
            <span>Fracciones</span>
            <span className="num">{fractions !== undefined ? formatInt(fractions) : "—"}</span>
          </div>
          <div className="line">
            <span>Participación</span>
            <span className="num">
              {fractions !== undefined ? `${percent(fractions, asset.soldFractions)}%` : "—"}
            </span>
          </div>
          <div className="line">
            <span>Saldo USDT</span>
            <span className="num">{usdtBalance !== undefined ? `${formatUsdt(usdtBalance)} USDT` : "—"}</span>
          </div>
          <div className="line line-strong">
            <span>Renta para retirar</span>
            <span className="num">{pending !== undefined ? `${formatUsdt(pending)} USDT` : "—"}</span>
          </div>
          <button
            className="orwa-btn orwa-btn--secondary"
            disabled={!canWrite || !pending || tx.busy}
            onClick={claim}
          >
            {pending ? `Retirar ${formatUsdt(pending)} USDT` : "Retirar renta"}
          </button>
          {gate && <p className="hint">{gate}</p>}
          <TxStatus state={tx.state} />
        </>
      )}
    </section>
  );
}
