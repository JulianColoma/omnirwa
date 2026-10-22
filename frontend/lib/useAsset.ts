"use client";

import { useAccount, useReadContracts } from "wagmi";
import { keccak256, toBytes, zeroAddress, type Address, type Hex } from "viem";
import { abis, addresses, ASSET_ID, chain } from "./contracts";

const ISSUER_ROLE = keccak256(toBytes("ISSUER_ROLE"));

export type Asset = {
  creator: Address;
  maxFractions: bigint;
  saleActive: boolean;
  pricePerFraction: bigint;
  soldFractions: bigint;
  docHash: Hex;
};

const tokenizer = { address: addresses.tokenizer, abi: abis.tokenizer } as const;
const governor = { address: addresses.governor, abi: abis.governor } as const;

/** Datos públicos del activo y de su Governor. `asset` es null si el id todavía no fue registrado. */
export function useAsset() {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      { ...tokenizer, functionName: "assets", args: [ASSET_ID] },
      { ...tokenizer, functionName: "paused" },
      { ...governor, functionName: "name" },
      { ...governor, functionName: "votingPeriod" },
      { ...tokenizer, functionName: "assetGovernor", args: [ASSET_ID] },
    ],
    allowFailure: false,
    query: { enabled: Boolean(addresses.tokenizer && addresses.governor) },
  });

  let asset: Asset | null | undefined;
  if (data) {
    const [creator, maxFractions, saleActive, pricePerFraction, soldFractions, docHash] = data[0];
    asset =
      creator === zeroAddress
        ? null
        : { creator, maxFractions, saleActive, pricePerFraction, soldFractions, docHash };
  }

  return {
    asset,
    paused: data?.[1] ?? false,
    governorName: data?.[2],
    votingPeriod: data?.[3],
    governorLinked: data ? data[4].toLowerCase() === addresses.governor?.toLowerCase() : undefined,
    isLoading,
    error,
    refetch,
  };
}

/** Saldos de la cuenta conectada: fracciones, USDT, allowance y dividendos pendientes. */
export function usePosition() {
  const { address } = useAccount();
  const account = address ?? zeroAddress;
  const { data, isLoading } = useReadContracts({
    contracts: [
      { ...tokenizer, functionName: "balanceOf", args: [account, ASSET_ID] },
      { ...tokenizer, functionName: "pendingDividends", args: [ASSET_ID, account] },
      { address: addresses.usdt, abi: abis.usdt, functionName: "balanceOf", args: [account] },
      {
        address: addresses.usdt,
        abi: abis.usdt,
        functionName: "allowance",
        args: [account, addresses.tokenizer ?? zeroAddress],
      },
    ],
    allowFailure: false,
    query: { enabled: Boolean(address && addresses.tokenizer && addresses.usdt) },
  });

  return {
    fractions: data?.[0],
    pending: data?.[1],
    usdtBalance: data?.[2],
    allowance: data?.[3],
    isLoading,
  };
}

/** Si la cuenta conectada tiene ISSUER_ROLE (puede registrar activos). */
export function useIsIssuer() {
  const { address } = useAccount();
  const { data } = useReadContracts({
    contracts: [{ ...tokenizer, functionName: "hasRole", args: [ISSUER_ROLE, address ?? zeroAddress] }],
    allowFailure: false,
    query: { enabled: Boolean(address && addresses.tokenizer) },
  });
  return data?.[0] ?? false;
}

/**
 * Billetera conectada y en la red correcta: condición para habilitar cualquier escritura.
 * `gate` explica qué falta, para mostrarlo debajo del botón.
 */
export function useCanWrite() {
  const { isConnected, chainId } = useAccount();
  const gate = !isConnected
    ? "Conectá tu billetera para operar."
    : chainId !== chain.id
      ? `Cambiá la red de tu billetera a ${chain.name}.`
      : undefined;
  return { canWrite: gate === undefined, gate };
}
