"use client";

import { txUrl } from "@/lib/contracts";
import { describeError } from "@/lib/errors";
import { formatInt, formatUsdt, shortAddress } from "@/lib/format";
import { useActivity, type ActivityEntry } from "@/lib/useActivity";
import { AddressChip } from "./ui";

const SUPPORT = ["en contra", "a favor", "abstención"];

function describe(entry: ActivityEntry) {
  switch (entry.kind) {
    case "registered":
      return `Registro del activo: ${formatInt(entry.amount)} fracciones a ${formatUsdt(entry.price)} USDT`;
    case "purchase":
      return `${shortAddress(entry.account)} compró ${formatInt(entry.amount)} fracciones por ${formatUsdt(entry.cost)} USDT`;
    case "deposit":
      return `El emisor depositó ${formatUsdt(entry.amount)} USDT de renta`;
    case "claim":
      return `${shortAddress(entry.account)} retiró ${formatUsdt(entry.amount)} USDT`;
    case "sale":
      return entry.active ? "La junta reabrió la venta" : "La junta cerró la venta";
    case "resolution":
      return `Resolución aprobada ${shortAddress(entry.hash)}`;
    case "proposal":
      return `${shortAddress(entry.account)} propuso "${entry.title}"`;
    case "vote":
      return `${shortAddress(entry.account)} votó ${SUPPORT[entry.support] ?? "?"} con ${formatInt(entry.weight)} fracciones`;
  }
}

/** Últimos eventos on-chain del activo, con link a cada transacción. */
export function Activity() {
  const { data, isLoading, error } = useActivity();

  return (
    <section className="section">
      <div className="section-head">
        <h2>Actividad</h2>
      </div>
      {error && <p className="status status-error">No se pudo leer la actividad: {describeError(error)}</p>}
      {isLoading && <p className="hint">Leyendo eventos…</p>}
      {data && data.length === 0 && <p className="empty">Sin movimientos todavía.</p>}
      <ul className="activity">
        {data?.map((entry) => (
          <li key={`${entry.txHash}-${entry.logIndex}`}>
            <span>{describe(entry)}</span>
            <AddressChip value={entry.txHash} href={txUrl(entry.txHash)} label="tx" />
          </li>
        ))}
      </ul>
    </section>
  );
}
