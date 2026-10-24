"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  defaultMemberCode,
  getMember,
  getMemberArchiveHref,
  homeMemberByCode,
  homeMembers,
  type Member,
  type MemberCode
} from "../data/members";
import { latestTracks } from "../data/tracks";
import { SiteHeader, type SiteHeaderActive } from "./SiteHeader";
import { FeaturedMemberClipsGrid } from "./TikTokAssetGrid";
import { TrackVideo } from "./TrackVideo";
import { GrowthEntryRail } from "./marketing/GrowthEntryRail";
import { recordMarketingEvent } from "../lib/marketing/client";

type SignalDeckProps = {
  headerActive?: SiteHeaderActive;
  initialCode?: MemberCode;
  openVoteOnLoad?: boolean;
};

const innerOrbitCodes: MemberCode[] = ["M01", "M09", "M07", "M05"];
const outerOrbitCodes: MemberCode[] = ["M02", "M03", "M11", "M13", "M10", "M12", "M08", "M06", "M04"];

function getOrbitPath(codes: MemberCode[]) {
  const orbitMembers = codes.map((code) => getMember(code));
  const closedOrbit = [...orbitMembers, orbitMembers[0]];
  return closedOrbit.map((member) => `${member.position.x},${member.position.y}`).join(" ");
}
const innerOrbitPath = getOrbitPath(innerOrbitCodes);
const outerOrbitPath = getOrbitPath(outerOrbitCodes);

function getMantra(member: Member) {
  if (member.code === "M12") {
    return ["Direction. Clarity. Control.", "She reads the stage. She sets the course."];
  }

  return [member.role, `${member.identity}.`];
}

export function SignalDeck({
  headerActive = "archive",
  initialCode = defaultMemberCode,
  openVoteOnLoad = false
}: SignalDeckProps) {
  const initialHomeCode = homeMemberByCode.has(initialCode) ? initialCode : defaultMemberCode;
  const [selectedCode, setSelectedCode] = useState<MemberCode>(initialHomeCode);
  const [isChanging, setIsChanging] = useState(false);

  const selectedMember = useMemo(() => getMember(selectedCode), [selectedCode]);
  const mantra = useMemo(() => getMantra(selectedMember), [selectedMember]);

  useEffect(() => {
    homeMembers.forEach((member) => {
      const teaser = new Image();
      teaser.src = member.image;
    });
  }, []);

  useEffect(() => {
    if (openVoteOnLoad) {
      window.location.assign("/vote");
    }
  }, [openVoteOnLoad]);

  function selectMember(member: Member) {
    setSelectedCode(member.code);
    setIsChanging(true);
    window.setTimeout(() => setIsChanging(false), 220);
    void recordMarketingEvent("member_select", {
      contentType: "member",
      contentKey: member.code
    });
  }

  return (
    <main className="shell" id="app" style={{ "--accent": selectedMember.accent } as CSSProperties}>
      <div className="stage-texture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <SiteHeader active={headerActive} />

      <section className="deck" id="deck" aria-label="Loom hero deck">
        <aside className="intro">
          <h1>
            LO<span className="star-o">O</span>M
          </h1>
          <p className="subbrand">SIGNAL DECK</p>
          <div className="signal-meter" aria-hidden="true">
            <span />
          </div>
          <p className="tagline">13 signals. One stage.</p>
          <p className="copy">
            Thirteen voices. Thirteen paths.
            <br />
            Woven into one future.
          </p>
          <div className="cta-row">
            <a className="button primary" href="#members">
              Enter Deck <i />
            </a>
            <a className="button secondary" href="/vote">
              Harne Vote <i />
            </a>
          </div>
          <p className="copyright">
            LOOM <span>2026. LOOM. All Rights Reserved.</span>
          </p>
        </aside>

        <section className="stage-map" id="members" aria-label="Member signal map">
          <div className="map-frame" aria-hidden="true" />
          <svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {homeMembers.map((member) => (
              <line
                className={member.code === selectedMember.code ? "is-active" : undefined}
                key={`${member.code}-spoke`}
                x1="50"
                y1="50"
                x2={member.position.x}
                y2={member.position.y}
              />
            ))}
            <polyline className="inner-orbit" points={innerOrbitPath} />
            <polyline className="outer-orbit" points={outerOrbitPath} />
            <line x1="50" y1="12" x2="50" y2="103" />
            <line x1="28" y1="55" x2="72" y2="55" />
          </svg>
          <div className="map-ring" aria-hidden="true" />
          <div className="map-core" aria-hidden="true">
            <span>M</span>
          </div>
          <div className="nodes">
            {homeMembers.map((member) => {
              const active = member.code === selectedMember.code;

              return (
                <button
                  aria-pressed={active}
                  className={`node${active ? " active" : ""}`}
                  key={member.code}
                  onClick={() => selectMember(member)}
                  style={
                    {
                      "--x": `${member.position.x}%`,
                      "--y": `${member.position.y}%`,
                      "--node-accent": member.accent
                    } as CSSProperties
                  }
                  type="button"
                >
                  <span className="node-dot" aria-hidden="true" />
                  <span>
                    <small>{member.code}</small>
                    <strong>{member.name}</strong>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className={`member-card${isChanging ? " is-changing" : ""}`} aria-live="polite">
          <p className="member-code">{selectedMember.code}</p>
          <div className="portrait">
            <img src={selectedMember.image} alt={`${selectedMember.name} ${selectedMember.word} teaser portrait`} />
          </div>
          <div className="panel-copy">
            <h2>{selectedMember.name}</h2>
            <p className="signal-name">
              {selectedMember.code === "M12" ? "Ash Compass" : `${selectedMember.word} Signal`}
            </p>
            <p className="mantra">
              {mantra[0]}
              <br />
              {mantra[1]}
            </p>
          </div>
          <div className="panel-actions">
            <a href={getMemberArchiveHref(selectedMember.code)}>
              View Profile <i />
            </a>
            <a href="/vote">
              Vote + Chat <i />
            </a>
          </div>
        </aside>
      </section>

      <section className="home-member-strip" aria-label="Member face lineup">
        <div className="home-section-label">
          <p>Member Faces</p>
          <h2>Saeyan opens first</h2>
        </div>
        <div className="home-face-grid">
          {homeMembers.map((member) => {
            const active = member.code === selectedMember.code;

            return (
              <button
                aria-pressed={active}
                className={active ? "is-active" : undefined}
                key={member.code}
                onClick={() => selectMember(member)}
                style={{ "--node-accent": member.accent } as CSSProperties}
                type="button"
              >
                <img loading="lazy" src={member.image} alt={`${member.name} face portrait`} />
                <span>{member.code}</span>
                <strong>{member.name}</strong>
              </button>
            );
          })}
        </div>
      </section>

      <section className="home-latest-tracks" id="tracks" aria-label="Latest track videos">
        <div className="home-section-label">
          <p>Latest Tracks</p>
          <h2>Official embeds</h2>
        </div>
        <div className="home-track-stack">
          {latestTracks.map((track) => (
            <TrackVideo key={track.id} track={track} variant="home" />
          ))}
        </div>
        <div className="home-member-tiktoks" aria-label="Featured member clips from TikTok and YouTube Shorts, newest first">
          <div className="home-section-label home-tiktok-label">
            <p>Social · newest first</p>
            <h2>Featured member clips</h2>
          </div>
          <FeaturedMemberClipsGrid className="home-member-tiktok-stack" />
        </div>
      </section>

      <GrowthEntryRail />
    </main>
  );
}
