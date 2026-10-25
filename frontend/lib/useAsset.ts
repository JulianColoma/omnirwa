"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { hexToString, keccak256, toBytes, zeroAddress, zeroHash, type Address, type Hex } from "viem";
import { abis, addresses, chain } from "./contracts";
import { useSelectedAsset } from "./selectedAsset";

export type Asset = {
  creator: Address;
  maxFractions: bigint;
  saleActive: boolean;
  pricePerFraction: bigint;
  soldFractions: bigint;
  docHash: Hex;
  name: string;
};

/**
 * Estado de la junta del activo:
 * - `none`: todavía no hay Governor vinculado;
 * - `valid`: el Governor vota con un AssetVotes de este tokenizer y de este id;
 * - `invalid`: la dirección vinculada no es un OmniGovernor de este activo.
 */
export type GovernorStatus = "none" | "checking" | "valid" | "invalid";

const tokenizer = { address: addresses.tokenizer, abi: abis.tokenizer } as const;

const ISSUER_ROLE = keccak256(toBytes("ISSUER_ROLE"));
const DEFAULT_ADMIN_ROLE = zeroHash;

type AssetTuple = readonly [Address, bigint, boolean, bigint, bigint, Hex, Hex];

/** El nombre llega como bytes32 UTF-8 completado con ceros a la derecha. */
function toAsset([creator, maxFractions, saleActive, pricePerFraction, soldFractions, docHash, name]: AssetTuple): Asset | null {
  return creator === zeroAddress
    ? null
    : { creator, maxFractions, saleActive, pricePerFraction, soldFractions, docHash, name: hexToString(name, { size: 32 }) };
}

/** Nombre visible del activo, o "Activo #id" si quedó vacío. */
function assetTitle(id: bigint, asset: Asset | null | undefined): string {
  return asset?.name.trim() || `Activo #${id}`;
}

/** Datos públicos del activo seleccionado y de su Governor. `asset` es null si el id no está registrado. */
export function useAsset() {
  const { assetId } = useSelectedAsset();
  const id = assetId ?? 0n;

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      { ...tokenizer, functionName: "assets", args: [id] },
      { ...tokenizer, functionName: "paused" },
      { ...tokenizer, functionName: "assetGovernor", args: [id] },
    ],
    allowFailure: false,
    query: { enabled: Boolean(addresses.tokenizer) && typeof assetId === "bigint" },
  });

  const linked = data && data[2] !== zeroAddress ? data[2] : undefined;

  // allowFailure: la dirección la elige el creador, así que puede no ser un Governor
  const { data: info } = useReadContracts({
    contracts: [
      { address: linked, abi: abis.governor, functionName: "name" },
      { address: linked, abi: abis.governor, functionName: "votingPeriod" },
      { address: linked, abi: abis.governor, functionName: "token" },
    ],
    query: { enabled: Boolean(linked) },
  });
  const votes = info?.[2].result;

  const { data: wiring } = useReadContracts({
    contracts: [
      { address: votes, abi: abis.votes, functionName: "tokenizer" },
      { address: votes, abi: abis.votes, functionName: "assetId" },
    ],
    query: { enabled: Boolean(votes) },
  });

  let governorStatus: GovernorStatus | undefined;
  if (data) {
    if (!linked) governorStatus = "none";
    else if (!info || (votes && !wiring)) governorStatus = "checking";
    else
      governorStatus =
        info.every((r) => r.status === "success") &&
        wiring?.[0].result?.toLowerCase() === addresses.tokenizer?.toLowerCase() &&
        wiring?.[1].result === id
          ? "valid"
          : "invalid";
  }

  const asset = data ? toAsset(data[0]) : undefined;

  return {
    assetId: typeof assetId === "bigint" ? assetId : undefined,
    asset,
    title: assetTitle(id, asset),
    paused: data?.[1] ?? false,
    governor: governorStatus === "valid" ? linked : undefined,
    linkedGovernor: linked,
    governorStatus,
    votingPeriod: info?.[1].result,
    isLoading,
    error,
    refetch,
  };
}

export type AssetSummary = { id: bigint; title: string; asset: Asset; hasGovernor: boolean };

/** Todos los activos registrados (ids 1..nextAssetId-1), del más nuevo al más viejo. */
export function useAssets() {
  const { data: nextId, isLoading: loadingNext } = useReadContract({
    ...tokenizer,
    functionName: "nextAssetId",
    query: { enabled: Boolean(addresses.tokenizer) },
  });

  const ids: bigint[] = [];
  if (nextId !== undefined) for (let i = nextId - 1n; i >= 1n; i--) ids.push(i);

  const { data, isLoading: loadingAssets } = useReadContracts({
    contracts: ids.flatMap((id) => [
      { ...tokenizer, functionName: "assets", args: [id] } as const,
      { ...tokenizer, functionName: "assetGovernor", args: [id] } as const,
    ]),
    allowFailure: false,
    query: { enabled: ids.length > 0 },
  });

  const assets: AssetSummary[] | undefined =
    nextId === undefined
      ? undefined
      : ids.length === 0
        ? []
        : data &&
          ids.flatMap((id, i) => {
            const asset = toAsset(data[i * 2] as AssetTuple);
            if (!asset) return [];
            const governor = data[i * 2 + 1] as Address;
            return [{ id, title: assetTitle(id, asset), asset, hasGovernor: governor !== zeroAddress }];
          });

  return { assets, isLoading: loadingNext || loadingAssets };
}

/** Saldos de la cuenta conectada en el activo seleccionado: fracciones, USDT, allowance y dividendos. */
export function usePosition() {
  const { address } = useAccount();
  const { assetId } = useSelectedAsset();
  const account = address ?? zeroAddress;
  const id = assetId ?? 0n;
  const { data, isLoading } = useReadContracts({
    contracts: [
      { ...tokenizer, functionName: "balanceOf", args: [account, id] },
      { ...tokenizer, functionName: "pendingDividends", args: [id, account] },
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

/**
 * Roles de la cuenta conectada en el tokenizer: `ISSUER_ROLE` registra activos y `DEFAULT_ADMIN_ROLE`
 * vincula la junta (Governor) de cada uno.
 */
export function useRoles() {
  const { address } = useAccount();
  const account = address ?? zeroAddress;
  const { data } = useReadContracts({
    contracts: [
      { ...tokenizer, functionName: "hasRole", args: [ISSUER_ROLE, account] },
      { ...tokenizer, functionName: "hasRole", args: [DEFAULT_ADMIN_ROLE, account] },
    ],
    allowFailure: false,
    query: { enabled: Boolean(address && addresses.tokenizer) },
  });
  return { isIssuer: data?.[0], isAdmin: data?.[1] };
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
