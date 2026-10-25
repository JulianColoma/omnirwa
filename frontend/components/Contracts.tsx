"use client";

import { addresses, addressUrl, chain } from "@/lib/contracts";
import { AddressChip } from "./ui";

const rows = [
  ["RWATokenizer1155", addresses.tokenizer],
  ["MockUSDT", addresses.usdt],
] as const;

/** Direcciones de los contratos de la plataforma, con link al código verificado. */
export function Contracts() {
  return (
    <footer className="footer">
      <span className="orwa-eyebrow">Contratos · {chain.name}</span>
      <dl className="contracts">
        {rows.map(([name, address]) => {
          const url = address && addressUrl(address);
          return (
            <div key={name}>
              <dt>{name}</dt>
              <dd>
                {address ? (
                  <AddressChip value={address} href={url ? `${url}#code` : undefined} />
                ) : (
                  <span className="hint">Sin configurar</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </footer>
  );
}
