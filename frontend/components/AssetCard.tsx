import Link from "next/link";
import { formatInt, formatUsdt, shortAddress } from "@/lib/format";
import type { AssetSummary } from "@/lib/useAsset";
import { Badge, FundingProgress } from "./ui";

/** Tarjeta de un activo en el listado: estado, nombre, emisor, recaudación y datos clave. */
export function AssetCard({ summary: { id, title, asset, hasGovernor } }: { summary: AssetSummary }) {
  return (
    <Link href={`/activos/${id}`} className="orwa-card card-link">
      <span className="orwa-card__head">
        <Badge tone={asset.saleActive ? "positive" : "plain"}>
          {asset.saleActive ? "Venta abierta" : "Venta cerrada"}
        </Badge>
        {!hasGovernor && <Badge tone="warning">Sin junta</Badge>}
      </span>
      <span>
        <span className="orwa-card__title">{title}</span>
        <span className="orwa-card__issuer card-block">
          Emite <span className="mono">{shortAddress(asset.creator)}</span>
        </span>
      </span>
      <FundingProgress sold={asset.soldFractions} max={asset.maxFractions} />
      <dl className="orwa-card__facts">
        <div>
          <dt>Precio</dt>
          <dd>{formatUsdt(asset.pricePerFraction)} USDT</dd>
        </div>
        <div>
          <dt>Disponibles</dt>
          <dd>{formatInt(asset.maxFractions - asset.soldFractions)}</dd>
        </div>
        <div>
          <dt>Activo</dt>
          <dd>#{id.toString()}</dd>
        </div>
      </dl>
    </Link>
  );
}

/** Acceso al alta, con el mismo formato que una tarjeta de activo. */
export function CreateAssetCard() {
  return (
    <Link href="/crear" className="orwa-card card-link card-new">
      <span className="orwa-card__title">Crear activo</span>
      <span className="orwa-card__issuer">
        Fraccioná un activo real: definís cuántas fracciones hay y a qué precio. Requiere el rol de emisor.
      </span>
    </Link>
  );
}
