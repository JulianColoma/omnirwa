"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { SelectedAssetProvider } from "@/lib/selectedAsset";
import { useAsset, useRoles } from "@/lib/useAsset";
import { Activity } from "./Activity";
import { AssetHeader, AssetSummary } from "./AssetInfo";
import { BuyFractions } from "./BuyFractions";
import { Dividends } from "./Dividends";
import { Governance } from "./Governance";
import { IssuerPanel } from "./IssuerPanel";

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "invertir", label: "Invertir" },
  { id: "junta", label: "Junta" },
  { id: "actividad", label: "Actividad" },
  { id: "emisor", label: "Emisor" },
] as const;

type Tab = (typeof TABS)[number]["id"];

function isTab(value: string): value is Tab {
  return TABS.some((t) => t.id === value);
}

/** Pestaña elegida, sincronizada con el `#hash` de la URL para poder compartir el link. */
function useTab(): [Tab, (tab: Tab) => void] {
  const [tab, setTab] = useState<Tab>("resumen");

  useEffect(() => {
    const read = () => {
      const hash = window.location.hash.slice(1);
      setTab(isTab(hash) ? hash : "resumen");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const select = (next: Tab) => {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
  };

  return [tab, select];
}

function AssetTabs() {
  const { address } = useAccount();
  const { asset, governorStatus } = useAsset();
  const { isAdmin } = useRoles();
  const [tab, setTab] = useTab();

  if (!asset) return null;

  const isCreator = Boolean(address && asset.creator.toLowerCase() === address.toLowerCase());
  const showIssuer = isCreator || (Boolean(isAdmin) && governorStatus === "none");
  const tabs = TABS.filter((t) => t.id !== "emisor" || showIssuer);
  const current = tab === "emisor" && !showIssuer ? "resumen" : tab;

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Secciones del activo">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={current === id}
            aria-controls={`panel-${id}`}
            className={current === id ? "tab active" : "tab"}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${current}`} aria-labelledby={`tab-${current}`}>
        {current === "resumen" && <AssetSummary />}
        {current === "invertir" && (
          <div className="section columns">
            <BuyFractions />
            <Dividends />
          </div>
        )}
        {current === "junta" && <Governance />}
        {current === "actividad" && <Activity />}
        {current === "emisor" && <IssuerPanel />}
      </div>
    </>
  );
}

/** Detalle de un activo: encabezado fijo y el resto dividido en pestañas. */
export function AssetView({ assetId }: { assetId: bigint }) {
  return (
    <SelectedAssetProvider assetId={assetId}>
      <AssetHeader />
      <AssetTabs />
    </SelectedAssetProvider>
  );
}
