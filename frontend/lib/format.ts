import { formatUnits, parseUnits } from "viem";
import { USDT_DECIMALS } from "./contracts";

const integer = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function formatInt(value: bigint | number): string {
  return integer.format(typeof value === "bigint" ? Number(value) : value);
}

/** Monto de USDT (6 decimales) con hasta 2 decimales visibles. */
export function formatUsdt(value: bigint): string {
  return money.format(Number(formatUnits(value, USDT_DECIMALS)));
}

/** Monto de USDT escrito por el usuario (hasta 6 decimales, coma o punto); undefined si no es válido o es 0. */
export function parseUsdt(value: string): bigint | undefined {
  if (!/^\d+([.,]\d{0,6})?$/.test(value)) return undefined;
  const amount = parseUnits(value.replace(",", "."), USDT_DECIMALS);
  return amount > 0n ? amount : undefined;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

/** Porcentaje con un decimal; 0 si el total es 0. */
export function percent(part: bigint, total: bigint): string {
  if (total === 0n) return "0";
  const basisPoints = Number((part * 10_000n) / total);
  return (basisPoints / 100).toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

/** Tiempo restante en formato corto: "9 min 12 s", "1 h 05 min". */
export function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "0 s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")} min`;
  if (m > 0) return s === 0 ? `${m} min` : `${m} min ${String(s).padStart(2, "0")} s`;
  return `${s} s`;
}
