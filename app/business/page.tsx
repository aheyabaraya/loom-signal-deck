import type { Metadata } from "next";
import { BusinessInquiryForm } from "../../components/marketing/BusinessInquiryForm";
import { SiteHeader } from "../../components/SiteHeader";
import { cfCampaigns } from "../../data/cf";
import { getMarketingMode } from "../../lib/marketing/config";

export const metadata: Metadata = {
  title: "Business · Loom Signal Deck",
  description: "Screen-backed Loom spec-film cases and a privacy-separated project inquiry route."
};

export default function BusinessPage() {
  const mode = getMarketingMode();
  const cases = cfCampaigns.filter((campaign) => campaign.status === "final").slice(0, 4);

  return (
    <main className="shell section-shell marketing-shell business-shell">
      <div className="stage-texture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <SiteHeader active="business" />

      <section className="business-hero">
        <p>Business / Marketing</p>
        <h1>From audience promise to visible proof.</h1>
        <div>
          <strong>Planning · AI-assisted production · evidence-bounded presentation</strong>
          <span>
            Loom frames each case through the business objective, the intended viewer read, the screen evidence, and the claims that remain out of scope.
          </span>
        </div>
      </section>

      <section className="business-process" aria-label="Loom business process">
        {[
          ["01", "Audience", "Name the person and situation before references."],
          ["02", "Promise", "Choose one primary change the screen should create."],
          ["03", "Proof", "Bind the promise to visible actions, objects, and frames."],
          ["04", "Learning", "Measure only what the current evidence can support."]
        ].map(([number, title, detail]) => (
          <article key={number}>
            <small>{number}</small>
            <strong>{title}</strong>
            <span>{detail}</span>
          </article>
        ))}
      </section>

      <section className="business-cases" id="cases" aria-labelledby="business-cases-title">
        <div className="business-section-heading">
          <p>Selected case studies</p>
          <h2 id="business-cases-title">Read the screen and its boundary.</h2>
        </div>
        <div className="business-case-grid">
          {cases.map((campaign) => (
            <article key={campaign.id}>
              <figure>
                <img src={campaign.image} alt={`${campaign.shortTitle} case frame`} />
                <figcaption>{campaign.duration} · {campaign.productLane}</figcaption>
              </figure>
              <div className="business-case-copy">
                <p>{campaign.objective}</p>
                <h3>{campaign.shortTitle}</h3>
                <strong>{campaign.memoryLine}</strong>
                <dl>
                  <div>
                    <dt>Viewer read</dt>
                    <dd>{campaign.viewerRead}</dd>
                  </div>
                  <div>
                    <dt>Visible proof</dt>
                    <dd>{campaign.proof.slice(0, 3).join(" · ")}</dd>
                  </div>
                  <div>
                    <dt>Claim boundary</dt>
                    <dd>{campaign.locks[0]}</dd>
                  </div>
                </dl>
                <a href={`/cf#${campaign.id}`}>Open CF archive</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="inquiry">
        <BusinessInquiryForm mode={mode} />
      </section>
    </main>
  );
}
