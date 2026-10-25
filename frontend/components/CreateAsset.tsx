"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount, useBalance, useDeployContract, useWriteContract } from "wagmi";
import { formatEther, keccak256, parseEventLogs, stringToHex, toBytes } from "viem";
import {
  abis,
  addresses,
  bytecodes,
  chain,
  DEFAULT_VOTING_MINUTES,
  GOVERNOR_NAME_PREFIX,
} from "@/lib/contracts";
import { formatInt, formatUsdt, parseUsdt } from "@/lib/format";
import { useAsset, useCanWrite, useRoles } from "@/lib/useAsset";
import { useTx } from "@/lib/useTx";
import { TxStatus } from "./TxStatus";

const MAX_UINT64 = 2n ** 64n - 1n;
const MAX_UINT128 = 2n ** 128n - 1n;
/** El nombre se guarda on-chain como bytes32: hasta 32 bytes en UTF-8 (las tildes ocupan 2). */
const MAX_NAME_BYTES = 32;
const MAX_VOTING_MINUTES = Math.floor((2 ** 32 - 1) / 60);

function parseMinutes(value: string): number | undefined {
  if (!/^\d+$/.test(value)) return undefined;
  const minutes = Number(value);
  return minutes > 0 && minutes <= MAX_VOTING_MINUTES ? minutes : undefined;
}

/**
 * Alta de un activo: una sola transacción (`registerAsset`, requiere `ISSUER_ROLE`). La junta se arma aparte,
 * desde la pestaña Emisor del activo.
 */
export function CreateAsset() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { isIssuer } = useRoles();
  const { canWrite, gate } = useCanWrite();
  const { writeContractAsync } = useWriteContract();
  const tx = useTx();
  const [name, setName] = useState("");
  const [fractions, setFractions] = useState("1000");
  const [price, setPrice] = useState("10");
  const [doc, setDoc] = useState("");

  const maxFractions = /^\d+$/.test(fractions) ? BigInt(fractions) : 0n;
  const pricePerFraction = parseUsdt(price) ?? 0n;
  const nameBytes = new TextEncoder().encode(name.trim()).length;
  const valid =
    nameBytes > 0 &&
    nameBytes <= MAX_NAME_BYTES &&
    doc.trim() !== "" &&
    maxFractions > 0n &&
    maxFractions <= MAX_UINT64 &&
    pricePerFraction > 0n &&
    pricePerFraction <= MAX_UINT128;

  const create = async () => {
    let id: bigint | undefined;
    const ok = await tx.run(async (step) => {
      const receipt = await step("registro del activo", (fees) =>
        writeContractAsync({
          ...fees,
          address: addresses.tokenizer!,
          abi: abis.tokenizer,
          functionName: "registerAsset",
          args: [
            maxFractions,
            pricePerFraction,
            keccak256(toBytes(doc.trim())),
            stringToHex(name.trim(), { size: MAX_NAME_BYTES }),
          ],
        }),
      );
      const [registered] = parseEventLogs({ abi: abis.tokenizer, eventName: "AssetRegistered", logs: receipt.logs });
      id = registered.args.id;
    });
    if (ok && id !== undefined) router.push(`/activos/${id}#emisor`);
  };

  return (
    <section className="orwa-card">
      <h2 className="card-title">Datos del activo</h2>
      <p className="hint">
        Quedás como emisor del activo: cobrás cada compra y depositás la renta para los dueños. Registrar requiere el rol
        de emisor (<code>ISSUER_ROLE</code>).
      </p>
      <div className="fields">
        <label className="field field-grow">
          <span>Nombre del activo</span>
          <input placeholder="Lote de soja Pergamino" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Fracciones</span>
          <input inputMode="numeric" value={fractions} onChange={(e) => setFractions(e.target.value.replace(/\D/g, ""))} />
        </label>
        <label className="field">
          <span>Precio por fracción (USDT)</span>
          <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="field field-grow">
          <span>Referencia del legajo</span>
          <input placeholder="ipfs://…" value={doc} onChange={(e) => setDoc(e.target.value)} />
        </label>
      </div>
      {nameBytes > MAX_NAME_BYTES && (
        <p className="hint status-error">
          El nombre es demasiado largo: se guarda on-chain y entra hasta {MAX_NAME_BYTES} bytes (las tildes y la ñ ocupan
          2).
        </p>
      )}
      {valid && (
        <p className="hint">
          {formatInt(maxFractions)} fracciones a {formatUsdt(pricePerFraction)} USDT · objetivo{" "}
          {formatUsdt(maxFractions * pricePerFraction)} USDT. On-chain se guardan el nombre y el hash del legajo.
        </p>
      )}
      <p className="hint">
        Es una sola transacción. La junta de inversores se arma después, en la pestaña Emisor.
      </p>
      <button
        className="orwa-btn orwa-btn--primary"
        disabled={!canWrite || !isIssuer || !valid || tx.busy}
        onClick={create}
      >
        Crear activo
      </button>
      {isConnected && isIssuer === false && (
        <p className="hint status-error">
          Tu cuenta no tiene el rol de emisor. Pedile al administrador que te lo otorgue para registrar activos.
        </p>
      )}
      {gate && <p className="hint">{gate}</p>}
      <TxStatus state={tx.state} />
    </section>
  );
}

/**
 * Para el administrador, en un activo sin junta: despliega AssetVotes + OmniGovernor("OmniRWA <nombre del activo>") y los
 * vincula con `setAssetGovernor` (solo `DEFAULT_ADMIN_ROLE`). Son 3 transacciones; desplegar el Governor es lo caro.
 */
export function SetupGovernance() {
  const { address } = useAccount();
  const { assetId, title } = useAsset();
  const { canWrite, gate } = useCanWrite();
  const { deployContractAsync } = useDeployContract();
  const { writeContractAsync } = useWriteContract();
  const { data: balance } = useBalance({ address, chainId: chain.id });
  const tx = useTx();
  const [minutes, setMinutes] = useState(String(DEFAULT_VOTING_MINUTES));

  const votingMinutes = parseMinutes(minutes);
  const valid = votingMinutes !== undefined;

  const setup = () =>
    assetId !== undefined &&
    votingMinutes !== undefined &&
    tx.run(async (step) => {
      const votesReceipt = await step("despliegue del adaptador de votos", (fees) =>
        deployContractAsync({ ...fees, abi: abis.votes, bytecode: bytecodes.votes, args: [addresses.tokenizer!, assetId] }),
      );
      const votes = votesReceipt.contractAddress;
      if (!votes) throw new Error("El despliegue de AssetVotes no devolvió una dirección.");

      const governorReceipt = await step("despliegue de la junta de inversores", (fees) =>
        deployContractAsync({
          ...fees,
          abi: abis.governor,
          bytecode: bytecodes.governor,
          args: [votes, `${GOVERNOR_NAME_PREFIX}${title}`, votingMinutes * 60],
        }),
      );
      const governor = governorReceipt.contractAddress;
      if (!governor) throw new Error("El despliegue de OmniGovernor no devolvió una dirección.");

      await step("vinculación de la junta al activo", (fees) =>
        writeContractAsync({
          ...fees,
          address: addresses.tokenizer!,
          abi: abis.tokenizer,
          functionName: "setAssetGovernor",
          args: [assetId, governor],
        }),
      );
    });

  return (
    <section className="orwa-card">
      <h2 className="card-title">Armar la junta de inversores</h2>
      <p className="hint">
        El activo todavía no tiene junta, así que no se puede votar. Se despliegan un adaptador de votos y un Governor, y
        se vinculan al activo: 3 transacciones. El Governor consume ~24M de gas; con las tarifas que propone el sitio y
        la red tranquila cuesta menos de 0,001 ETH. Si MetaMask muestra un costo mayor, elegí la tarifa del sitio.
      </p>
      <div className="fields">
        <div className="field field-grow">
          <span>Nombre de la junta</span>
          <p className="field-value">
            {GOVERNOR_NAME_PREFIX}
            {title}
          </p>
        </div>
        <label className="field">
          <span>Duración de la votación (min)</span>
          <input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} />
        </label>
      </div>
      {balance && (
        <p className="hint">
          Tu saldo:{" "}
          <span className="num">
            {Number(formatEther(balance.value)).toLocaleString("es-AR", { maximumFractionDigits: 4 })} ETH
          </span>
        </p>
      )}
      <button className="orwa-btn orwa-btn--secondary" disabled={!canWrite || !valid || tx.busy} onClick={setup}>
        Armar la junta
      </button>
      {gate && <p className="hint">{gate}</p>}
      <TxStatus state={tx.state} />
    </section>
  );
}
