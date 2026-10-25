import type { Metadata } from "next";
import { AssetList } from "@/components/AssetList";
import { NotConfigured } from "@/components/NotConfigured";
import { isConfigured } from "@/lib/contracts";

export const metadata: Metadata = { title: "Activos · OmniRWA" };

export default function AssetsPage() {
  return isConfigured ? <AssetList /> : <NotConfigured />;
}
