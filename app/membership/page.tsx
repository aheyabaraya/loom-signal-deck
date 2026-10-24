import type { Metadata } from "next";
import { MembershipInterest } from "../../components/marketing/MembershipInterest";
import { SiteHeader } from "../../components/SiteHeader";
import { membershipPaymentsEnabled, membershipPlans } from "../../data/membershipPlans";
import { getMarketingMode } from "../../lib/marketing/config";

export const metadata: Metadata = {
  title: "Membership Preview · Loom Signal Deck",
  description: "Loom membership information architecture with billing intentionally disabled."
};

export default function MembershipPage() {
  return (
    <main className="shell section-shell marketing-shell membership-shell">
      <div className="stage-texture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <SiteHeader active="membership" />
      <section className="membership-hero">
        <div>
          <p>Membership Preview</p>
          <h1>A structure before a paywall.</h1>
        </div>
        <div className="membership-boundary-badge">
          <span>{membershipPaymentsEnabled ? "Billing on" : "Billing disabled"}</span>
          <strong>No checkout · no card fields · no charge</strong>
        </div>
      </section>

      <MembershipInterest mode={getMarketingMode()} plans={membershipPlans} />

      <section className="membership-safety-grid">
        <article>
          <small>Product</small>
          <strong>Plan names and benefits are testable now.</strong>
          <span>Public copy and interest signals can evolve through the versioned catalog.</span>
        </article>
        <article>
          <small>Payment</small>
          <strong>The adapter is closed by design.</strong>
          <span>The checkout endpoint rejects every request and accepts no payment payload.</span>
        </article>
        <article>
          <small>Activation gate</small>
          <strong>A separate decision is required.</strong>
          <span>Pricing, provider, webhook, refund, tax, terms, and security review must be approved together.</span>
        </article>
      </section>
    </main>
  );
}
