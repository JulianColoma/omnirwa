"use client";

import Link from "next/link";
import { isConfigured } from "@/lib/contracts";
import { formatInt, formatUsdt } from "@/lib/format";
import { useAssets } from "@/lib/useAsset";
import { AssetCard } from "./AssetCard";
import { StatTile } from "./ui";

const FEATURED = 3;
const GRID_COLS = 8;
const GRID_ROWS = 7;
const GRID_OWNED = 35;

/** Motivo de la portada: bloques de marca y la grilla de fracciones, financiada al 62 % desde abajo. */
function CoverArt() {
  const cells = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
    const row = Math.floor(i / GRID_COLS);
    const col = i % GRID_COLS;
    const fromBottom = (GRID_ROWS - 1 - row) * GRID_COLS + col;
    return { x: 288 + col * 24, y: 88 + row * 24, owned: fromBottom < GRID_OWNED };
  });

  return (
    <svg className="cover-art" viewBox="0 0 480 288" aria-hidden="true">
      <rect className="cover-accent" x="16" y="-16" width="128" height="240" rx="12" />
      <rect className="cover-chain" x="16" y="240" width="64" height="24" rx="4" />
      <rect className="cover-agro" x="160" y="96" width="96" height="168" rx="12" />
      <rect className="cover-ink" x="272" y="72" width="224" height="192" rx="12" />
      {cells.map((c) => (
        <rect
          key={`${c.x}-${c.y}`}
          className={c.owned ? "cover-accent" : "cover-cut"}
          x={c.x}
          y={c.y}
          width="16"
          height="16"
          rx="4"
        />
      ))}
    </svg>
  );
}

const STEPS = [
  {
    title: "Comprá fracciones",
    text: "Elegís un activo real —una obra, una cosecha, una máquina— y comprás las fracciones que quieras desde 10 USDT.",
  },
  {
    title: "Cobrás tu parte",
    text: "El emisor deposita la renta y cada dueño retira su parte, proporcional a sus fracciones, cuando quiera.",
  },
  {
    title: "Votá las decisiones",
    text: "Cerrar la venta, vender el activo, contratar una obra: se decide en la junta, una fracción es un voto.",
  },
] as const;

/** Home: qué es OmniRWA, cifras on-chain, cómo funciona, las reglas de la junta y los últimos activos. */
export function Landing() {
  const { assets } = useAssets();
  const sold = assets?.reduce((sum, { asset }) => sum + asset.soldFractions, 0n);
  const raised = assets?.reduce((sum, { asset }) => sum + asset.soldFractions * asset.pricePerFraction, 0n);
  const open = assets?.filter(({ asset }) => asset.saleActive).length;

  return (
    <>
      <section className="landing-hero">
        <div className="landing-hero__words">
          <h1 className="display">Sé dueño de una parte</h1>
          <p className="lead">
            Fracciones de activos reales, con renta y voto. Comprás desde 10 USDT, cobrás tu parte de la renta y decidís
            con los demás dueños. Todo queda registrado on-chain y cualquiera lo puede verificar.
          </p>
          <div className="button-row">
            <Link href="/activos" className="orwa-btn orwa-btn--primary">
              Ver activos
            </Link>
            <Link href="/crear" className="orwa-btn orwa-btn--secondary">
              Crear activo
            </Link>
          </div>
        </div>
        <CoverArt />
      </section>

      {isConfigured && (
        <section className="section">
          <div className="stats">
            <StatTile label="Activos" value={assets ? formatInt(assets.length) : "—"} note={open !== undefined ? `${formatInt(open)} con venta abierta` : undefined} />
            <StatTile label="Fracciones vendidas" value={sold !== undefined ? formatInt(sold) : "—"} />
            <StatTile label="Recaudado" value={raised !== undefined ? formatUsdt(raised) : "—"} unit="USDT" />
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Cómo funciona</h2>
        </div>
        <ol className="steps">
          {STEPS.map(({ title, text }, i) => (
            <li key={title} className="orwa-card">
              <span className="orwa-eyebrow">Paso {i + 1}</span>
              <h3 className="orwa-card__title">{title}</h3>
              <p className="hint">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Las reglas, a la vista</h2>
          <p className="hint">Están escritas en los contratos: nadie las puede cambiar después de votar.</p>
        </div>
        <div className="stats">
          <StatTile label="Mayoría" value="2/3" note="De los votos emitidos, a favor. Protege a la minoría." />
          <StatTile label="Quórum" value="20" unit="%" note="De las fracciones tienen que participar." />
          <StatTile label="Snapshot" value="1" unit="fracción = 1 voto" note="Vale lo que tenías al crear la propuesta." />
        </div>
      </section>

      {assets && assets.length > 0 && (
        <section className="section">
          <div className="section-head section-head--row">
            <h2>Últimos activos</h2>
            <Link href="/activos" className="orwa-btn orwa-btn--ghost orwa-btn--sm">
              Ver todos
            </Link>
          </div>
          <div className="card-grid">
            {assets.slice(0, FEATURED).map((summary) => (
              <AssetCard key={summary.id.toString()} summary={summary} />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <p className="hint">
          Invertir en activos reales tiene riesgo. La renta depende del emisor de cada activo: revisá quién emite y su
          legajo antes de comprar.
        </p>
      </section>
    </>
  );
}
