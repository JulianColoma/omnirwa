import { ConnectButton } from "@/components/ConnectButton";
import { AssetInfo } from "@/components/AssetInfo";
import { BuyFractions } from "@/components/BuyFractions";
import { Dividends } from "@/components/Dividends";
import { IssuerPanel } from "@/components/IssuerPanel";
import { Governance } from "@/components/Governance";
import { Activity } from "@/components/Activity";
import { Contracts } from "@/components/Contracts";
import { Tabs } from "@/components/Tabs";
import { isConfigured } from "@/lib/contracts";

export default function Home() {
  return (
    <main className="page">
      <header className="topbar">
        <span className="wordmark">OmniRWA</span>
        <ConnectButton />
      </header>

      {isConfigured ? (
        <>
          <AssetInfo />
          <Tabs
            tabs={[
              {
                id: "invertir",
                label: "Invertir",
                content: (
                  <>
                    <div className="columns">
                      <BuyFractions />
                      <Dividends />
                    </div>
                    <IssuerPanel />
                  </>
                ),
              },
              {
                id: "gobernanza",
                label: "Gobernanza",
                content: <Governance />,
                empty: "La junta de inversores se habilita cuando el activo esté registrado.",
              },
              { id: "actividad", label: "Actividad", content: <Activity /> },
            ]}
          />
        </>
      ) : (
        <section className="hero">
          <h1 className="title">Falta configurar los contratos</h1>
          <p className="lead">
            Completá <code>frontend/.env.local</code> con las direcciones desplegadas (o corré{" "}
            <code>npm run sync</code> después del deploy) y reiniciá el servidor.
          </p>
        </section>
      )}

      <Contracts />
    </main>
  );
}
