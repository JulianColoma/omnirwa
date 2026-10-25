"use client";

import { addressUrl } from "@/lib/contracts";
import { describeError } from "@/lib/errors";
import { formatInt, formatUsdt } from "@/lib/format";
import { useAsset, usePosition } from "@/lib/useAsset";
import { AddressChip, Badge, FractionGrid, FundingProgress, StatTile } from "./ui";

/** Encabezado del activo, visible en todas las pestañas: estado, nombre, emisor y recaudación. */
export function AssetHeader() {
  const { assetId, asset, title, paused, governorStatus, isLoading, error } = useAsset();
  const label = `Activo #${assetId?.toString() ?? ""}`;

  if (error) {
    return (
      <section className="page-head">
        <p className="status status-error">No se pudo leer el contrato: {describeError(error)}</p>
      </section>
    );
  }

  if (isLoading || asset === undefined) {
    return (
      <section className="page-head">
        <span className="orwa-eyebrow">{label}</span>
        <h1 className="title placeholder">Cargando…</h1>
      </section>
    );
  }

  if (asset === null) {
    return (
      <section className="page-head">
        <span className="orwa-eyebrow">{label}</span>
        <h1 className="title">Este activo no existe</h1>
        <p className="hint">Volvé al listado y elegí otro, o creá uno nuevo.</p>
      </section>
    );
  }

  return (
    <section className="page-head">
      <div className="asset-head__meta">
        <span className="orwa-eyebrow">{label}</span>
        {paused ? (
          <Badge tone="warning">Compras pausadas</Badge>
        ) : asset.saleActive ? (
          <Badge tone="positive">Venta abierta</Badge>
        ) : (
          <Badge tone="plain">Venta cerrada</Badge>
        )}
        {governorStatus === "valid" && <Badge tone="chain">Registrado on-chain</Badge>}
      </div>
      <div>
        <h1 className="title">{title}</h1>
        <p className="issuer">
          Emite <AddressChip value={asset.creator} href={addressUrl(asset.creator)} />
        </p>
      </div>
      <FundingProgress sold={asset.soldFractions} max={asset.maxFractions} />
    </section>
  );
}

/** Pestaña Resumen: quién tiene las fracciones, cifras clave y datos verificables del activo. */
export function AssetSummary() {
  const { asset, linkedGovernor } = useAsset();
  const { fractions } = usePosition();

  if (!asset) return null;

  const remaining = asset.maxFractions - asset.soldFractions;
  const raised = asset.soldFractions * asset.pricePerFraction;

  return (
    <div className="section">
      <div className="orwa-card">
        <h2 className="card-title">Fracciones</h2>
        <FractionGrid max={asset.maxFractions} sold={asset.soldFractions} mine={fractions ?? 0n} />
      </div>
      <div className="stats">
        <StatTile label="Precio por fracción" value={formatUsdt(asset.pricePerFraction)} unit="USDT" />
        <StatTile
          label="Recaudado"
          value={formatUsdt(raised)}
          unit="USDT"
          note={`${formatInt(asset.soldFractions)} fracciones vendidas`}
        />
        <StatTile label="Disponibles" value={formatInt(remaining)} note={`De ${formatInt(asset.maxFractions)} fracciones`} />
      </div>
      <div className="orwa-card">
        <h2 className="card-title">Datos on-chain</h2>
        <dl className="contracts">
          <div>
            <dt>Emisor</dt>
            <dd>
              <AddressChip value={asset.creator} href={addressUrl(asset.creator)} />
            </dd>
          </div>
          <div>
            <dt>Hash del legajo</dt>
            <dd>
              <AddressChip value={asset.docHash} />
            </dd>
          </div>
          <div>
            <dt>Junta (OmniGovernor)</dt>
            <dd>
              {linkedGovernor ? (
                <AddressChip
                  value={linkedGovernor}
                  href={addressUrl(linkedGovernor) && `${addressUrl(linkedGovernor)}#code`}
                />
              ) : (
                <span className="hint">Sin vincular</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
