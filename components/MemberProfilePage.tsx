import type { CSSProperties } from "react";
import type { MemberArchive } from "../data/media";
import { getMemberArchiveHref, type Member } from "../data/members";
import { getPulsoTrackCutsForMember } from "../data/pulsoAssets";
import { rootSignalTrack } from "../data/tracks";
import { SiteHeader } from "./SiteHeader";
import { TikTokAssetGrid } from "./TikTokAssetGrid";

type MemberProfilePageProps = {
  archive?: MemberArchive;
  member: Member;
};

function getSignalName(member: Member) {
  return member.code === "M12" ? "Ash Compass" : `${member.word} Signal`;
}

export function MemberProfilePage({ archive, member }: MemberProfilePageProps) {
  const portrait = archive?.profile ?? member.image;
  const trackCuts = [
    ...(archive?.stageCuts ?? []).map((cut) => ({
      id: cut.id,
      image: cut.image,
      kind: "root-signal",
      sourceLabel: cut.sourceType === "duo" ? "Root Signal Duo" : "Root Signal Solo",
      subtitle: cut.subtitle,
      title: cut.title
    })),
    ...getPulsoTrackCutsForMember(member.code).map((cut) => ({
      id: cut.id,
      image: cut.image,
      kind: cut.sourceType,
      sourceLabel: cut.sourceType === "pulso-face" ? "Pulso Face" : "Pulso Stagewear",
      subtitle: cut.subtitle,
      title: cut.title
    }))
  ];

  return (
    <main
      className="shell member-page"
      id="app"
      style={{ "--accent": member.accent } as CSSProperties}
    >
      <div className="stage-texture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <SiteHeader active="member" />

      <section className="member-hero" aria-label={`${member.name} profile`}>
        <div className="member-portrait-large">
          <img src={portrait} alt={`${member.name} profile portrait`} />
          <span>{member.code}</span>
        </div>

        <div className="member-profile-panel">
          <p>{member.code}</p>
          <h1>{member.name}</h1>
          <h2>{getSignalName(member)}</h2>
          <dl>
            <div>
              <dt>Identity</dt>
              <dd>{member.identity}</dd>
            </div>
            <div>
              <dt>Stage Role</dt>
              <dd>{member.role}</dd>
            </div>
            <div>
              <dt>Track</dt>
              <dd>{rootSignalTrack.displayTitle}</dd>
            </div>
          </dl>
          <div className="cta-row">
            <a className="button primary" href={getMemberArchiveHref(member.code)}>
              Member Map <i />
            </a>
            <a className="button secondary" href="/track">
              Track <i />
            </a>
          </div>
        </div>
      </section>

      {archive ? (
        <section className="member-board-feature" aria-label={`${member.name} character board`}>
          <div className="asset-heading">
            <p>Identity Board</p>
            <h2>{member.code} character archive</h2>
          </div>
          <img src={archive.board} alt={`${member.name} character board`} />
        </section>
      ) : null}

      <section className="asset-section member-stage-section" aria-label={`${member.name} track cuts`}>
        <div className="asset-heading">
          <p>Track Archive</p>
          <h2>{member.name} cuts</h2>
        </div>
        <div className="stage-gallery">
          {trackCuts.map((cut) => (
            <article className={`track-cut-card track-cut-card-${cut.kind}`} key={cut.id}>
              <img loading="lazy" src={cut.image} alt={`${cut.title} ${cut.subtitle} track cut`} />
              <div>
                <strong>{cut.sourceLabel}</strong>
                <span>{cut.subtitle}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <TikTokAssetGrid
        className="asset-section member-tiktok-section"
        memberCode={member.code}
        memberName={member.name}
      />
    </main>
  );
}
