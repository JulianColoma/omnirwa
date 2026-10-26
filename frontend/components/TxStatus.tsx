"use client";

import type { TxState } from "@/lib/useTx";
import { txUrl } from "@/lib/contracts";
import { formatEth } from "@/lib/format";
import { AddressChip } from "./ui";

function TxLink({ hash }: { hash: string }) {
  return <AddressChip value={hash} href={txUrl(hash)} label="tx" />;
}

/** Los tres pasos de una transacción en palabras: firma, registro on-chain y listo (o error). */
export function TxStatus({ state }: { state: TxState }) {
  switch (state.status) {
    case "idle":
      return null;
    case "signing":
      return <p className="status">Confirmá en tu wallet: {state.label}.</p>;
    case "pending":
      return (
        <p className="status">
          Registrando on-chain: {state.label}. <TxLink hash={state.hash} />
        </p>
      );
    case "success":
      return (
        <p className="status status-ok">
          Listo: {state.label}. Comisión: {formatEth(state.fee)} ETH. <TxLink hash={state.hash} />
        </p>
      );
    case "error":
      return (
        <p className="status status-error">
          {state.message}
          {state.hash && <TxLink hash={state.hash} />}
        </p>
      );
  }
}
