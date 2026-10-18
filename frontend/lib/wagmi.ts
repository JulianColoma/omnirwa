import { http, createConfig } from "wagmi";
import { sepolia, foundry } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [sepolia, foundry],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || undefined),
    [foundry.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
