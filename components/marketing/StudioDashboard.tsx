"use client";

import { useEffect, useMemo, useState } from "react";
import type { MarketingCampaign } from "../../data/marketingCampaigns";
import type { MarketingSummary } from "../../lib/marketing/contracts";
import { readLocalMarketingEvents } from "../../lib/marketing/client";
import type { StudioMode } from "../../lib/marketing/config";

export type StudioRegistrySummary = {
  productVersion: string;
  releaseState: string;
  contracts: Array<{ id: string; version: string; status: string }>;
};

export function StudioDashboard({
  mode,
  registry,
  campaigns
}: {
  mode: StudioMode;
  registry: StudioRegistrySummary;
  campaigns: MarketingCampaign[];
}) {
  const [localEvents, setLocalEvents] = useState(() => [] as ReturnType<typeof readLocalMarketingEvents>);
  const [databaseSummary, setDatabaseSummary] = useState<MarketingSummary | null>(null);
  const [status, setStatus] = useState("Reading the current browser preview.");

  useEffect(() => {
    setLocalEvents(readLocalMarketingEvents());
    if (mode !== "database") {
      setStatus(
        mode === "preview"
          ? "Preview mode: counts below come only from this browser and are not production performance."
          : "Studio data access is off. Contract and release state remain readable."
      );
      return;
    }

    let active = true;
    void fetch("/api/marketing/summary?days=30", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as
          | { summary?: MarketingSummary; error?: { message?: string } }
          | null;
        if (!response.ok) throw new Error(body?.error?.message ?? "Staff summary is unavailable.");
        if (active && body?.summary) {
          setDatabaseSummary(body.summary);
          setStatus("Aggregate-only 30-day staff summary loaded. No contact fields are included.");
        }
      })
      .catch((error: Error) => {
        if (active) setStatus(`${error.message} Sign in with an approved staff account to load database aggregates.`);
      });
    return () => {
      active = false;
    };
  }, [mode]);

  const localCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of localEvents) counts[event.eventName] = (counts[event.eventName] ?? 0) + 1;
    return counts;
  }, [localEvents]);

  const eventCounts = databaseSummary?.eventsByName ?? localCounts;
  const eventTotal = databaseSummary?.eventsTotal ?? localEvents.length;
  const releaseGates = [
    ["Design", registry.contracts.length > 0 ? "tracked" : "missing"],
    ["Local tests", registry.releaseState === "local_verified" ? "passed" : "pending"],
    ["Test DB + RLS", "pending"],
    ["Preview deploy", "pending"],
    ["Production", "blocked by approval"]
  ];

  return (
    <div className="studio-dashboard">
      <section className="studio-status-strip" aria-label="Studio runtime status">
        <div>
          <p>Product version</p>
          <strong>{registry.productVersion}</strong>
        </div>
        <div>
          <p>Release state</p>
          <strong>{registry.releaseState}</strong>
        </div>
        <div>
          <p>Data mode</p>
          <strong>{mode}</strong>
        </div>
        <div>
          <p>Observed events</p>
          <strong>{eventTotal}</strong>
        </div>
      </section>

      <p className="studio-readout" aria-live="polite">{status}</p>

      <section className="studio-grid">
        <article className="studio-panel">
          <div className="studio-panel-heading">
            <p>Signal read model</p>
            <h2>Event mix</h2>
          </div>
          {Object.keys(eventCounts).length ? (
            <div className="studio-event-list">
              {Object.entries(eventCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                  <div key={name}>
                    <span>{name.replaceAll("_", " ")}</span>
                    <strong>{count}</strong>
                    <i style={{ "--event-width": `${Math.max(8, (count / Math.max(1, eventTotal)) * 100)}%` } as React.CSSProperties} />
                  </div>
                ))}
            </div>
          ) : (
            <p className="studio-empty">No consented browser events are available yet.</p>
          )}
        </article>

        <article className="studio-panel">
          <div className="studio-panel-heading">
            <p>Version registry</p>
            <h2>Contracts</h2>
          </div>
          <div className="studio-contract-list">
            {registry.contracts.map((contract) => (
              <div key={contract.id}>
                <span>{contract.id}</span>
                <strong>{contract.version}</strong>
                <small>{contract.status}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="studio-panel studio-campaign-panel">
          <div className="studio-panel-heading">
            <p>Owned entry points</p>
            <h2>Campaigns</h2>
          </div>
          <div className="studio-campaign-list">
            {campaigns.map((campaign) => (
              <a href={`/campaign/${campaign.slug}`} key={campaign.id}>
                <span>{campaign.status}</span>
                <strong>{campaign.title}</strong>
                <small>{campaign.audience}</small>
              </a>
            ))}
          </div>
        </article>

        <article className="studio-panel">
          <div className="studio-panel-heading">
            <p>Sequential release</p>
            <h2>Gates</h2>
          </div>
          <ol className="studio-gate-list">
            {releaseGates.map(([gate, state], index) => (
              <li key={gate}>
                <small>0{index + 1}</small>
                <span>{gate}</span>
                <strong>{state}</strong>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="studio-boundary">
        <p>Operator boundary</p>
        <strong>Read-only in v1.</strong>
        <span>
          This console cannot publish, edit campaign truth, inspect inquiry text, activate billing, apply a migration, or deploy production.
        </span>
        {mode === "database" && !databaseSummary ? <a href="/login">Open staff sign-in</a> : null}
      </section>
    </div>
  );
}
