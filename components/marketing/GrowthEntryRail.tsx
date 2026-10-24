import { marketingCampaigns } from "../../data/marketingCampaigns";
import { TrackedLink } from "./TrackedLink";

export function GrowthEntryRail() {
  const firstSignal = marketingCampaigns.find((campaign) => campaign.id === "first-signal")!;

  return (
    <section className="growth-entry-rail" aria-labelledby="growth-entry-title">
      <div className="home-section-label">
        <p>Signal Loop</p>
        <h2 id="growth-entry-title">Choose what happens next</h2>
      </div>
      <div className="growth-entry-grid">
        <TrackedLink
          campaignId={firstSignal.id}
          contentKey={firstSignal.contentKey}
          contentType={firstSignal.contentType}
          href={`/campaign/${firstSignal.slug}?utm_source=web&utm_medium=owned&utm_campaign=${firstSignal.id}&utm_content=${firstSignal.touchpointId}`}
          touchpointId={firstSignal.touchpointId}
        >
          <small>01 · Discover</small>
          <strong>Start with one member signal.</strong>
          <span>Use a focused campaign entry before opening all thirteen.</span>
        </TrackedLink>
        <TrackedLink contentKey="fan-room" contentType="fan" href="/fan">
          <small>02 · Return</small>
          <strong>Build your signal shelf.</strong>
          <span>Keep favorite members, tracks, and follow choices under your control.</span>
        </TrackedLink>
        <TrackedLink contentKey="business" contentType="business" href="/business">
          <small>03 · Collaborate</small>
          <strong>Read the case before the pitch.</strong>
          <span>See objectives, visible proof, and claim boundaries before an inquiry.</span>
        </TrackedLink>
      </div>
    </section>
  );
}
