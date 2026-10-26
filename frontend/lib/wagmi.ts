import { http, createConfig } from "wagmi";
import { foundry, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import type { Transport } from "viem";
import { chain } from "./contracts";

const FEE_FIELDS = ["gasPrice", "maxFeePerGas", "maxPriorityFeePerGas"] as const;

/**
 * Antes de cada escritura wagmi simula la transacción con `eth_call` pasando las tarifas, pero sin `gas`. Algunos
 * nodos (ej. algunos backends de publicnode) completan el gas con su tope de 10.000 M y exigen saldo para
 * gas × maxFeePerGas: según la propina del momento la simulación falla por "insufficient funds" aunque la transacción
 * cueste millonésimas de ETH. Sin tarifas el nodo no chequea saldo; la billetera igual verifica que alcance al firmar.
 */
function withoutSimulationFees(transport: Transport): Transport {
  return (params) => {
    const base = transport(params);
    return {
      ...base,
      request: (args, options) => {
        if (args.method === "eth_call" && Array.isArray(args.params)) {
          const [call, ...rest] = args.params as [Record<string, unknown>, ...unknown[]];
          if (call && call.gas === undefined && FEE_FIELDS.some((field) => call[field] !== undefined)) {
            const stripped = Object.fromEntries(
              Object.entries(call).filter(([key]) => !(FEE_FIELDS as readonly string[]).includes(key)),
            );
            return base.request({ ...args, params: [stripped, ...rest] }, options);
          }
        }
        return base.request(args, options);
      },
    };
  };
}

export const config = createConfig({
  chains: [chain],
  connectors: [injected()],
  transports: {
    [foundry.id]: withoutSimulationFees(http(process.env.NEXT_PUBLIC_RPC_URL || undefined)),
    [sepolia.id]: withoutSimulationFees(http(process.env.NEXT_PUBLIC_RPC_URL || undefined)),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
