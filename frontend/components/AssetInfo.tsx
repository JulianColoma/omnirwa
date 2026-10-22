"use client";

import { ASSET_ID, addressUrl } from "@/lib/contracts";
import { describeError } from "@/lib/errors";
import { formatInt, formatUsdt, percent, shortAddress, shortHash } from "@/lib/format";
import { useAsset } from "@/lib/useAsset";

/** Encabezado del activo: nombre, avance de la venta y datos del struct `Asset`. */
export function AssetInfo() {
  const { asset, paused, governorName, isLoading, error } = useAsset();
  const title = governorName?.replace(/^OmniRWA\s+/, "") || `Activo #${ASSET_ID}`;

  if (error) {
    return (
      <section className="hero">
        <p className="status status-error">No se pudo leer el contrato: {describeError(error)}</p>
      </section>
    );
  }

  if (isLoading || asset === undefined) {
    return (
      <section className="hero">
        <p className="eyebrow">Activo #{ASSET_ID.toString()}</p>
        <h1 className="title placeholder">Cargando…</h1>
      </section>
    );
  }

  if (asset === null) {
    return (
      <section className="hero">
        <p className="eyebrow">Activo #{ASSET_ID.toString()}</p>
        <h1 className="title">{title}</h1>
        <p className="lead">El activo todavía no fue registrado. Un emisor habilitado puede registrarlo desde abajo.</p>
      </section>
    );
  }

  const remaining = asset.maxFractions - asset.soldFractions;
  const raised = asset.soldFractions * asset.pricePerFraction;
  const creatorUrl = addressUrl(asset.creator);

  return (
    <section className="hero">
      <p className="eyebrow">
        Activo #{ASSET_ID.toString()} ·{" "}
        <span className={asset.saleActive && !paused ? "tag tag-on" : "tag"}>
          {paused ? "pausado" : asset.saleActive ? "venta abierta" : "venta cerrada"}
        </span>
      </p>
      <h1 className="title">{title}</h1>

      <div className="progress" aria-label="Fracciones vendidas">
        <div
          className="progress-bar"
          style={{ width: `${asset.maxFractions === 0n ? 0 : Number((asset.soldFractions * 1000n) / asset.maxFractions) / 10}%` }}
        />
      </div>
      <p className="progress-label">
        {formatInt(asset.soldFractions)} de {formatInt(asset.maxFractions)} fracciones vendidas (
        {percent(asset.soldFractions, asset.maxFractions)}%)
      </p>

      <dl className="stats">
        <div>
          <dt>Precio por fracción</dt>
          <dd>{formatUsdt(asset.pricePerFraction)} USDT</dd>
        </div>
        <div>
          <dt>Disponibles</dt>
          <dd>{formatInt(remaining)}</dd>
        </div>
        <div>
          <dt>Recaudado</dt>
          <dd>{formatUsdt(raised)} USDT</dd>
        </div>
        <div>
          <dt>Emisor</dt>
          <dd className="mono">
            {creatorUrl ? (
              <a href={creatorUrl} target="_blank" rel="noreferrer">
                {shortAddress(asset.creator)}
              </a>
            ) : (
              shortAddress(asset.creator)
            )}
          </dd>
        </div>
      </dl>
      <p className="fineprint mono" title={asset.docHash}>
        Legajo {shortHash(asset.docHash)}
      </p>
    </section>
  );
}
