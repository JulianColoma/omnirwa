"use client";

import { useCallback, useState } from "react";
import { useConfig } from "wagmi";
import { getPublicClient, waitForTransactionReceipt } from "wagmi/actions";
import { useQueryClient } from "@tanstack/react-query";
import { parseGwei, type Hash, type TransactionReceipt } from "viem";
import { chain } from "./contracts";
import { describeError } from "./errors";

export type TxState =
  | { status: "idle" }
  | { status: "signing"; label: string }
  | { status: "pending"; label: string; hash: Hash }
  | { status: "success"; label: string; hash: Hash }
  | { status: "error"; message: string; hash?: Hash };

/** Tarifas EIP-1559 que se pasan a la billetera junto con cada transacción. */
export type TxFees = { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };

/** Un paso firma una transacción, espera su recibo y lo devuelve (ej. para leer la dirección de un deploy). */
export type TxStep = (label: string, send: (fees: TxFees) => Promise<Hash>) => Promise<TransactionReceipt>;

/** Propina mínima: los nodos geth no minan transacciones con menos de 0,001 gwei. */
const MIN_PRIORITY_FEE = parseGwei("0.01");

/**
 * Tarifas a partir del bloque actual: hasta 2 × base fee (aguanta varios bloques de suba) + la propina que sugiere el
 * nodo. Sin esto, MetaMask aplica su propia propina "de mercado" (~1,5 gwei en Sepolia) y el despliegue del Governor
 * (~24M de gas) le pide al creador decenas de veces más ETH del que se termina cobrando.
 */
async function suggestFees(config: ReturnType<typeof useConfig>): Promise<TxFees> {
  const client = getPublicClient(config, { chainId: chain.id });
  if (!client) throw new Error(`No hay conexión con ${chain.name}.`);
  const [block, tip] = await Promise.all([client.getBlock(), client.estimateMaxPriorityFeePerGas()]);
  const maxPriorityFeePerGas = tip > MIN_PRIORITY_FEE ? tip : MIN_PRIORITY_FEE;
  const baseFee = block.baseFeePerGas ?? (await client.getGasPrice());
  return { maxFeePerGas: baseFee * 2n + maxPriorityFeePerGas, maxPriorityFeePerGas };
}

/**
 * Ejecuta uno o más pasos en orden (ej. approve → buy), esperando cada recibo antes del siguiente.
 * Después de cada recibo refresca las lecturas, así el "confirmada" ya se muestra con los saldos nuevos.
 */
export function useTx() {
  const config = useConfig();
  const queryClient = useQueryClient();
  const [state, setState] = useState<TxState>({ status: "idle" });

  const run = useCallback(
    async (flow: (step: TxStep) => Promise<unknown>): Promise<boolean> => {
      let lastHash: Hash | undefined;
      const step: TxStep = async (label, send) => {
        setState({ status: "signing", label });
        const hash = await send(await suggestFees(config));
        lastHash = hash;
        setState({ status: "pending", label, hash });
        const receipt = await waitForTransactionReceipt(config, { hash });
        if (receipt.status !== "success") throw new Error("La transacción revirtió.");
        await queryClient.invalidateQueries();
        setState({ status: "success", label, hash });
        return receipt;
      };
      try {
        await flow(step);
        return true;
      } catch (error) {
        setState({ status: "error", message: describeError(error), hash: lastHash });
        await queryClient.invalidateQueries();
        return false;
      }
    },
    [config, queryClient],
  );

  const busy = state.status === "signing" || state.status === "pending";
  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, run, busy, reset };
}
