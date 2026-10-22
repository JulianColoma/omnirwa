import {
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  UserRejectedRequestError,
  toFunctionSelector,
  type AbiItem,
} from "viem";
import { formatAbiItem } from "viem/utils";
import { abis } from "./contracts";

type AbiError = Extract<AbiItem, { type: "error" }>;

/** Errores de los tres contratos por selector: una compra puede revertir dentro de MockUSDT, por ejemplo. */
const errorsBySelector = new Map(
  ([...abis.usdt, ...abis.tokenizer, ...abis.governor] as readonly AbiItem[])
    .filter((item): item is AbiError => item.type === "error")
    .map((item) => [toFunctionSelector(formatAbiItem(item)), item.name]),
);

const messages: Record<string, (args: readonly unknown[]) => string> = {
  SaleNotActive: () => "La venta de este activo está cerrada.",
  ZeroAmount: () => "La cantidad tiene que ser mayor a cero.",
  ExceedsAvailable: (args) =>
    args[1] !== undefined ? `Solo quedan ${String(args[1])} fracciones disponibles.` : "No quedan tantas fracciones.",
  NotAssetCreator: () => "Solo el creador del activo puede depositar dividendos.",
  NoHolders: () => "Todavía no hay fracciones vendidas entre las que repartir.",
  DepositTooSmall: () => "El monto es demasiado chico para repartirlo entre las fracciones emitidas.",
  NothingToClaim: () => "No tenés dividendos pendientes.",
  EnforcedPause: () => "El contrato está pausado.",
  AccessControlUnauthorizedAccount: () => "Tu cuenta no tiene permiso para esta operación.",
  ERC20InsufficientBalance: () => "No tenés USDT suficiente.",
  ERC20InsufficientAllowance: () => "El USDT aprobado no alcanza.",
  GovernorInsufficientProposerVotes: () =>
    "Para proponer necesitás al menos una fracción comprada antes de este bloque.",
  GovernorAlreadyCastVote: () => "Ya votaste esta propuesta.",
  GovernorUnexpectedProposalState: () =>
    "La propuesta no está en un estado que permita esta acción (o ya existe una idéntica).",
  GovernorNonexistentProposal: () => "La propuesta no existe.",
  ERC5805FutureLookup: () => "La votación todavía no empezó. Probá de nuevo en unos segundos.",
};

function fromRevert(error: ContractFunctionRevertedError): string | undefined {
  // si el error vino de otro contrato (ej. MockUSDT dentro de una compra) viem solo trae el selector
  const name = error.data?.errorName ?? (error.signature && errorsBySelector.get(error.signature));
  const args: readonly unknown[] = error.data?.args ?? [];
  if (!name) return error.reason;
  return messages[name]?.(args) ?? name;
}

/** Convierte un error de viem/wagmi en un mensaje corto para mostrar. */
export function describeError(error: unknown): string {
  if (error instanceof Error && error.name === "ProviderNotFoundError")
    return "No se detectó ninguna billetera. Abrí la página en el navegador donde tenés MetaMask.";
  if (error instanceof BaseError) {
    if (error.walk((e) => e instanceof UserRejectedRequestError)) return "Firma cancelada en la billetera.";
    if (error.walk((e) => e instanceof ContractFunctionZeroDataError))
      return "No hay un contrato en la dirección configurada. Revisá la red y las direcciones de .env.local (o volvé a deployar y corré npm run sync).";
    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const message = fromRevert(revert);
      if (message) return message;
    }
    return error.shortMessage;
  }
  if (error instanceof Error) return error.message.split("\n")[0];
  return "Ocurrió un error inesperado.";
}
