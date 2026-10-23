"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { keccak256, parseUnits, toBytes } from "viem";
import { abis, addresses, ASSET_ID, USDT_DECIMALS } from "@/lib/contracts";
import { formatInt, formatUsdt } from "@/lib/format";
import { useAsset, useCanWrite, useIsIssuer, usePosition } from "@/lib/useAsset";
import { useTx } from "@/lib/useTx";
import { TxStatus } from "./TxStatus";

const MAX_UINT64 = 2n ** 64n - 1n;
const MAX_UINT128 = 2n ** 128n - 1n;

function parseUsdt(value: string): bigint | undefined {
  if (!/^\d+([.,]\d{0,6})?$/.test(value)) return undefined;
  const amount = parseUnits(value.replace(",", "."), USDT_DECIMALS);
  return amount > 0n ? amount : undefined;
}

/** Herramientas del emisor: registrar el activo (ISSUER_ROLE) y depositar dividendos (creador). */
export function IssuerPanel() {
  const { address } = useAccount();
  const { asset } = useAsset();
  const isIssuer = useIsIssuer();

  if (asset === null && isIssuer) return <RegisterAsset />;
  if (asset && address && asset.creator.toLowerCase() === address.toLowerCase()) return <DepositDividends />;
  return null;
}

function RegisterAsset() {
  const { canWrite, gate } = useCanWrite();
  const { writeContractAsync } = useWriteContract();
  const tx = useTx();
  const [fractions, setFractions] = useState("1000");
  const [price, setPrice] = useState("10");
  const [doc, setDoc] = useState("");

  const { data: nextId } = useReadContract({
    address: addresses.tokenizer,
    abi: abis.tokenizer,
    functionName: "nextAssetId",
    query: { enabled: Boolean(addresses.tokenizer) },
  });

  const maxFractions = /^\d+$/.test(fractions) ? BigInt(fractions) : 0n;
  const pricePerFraction = parseUsdt(price) ?? 0n;
  const valid = maxFractions > 0n && maxFractions <= MAX_UINT64 && pricePerFraction > 0n && pricePerFraction <= MAX_UINT128;
  const wrongId = nextId !== undefined && nextId !== ASSET_ID;

  const register = () =>
    tx.run((step) =>
      step("registro del activo", () =>
        writeContractAsync({
          address: addresses.tokenizer!,
          abi: abis.tokenizer,
          functionName: "registerAsset",
          args: [maxFractions, pricePerFraction, keccak256(toBytes(doc.trim()))],
        }),
      ),
    );

  return (
    <section className="panel panel-wide">
      <h2>Registrar activo</h2>
      <p className="hint">Tu cuenta tiene el rol de emisor. El activo se registra con la venta abierta.</p>
      <div className="fields">
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
      {valid && (
        <p className="hint">
          {formatInt(maxFractions)} fracciones a {formatUsdt(pricePerFraction)} USDT · objetivo{" "}
          {formatUsdt(maxFractions * pricePerFraction)} USDT. On-chain se guarda solo el hash del legajo.
        </p>
      )}
      {wrongId && (
        <p className="hint status-error">
          El próximo id libre es {nextId.toString()}, pero esta interfaz está configurada para el activo #
          {ASSET_ID.toString()}.
        </p>
      )}
      <button className="button" disabled={!canWrite || !valid || !doc.trim() || wrongId || tx.busy} onClick={register}>
        Registrar
      </button>
      {gate && <p className="hint">{gate}</p>}
      <TxStatus state={tx.state} />
    </section>
  );
}

function DepositDividends() {
  const { asset } = useAsset();
  const { usdtBalance, allowance } = usePosition();
  const { canWrite, gate } = useCanWrite();
  const { writeContractAsync } = useWriteContract();
  const tx = useTx();
  const [input, setInput] = useState("");

  if (!asset) return null;

  const amount = parseUsdt(input);
  const supply = asset.soldFractions;
  const needsApproval = amount !== undefined && allowance !== undefined && allowance < amount;

  let problem: string | undefined;
  if (supply === 0n) problem = "Todavía no hay fracciones vendidas.";
  else if (input !== "" && amount === undefined) problem = "Ingresá un monto válido (hasta 6 decimales).";
  else if (amount !== undefined && usdtBalance !== undefined && usdtBalance < amount) problem = "No tenés USDT suficiente.";

  const deposit = () =>
    amount !== undefined &&
    tx.run(async (step) => {
      if (needsApproval) {
        await step("aprobación de USDT", () =>
          writeContractAsync({
            address: addresses.usdt!,
            abi: abis.usdt,
            functionName: "approve",
            args: [addresses.tokenizer!, amount],
          }),
        );
      }
      await step("depósito de dividendos", () =>
        writeContractAsync({
          address: addresses.tokenizer!,
          abi: abis.tokenizer,
          functionName: "depositDividends",
          args: [ASSET_ID, amount],
        }),
      );
      setInput("");
    });

  return (
    <section className="panel panel-wide">
      <h2>Depositar dividendos</h2>
      <p className="hint">
        Sos el emisor de este activo. Lo que deposites se reparte entre las {formatInt(supply)} fracciones emitidas
        hoy; cada titular lo retira cuando quiere.
      </p>
      <div className="fields">
        <label className="field">
          <span>Monto (USDT)</span>
          <input inputMode="decimal" placeholder="800" value={input} onChange={(e) => setInput(e.target.value)} />
        </label>
        <div className="field">
          <span>Por fracción</span>
          <p className="num field-value">
            {amount !== undefined && supply > 0n ? `${formatUsdt(amount / supply)} USDT` : "—"}
          </p>
        </div>
        <div className="field">
          <span>Tu saldo</span>
          <p className="num field-value">{usdtBalance !== undefined ? `${formatUsdt(usdtBalance)} USDT` : "—"}</p>
        </div>
      </div>
      <button
        className="button"
        disabled={!canWrite || amount === undefined || Boolean(problem) || tx.busy}
        onClick={deposit}
      >
        {needsApproval ? "Aprobar y depositar" : "Depositar"}
      </button>
      {problem && <p className="hint">{problem}</p>}
      {gate && <p className="hint">{gate}</p>}
      <TxStatus state={tx.state} />
    </section>
  );
}
