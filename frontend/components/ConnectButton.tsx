"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { addressUrl, chain } from "@/lib/contracts";
import { describeError } from "@/lib/errors";
import { AddressChip } from "./ui";

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  if (isConnected && address) {
    return (
      <div className="account">
        {chainId !== chain.id ? (
          <button
            className="orwa-btn orwa-btn--secondary orwa-btn--sm"
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: chain.id })}
          >
            Cambiar a {chain.name}
          </button>
        ) : (
          <AddressChip value={address} href={addressUrl(address)} />
        )}
        <button className="orwa-btn orwa-btn--ghost orwa-btn--sm" onClick={() => disconnect()}>
          Salir
        </button>
      </div>
    );
  }

  const connector = connectors[0];
  return (
    <div className="account">
      {error && <span className="hint status-error">{describeError(error)}</span>}
      <button
        className="orwa-btn orwa-btn--secondary orwa-btn--sm"
        disabled={isPending || !connector}
        onClick={() => connector && connect({ connector, chainId: chain.id })}
      >
        {isPending ? "Conectando…" : "Conectar wallet"}
      </button>
    </div>
  );
}
