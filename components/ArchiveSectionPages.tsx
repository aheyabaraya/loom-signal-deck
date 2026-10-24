"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { cfCampaigns } from "../data/cf";
import {
  memberArchives,
  memberBoards,
  storyboardImages,
  type MemberArchive
} from "../data/media";
import {
  defaultMemberCode,
  getMember,
  getMemberArchiveHref,
  members,
  normalizeMemberCode,
  type MemberCode
} from "../data/members";
import { getMemberDisplayTrackCuts } from "../data/memberTrackCuts";
import {
  nextTrackVoteCandidates,
  type NextTrackVoteCandidate
} from "../data/trackVotes";
import {
  getTrackContactSheetGroup,
  trackContactSheetGroups,
  type ContactSheet,
  type TrackContactSheetGroup
} from "../data/trackContactSheets";
import { pulsoWardrobeSets } from "../data/pulsoAssets";
import { signalDeckPlatformLabel } from "../data/signalDeckPublications";
import { latestTracks, pulsoTrack } from "../data/tracks";
import { SiteHeader } from "./SiteHeader";
import { CfSocialProofGrid, SocialProofGrid, TrackSocialProofGrid } from "./TikTokAssetGrid";
import { TrackVideo } from "./TrackVideo";

type NextTrackVoteState = {
  brief: string;
  selectedCandidateId?: string;
};

const nextTrackVoteStorageKey = "loom-next-track-vote-v1";
const nextTrackBriefPlaceholder =
  "Paste the next album theme, song title, hook line, or rough track mood.";
function getMemberArchive(code: MemberCode): MemberArchive {
  return memberArchives.find((archive) => archive.memberCode === code) ?? memberArchives[0];
}

function getMemberBoard(code: MemberCode) {
  return memberBoards.find((board) => board.memberCode === code) ?? memberBoards[0];
}

function getCandidateMemberNames(candidate: NextTrackVoteCandidate) {
  return candidate.memberCodes.map((code) => getMember(code).name).join(" / ");
}

function getBriefPreview(brief: string) {
  const trimmed = brief.trim();

  if (!trimmed) {
    return "No album or song cue attached yet.";
  }

  return trimmed.length > 132 ? `${trimmed.slice(0, 132)}...` : trimmed;
}

function SectionShell({
  active,
  eyebrow,
  title,
  summary,
  children
}: {
  active: "archive" | "members" | "story" | "track" | "cf";
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <main className="shell section-shell" id="app">
      <div className="stage-texture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <SiteHeader active={active} />

      <section className="section-hero">
        <div>
          <p>{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <span>{summary}</span>
      </section>

      {children}
    </main>
  );
}

/** @deprecated `/archive` redirects to `/members`; do not add active content here. */
export function ArchiveOverviewPage() {
  const overviewItems = [
    {
      href: "/members",
      label: "Members",
      title: "Member Archive",
      summary: "Face, board, and member-scoped track cuts in one selected view.",
      image: getMember(defaultMemberCode).image
    },
    {
      href: "/story",
      label: "Story",
      title: "Storyboard",
      summary: "Four key visual anchors, sized for inspection instead of feed scrolling.",
      image: storyboardImages[0]
    },
    {
      href: "/track",
      label: "Track",
      title: "Track Archive",
      summary: "Pulso and Root Signal embeds, contact sheets, and next-track planning vote.",
      image: storyboardImages[1]
    },
    {
      href: "/cf",
      label: "CF",
      title: "Commercial Lane",
      summary: "Ad concept assets separated from the music archive.",
      image: cfCampaigns[0].image
    }
  ];

  return (
    <SectionShell
      active="archive"
      eyebrow="Archive"
      title="Asset Index"
      summary="Pick a destination first. Each page now owns one job, so assets do not fight for space inside one overloaded console."
    >
      <section className="archive-overview-grid" aria-label="Archive destinations">
        {overviewItems.map((item) => (
          <a href={item.href} key={item.href}>
            <img src={item.image} alt="" />
            <div>
              <p>{item.label}</p>
              <h2>{item.title}</h2>
              <span>{item.summary}</span>
            </div>
          </a>
        ))}
      </section>
    </SectionShell>
  );
}

export function MembersArchivePage({ initialCode = defaultMemberCode }: { initialCode?: MemberCode }) {
  const [selectedCode, setSelectedCode] = useState<MemberCode>(initialCode);
  const selectedMember = useMemo(() => getMember(selectedCode), [selectedCode]);
  const selectedArchive = useMemo(() => getMemberArchive(selectedCode), [selectedCode]);
  const selectedBoard = useMemo(() => getMemberBoard(selectedCode), [selectedCode]);
  const trackCuts = useMemo(
    () => getMemberDisplayTrackCuts(selectedCode, selectedArchive.stageCuts),
    [selectedArchive, selectedCode]
  );

  useEffect(() => {
    setSelectedCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    function syncSelectedMemberFromUrl() {
      const memberParam = new URLSearchParams(window.location.search).get("member") ?? undefined;
      setSelectedCode(normalizeMemberCode(memberParam));
    }

    window.addEventListener("popstate", syncSelectedMemberFromUrl);

    return () => window.removeEventListener("popstate", syncSelectedMemberFromUrl);
  }, []);

  function selectArchiveMember(code: MemberCode) {
    setSelectedCode(code);
    window.history.replaceState(null, "", getMemberArchiveHref(code));
  }

  return (
    <SectionShell
      active="members"
      eyebrow="Members"
      title="Profile Archive"
      summary="Choose one member from the side rail. The main panel keeps portraits, boards, and track cuts at inspection-friendly sizes."
    >
      <section className="members-page-grid" aria-label="Member archive workspace">
        <aside className="members-page-rail" aria-label="Member selector">
          {members.map((member) => (
            <button
              aria-pressed={member.code === selectedCode}
              className={member.code === selectedCode ? "is-active" : undefined}
              key={member.code}
              onClick={() => selectArchiveMember(member.code)}
              style={{ "--node-accent": member.accent } as CSSProperties}
              type="button"
            >
              <img src={member.image} alt="" />
              <span>{member.code}</span>
              <strong>{member.name}</strong>
            </button>
          ))}
        </aside>

        <section className="member-focus-panel" aria-live="polite">
          <div className="member-focus-portrait">
            <img src={selectedArchive.profile} alt={`${selectedMember.name} profile portrait`} />
          </div>
          <div className="member-focus-copy">
            <p>{selectedMember.code}</p>
            <h2>{selectedMember.name}</h2>
            <strong>{selectedMember.identity}</strong>
            <span>{selectedMember.role}</span>
            <a href={getMemberArchiveHref(selectedMember.code)}>Open Profile <i /></a>
          </div>
        </section>

        <section className="member-board-panel" aria-label={`${selectedMember.name} character board`}>
          <div className="section-block-heading">
            <p>Identity Board</p>
            <h2>{selectedBoard.title}</h2>
          </div>
          <img src={selectedBoard.image} alt={`${selectedBoard.title} character board`} />
        </section>

        <section className="member-cut-panel" aria-label={`${selectedMember.name} track cuts`}>
          <div className="section-block-heading">
            <p>Track Cuts</p>
            <h2>{selectedMember.name}</h2>
          </div>
          <div className="member-cut-grid">
            {trackCuts.map((cut) => (
              <article className={`track-cut-card track-cut-card-${cut.kind}`} key={cut.id}>
                <img src={cut.image} alt={`${cut.title} ${cut.subtitle} track cut`} />
                <div>
                  <strong>{cut.sourceLabel}</strong>
                  <span>{cut.subtitle}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <SocialProofGrid
          className="member-tiktok-panel"
          memberCode={selectedMember.code}
          memberName={selectedMember.name}
        />
      </section>
    </SectionShell>
  );
}

function StoryContactSheetGallery({
  eyebrow,
  sheets,
  title
}: {
  eyebrow: string;
  sheets: ContactSheet[];
  title: string;
}) {
  return (
    <section className="story-contact-section" aria-label={title}>
      <div className="section-block-heading">
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <div className="story-contact-grid">
        {sheets.map((sheet) => (
          <article className="story-contact-card" key={sheet.image}>
            <img src={sheet.image} alt={`${sheet.label} ${sheet.title} contact sheet`} loading="lazy" />
            <div>
              <span>{sheet.label}</span>
              <strong>{sheet.title}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrackContactSheetSection({ track }: { track: TrackContactSheetGroup }) {
  return (
    <section
      className="story-track-contact-section"
      id={track.id}
      aria-label={`${track.trackLabel} ${track.title} contact sheets`}
    >
      <div className="story-track-contact-heading">
        <p>{track.trackLabel}</p>
        <div>
          <h2>{track.title}</h2>
          <span>{track.summary}</span>
        </div>
      </div>
      {track.groups.map((group) => (
        <StoryContactSheetGallery
          eyebrow={group.eyebrow}
          key={`${track.trackLabel}-${group.title}`}
          sheets={group.sheets}
          title={group.title}
        />
      ))}
    </section>
  );
}

function PulsoWardrobeArchive() {
  if (pulsoWardrobeSets.length === 0) {
    return null;
  }

  return (
    <section className="pulso-wardrobe-archive" aria-label="Pulso member wardrobe boards">
      <div className="story-track-contact-heading">
        <p>Pulso</p>
        <div>
          <h2>Member Pulso Cuts</h2>
          <span>
            Member-specific face paint and founder-matched stagewear cuts from the Pulso closeout.
          </span>
        </div>
      </div>

      {pulsoWardrobeSets.map((set) => (
        <section className="pulso-wardrobe-set" key={set.title} aria-label={set.title}>
          <div className="section-block-heading">
            <p>{set.eyebrow}</p>
            <h2>{set.title}</h2>
          </div>
          <p className="pulso-wardrobe-summary">{set.summary}</p>
          <div className="pulso-wardrobe-grid">
            {set.assets.map((asset) => (
              <article className="pulso-wardrobe-card" key={asset.image}>
                <img src={asset.image} alt={`${asset.label} ${asset.title}`} loading="lazy" />
                <div>
                  <span>{asset.label}</span>
                  <strong>{asset.title}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}

/** @deprecated `/story` redirects to `/track`; do not add active content here. */
export function StoryArchivePage() {
  const [storyIndex, setStoryIndex] = useState(0);
  const selectedImage = storyboardImages[storyIndex];

  return (
    <SectionShell
      active="story"
      eyebrow="Story"
      title="Storyboard"
      summary="Storyboard assets use a contained main frame so composition stays visible instead of being cropped by the console."
    >
      <section className="story-page-grid" aria-label="Storyboard viewer">
        <div className="story-main-frame">
          <img src={selectedImage} alt={`Storyboard ${storyIndex + 1}`} />
        </div>
        <aside className="story-thumb-panel">
          {storyboardImages.map((image, index) => (
            <button
              aria-pressed={storyIndex === index}
              className={storyIndex === index ? "is-active" : undefined}
              key={image}
              onClick={() => setStoryIndex(index)}
              type="button"
            >
              <img src={image} alt="" />
              <span>Storyboard</span>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
            </button>
          ))}
        </aside>
      </section>
      {trackContactSheetGroups.map((track) => (
        <TrackContactSheetSection key={track.trackLabel} track={track} />
      ))}
      <PulsoWardrobeArchive />
    </SectionShell>
  );
}

function NextTrackVotePanel() {
  const [nextTrackBrief, setNextTrackBrief] = useState("");
  const [nextTrackVoteId, setNextTrackVoteId] = useState<string | undefined>();
  const selectedNextTrackVote =
    nextTrackVoteCandidates.find((candidate) => candidate.id === nextTrackVoteId) ?? null;

  useEffect(() => {
    try {
      const storedVote = window.localStorage.getItem(nextTrackVoteStorageKey);

      if (!storedVote) {
        return;
      }

      const parsedVote = JSON.parse(storedVote) as NextTrackVoteState;
      setNextTrackBrief(parsedVote.brief ?? "");
      setNextTrackVoteId(parsedVote.selectedCandidateId);
    } catch {
      setNextTrackBrief("");
      setNextTrackVoteId(undefined);
    }
  }, []);

  function persistNextTrackVote(nextState: NextTrackVoteState) {
    try {
      window.localStorage.setItem(nextTrackVoteStorageKey, JSON.stringify(nextState));
    } catch {
      // Local persistence is optional for this prototype.
    }
  }

  function updateNextTrackBrief(brief: string) {
    setNextTrackBrief(brief);
    persistNextTrackVote({ brief, selectedCandidateId: nextTrackVoteId });
  }

  function selectNextTrackCandidate(candidate: NextTrackVoteCandidate) {
    setNextTrackVoteId(candidate.id);
    persistNextTrackVote({ brief: nextTrackBrief, selectedCandidateId: candidate.id });
  }

  return (
    <section className="track-vote-panel" aria-label="Next album track vote">
      <div className="track-vote-brief">
        <p>Next Track Vote</p>
        <h2>Which name goes next?</h2>
        <span>
          Add the album theme or song cue, then test which member or pair should be selected next.
        </span>
        <label>
          Album / Song Cue
          <textarea
            onChange={(event) => updateNextTrackBrief(event.currentTarget.value)}
            placeholder={nextTrackBriefPlaceholder}
            value={nextTrackBrief}
          />
        </label>
      </div>

      <div className="track-vote-options">
        {nextTrackVoteCandidates.map((candidate) => {
          const active = candidate.id === nextTrackVoteId;
          const accent = getMember(candidate.memberCodes[0]).accent;

          return (
            <button
              aria-pressed={active}
              className={active ? "is-active" : undefined}
              key={candidate.id}
              onClick={() => selectNextTrackCandidate(candidate)}
            style={{ "--node-accent": accent } as CSSProperties}
            type="button"
          >
            <strong>{getCandidateMemberNames(candidate)}</strong>
          </button>
        );
      })}
      </div>

      <aside className={`track-vote-result${selectedNextTrackVote ? " is-filled" : ""}`}>
        <p>Local Planning Signal</p>
        <h3>{selectedNextTrackVote ? getCandidateMemberNames(selectedNextTrackVote) : "No name selected yet"}</h3>
        <span>
          {selectedNextTrackVote
            ? "This browser saved the selected next-track name."
            : "Choose a member or pair name to save a local next-track signal."}
        </span>
        <dl>
          <div>
            <dt>Attached Cue</dt>
            <dd>{getBriefPreview(nextTrackBrief)}</dd>
          </div>
          <div>
            <dt>Boundary</dt>
            <dd>Participation signal only. Founder review required before track direction lock.</dd>
          </div>
        </dl>
      </aside>
    </section>
  );
}

export function TrackArchivePage() {
  const [selectedTrackId, setSelectedTrackId] = useState(latestTracks[0]?.id ?? "");
  const selectedTrack = latestTracks.find((track) => track.id === selectedTrackId) ?? latestTracks[0];
  const selectedTrackContactSheets = selectedTrack ? getTrackContactSheetGroup(selectedTrack.id) : null;
  const hasTrackContactSheets = Boolean(selectedTrackContactSheets?.groups.length);
  const showPulsoWardrobe = selectedTrack?.id === pulsoTrack.id;

  return (
    <SectionShell
      active="track"
      eyebrow="Track"
      title="Track Index"
      summary="Choose one track first. The selected track owns its embed, member material, contact sheets, and storyboard material in one contained view."
    >
      <section className="track-browser" aria-label="Track browser">
        <aside className="track-route-nav" aria-label="Track navigation">
          <p>Track Navigation</p>
          {latestTracks.map((track) => {
            const active = track.id === selectedTrack.id;

            return (
              <button
                aria-pressed={active}
                className={active ? "is-active" : undefined}
                key={track.id}
                onClick={() => setSelectedTrackId(track.id)}
                type="button"
              >
                <span>{track.trackNumber}</span>
                <strong>{track.title}</strong>
              </button>
            );
          })}
        </aside>

        <div className="track-detail-stack" aria-live="polite">
          <TrackVideo track={selectedTrack} />

          <TrackSocialProofGrid trackId={selectedTrack.id} trackTitle={selectedTrack.title} />

          {hasTrackContactSheets && selectedTrackContactSheets ? (
            <TrackContactSheetSection track={selectedTrackContactSheets} />
          ) : null}

          {showPulsoWardrobe ? <PulsoWardrobeArchive /> : null}
        </div>
      </section>
    </SectionShell>
  );
}

export function CfArchivePage() {
  const [selectedCfId, setSelectedCfId] = useState(cfCampaigns[0].id);
  const selectedCf = cfCampaigns.find((campaign) => campaign.id === selectedCfId) ?? cfCampaigns[0];
  const videoPlatformLabel = selectedCf.videoPlatform
    ? signalDeckPlatformLabel(selectedCf.videoPlatform)
    : "Public video";

  return (
    <SectionShell
      active="cf"
      eyebrow="CF"
      title="Commercial Lane"
      summary="Commercial concepts are kept separate from track and member assets so the archive does not feel like one mixed feed."
    >
      <section className="cf-page-layout" aria-label="Commercial concept archive">
        <aside className="cf-campaign-list">
          {cfCampaigns.map((campaign) => (
            <button
              aria-pressed={campaign.id === selectedCf.id}
              className={campaign.id === selectedCf.id ? "is-active" : undefined}
              key={campaign.id}
              onClick={() => setSelectedCfId(campaign.id)}
              type="button"
            >
              <img src={campaign.image} alt="" />
              <span>{campaign.duration}</span>
              <strong>{campaign.shortTitle}</strong>
            </button>
          ))}
        </aside>

        <article className="cf-detail-panel">
          <div className="cf-detail-image">
            <img src={selectedCf.image} alt={`${selectedCf.shortTitle} CF visual anchor`} />
          </div>
          <div className="cf-detail-copy">
            <p>{selectedCf.productLane}</p>
            <h2>{selectedCf.title}</h2>
            <strong>{selectedCf.memoryLine}</strong>
            <span>{selectedCf.story}</span>
            <span>{selectedCf.viewerRead}</span>
            <ul>
              {selectedCf.proof.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {selectedCf.videoUrl ? (
              <a className="cf-video-link" href={selectedCf.videoUrl} target="_blank" rel="noreferrer">
                Open {videoPlatformLabel} <i />
              </a>
            ) : null}
          </div>
        </article>
      </section>

      <CfSocialProofGrid cfId={selectedCf.id} cfTitle={selectedCf.shortTitle} />
    </SectionShell>
  );
}
