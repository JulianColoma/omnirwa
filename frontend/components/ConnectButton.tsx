"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="row">
        <span className="muted">
          {chain?.name ?? "Red desconocida"} · {address?.slice(0, 6)}…{address?.slice(-4)}
        </span>
        <button onClick={() => disconnect()}>Desconectar</button>
      </div>
    );
  }

  return (
    <button disabled={isPending} onClick={() => connect({ connector: connectors[0] })}>
      Conectar billetera
    </button>
  );
}
