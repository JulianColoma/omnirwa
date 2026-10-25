// Copia los ABIs compilados por Foundry (../out) a lib/abis/*.ts como `as const`, para que wagmi/viem
// infieran los tipos de argumentos y retornos. De los contratos que despliega el creador de cada activo
// (AssetVotes y OmniGovernor) también exporta el bytecode.
// Uso: desde la raíz `forge build`, luego `cd frontend && npm run abis`.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const contracts = {
  MockUSDT: "MockUSDT.sol/MockUSDT.json",
  RWATokenizer1155: "RWATokenizer1155.sol/RWATokenizer1155.json",
  AssetVotes: "AssetVotes.sol/AssetVotes.json",
  OmniGovernor: "OmniGovernor.sol/OmniGovernor.json",
};

const deployable = new Set(["AssetVotes", "OmniGovernor"]);

const outDir = join(process.cwd(), "lib", "abis");
mkdirSync(outDir, { recursive: true });

for (const [name, path] of Object.entries(contracts)) {
  const artifact = JSON.parse(readFileSync(join(process.cwd(), "..", "out", path), "utf8"));
  let source = `// Generado por scripts/export-abis.mjs. No editar a mano.\nexport const ${name}Abi = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`;
  if (deployable.has(name)) source += `\nexport const ${name}Bytecode = "${artifact.bytecode.object}" as const;\n`;
  writeFileSync(join(outDir, `${name}.ts`), source);
  const legacy = join(outDir, `${name}.json`);
  if (existsSync(legacy)) rmSync(legacy);
  process.stdout.write(`${name}\n`);
}
