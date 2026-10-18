import type { Abi, Address } from "viem";
import usdtAbi from "./abis/MockUSDT.json";
import tokenizerAbi from "./abis/RWATokenizer1155.json";
import governorAbi from "./abis/OmniGovernor.json";

/** ABIs generados con `npm run abis` desde ../out (Foundry). */
export const abis = {
  usdt: usdtAbi as Abi,
  tokenizer: tokenizerAbi as Abi,
  governor: governorAbi as Abi,
};

/** Direcciones desplegadas (ver frontend/.env.example). */
export const addresses = {
  usdt: process.env.NEXT_PUBLIC_USDT_ADDRESS as Address | undefined,
  tokenizer: process.env.NEXT_PUBLIC_TOKENIZER_ADDRESS as Address | undefined,
  governor: process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS as Address | undefined,
};

export const ASSET_ID = BigInt(process.env.NEXT_PUBLIC_ASSET_ID ?? "1");

/** MockUSDT usa 6 decimales. */
export const USDT_DECIMALS = 6;
