import { addresses, addressUrl, chain } from "@/lib/contracts";

const rows = [
  ["RWATokenizer1155", addresses.tokenizer],
  ["OmniGovernor", addresses.governor],
  ["MockUSDT", addresses.usdt],
] as const;

/** Direcciones de los contratos en uso, con link al explorer. */
export function Contracts() {
  return (
    <footer className="footer">
      <p className="eyebrow">Contratos · {chain.name}</p>
      <dl className="contracts">
        {rows.map(([name, address]) => {
          const url = address && addressUrl(address);
          return (
            <div key={name}>
              <dt>{name}</dt>
              <dd className="mono">
                {!address ? "sin configurar" : url ? (
                  <a href={`${url}#code`} target="_blank" rel="noreferrer">
                    {address}
                  </a>
                ) : (
                  address
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </footer>
  );
}
