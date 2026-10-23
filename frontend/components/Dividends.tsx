"use client";

import { useAccount, useWriteContract } from "wagmi";
import { abis, addresses, ASSET_ID } from "@/lib/contracts";
import { formatInt, formatUsdt, percent } from "@/lib/format";
import { useAsset, useCanWrite, usePosition } from "@/lib/useAsset";
import { useTx } from "@/lib/useTx";
import { TxStatus } from "./TxStatus";

/** Posición de la cuenta conectada: fracciones, participación y dividendos pendientes (retiro pull). */
export function Dividends() {
  const { isConnected } = useAccount();
  const { asset } = useAsset();
  const { fractions, pending, usdtBalance } = usePosition();
  const { canWrite, gate } = useCanWrite();
  const { writeContractAsync } = useWriteContract();
  const tx = useTx();

  if (!asset) return null;

  const claim = () =>
    tx.run((step) =>
      step("retiro de dividendos", () =>
        writeContractAsync({
          address: addresses.tokenizer!,
          abi: abis.tokenizer,
          functionName: "claimDividends",
          args: [ASSET_ID],
        }),
      ),
    );

  return (
    <section className="panel">
      <h2>Tu posición</h2>
      {!isConnected ? (
        <p className="hint">Conectá tu billetera para ver tus fracciones y dividendos.</p>
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
            <span className="num">{usdtBalance !== undefined ? formatUsdt(usdtBalance) : "—"}</span>
          </div>
          <div className="line line-strong">
            <span>Dividendos a retirar</span>
            <span className="num">{pending !== undefined ? `${formatUsdt(pending)} USDT` : "—"}</span>
          </div>
          <button
            className="button button-secondary"
            disabled={!canWrite || !pending || tx.busy}
            onClick={claim}
          >
            Retirar dividendos
          </button>
          {gate && <p className="hint">{gate}</p>}
          <TxStatus state={tx.state} />
        </>
      )}
    </section>
  );
}
