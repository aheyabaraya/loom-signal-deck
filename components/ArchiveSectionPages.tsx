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
      </section>
    </SectionShell>
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
