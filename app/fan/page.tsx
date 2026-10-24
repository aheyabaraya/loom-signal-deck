import type { Metadata } from "next";
import { FanRoom } from "../../components/marketing/FanRoom";
import { SiteHeader } from "../../components/SiteHeader";
import { getMarketingMode } from "../../lib/marketing/config";

export const metadata: Metadata = {
  title: "Fan Room · Loom Signal Deck",
  description: "Build a privacy-controlled Loom signal shelf for favorite members, tracks, and follows."
};

export default function FanPage() {
  const mode = getMarketingMode();

  return (
    <main className="shell section-shell marketing-shell fan-room-shell">
      <div className="stage-texture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <SiteHeader active="fan" />
      <section className="section-hero marketing-page-hero">
        <div>
          <p>Fan Room</p>
          <h1>Your Signals</h1>
        </div>
        <span>
          Choose what this browser remembers, what may sync to your account, and which signals should form your return path.
        </span>
      </section>
      <FanRoom mode={mode} />
      <section className="fan-membership-bridge">
        <div>
          <p>Membership structure</p>
          <h2>No paywall yet. A clear boundary first.</h2>
        </div>
        <span>Explore the plan structure and mark interest without entering payment information.</span>
        <a href="/membership">View membership scaffold</a>
      </section>
    </main>
  );
}
