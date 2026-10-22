"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { chain } from "@/lib/contracts";
import { describeError } from "@/lib/errors";
import { shortAddress } from "@/lib/format";

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  if (isConnected && address) {
    return (
      <div className="account">
        {chainId !== chain.id ? (
          <button className="button-small" disabled={isSwitching} onClick={() => switchChain({ chainId: chain.id })}>
            Cambiar a {chain.name}
          </button>
        ) : (
          <span className="account-address mono" title={address}>
            {shortAddress(address)}
          </span>
        )}
        <button className="link-button" onClick={() => disconnect()}>
          Salir
        </button>
      </div>
    );
  }

  const connector = connectors[0];
  return (
    <div className="account">
      {error && <span className="status-error small">{describeError(error)}</span>}
      <button
        className="button-small"
        disabled={isPending || !connector}
        onClick={() => connector && connect({ connector, chainId: chain.id })}
      >
        {isPending ? "Conectando…" : "Conectar billetera"}
      </button>
    </div>
  );
}
