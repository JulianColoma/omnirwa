// Escribe en .env.local las direcciones de ../deployments/<chainId>.json (generado por Deploy.s.sol).
// Uso: `npm run sync` (Sepolia) o `npm run sync -- 31337` (anvil). Conserva el resto de las variables.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const chainId = process.argv[2] ?? "11155111";
const deploymentPath = join(process.cwd(), "..", "deployments", `${chainId}.json`);
if (!existsSync(deploymentPath)) {
  const hint = chainId === "31337" ? "" : " ¿Quisiste `npm run sync -- 31337` (anvil)?";
  process.stderr.write(`No hay deploy para la red ${chainId} (falta deployments/${chainId}.json).${hint}\n`);
  process.exit(1);
}
const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));

const values = {
  NEXT_PUBLIC_CHAIN_ID: chainId,
  NEXT_PUBLIC_USDT_ADDRESS: deployment.MockUSDT,
  NEXT_PUBLIC_TOKENIZER_ADDRESS: deployment.RWATokenizer1155,
  NEXT_PUBLIC_GOVERNOR_ADDRESS: deployment.OmniGovernor,
  NEXT_PUBLIC_ASSET_ID: String(deployment.assetId ?? 1),
  NEXT_PUBLIC_START_BLOCK: String(deployment.startBlock ?? 0),
};

const envPath = join(process.cwd(), ".env.local");
const lines = existsSync(envPath) ? readFileSync(envPath, "utf8").split(/\r?\n/) : [];
const pending = new Set(Object.keys(values));

const updated = lines.map((line) => {
  const key = line.split("=")[0]?.trim();
  if (!pending.has(key)) return line;
  pending.delete(key);
  return `${key}=${values[key]}`;
});
for (const key of pending) updated.push(`${key}=${values[key]}`);

writeFileSync(envPath, updated.filter((line, i, all) => line !== "" || i < all.length - 1).join("\n") + "\n");
process.stdout.write(`.env.local actualizado para la red ${chainId}\n`);
