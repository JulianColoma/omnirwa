import { ConnectButton } from "@/components/ConnectButton";
import { AssetInfo } from "@/components/AssetInfo";
import { BuyFractions } from "@/components/BuyFractions";
import { Dividends } from "@/components/Dividends";
import { Governance } from "@/components/Governance";

export default function Home() {
  return (
    <main>
      <header>
        <h1>OmniRWA</h1>
        <ConnectButton />
      </header>
      <AssetInfo />
      <BuyFractions />
      <Dividends />
      <Governance />
    </main>
  );
}
