import { http, createConfig } from "wagmi";
import { foundry, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { chain } from "./contracts";

export const config = createConfig({
  chains: [chain],
  connectors: [injected()],
  transports: {
    [foundry.id]: http(process.env.NEXT_PUBLIC_RPC_URL || undefined),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || undefined),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
