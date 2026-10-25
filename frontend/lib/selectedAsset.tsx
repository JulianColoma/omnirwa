"use client";

import { createContext, useContext, type ReactNode } from "react";

const SelectedAssetContext = createContext<bigint | undefined>(undefined);

/** Activo de la página actual (`/activos/[id]`): lo leen todos los hooks y paneles del detalle. */
export function SelectedAssetProvider({ assetId, children }: { assetId: bigint; children: ReactNode }) {
  return <SelectedAssetContext.Provider value={assetId}>{children}</SelectedAssetContext.Provider>;
}

/** Id del activo de la página, o undefined fuera del detalle de un activo. */
export function useSelectedAsset(): { assetId: bigint | undefined } {
  return { assetId: useContext(SelectedAssetContext) };
}
