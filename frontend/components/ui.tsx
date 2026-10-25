import { formatInt, percent, shortAddress } from "@/lib/format";

/** Flecha "external" de Lucide (trazo 1.5px, currentColor). */
function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

/** Dirección o hash truncado (4 + 4) en `chain`; con `href` enlaza al explorador. */
export function AddressChip({ value, href, label }: { value: string; href?: string; label?: string }) {
  const text = `${label ? `${label} ` : ""}${shortAddress(value)}`;
  if (!href) {
    return (
      <span className="orwa-addr" title={value}>
        {text}
      </span>
    );
  }
  return (
    <a className="orwa-addr" href={href} target="_blank" rel="noreferrer" title={value}>
      {text}
      <ExternalIcon />
    </a>
  );
}

export type BadgeTone = "positive" | "warning" | "danger" | "chain" | "plain";

/** Etiqueta de estado: el color nunca va solo, siempre con texto. */
export function Badge({ tone, children }: { tone: BadgeTone; children: string }) {
  return <span className={`orwa-badge orwa-badge--${tone}`}>{children}</span>;
}

/** Barra de recaudación: vendidas sobre el total. */
export function FundingProgress({ sold, max }: { sold: bigint; max: bigint }) {
  const width = max === 0n ? 0 : Number((sold * 1000n) / max) / 10;
  return (
    <div className="orwa-progress">
      <div
        className="orwa-progress__track"
        role="progressbar"
        aria-valuenow={Math.round(width)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="orwa-progress__fill" style={{ width: `${width}%` }} />
      </div>
      <div className="orwa-progress__meta">
        <span>
          <b>
            {formatInt(sold)} / {formatInt(max)}
          </b>{" "}
          fracciones
        </span>
        <span>
          <b>{percent(sold, max)} %</b> financiado
        </span>
      </div>
    </div>
  );
}

const MAX_CELLS = 200;
const BLOCK_CELLS = 100;

/**
 * Grilla de fracciones: lima = tuyas, gris = de otros dueños, vacía = disponible.
 * Hasta 200 fracciones va una celda por fracción; si son más, 100 celdas que representan un bloque cada una.
 */
export function FractionGrid({ max, sold, mine }: { max: bigint; sold: bigint; mine: bigint }) {
  if (max === 0n) return null;
  const cells = max <= BigInt(MAX_CELLS) ? Number(max) : BLOCK_CELLS;
  const perCell = Number(max) / cells;
  const mineCells = Math.round(Number(mine) / perCell);
  const soldCells = Math.max(mineCells, Math.round(Number(sold) / perCell));
  const others = sold - mine;
  const available = max - sold;

  return (
    <div className="ownership">
      <div
        className="orwa-grid"
        style={{ "--cols": 20 } as React.CSSProperties}
        role="img"
        aria-label={`${formatInt(sold)} de ${formatInt(max)} fracciones vendidas, ${formatInt(mine)} tuyas`}
      >
        {Array.from({ length: cells }, (_, i) => (
          <i key={i} className={i < mineCells ? "mine" : i < soldCells ? "sold" : undefined} />
        ))}
      </div>
      <div className="ownership-legend">
        <span>
          <b className="orwa-num">{formatInt(mine)}</b> tuyas
        </span>
        <span>
          <b className="orwa-num">{formatInt(others)}</b> de otros dueños
        </span>
        <span>
          <b className="orwa-num">{formatInt(available)}</b> disponibles
        </span>
        {perCell > 1 && <span>Cada celda ≈ {formatInt(Math.round(perCell))} fracciones</span>}
      </div>
    </div>
  );
}

/** Cifra clave con rótulo arriba y nota corta abajo. */
export function StatTile({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: string }) {
  return (
    <div className="orwa-stat">
      <span className="orwa-eyebrow">{label}</span>
      <span className="orwa-figure-lg">
        {value}
        {unit && <small>{unit}</small>}
      </span>
      {note && <span className="orwa-stat__note">{note}</span>}
    </div>
  );
}

/**
 * Resultado de una votación con las reglas dibujadas: marca en 2/3 sobre los votos emitidos y estado del
 * quórum (a favor + abstención ≥ 20 % del supply del snapshot).
 */
export function VoteTally(props: {
  forVotes: bigint;
  against: bigint;
  abstain: bigint;
  quorum: bigint | undefined;
  supply: bigint | undefined;
  closing: string | undefined;
}) {
  const { forVotes, against, abstain, quorum, supply, closing } = props;
  const cast = forVotes + against;
  const forWidth = cast === 0n ? 0 : Number((forVotes * 1000n) / cast) / 10;
  const againstWidth = cast === 0n ? 0 : 100 - forWidth;
  const majority = forVotes > 0n && forVotes * 3n >= cast * 2n;
  const quorumReached = quorum !== undefined && forVotes + abstain >= quorum;
  const participation = supply !== undefined ? `${percent(cast + abstain, supply)} %` : "—";

  return (
    <div className="orwa-vote">
      <div
        className="orwa-vote__bar"
        role="img"
        aria-label={`${percent(forVotes, cast)} % a favor, ${percent(against, cast)} % en contra, participación ${participation}. Mayoría 2/3 ${majority ? "alcanzada" : "pendiente"}`}
      >
        <div className="orwa-vote__for" style={{ width: `${forWidth}%` }} />
        <div className="orwa-vote__against" style={{ width: `${againstWidth}%` }} />
        <span className="orwa-vote__mark" style={{ left: "66.67%" }} title="2/3" />
      </div>
      <div className="orwa-vote__legend">
        <span className="for">
          A favor <b>{percent(forVotes, cast)} %</b>
        </span>
        <span>
          Participación <b style={{ color: "var(--ink)" }}>{participation}</b>
        </span>
        <span className="against">
          En contra <b>{percent(against, cast)} %</b>
        </span>
      </div>
      <div className="orwa-vote__rules">
        <span className={majority ? "ok" : "pending"}>{majority ? "✓ Mayoría 2/3" : "Mayoría 2/3 pendiente"}</span>
        <span className={quorumReached ? "ok" : "pending"}>
          {quorumReached
            ? "✓ Quórum 20 %"
            : `Quórum 20 % pendiente${quorum !== undefined ? ` (${formatInt(forVotes + abstain)} / ${formatInt(quorum)})` : ""}`}
        </span>
        {closing && <span>{closing}</span>}
      </div>
    </div>
  );
}
