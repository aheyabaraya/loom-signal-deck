"use client";

import { useEffect } from "react";
import type { MarketingCampaign } from "../../data/marketingCampaigns";
import { recordMarketingEvent } from "../../lib/marketing/client";
import { SiteHeader } from "../SiteHeader";
import { TrackedLink } from "./TrackedLink";

export function CampaignLanding({ campaign }: { campaign: MarketingCampaign }) {
  useEffect(() => {
    void recordMarketingEvent("campaign_entry", {
      campaignId: campaign.id,
      touchpointId: campaign.touchpointId,
      contentType: campaign.contentType,
      contentKey: campaign.contentKey
    });
  }, [campaign]);

  return (
    <main className="shell section-shell marketing-shell campaign-shell">
      <div className="stage-texture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <SiteHeader active="campaign" />

      <section className="campaign-hero" aria-labelledby="campaign-title">
        <div className="campaign-hero-copy">
          <p>{campaign.eyebrow}</p>
          <h1 id="campaign-title">{campaign.title}</h1>
          <strong>{campaign.promise}</strong>
          <span>{campaign.message}</span>
          <div className="campaign-actions">
            <TrackedLink
              campaignId={campaign.id}
              className="button primary"
              contentKey={campaign.contentKey}
              contentType={campaign.contentType}
              href={campaign.primaryCta.href}
              touchpointId={campaign.touchpointId}
            >
              {campaign.primaryCta.label} <i />
            </TrackedLink>
            <TrackedLink
              campaignId={campaign.id}
              className="button secondary"
              contentKey={campaign.contentKey}
              contentType={campaign.contentType}
              eventProperties={{ cta_position: "secondary" }}
              href={campaign.secondaryCta.href}
              touchpointId={campaign.touchpointId}
            >
              {campaign.secondaryCta.label} <i />
            </TrackedLink>
          </div>
        </div>

        <figure className="campaign-visual">
          <img src={campaign.hero.image} alt={campaign.hero.alt} />
          <figcaption>
            <span>{campaign.contentType}</span>
            <strong>{campaign.contentKey}</strong>
          </figcaption>
        </figure>
      </section>

      <section className="signal-spine" aria-label="Campaign signal path">
        {[
          ["01", "Entry", campaign.audience],
          ["02", "Promise", campaign.promise],
          ["03", "Action", campaign.primaryCta.label],
          ["04", "Return", "Save a fan signal or continue into the archive."]
        ].map(([number, label, detail]) => (
          <article key={number}>
            <small>{number}</small>
            <div>
              <p>{label}</p>
              <span>{detail}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="campaign-proof" aria-labelledby="campaign-proof-title">
        <div>
          <p>Screen-backed route</p>
          <h2 id="campaign-proof-title">What this entry can prove</h2>
        </div>
        <ol>
          {campaign.proof.map((proof) => (
            <li key={proof}>{proof}</li>
          ))}
        </ol>
        <p className="campaign-boundary">
          This landing route does not claim a partnership, publication result, conversion, or platform performance that is not present in the source records.
        </p>
      </section>
    </main>
  );
}
