"use client";

import type { TxState } from "@/lib/useTx";
import { txUrl } from "@/lib/contracts";
import { shortHash } from "@/lib/format";

function TxLink({ hash }: { hash: string }) {
  const url = txUrl(hash);
  if (!url) return <span className="mono">{shortHash(hash)}</span>;
  return (
    <a className="mono" href={url} target="_blank" rel="noreferrer">
      {shortHash(hash)}
    </a>
  );
}

/** Línea de estado debajo de una acción: firma, confirmación, éxito o error. */
export function TxStatus({ state }: { state: TxState }) {
  switch (state.status) {
    case "idle":
      return null;
    case "signing":
      return <p className="status">Confirmá en tu billetera: {state.label}.</p>;
    case "pending":
      return (
        <p className="status">
          Esperando confirmación: {state.label} · <TxLink hash={state.hash} />
        </p>
      );
    case "success":
      return (
        <p className="status status-ok">
          Confirmada: {state.label} · <TxLink hash={state.hash} />
        </p>
      );
    case "error":
      return (
        <p className="status status-error">
          {state.message}
          {state.hash && (
            <>
              {" "}
              · <TxLink hash={state.hash} />
            </>
          )}
        </p>
      );
  }
}
