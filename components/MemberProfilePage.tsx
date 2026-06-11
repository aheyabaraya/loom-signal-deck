import type { CSSProperties } from "react";
import type { MemberArchive } from "../data/media";
import type { Member } from "../data/members";
import { rootSignalTrack } from "../data/tracks";
import { SiteHeader } from "./SiteHeader";

type MemberProfilePageProps = {
  archive?: MemberArchive;
  member: Member;
};

function getSignalName(member: Member) {
  return member.code === "M12" ? "Ash Compass" : `${member.word} Signal`;
}

export function MemberProfilePage({ archive, member }: MemberProfilePageProps) {
  const portrait = archive?.profile ?? member.image;
  const stageCuts = archive?.stageCuts ?? [];

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
            <a className="button primary" href="/members">
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

      <section className="asset-section member-stage-section" aria-label={`${member.name} stage cuts`}>
        <div className="asset-heading">
          <p>Stage Archive</p>
          <h2>{member.name} cuts</h2>
        </div>
        <div className="stage-gallery">
          {stageCuts.map((cut) => (
            <article key={cut.id}>
              <img loading="lazy" src={cut.image} alt={`${cut.title} ${cut.subtitle} stage cut`} />
              <div>
                <strong>{cut.title}</strong>
                <span>{cut.subtitle}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
