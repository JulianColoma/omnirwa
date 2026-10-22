"use client";

import { useCallback, useState } from "react";
import { useConfig } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useQueryClient } from "@tanstack/react-query";
import type { Hash } from "viem";
import { describeError } from "./errors";

export type TxState =
  | { status: "idle" }
  | { status: "signing"; label: string }
  | { status: "pending"; label: string; hash: Hash }
  | { status: "success"; label: string; hash: Hash }
  | { status: "error"; message: string; hash?: Hash };

/** Un paso firma una transacción y espera su recibo. */
export type TxStep = (label: string, send: () => Promise<Hash>) => Promise<void>;

/**
 * Ejecuta uno o más pasos en orden (ej. approve → buy), esperando cada recibo antes del siguiente.
 * Después de cada recibo refresca las lecturas, así el "confirmada" ya se muestra con los saldos nuevos.
 */
export function useTx() {
  const config = useConfig();
  const queryClient = useQueryClient();
  const [state, setState] = useState<TxState>({ status: "idle" });

  const run = useCallback(
    async (flow: (step: TxStep) => Promise<void>): Promise<boolean> => {
      let lastHash: Hash | undefined;
      const step: TxStep = async (label, send) => {
        setState({ status: "signing", label });
        const hash = await send();
        lastHash = hash;
        setState({ status: "pending", label, hash });
        const receipt = await waitForTransactionReceipt(config, { hash });
        if (receipt.status !== "success") throw new Error("La transacción revirtió.");
        await queryClient.invalidateQueries();
        setState({ status: "success", label, hash });
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
