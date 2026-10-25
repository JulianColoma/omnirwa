"use client";

import { useAssets } from "@/lib/useAsset";
import { AssetCard, CreateAssetCard } from "./AssetCard";

/** Listado de todos los activos registrados, del más nuevo al más viejo. */
export function AssetList() {
  const { assets, isLoading } = useAssets();

  return (
    <section className="page-head">
      <div className="section-head">
        <h1 className="title">Activos</h1>
        <p className="hint">
          Cada activo se divide en fracciones. Comprás las que quieras, cobrás tu parte de la renta y votás las decisiones
          con los demás dueños.
        </p>
      </div>
      {isLoading && <p className="hint">Buscando activos…</p>}
      {assets && assets.length === 0 && <p className="empty">Todavía no hay activos registrados.</p>}
      <div className="card-grid">
        {assets?.map((summary) => <AssetCard key={summary.id.toString()} summary={summary} />)}
        <CreateAssetCard />
      </div>
    </section>
  );
}
