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
import { defaultMemberCode, getMember, members, type MemberCode } from "../data/members";
import {
  nextTrackVoteCandidates,
  type NextTrackVoteCandidate
} from "../data/trackVotes";
import { latestTracks, tracks } from "../data/tracks";
import { SiteHeader } from "./SiteHeader";
import { TikTokAssetGrid } from "./TikTokAssetGrid";

type NextTrackVoteState = {
  brief: string;
  selectedCandidateId?: string;
};

const nextTrackVoteStorageKey = "loom-next-track-vote-v1";
const nextTrackBriefPlaceholder =
  "Paste the next album theme, song title, hook line, or rough track mood.";
const contactSheetBasePath = "/assets/tracks/code-root-signal/contact-sheets";

type ContactSheet = {
  image: string;
  label: string;
  title: string;
};

const beatContactSheetFiles = [
  "beat-03-b03-bassline-walk.webp",
  "beat-09-b09-set-the-motion.webp",
  "beat-10-b10-let-it-rise.webp",
  "beat-11-b11-one-more-step-ignition.webp",
  "beat-12-b12-turn-before-speak.webp",
  "beat-13-b13-low-key-high-control-1.webp",
  "beat-14-b14-click-hush-roll-1.webp",
  "beat-15-b15-whole-room-turn-1.webp",
  "beat-16-b16-low-roll-floor-talks.webp",
  "beat-17-b17-light-pop-bounce-1.webp",
  "beat-18-b18-la-da-false-stop.webp",
  "beat-19-b19-back-to-line-reset.webp",
  "beat-20-b20-check-the-line.webp",
  "beat-21-b21-clean-attack-return.webp",
  "beat-22-b22-smooth-move.webp",
  "beat-23-b23-circle-handoff.webp",
  "beat-24-b24-set-the-motion-2.webp",
  "beat-25-b25-let-it-rise-2.webp",
  "beat-26-b26-before-speak-eye-turn.webp",
  "beat-27-b27-second-lift-ignition.webp",
  "beat-28-b28-high-control-return.webp",
  "beat-29-b29-click-hush-return.webp",
  "beat-30-b30-whole-room-turn-2.webp",
  "beat-31-b31-low-roll-repeat-2.webp",
  "beat-32-b32-floor-talks-metal.webp",
  "beat-33-b33-make-it-pop-memory.webp",
  "beat-34-b34-lights-go-quiet.webp",
  "beat-35-b35-motion-remains.webp",
  "beat-36-b36-fingertip-pulls-closer.webp",
  "beat-37-b37-small-sound-still-heard.webp",
  "beat-38-b38-final-high-control.webp",
  "beat-39-b39-final-click-hush.webp",
  "beat-40-b40-final-room-turn.webp",
  "beat-41-b41-final-low-seal.webp"
];

const storyboardContactSheets: ContactSheet[] = [
  {
    image: `${contactSheetBasePath}/storyboards/storyboard-v2-sheet-01.webp`,
    label: "Storyboard",
    title: "Sheet 01"
  },
  {
    image: `${contactSheetBasePath}/storyboards/storyboard-v2-sheet-02.webp`,
    label: "Storyboard",
    title: "Sheet 02"
  },
  {
    image: `${contactSheetBasePath}/storyboards/storyboard-v2-sheet-03.webp`,
    label: "Storyboard",
    title: "Sheet 03"
  },
  {
    image: `${contactSheetBasePath}/storyboards/storyboard-v2-sheet-04.webp`,
    label: "Storyboard",
    title: "Sheet 04"
  },
  {
    image: `${contactSheetBasePath}/storyboards/airport-wardrobe-storyboard.webp`,
    label: "Contact",
    title: "Airport Wardrobe Storyboard"
  },
  {
    image: `${contactSheetBasePath}/storyboards/airport-wardrobe-lock.webp`,
    label: "Contact",
    title: "Airport Wardrobe Lock"
  },
  {
    image: `${contactSheetBasePath}/storyboards/solo-group-hook.webp`,
    label: "Contact",
    title: "Solo Group Hook"
  },
  {
    image: `${contactSheetBasePath}/storyboards/solo-group-hook-strict-wide.webp`,
    label: "Contact",
    title: "Solo Group Hook Wide"
  }
];

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getBeatContactSheet(fileName: string): ContactSheet {
  const parts = fileName.replace(".webp", "").split("-");
  const beatNumber = parts[1] ?? "00";
  const beatCode = parts[2] ?? "beat";
  const titleParts = parts.slice(3);

  return {
    image: `${contactSheetBasePath}/beats/${fileName}`,
    label: `Beat ${beatNumber}`,
    title: titleCaseSlug(titleParts.length > 0 ? titleParts.join("-") : beatCode)
  };
}

const beatContactSheets = beatContactSheetFiles.map(getBeatContactSheet);

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

export function ArchiveOverviewPage() {
  const overviewItems = [
    {
      href: "/members",
      label: "Members",
      title: "Member Archive",
      summary: "Face, board, and member-scoped stage cuts in one selected view.",
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
      title: "Root Signal",
      summary: "Official embed, track summary, and next-track planning vote.",
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

export function MembersArchivePage() {
  const [selectedCode, setSelectedCode] = useState<MemberCode>(defaultMemberCode);
  const selectedMember = useMemo(() => getMember(selectedCode), [selectedCode]);
  const selectedArchive = useMemo(() => getMemberArchive(selectedCode), [selectedCode]);
  const selectedBoard = useMemo(() => getMemberBoard(selectedCode), [selectedCode]);
  const visibleCuts = selectedArchive.stageCuts.slice(0, 6);

  return (
    <SectionShell
      active="members"
      eyebrow="Members"
      title="Profile Archive"
      summary="Choose one member from the side rail. The main panel keeps portraits, boards, and stage cuts at inspection-friendly sizes."
    >
      <section className="members-page-grid" aria-label="Member archive workspace">
        <aside className="members-page-rail" aria-label="Member selector">
          {members.map((member) => (
            <button
              aria-pressed={member.code === selectedCode}
              className={member.code === selectedCode ? "is-active" : undefined}
              key={member.code}
              onClick={() => setSelectedCode(member.code)}
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
            <a href={`/member/${selectedMember.code.toLowerCase()}`}>Open Profile <i /></a>
          </div>
        </section>

        <section className="member-board-panel" aria-label={`${selectedMember.name} character board`}>
          <div className="section-block-heading">
            <p>Identity Board</p>
            <h2>{selectedBoard.title}</h2>
          </div>
          <img src={selectedBoard.image} alt={`${selectedBoard.title} character board`} />
        </section>

        <section className="member-cut-panel" aria-label={`${selectedMember.name} stage cuts`}>
          <div className="section-block-heading">
            <p>Stage Cuts</p>
            <h2>{selectedMember.name}</h2>
          </div>
          <div className="member-cut-grid">
            {visibleCuts.map((cut) => (
              <article key={cut.id}>
                <img src={cut.image} alt={`${cut.title} ${cut.subtitle}`} />
                <div>
                  <strong>{cut.sourceType}</strong>
                  <span>{cut.subtitle}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <TikTokAssetGrid
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
      <StoryContactSheetGallery eyebrow="Beat By Beat" sheets={beatContactSheets} title="Beat Contact Sheets" />
      <StoryContactSheetGallery
        eyebrow="Storyboard"
        sheets={storyboardContactSheets}
        title="Storyboard Contact Sheets"
      />
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
        <h2>Who carries the next track?</h2>
        <span>
          Add the album theme or song cue, then test which member or unit should carry the next
          track direction.
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
              <span>{candidate.role}</span>
              <strong>{candidate.label}</strong>
              <small>{getCandidateMemberNames(candidate)}</small>
              <em>{candidate.direction}</em>
            </button>
          );
        })}
      </div>

      <aside className={`track-vote-result${selectedNextTrackVote ? " is-filled" : ""}`}>
        <p>Local Planning Signal</p>
        <h3>{selectedNextTrackVote?.label ?? "No carrier selected yet"}</h3>
        <span>
          {selectedNextTrackVote?.founderUse ??
            "Choose a member or unit lane to preview how the next album track vote could be framed."}
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
  const selectedTrack = latestTracks[0] ?? tracks[0];

  return (
    <SectionShell
      active="track"
      eyebrow="Track"
      title="Root Signal"
      summary="The track page now owns the video frame and planning vote. The embed stays 16:9 and no longer competes with member boards."
    >
      <section className="track-page-layout" aria-label="Official track video">
        <div className="track-page-copy">
          <p>{selectedTrack.albumTitle}</p>
          <h2>{selectedTrack.displayTitle}</h2>
          <span>{selectedTrack.summary}</span>
          <div>
            {selectedTrack.credits.map((credit) => (
              <strong key={credit}>{credit}</strong>
            ))}
          </div>
          <a href={selectedTrack.youtubeUrl}>Open YouTube <i /></a>
        </div>
        <div className="track-page-video">
          <iframe
            src={selectedTrack.embedUrl}
            title={selectedTrack.displayTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </section>

      <NextTrackVotePanel />
    </SectionShell>
  );
}

export function CfArchivePage() {
  const [selectedCfId, setSelectedCfId] = useState(cfCampaigns[0].id);
  const selectedCf = cfCampaigns.find((campaign) => campaign.id === selectedCfId) ?? cfCampaigns[0];

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
            <ul>
              {selectedCf.proof.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>
    </SectionShell>
  );
}
