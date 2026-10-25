import { isAddress, type Address } from "viem";
import { foundry, sepolia } from "wagmi/chains";
import { MockUSDTAbi } from "./abis/MockUSDT";
import { RWATokenizer1155Abi } from "./abis/RWATokenizer1155";
import { AssetVotesAbi, AssetVotesBytecode } from "./abis/AssetVotes";
import { OmniGovernorAbi, OmniGovernorBytecode } from "./abis/OmniGovernor";

/** ABIs generados con `npm run abis` desde ../out (Foundry). */
export const abis = {
  usdt: MockUSDTAbi,
  tokenizer: RWATokenizer1155Abi,
  votes: AssetVotesAbi,
  governor: OmniGovernorAbi,
};

/** Bytecode de los contratos que despliega el creador de cada activo (su junta de inversores). */
export const bytecodes = {
  votes: AssetVotesBytecode,
  governor: OmniGovernorBytecode,
};

/** Red objetivo: Sepolia por defecto, anvil (31337) para desarrollo local. */
export const chain = process.env.NEXT_PUBLIC_CHAIN_ID === String(foundry.id) ? foundry : sepolia;

function envAddress(value: string | undefined): Address | undefined {
  return value && isAddress(value) ? value : undefined;
}

/** Direcciones desplegadas (ver frontend/.env.example o `npm run sync`). */
export const addresses = {
  usdt: envAddress(process.env.NEXT_PUBLIC_USDT_ADDRESS),
  tokenizer: envAddress(process.env.NEXT_PUBLIC_TOKENIZER_ADDRESS),
};

export const isConfigured = Boolean(addresses.usdt && addresses.tokenizer);

/** Prefijo con el que se nombra el Governor de cada activo: "OmniRWA <nombre del activo>". */
export const GOVERNOR_NAME_PREFIX = "OmniRWA ";

/** Duración de la votación que se sugiere al crear un activo (10 minutos). */
export const DEFAULT_VOTING_MINUTES = 10;

/** Bloque del deploy: desde acá se leen los eventos. */
export const START_BLOCK = BigInt(process.env.NEXT_PUBLIC_START_BLOCK || "0");

/** MockUSDT usa 6 decimales. */
export const USDT_DECIMALS = 6;

/** Soporte de voto de GovernorCountingSimple. */
export const VoteType = { Against: 0, For: 1, Abstain: 2 } as const;

/** Estados del Governor de OpenZeppelin (enum ProposalState). */
export const PROPOSAL_STATES = [
  "Pendiente",
  "Activa",
  "Cancelada",
  "Rechazada",
  "Aprobada",
  "En cola",
  "Expirada",
  "Ejecutada",
] as const;

export const ProposalState = { Pending: 0, Active: 1, Defeated: 3, Succeeded: 4, Executed: 7 } as const;

const explorer = chain.blockExplorers?.default.url;

export function txUrl(hash: string): string | undefined {
  return explorer ? `${explorer}/tx/${hash}` : undefined;
}

export function addressUrl(address: string): string | undefined {
  return explorer ? `${explorer}/address/${address}` : undefined;
}
