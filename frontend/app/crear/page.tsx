import type { Metadata } from "next";
import { CreateAsset } from "@/components/CreateAsset";
import { NotConfigured } from "@/components/NotConfigured";
import { isConfigured } from "@/lib/contracts";

export const metadata: Metadata = { title: "Crear activo · OmniRWA" };

export default function CreatePage() {
  if (!isConfigured) return <NotConfigured />;

  return (
    <section className="page-head">
      <div className="section-head">
        <h1 className="title">Crear activo</h1>
        <p className="hint">
          Fraccioná un activo real: definís cuántas fracciones hay y a qué precio. Necesitás el rol de emisor; la junta
          de inversores la arma después el administrador.
        </p>
      </div>
      <CreateAsset />
    </section>
  );
}
