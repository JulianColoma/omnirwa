// Copia los ABIs compilados por Foundry (../out) a lib/abis/*.json para el frontend.
// Uso: desde la raíz `forge build`, luego `cd frontend && npm run abis`.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const contracts = {
  MockUSDT: "MockUSDT.sol/MockUSDT.json",
  RWATokenizer1155: "RWATokenizer1155.sol/RWATokenizer1155.json",
  AssetVotes: "AssetVotes.sol/AssetVotes.json",
  OmniGovernor: "OmniGovernor.sol/OmniGovernor.json",
};

const outDir = join(process.cwd(), "lib", "abis");
mkdirSync(outDir, { recursive: true });

for (const [name, path] of Object.entries(contracts)) {
  const artifact = JSON.parse(readFileSync(join(process.cwd(), "..", "out", path), "utf8"));
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(artifact.abi, null, 2));
  console.log(`✓ ${name}`);
}
