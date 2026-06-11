"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { cfCampaigns } from "../data/cf";
import {
  memberArchives,
  memberBoards,
  stageCuts,
  storyboardImages,
  type StageCut
} from "../data/media";
import { defaultMemberCode, getMember, members, type MemberCode } from "../data/members";
import {
  nextTrackVoteCandidates,
  type NextTrackVoteCandidate
} from "../data/trackVotes";
import { latestTracks, tracks } from "../data/tracks";
import { SiteHeader } from "./SiteHeader";

type ArchiveMode = "track" | "storyboard" | "members" | "stage" | "cf";
type NextTrackVoteState = {
  brief: string;
  selectedCandidateId?: string;
};

const archiveModes: Array<{
  id: ArchiveMode;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: "track",
    label: "Track",
    title: "Root Signal",
    description: "Official track embed and short launch context."
  },
  {
    id: "storyboard",
    label: "Story",
    title: "Storyboard Board",
    description: "Four visual anchors from the first signal deck."
  },
  {
    id: "members",
    label: "Members",
    title: "Member Identity",
    description: "Profile and character board per signal."
  },
  {
    id: "stage",
    label: "Stage",
    title: "Stage Cut Index",
    description: "Member-filtered performance stills, not one long wall."
  },
  {
    id: "cf",
    label: "CF",
    title: "Commercial Lane",
    description: "20-30s ad concepts stay separated from the main music releases."
  }
];

const nextTrackVoteStorageKey = "loom-next-track-vote-v1";
const nextTrackBriefPlaceholder =
  "Paste the next album theme, song title, hook line, or rough track mood. Example: a cool low-tempo title track about hidden control.";

function getMemberArchive(code: MemberCode) {
  return memberArchives.find((archive) => archive.memberCode === code) ?? memberArchives[0];
}

function getMemberBoard(code: MemberCode) {
  return memberBoards.find((board) => board.memberCode === code) ?? memberBoards[0];
}

function getStageTitle(cut: StageCut) {
  return `${cut.title} / ${cut.subtitle}`;
}

function getCandidateMemberNames(candidate: NextTrackVoteCandidate) {
  return candidate.memberCodes.map((code) => getMember(code).name).join(" / ");
}

function getBriefPreview(brief: string) {
  const trimmed = brief.trim();

  if (!trimmed) {
    return "No album or song cue attached yet.";
  }

  return trimmed.length > 140 ? `${trimmed.slice(0, 140)}...` : trimmed;
}

export function ArchiveConsole() {
  const [mode, setMode] = useState<ArchiveMode>("members");
  const [selectedCode, setSelectedCode] = useState<MemberCode>(defaultMemberCode);
  const [selectedCfId, setSelectedCfId] = useState(cfCampaigns[0].id);
  const [selectedTrackId, setSelectedTrackId] = useState(tracks[0].id);
  const [storyIndex, setStoryIndex] = useState(0);
  const [memberRailOpen, setMemberRailOpen] = useState(true);
  const [nextTrackBrief, setNextTrackBrief] = useState("");
  const [nextTrackVoteId, setNextTrackVoteId] = useState<string | undefined>();
  const [selectedStageId, setSelectedStageId] = useState(() => {
    const archive = getMemberArchive(defaultMemberCode);
    return archive.stageCuts[0]?.id ?? stageCuts[0]?.id;
  });

  const selectedMember = useMemo(() => getMember(selectedCode), [selectedCode]);
  const selectedArchive = useMemo(() => getMemberArchive(selectedCode), [selectedCode]);
  const selectedBoard = useMemo(() => getMemberBoard(selectedCode), [selectedCode]);
  const memberStageCuts = selectedArchive.stageCuts;
  const selectedCf = cfCampaigns.find((campaign) => campaign.id === selectedCfId) ?? cfCampaigns[0];
  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) ?? tracks[0];
  const selectedStage =
    memberStageCuts.find((cut) => cut.id === selectedStageId) ?? memberStageCuts[0] ?? stageCuts[0];
  const currentMode = archiveModes.find((item) => item.id === mode) ?? archiveModes[0];
  const selectedNextTrackVote =
    nextTrackVoteCandidates.find((candidate) => candidate.id === nextTrackVoteId) ?? null;

  useEffect(() => {
    function syncModeFromHash() {
      const hash = window.location.hash.replace("#", "");

      if (hash === "tracks") {
        setMode("track");
      }

      if (hash === "storyboard" || hash === "story" || hash === "media") {
        setMode("storyboard");
      }

      if (hash === "members") {
        setMode("members");
        setMemberRailOpen(true);
      }

      if (hash === "stage") {
        setMode("stage");
      }

      if (hash === "cf") {
        setMode("cf");
        setSelectedCfId(cfCampaigns[0].id);
        selectMember(cfCampaigns[0].memberCodes[0]);
      }
    }

    syncModeFromHash();
    window.addEventListener("hashchange", syncModeFromHash);

    return () => window.removeEventListener("hashchange", syncModeFromHash);
  }, []);

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

  function selectMember(code: MemberCode) {
    const archive = getMemberArchive(code);
    setSelectedCode(code);
    setSelectedStageId(archive.stageCuts[0]?.id ?? stageCuts[0]?.id);
  }

  function selectCfCampaign(id: string) {
    const campaign = cfCampaigns.find((item) => item.id === id) ?? cfCampaigns[0];
    setSelectedCfId(campaign.id);
    selectMember(campaign.memberCodes[0]);
  }

  function selectMode(nextMode: ArchiveMode) {
    setMode(nextMode);

    if (nextMode === "members") {
      setMemberRailOpen(true);
    }

    if (nextMode === "cf") {
      selectCfCampaign(selectedCf.id);
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
    <main className="shell archive-shell" id="app">
      <div className="stage-texture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <SiteHeader active="archive" />

      <section className="archive-console" id="tracks" aria-label="Loom archive console">
        <div className="archive-hero-copy">
          <h1>Archive Console</h1>
          <p>
            Track, storyboard, identity boards, and stage cuts stay in one focused viewer.
            Choose a signal, then inspect the matching material without falling into a feed.
          </p>
        </div>

        <div className="archive-command-grid">
          <aside className={`archive-left-rail${memberRailOpen ? " is-open" : " is-collapsed"}`}>
            <nav className="archive-mode-tabs" aria-label="Archive mode">
              {archiveModes.map((item) => (
                <button
                  aria-pressed={mode === item.id}
                  className={mode === item.id ? "is-active" : undefined}
                  key={item.id}
                  onClick={() => selectMode(item.id)}
                  type="button"
                >
                  <span>{item.label}</span>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </nav>

            <section className="archive-member-sidebar" id="members" aria-label="Member archive selector">
              <button
                aria-expanded={memberRailOpen}
                className="archive-member-toggle"
                onClick={() => setMemberRailOpen((open) => !open)}
                type="button"
              >
                <span>Members</span>
                <strong>{memberRailOpen ? "Collapse" : selectedMember.code}</strong>
              </button>
              <div className="archive-member-sidebar-list">
                {members.map((member) => (
                  <button
                    aria-pressed={member.code === selectedCode}
                    className={member.code === selectedCode ? "is-active" : undefined}
                    key={member.code}
                    onClick={() => selectMember(member.code)}
                    style={{ "--node-accent": member.accent } as CSSProperties}
                    type="button"
                  >
                    <img src={member.image} alt="" />
                    <span>{member.code}</span>
                    <strong>{member.name}</strong>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className={`archive-viewer archive-viewer-${mode}`} aria-live="polite">
            <div className="archive-frame">
              {mode === "track" ? (
                <iframe
                  src={selectedTrack.embedUrl}
                  title={selectedTrack.displayTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : null}

              {mode === "storyboard" ? (
                <img src={storyboardImages[storyIndex]} alt={`Loom storyboard ${storyIndex + 1}`} />
              ) : null}

              {mode === "members" ? (
                <img src={selectedBoard.image} alt={`${selectedBoard.title} character board`} />
              ) : null}

              {mode === "stage" ? (
                <img src={selectedStage.image} alt={getStageTitle(selectedStage)} />
              ) : null}

              {mode === "cf" ? (
                <article className="cf-showcase">
                  <div className="cf-showcase-image">
                    <img src={selectedCf.image} alt={`${selectedCf.shortTitle} CF visual anchor`} />
                  </div>
                  <div className="cf-showcase-copy">
                    <p>{selectedCf.productLane}</p>
                    <h3>{selectedCf.title}</h3>
                    <span>{selectedCf.memoryLine}</span>
                    <dl>
                      <div>
                        <dt>Duration</dt>
                        <dd>{selectedCf.duration}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{selectedCf.status.replace("_", " ")}</dd>
                      </div>
                    </dl>
                    <ul>
                      {selectedCf.proof.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ) : null}
            </div>

            <div className="archive-viewer-caption">
              <p>{currentMode.description}</p>
              <h2>
                {mode === "track" ? selectedTrack.displayTitle : null}
                {mode === "storyboard" ? `Storyboard ${String(storyIndex + 1).padStart(2, "0")}` : null}
                {mode === "members" ? `${selectedMember.code} ${selectedMember.name}` : null}
                {mode === "stage" ? selectedStage.subtitle : null}
                {mode === "cf" ? selectedCf.shortTitle : null}
              </h2>
            </div>
          </section>

          <aside className="archive-inspector">
            <p>{mode === "cf" ? "CF-CODE" : selectedMember.code}</p>
            <img src={selectedArchive.profile} alt={`${selectedMember.name} profile`} />
            <h2>{mode === "cf" ? selectedCf.shortTitle : selectedMember.name}</h2>
            <span>{mode === "cf" ? selectedCf.objective : selectedMember.identity}</span>
            <dl>
              <div>
                <dt>{mode === "cf" ? "Campaigns" : "Boards"}</dt>
                <dd>{mode === "cf" ? cfCampaigns.length : memberBoards.length}</dd>
              </div>
              <div>
                <dt>{mode === "cf" ? "Cast" : "Member Cuts"}</dt>
                <dd>{mode === "cf" ? selectedCf.memberCodes.join(" / ") : memberStageCuts.length}</dd>
              </div>
              <div>
                <dt>{mode === "cf" ? "Source" : "Total Cuts"}</dt>
                <dd>{mode === "cf" ? "CF RUN" : stageCuts.length}</dd>
              </div>
            </dl>
            <a href={`/member/${selectedMember.code.toLowerCase()}`}>
              {mode === "cf" ? "Open Cast" : "Open Profile"} <i />
            </a>
          </aside>
        </div>

        {mode === "track" ? (
          <section className="next-track-vote" id="next-track-vote" aria-label="Next album track vote">
            <div className="next-track-brief">
              <p>Next Track Vote</p>
              <h2>Who carries the next album track?</h2>
              <span>
                Add the album theme or song cue, then collect a local Harne signal for which member
                or unit should lead the next track direction. No audio is uploaded here.
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

            <div className="next-track-candidates" aria-label="Next track carrier candidates">
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

            <aside className={`next-track-result${selectedNextTrackVote ? " is-filled" : ""}`}>
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
                  <dt>Public Boundary</dt>
                  <dd>Participation signal only. Founder review required before track direction lock.</dd>
                </div>
              </dl>
            </aside>
          </section>
        ) : null}
      </section>

      <section className="archive-media-rack" id="archive-rack" aria-label="Focused archive media rack">
        <div className="archive-section-label">
          <p>Focused Rack</p>
          <h2>{currentMode.title}</h2>
        </div>

        <div className="archive-rack-row">
          {mode === "track"
            ? latestTracks.map((track) => (
                <button
                  aria-pressed={track.id === selectedTrack.id}
                  className={`archive-track-card${track.id === selectedTrack.id ? " is-active" : ""}`}
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  type="button"
                >
                  <span>{track.albumTitle}</span>
                  <strong>{track.title}</strong>
                  <small>{track.summary}</small>
                </button>
              ))
            : null}

          {mode === "storyboard"
            ? storyboardImages.map((image, index) => (
                <button
                  aria-pressed={storyIndex === index}
                  className={storyIndex === index ? "is-active" : undefined}
                  key={image}
                  onClick={() => setStoryIndex(index)}
                  type="button"
                >
                  <img src={image} alt={`Storyboard thumbnail ${index + 1}`} />
                  <span>Storyboard</span>
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                </button>
              ))
            : null}

          {mode === "members"
            ? memberBoards.map((board) => (
                <button
                  aria-pressed={board.memberCode === selectedCode}
                  className={board.memberCode === selectedCode ? "is-active" : undefined}
                  key={board.id}
                  onClick={() => selectMember(board.memberCode)}
                  type="button"
                >
                  <img src={board.image} alt={`${board.title} thumbnail`} />
                  <span>{board.memberCode}</span>
                  <strong>{board.title.replace(`${board.memberCode} `, "")}</strong>
                </button>
              ))
            : null}

          {mode === "stage"
            ? memberStageCuts.map((cut) => (
                <button
                  aria-pressed={cut.id === selectedStage.id}
                  className={cut.id === selectedStage.id ? "is-active" : undefined}
                  key={cut.id}
                  onClick={() => setSelectedStageId(cut.id)}
                  type="button"
                >
                  <img src={cut.image} alt={getStageTitle(cut)} />
                  <span>{cut.sourceType}</span>
                  <strong>{cut.subtitle}</strong>
                </button>
              ))
            : null}

          {mode === "cf"
            ? cfCampaigns.map((campaign) => (
                <button
                  aria-pressed={campaign.id === selectedCf.id}
                  className={campaign.id === selectedCf.id ? "is-active" : undefined}
                  key={campaign.id}
                  onClick={() => selectCfCampaign(campaign.id)}
                  type="button"
                >
                  <img src={campaign.image} alt={`${campaign.shortTitle} thumbnail`} />
                  <span>{campaign.duration} / {campaign.status.replace("_", " ")}</span>
                  <strong>{campaign.shortTitle}</strong>
                </button>
              ))
            : null}
        </div>
      </section>
    </main>
  );
}
