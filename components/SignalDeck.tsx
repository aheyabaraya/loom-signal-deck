"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  defaultMemberCode,
  getMember,
  getMemberArchiveHref,
  members,
  type Member,
  type MemberCode,
  type VoteOption
} from "../data/members";
import { latestTracks } from "../data/tracks";
import {
  nextTrackVoteCandidates,
  type NextTrackVoteCandidate
} from "../data/trackVotes";
import { tiktokMemberAssets } from "../data/tiktokAssets";
import { SiteHeader, type SiteHeaderActive } from "./SiteHeader";
import { TikTokAssetGrid } from "./TikTokAssetGrid";
import { TrackVideo } from "./TrackVideo";

type SignalDeckProps = {
  headerActive?: SiteHeaderActive;
  initialCode?: MemberCode;
  openVoteOnLoad?: boolean;
};

type MemberChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
};

type NextTrackVoteState = {
  brief: string;
  selectedCandidateId?: string;
};

const innerOrbitCodes: MemberCode[] = ["M01", "M09", "M07", "M05"];
const outerOrbitCodes: MemberCode[] = ["M02", "M03", "M11", "M13", "M10", "M12", "M08", "M06", "M04"];
const tiktokMemberCodes = new Set(tiktokMemberAssets.map((asset) => asset.memberCode));
const membersWithTikTokAssets = members.filter((member) => tiktokMemberCodes.has(member.code));

function getOrbitPath(codes: MemberCode[]) {
  const orbitMembers = codes.map((code) => getMember(code));
  const closedOrbit = [...orbitMembers, orbitMembers[0]];

  return closedOrbit.map((member) => `${member.position.x},${member.position.y}`).join(" ");
}

const innerOrbitPath = getOrbitPath(innerOrbitCodes);
const outerOrbitPath = getOrbitPath(outerOrbitCodes);
const voteStorageKey = "loom-harne-identity-votes-v1";
const chatStorageKey = "loom-harne-member-chat-v1";
const nextTrackVoteStorageKey = "loom-next-track-vote-v1";
const emptyVoteReceipt = "Choose one thread. This prototype saves only in this browser.";
const memberChatTurnLimit = 15;
const memberChatMaxMessages = memberChatTurnLimit * 2;
const memberChatInputLimit = 240;
const nextTrackBriefPlaceholder =
  "Paste the next album theme, song title, hook line, or rough track mood.";

function getMantra(member: Member) {
  if (member.code === "M12") {
    return ["Direction. Clarity. Control.", "She reads the stage. She sets the course."];
  }

  return [member.role, `${member.identity}.`];
}

function createChatId(role: MemberChatMessage["role"]) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

function parseStoredChats(value: string) {
  const parsed = JSON.parse(value) as Partial<Record<MemberCode, MemberChatMessage[]>>;
  const nextChats: Partial<Record<MemberCode, MemberChatMessage[]>> = {};

  members.forEach((member) => {
    const messages = parsed[member.code];

    if (!Array.isArray(messages)) {
      return;
    }

    nextChats[member.code] = messages
      .flatMap((message) => {
        if (
          !message ||
          typeof message !== "object" ||
          (message.role !== "user" && message.role !== "assistant") ||
          typeof message.text !== "string"
        ) {
          return [];
        }

        return [
          {
            createdAt: typeof message.createdAt === "number" ? message.createdAt : Date.now(),
            id: typeof message.id === "string" ? message.id : createChatId(message.role),
            role: message.role,
            text: message.text.slice(0, memberChatInputLimit * 2)
          }
        ];
      })
      .slice(-memberChatMaxMessages);
  });

  return nextChats;
}

export function SignalDeck({
  headerActive = "archive",
  initialCode = defaultMemberCode,
  openVoteOnLoad = false
}: SignalDeckProps) {
  const [selectedCode, setSelectedCode] = useState<MemberCode>(initialCode);
  const [isChanging, setIsChanging] = useState(false);
  const [receipt, setReceipt] = useState(emptyVoteReceipt);
  const [localVotes, setLocalVotes] = useState<Partial<Record<MemberCode, string>>>({});
  const [chatByMember, setChatByMember] = useState<Partial<Record<MemberCode, MemberChatMessage[]>>>({});
  const [chatDrafts, setChatDrafts] = useState<Partial<Record<MemberCode, string>>>({});
  const [chatLoaded, setChatLoaded] = useState(false);
  const [isChatDockOpen, setIsChatDockOpen] = useState(false);
  const [chatMemberCode, setChatMemberCode] = useState<MemberCode>(initialCode);
  const [sendingMemberCode, setSendingMemberCode] = useState<MemberCode | null>(null);
  const [chatStatus, setChatStatus] = useState("Vote to unlock a short member chat.");
  const [nextTrackBrief, setNextTrackBrief] = useState("");
  const [nextTrackVoteId, setNextTrackVoteId] = useState<string | undefined>();
  const voteModal = useRef<HTMLDialogElement>(null);

  const selectedMember = useMemo(() => getMember(selectedCode), [selectedCode]);
  const chatMember = useMemo(() => getMember(chatMemberCode), [chatMemberCode]);
  const mantra = useMemo(() => getMantra(selectedMember), [selectedMember]);
  const selectedVoteId = localVotes[selectedMember.code];
  const selectedVote = useMemo(
    () => selectedMember.voteOptions.find((option) => option.id === selectedVoteId) ?? null,
    [selectedMember, selectedVoteId]
  );
  const chatVoteId = localVotes[chatMember.code];
  const chatVote = useMemo(
    () => chatMember.voteOptions.find((option) => option.id === chatVoteId) ?? null,
    [chatMember, chatVoteId]
  );
  const savedSignalCount = useMemo(
    () => members.filter((member) => Boolean(localVotes[member.code])).length,
    [localVotes]
  );
  const chatMessages = chatByMember[chatMember.code] ?? [];
  const chatDraft = chatDrafts[chatMember.code] ?? "";
  const chatUserCount = chatMessages.filter((message) => message.role === "user").length;
  const chatLimitReached = chatUserCount >= memberChatTurnLimit;
  const isSendingChat = sendingMemberCode === chatMember.code;
  const selectedNextTrackVote = useMemo(
    () => nextTrackVoteCandidates.find((candidate) => candidate.id === nextTrackVoteId) ?? null,
    [nextTrackVoteId]
  );

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", selectedMember.accent);
    setReceipt(
      selectedVote
        ? `${selectedMember.name}'s local Harne signal is ${selectedVote.label}.`
        : emptyVoteReceipt
    );
  }, [selectedMember, selectedVote]);

  useEffect(() => {
    try {
      const storedVotes = window.localStorage.getItem(voteStorageKey);

      if (storedVotes) {
        setLocalVotes(JSON.parse(storedVotes) as Partial<Record<MemberCode, string>>);
      }
    } catch {
      setLocalVotes({});
    }
  }, []);

  useEffect(() => {
    try {
      const storedChats = window.localStorage.getItem(chatStorageKey);

      if (storedChats) {
        setChatByMember(parseStoredChats(storedChats));
      }
    } catch {
      setChatByMember({});
    } finally {
      setChatLoaded(true);
    }
  }, []);

  useEffect(() => {
    try {
      const storedVote = window.localStorage.getItem(nextTrackVoteStorageKey);

      if (!storedVote) {
        return;
      }

      const parsed = JSON.parse(storedVote) as NextTrackVoteState;
      setNextTrackBrief(typeof parsed.brief === "string" ? parsed.brief : "");
      setNextTrackVoteId(
        nextTrackVoteCandidates.some((candidate) => candidate.id === parsed.selectedCandidateId)
          ? parsed.selectedCandidateId
          : undefined
      );
    } catch {
      setNextTrackBrief("");
      setNextTrackVoteId(undefined);
    }
  }, []);

  useEffect(() => {
    if (!chatLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(chatStorageKey, JSON.stringify(chatByMember));
    } catch {
      setChatStatus("Chat is available, but local save is unavailable in this browser.");
    }
  }, [chatByMember, chatLoaded]);

  useEffect(() => {
    members.forEach((member) => {
      const teaser = new Image();
      teaser.src = member.image;
    });
  }, []);

  useEffect(() => {
    if (openVoteOnLoad && voteModal.current && !voteModal.current.open) {
      voteModal.current?.showModal();
    }
  }, [openVoteOnLoad]);

  function selectMember(member: Member) {
    setSelectedCode(member.code);
    setChatMemberCode(member.code);
    setIsChanging(true);
    window.setTimeout(() => setIsChanging(false), 220);
  }

  function selectChatMember(member: Member) {
    selectMember(member);
    setIsChatDockOpen(true);
  }

  function openVoteModal() {
    if (voteModal.current && !voteModal.current.open) {
      voteModal.current.showModal();
    }
  }

  function openSelectedMemberChat() {
    setChatMemberCode(selectedMember.code);
    setIsChatDockOpen(true);
    voteModal.current?.close();
  }

  function openChatMemberVote() {
    selectMember(chatMember);
    openVoteModal();
  }

  function recordVote(option: VoteOption) {
    const nextVotes = {
      ...localVotes,
      [selectedMember.code]: option.id
    };

    setLocalVotes(nextVotes);
    setReceipt(`Thread recorded for ${selectedMember.name}: ${option.label}.`);

    try {
      window.localStorage.setItem(voteStorageKey, JSON.stringify(nextVotes));
    } catch {
      setReceipt(`Thread recorded for ${selectedMember.name}: ${option.label}. Local save unavailable.`);
    }
  }

  function updateChatDraft(memberCode: MemberCode, value: string) {
    setChatDrafts((currentDrafts) => ({
      ...currentDrafts,
      [memberCode]: value.slice(0, memberChatInputLimit)
    }));
  }

  function updateMemberChat(
    memberCode: MemberCode,
    updater: (messages: MemberChatMessage[]) => MemberChatMessage[]
  ) {
    setChatByMember((currentChats) => {
      const nextMessages = updater(currentChats[memberCode] ?? []).slice(-memberChatMaxMessages);

      return {
        ...currentChats,
        [memberCode]: nextMessages
      };
    });
  }

  function clearChatMemberThread() {
    updateMemberChat(chatMember.code, () => []);
    setChatStatus(`${chatMember.name}'s local chat was cleared.`);
  }

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

  async function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!chatVote) {
      setChatStatus("Choose a Harne vote thread before opening chat.");
      return;
    }

    const text = chatDraft.trim();

    if (!text) {
      return;
    }

    if (chatLimitReached) {
      setChatStatus(`${chatMember.name}'s 15-message local limit is reached for today.`);
      return;
    }

    const memberCode = chatMember.code;
    const memberName = chatMember.name;
    const userMessage: MemberChatMessage = {
      createdAt: Date.now(),
      id: createChatId("user"),
      role: "user",
      text
    };
    const nextMessages = [...chatMessages, userMessage].slice(-memberChatMaxMessages);

    updateMemberChat(memberCode, () => nextMessages);
    setChatDrafts((currentDrafts) => ({ ...currentDrafts, [memberCode]: "" }));
    setSendingMemberCode(memberCode);
    setChatStatus(`Sending to ${memberName}...`);

    try {
      const response = await fetch("/api/member-chat", {
        body: JSON.stringify({
          memberCode,
          messages: nextMessages.slice(-10).map((message) => ({
            role: message.role,
            text: message.text
          })),
          voteOptionId: chatVote.id
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string; reply?: string }
        | null;

      if (!response.ok || !data?.reply) {
        throw new Error(data?.error ?? "Chat request failed.");
      }

      const assistantMessage: MemberChatMessage = {
        createdAt: Date.now(),
        id: createChatId("assistant"),
        role: "assistant",
        text: data.reply
      };

      updateMemberChat(memberCode, (messages) => [...messages, assistantMessage]);
      setChatStatus(`${memberName} replied. ${chatUserCount + 1}/${memberChatTurnLimit} local sends used.`);
    } catch (error) {
      setChatStatus(error instanceof Error ? error.message : "Chat request failed.");
    } finally {
      setSendingMemberCode(null);
    }
  }

  return (
    <>
      <main className="shell" id="app">
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
            <svg
              className="map-lines"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {members.map((member) => (
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
              {members.map((member) => {
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
              <img
                src={selectedMember.image}
                alt={`${selectedMember.name} ${selectedMember.word} teaser portrait`}
              />
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
              <button type="button" onClick={openVoteModal}>
                Vote Signal <i />
              </button>
            </div>
          </aside>
        </section>

        <section className="home-member-strip" aria-label="Member face lineup">
          <div className="home-section-label">
            <p>Member Faces</p>
            <h2>Saeyan opens first</h2>
          </div>
          <div className="home-face-grid">
            {members.map((member) => {
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
          <div className="home-member-tiktoks" aria-label="Member TikTok dance video embeds">
            <div className="home-section-label home-tiktok-label">
              <p>TikTok Embeds</p>
              <h2>Member dance clips</h2>
            </div>
            <div className="home-member-tiktok-stack">
              {membersWithTikTokAssets.map((member) => (
                <TikTokAssetGrid
                  className="member-tiktok-panel home-member-tiktok-panel"
                  key={member.code}
                  memberCode={member.code}
                  memberName={member.name}
                />
              ))}
            </div>
          </div>
        </section>

      </main>

      <aside className={`member-chat-dock${isChatDockOpen ? " is-open" : ""}`} aria-label="Harne member chat">
        <button
          aria-expanded={isChatDockOpen}
          className="member-chat-toggle"
          onClick={() => setIsChatDockOpen((open) => !open)}
          type="button"
        >
          <span>Member Chat</span>
          <strong>{chatMember.code}</strong>
        </button>

        {isChatDockOpen ? (
          <section className="member-chat-drawer" aria-label={`${chatMember.name} chat panel`}>
            <div className="member-chat-drawer-head">
              <div>
                <p>Harne Member Chat</p>
                <h2>{chatMember.name}</h2>
                <span>
                  {chatVote
                    ? `${chatVote.label} thread unlocked.`
                    : "Vote for this member to unlock a short local chat."}
                </span>
              </div>
              <button type="button" onClick={() => setIsChatDockOpen(false)}>
                Close
              </button>
            </div>

            <div className="member-chat-member-rail" aria-label="Select chat member">
              {members.map((member) => {
                const active = member.code === chatMember.code;
                const hasSignal = Boolean(localVotes[member.code]);

                return (
                  <button
                    aria-pressed={active}
                    className={`${active ? "is-active" : ""}${hasSignal ? " has-signal" : ""}`}
                    key={`${member.code}-chat-tab`}
                    onClick={() => selectChatMember(member)}
                    style={{ "--member-accent": member.accent } as CSSProperties}
                    type="button"
                  >
                    <span>{member.code}</span>
                    <strong>{member.name}</strong>
                  </button>
                );
              })}
            </div>

            <section
              className={`member-chat-card${chatVote ? " is-unlocked" : " is-locked"}`}
              aria-label={`${chatMember.name} member chat`}
            >
              <div className="member-chat-head">
                <p>{chatVote ? "Member Chat" : "Chat Locked"}</p>
                <strong>{chatVote ? `${chatMember.name} is listening` : "Vote first"}</strong>
                <span>
                  {chatVote
                    ? `${chatUserCount}/${memberChatTurnLimit} local sends used.`
                    : "Choose one Harne signal for this member to open chat."}
                </span>
              </div>

              {chatVote ? (
                <>
                  <div className="member-chat-log" aria-live="polite">
                    {chatMessages.length ? (
                      chatMessages.map((message) => (
                        <p className={`member-chat-message is-${message.role}`} key={message.id}>
                          <span>{message.role === "user" ? "Harne" : chatMember.name}</span>
                          {message.text}
                        </p>
                      ))
                    ) : (
                      <p className="member-chat-empty">
                        Send one line. The chat will follow the selected {chatVote.label} thread.
                      </p>
                    )}
                  </div>

                  <form className="member-chat-form" onSubmit={sendChatMessage}>
                    <label htmlFor={`member-chat-${chatMember.code}`}>Message</label>
                    <textarea
                      disabled={isSendingChat || chatLimitReached}
                      id={`member-chat-${chatMember.code}`}
                      maxLength={memberChatInputLimit}
                      onChange={(event) => updateChatDraft(chatMember.code, event.target.value)}
                      placeholder={
                        chatLimitReached
                          ? "Local chat limit reached."
                          : `Say something to ${chatMember.name}`
                      }
                      rows={3}
                      value={chatDraft}
                    />
                    <div className="member-chat-controls">
                      <span>{memberChatInputLimit - chatDraft.length} chars left</span>
                      <button
                        disabled={isSendingChat || chatLimitReached || !chatDraft.trim()}
                        type="submit"
                      >
                        {isSendingChat ? "Sending" : "Send"}
                      </button>
                    </div>
                  </form>

                  <div className="member-chat-meta" aria-live="polite">
                    <span>{chatStatus}</span>
                    {chatMessages.length ? (
                      <button type="button" onClick={clearChatMemberThread}>
                        Clear
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="member-chat-locked">
                  <p className="member-chat-empty">
                    The member chat opens only after this member has a local Harne signal.
                  </p>
                  <button type="button" onClick={openChatMemberVote}>
                    Vote Signal
                  </button>
                </div>
              )}
            </section>
          </section>
        ) : null}
      </aside>

      <dialog className="modal" ref={voteModal}>
        <button className="close" type="button" onClick={() => voteModal.current?.close()}>
          Done
        </button>
        <p className="eyebrow">Harne Vote</p>
        <div className="vote-heading">
          <h2>Choose the identity thread</h2>
          <p>
            A Harne signal helps read which direction of a member feels strongest. It does
            not rewrite canon or publish results.
          </p>
        </div>

        <div className="vote-member-rail" aria-label="Select member for identity vote">
          {members.map((member) => {
            const active = member.code === selectedMember.code;
            const hasSignal = Boolean(localVotes[member.code]);

            return (
              <button
                aria-pressed={active}
                className={`${active ? "is-active" : ""}${hasSignal ? " has-signal" : ""}`}
                key={`${member.code}-vote-tab`}
                onClick={() => selectMember(member)}
                style={{ "--member-accent": member.accent } as CSSProperties}
                type="button"
              >
                <span>{member.code}</span>
                <strong>{member.name}</strong>
              </button>
            );
          })}
        </div>

        <div className="vote-body-grid">
          <section className="vote-member-panel" aria-label={`${selectedMember.name} vote context`}>
            <img src={selectedMember.image} alt={`${selectedMember.name} identity vote portrait`} />
            <div>
              <p>{selectedMember.code}</p>
              <h3>{selectedMember.name}</h3>
              <strong>
                {selectedMember.code === "M12" ? "Ash Compass" : `${selectedMember.word} Signal`}
              </strong>
              <span>{selectedMember.role}</span>
            </div>
          </section>

          <section className="vote-choice-panel" aria-label={`${selectedMember.name} identity thread options`}>
            <p className="vote-prompt">{selectedMember.votePrompt}</p>
            <div className="vote-options">
              {selectedMember.voteOptions.map((option) => (
                <button
                  aria-pressed={selectedVoteId === option.id}
                  className={selectedVoteId === option.id ? "is-selected" : undefined}
                  key={option.id}
                  type="button"
                  onClick={() => recordVote(option)}
                >
                  <span className="vote-option-top">
                    <strong>{option.label}</strong>
                    <em>{option.dimension}</em>
                  </span>
                  <span>{option.detail}</span>
                </button>
              ))}
            </div>

            <section className={`vote-receipt-card${selectedVote ? " is-filled" : ""}`} aria-live="polite">
              <p>{selectedVote ? "Local Harne Signal" : "Waiting for thread"}</p>
              <strong>{selectedVote?.label ?? "No thread selected yet"}</strong>
              <span>
                {selectedVote?.signal ??
                  "Pick one identity thread above. Real public collection still needs founder approval."}
              </span>
              <small>
                {savedSignalCount}/13 member signals saved locally. {receipt}
              </small>
            </section>

            <div className="vote-receipt-actions">
              <button disabled={!selectedVote} type="button" onClick={openSelectedMemberChat}>
                Open Member Chat
              </button>
              <a href="#next-track-vote">Next Track Vote</a>
            </div>
          </section>
        </div>

        <section className="vote-track-panel" id="next-track-vote" aria-label="Next album track vote">
          <div className="vote-track-brief">
            <p>Next Track Vote</p>
            <h3>Which name goes next?</h3>
            <span>
              Add an album theme or song cue, then collect a local Harne planning signal for
              which member or pair should be tested next.
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

          <div className="vote-track-options" aria-label="Next track name candidates">
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

          <aside className={`vote-track-result${selectedNextTrackVote ? " is-filled" : ""}`}>
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
                <dt>Public Boundary</dt>
                <dd>Participation signal only. Founder review required before track direction lock.</dd>
              </div>
            </dl>
          </aside>
        </section>
      </dialog>
    </>
  );
}
