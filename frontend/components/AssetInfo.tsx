"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { abis, addresses, ASSET_ID, USDT_DECIMALS } from "@/lib/contracts";

/** Muestra los datos del activo (struct Asset). */
export function AssetInfo() {
  const { data, isLoading, error } = useReadContract({
    address: addresses.tokenizer,
    abi: abis.tokenizer,
    functionName: "assets",
    args: [ASSET_ID],
    query: { enabled: !!addresses.tokenizer },
  });

  // assets(id) → [creator, maxFractions, saleActive, pricePerFraction, soldFractions, docHash]
  const asset = data as readonly [string, bigint, boolean, bigint, bigint, string] | undefined;

  return (
    <section className="card">
      <h2>Activo #{ASSET_ID.toString()}</h2>
      {!addresses.tokenizer && <p className="muted">Configurá NEXT_PUBLIC_TOKENIZER_ADDRESS.</p>}
      {isLoading && <p className="muted">Cargando…</p>}
      {error && <p className="muted">Error: {error.message.split("\n")[0]}</p>}
      {asset && (
        <ul>
          <li>Creador: {asset[0]}</li>
          <li>
            Vendidas: {asset[4].toString()} / {asset[1].toString()}
          </li>
          <li>Precio: {formatUnits(asset[3], USDT_DECIMALS)} USDT</li>
          <li>Venta: {asset[2] ? "abierta" : "cerrada"}</li>
        </ul>
      )}
    </section>
  );
}
