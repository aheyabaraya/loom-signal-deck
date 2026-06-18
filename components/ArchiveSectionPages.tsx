"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { cfCampaigns } from "../data/cf";
import {
  memberArchives,
  memberBoards,
  storyboardImages,
  type MemberArchive,
  type StageCut
} from "../data/media";
import {
  defaultMemberCode,
  getMember,
  getMemberArchiveHref,
  members,
  normalizeMemberCode,
  type MemberCode
} from "../data/members";
import {
  nextTrackVoteCandidates,
  type NextTrackVoteCandidate
} from "../data/trackVotes";
import {
  getPulsoTrackCutsForMember,
  pulsoContactSheetGroups,
  pulsoWardrobeSets,
  type PulsoTrackCut
} from "../data/pulsoAssets";
import { latestTracks } from "../data/tracks";
import { SiteHeader } from "./SiteHeader";
import { TikTokAssetGrid } from "./TikTokAssetGrid";
import { TrackVideo } from "./TrackVideo";

type NextTrackVoteState = {
  brief: string;
  selectedCandidateId?: string;
};

const nextTrackVoteStorageKey = "loom-next-track-vote-v1";
const nextTrackBriefPlaceholder =
  "Paste the next album theme, song title, hook line, or rough track mood.";
const rootSignalContactSheetBasePath = "/assets/tracks/code-root-signal/contact-sheets";
const lowContactSheetBasePath = "/assets/tracks/low/contact-sheets";

type ContactSheet = {
  image: string;
  label: string;
  title: string;
};

type ContactSheetGroup = {
  eyebrow: string;
  sheets: ContactSheet[];
  title: string;
};

type TrackContactSheetGroup = {
  groups: ContactSheetGroup[];
  id?: string;
  summary: string;
  title: string;
  trackLabel: string;
};

type DisplayTrackCut = {
  id: string;
  image: string;
  kind: "root-signal" | PulsoTrackCut["sourceType"];
  sourceLabel: string;
  subtitle: string;
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
    image: `${rootSignalContactSheetBasePath}/storyboards/storyboard-v2-sheet-01.webp`,
    label: "Storyboard",
    title: "Sheet 01"
  },
  {
    image: `${rootSignalContactSheetBasePath}/storyboards/storyboard-v2-sheet-02.webp`,
    label: "Storyboard",
    title: "Sheet 02"
  },
  {
    image: `${rootSignalContactSheetBasePath}/storyboards/storyboard-v2-sheet-03.webp`,
    label: "Storyboard",
    title: "Sheet 03"
  },
  {
    image: `${rootSignalContactSheetBasePath}/storyboards/storyboard-v2-sheet-04.webp`,
    label: "Storyboard",
    title: "Sheet 04"
  }
];

const lowStoryboardContactSheets: ContactSheet[] = [
  {
    image: `${lowContactSheetBasePath}/storyboards/airport-wardrobe-storyboard.webp`,
    label: "LOW v6",
    title: "Airport Wardrobe Storyboard"
  },
  {
    image: `${lowContactSheetBasePath}/storyboards/airport-wardrobe-lock.webp`,
    label: "LOW v6",
    title: "Airport Wardrobe Lock"
  },
  {
    image: `${lowContactSheetBasePath}/storyboards/solo-group-hook.webp`,
    label: "LOW v7",
    title: "Solo Group Hook"
  },
  {
    image: `${lowContactSheetBasePath}/storyboards/solo-group-hook-strict-wide.webp`,
    label: "LOW v7",
    title: "Solo Group Hook Wide"
  }
];

const lowGroupedContactSheets: ContactSheet[] = [
  {
    image: `${lowContactSheetBasePath}/groups/low-duo-angle-change-two-cut-v1-all-24-founder-passed-contact-sheet.png`,
    label: "LOW duo",
    title: "Duo Angle Change 24"
  },
  {
    image: `${lowContactSheetBasePath}/groups/low-active-5member-group-originals-overview.png`,
    label: "LOW group",
    title: "Active Five Member Originals"
  },
  {
    image: `${lowContactSheetBasePath}/groups/low-previous-02b-keyframes-all-41-overview.png`,
    label: "LOW 02B",
    title: "Previous Keyframes All 41"
  },
  {
    image: `${lowContactSheetBasePath}/groups/low-original-group-five-member-keyframes-overview.png`,
    label: "LOW group",
    title: "Original Five Member Keyframes"
  }
];

const lowSectionContactSheets: ContactSheet[] = Array.from({ length: 15 }, (_, index) => {
  const sectionCode = `S${String(index).padStart(2, "0")}`;

  return {
    image: `${lowContactSheetBasePath}/sections/low-latest-${sectionCode.toLowerCase()}-section-contact-sheet.png`,
    label: "LOW section",
    title: `${sectionCode} Latest Section`
  };
});

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
    image: `${rootSignalContactSheetBasePath}/beats/${fileName}`,
    label: `Beat ${beatNumber}`,
    title: titleCaseSlug(titleParts.length > 0 ? titleParts.join("-") : beatCode)
  };
}

const beatContactSheets = beatContactSheetFiles.map(getBeatContactSheet);

const trackContactSheetGroups: TrackContactSheetGroup[] = [
  {
    id: "pulso",
    trackLabel: "Latest",
    title: "Pulso",
    summary:
      "Pulso is cleaned to the final v6 master; preview contact-sheet mirrors were removed from the web archive.",
    groups: pulsoContactSheetGroups
  },
  {
    id: "root-signal",
    trackLabel: "Track 01",
    title: "Root Signal",
    summary: "Root Signal beat sheets and core storyboard boards grouped under the first track.",
    groups: [
      {
        eyebrow: "Root Signal Beat",
        title: "Beat Contact Sheets",
        sheets: beatContactSheets
      },
      {
        eyebrow: "Root Signal Storyboard",
        title: "Storyboard Contact Sheets",
        sheets: storyboardContactSheets
      }
    ]
  },
  {
    id: "low",
    trackLabel: "Legacy Preview",
    title: "LOW",
    summary: "LOW storyboard boards, grouped source versions, and section-level contact sheets.",
    groups: [
      {
        eyebrow: "LOW Storyboard",
        title: "Storyboard Contact Sheets",
        sheets: lowStoryboardContactSheets
      },
      {
        eyebrow: "LOW Grouped Versions",
        title: "Grouped Contact Sheets",
        sheets: lowGroupedContactSheets
      },
      {
        eyebrow: "LOW Sections",
        title: "Latest Section Contact Sheets",
        sheets: lowSectionContactSheets
      }
    ]
  }
];

function getTrackContactSheetGroup(trackId: string) {
  if (trackId === "loom-track-pulso") {
    return trackContactSheetGroups.find((track) => track.id === "pulso") ?? null;
  }

  if (trackId === "loom-track-root-signal") {
    return trackContactSheetGroups.find((track) => track.id === "root-signal") ?? null;
  }

  return null;
}

function getMemberArchive(code: MemberCode): MemberArchive {
  return memberArchives.find((archive) => archive.memberCode === code) ?? memberArchives[0];
}

function getMemberBoard(code: MemberCode) {
  return memberBoards.find((board) => board.memberCode === code) ?? memberBoards[0];
}

function getRootSignalCutLabel(cut: StageCut) {
  return cut.sourceType === "duo" ? "Root Signal Duo" : "Root Signal Solo";
}

function getPulsoCutLabel(cut: PulsoTrackCut) {
  return cut.sourceType === "pulso-face" ? "Pulso Face" : "Pulso Stagewear";
}

function getMemberTrackCuts(baseCuts: StageCut[], memberCode: MemberCode): DisplayTrackCut[] {
  return [
    ...baseCuts.map((cut) => ({
      id: cut.id,
      image: cut.image,
      kind: "root-signal" as const,
      sourceLabel: getRootSignalCutLabel(cut),
      subtitle: cut.subtitle,
      title: cut.title
    })),
    ...getPulsoTrackCutsForMember(memberCode).map((cut) => ({
      id: cut.id,
      image: cut.image,
      kind: cut.sourceType,
      sourceLabel: getPulsoCutLabel(cut),
      subtitle: cut.subtitle,
      title: cut.title
    }))
  ];
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
    () => getMemberTrackCuts(selectedArchive.stageCuts, selectedCode),
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
  const showPulsoWardrobe = selectedTrack?.id === "loom-track-pulso";

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
