import Link from "next/link";
import { AssetView } from "@/components/AssetView";
import { NotConfigured } from "@/components/NotConfigured";
import { isConfigured } from "@/lib/contracts";

export default function AssetPage({ params }: { params: { id: string } }) {
  if (!isConfigured) return <NotConfigured />;

  if (!/^\d+$/.test(params.id) || BigInt(params.id) === 0n) {
    return (
      <section className="page-head">
        <h1 className="title">Este activo no existe</h1>
        <Link href="/activos" className="orwa-btn orwa-btn--secondary">
          Ver activos
        </Link>
      </section>
    );
  }

  return <AssetView assetId={BigInt(params.id)} />;
}
