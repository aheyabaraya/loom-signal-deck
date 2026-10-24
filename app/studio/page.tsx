import type { Metadata } from "next";
import { StudioDashboard } from "../../components/marketing/StudioDashboard";
import { SiteHeader } from "../../components/SiteHeader";
import { marketingCampaigns } from "../../data/marketingCampaigns";
import versionRegistry from "../../docs/governance/version-registry.json";
import { getStudioMode } from "../../lib/marketing/config";

export const metadata: Metadata = {
  title: "Studio · Loom Signal Deck",
  description: "Read-only Loom product contracts, campaign entries, signal aggregates, and release gates."
};

export default function StudioPage() {
  const registry = {
    productVersion: versionRegistry.productVersion,
    releaseState: versionRegistry.releaseState,
    contracts: versionRegistry.contracts.map((contract) => ({
      id: contract.id,
      version: contract.version,
      status: contract.status
    }))
  };

  return (
    <main className="shell section-shell marketing-shell studio-shell">
      <div className="stage-texture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <SiteHeader active="studio" />
      <section className="section-hero marketing-page-hero">
        <div>
          <p>Operator Console</p>
          <h1>Studio</h1>
        </div>
        <span>
          One read-only surface for web-owned contract versions, campaign entry points, privacy-safe aggregates, and sequential release gates.
        </span>
      </section>
      <StudioDashboard campaigns={marketingCampaigns} mode={getStudioMode()} registry={registry} />
    </main>
  );
}
