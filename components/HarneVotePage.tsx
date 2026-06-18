"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import {
  defaultMemberCode,
  getMember,
  members,
  type Member,
  type MemberCode,
  type VoteOption
} from "../data/members";
import {
  nextTrackVoteCandidates,
  type NextTrackVoteCandidate
} from "../data/trackVotes";
import { SiteHeader } from "./SiteHeader";

type MemberChatMessage = {
  createdAt: number;
  id: string;
  role: "user" | "assistant";
  text: string;
};

type NextTrackVoteState = {
  brief: string;
  selectedCandidateId?: string;
};

const voteStorageKey = "loom-harne-identity-votes-v1";
const chatStorageKey = "loom-harne-member-chat-v1";
const nextTrackVoteStorageKey = "loom-next-track-vote-v1";
const memberChatTurnLimit = 15;
const memberChatMaxMessages = memberChatTurnLimit * 2;
const memberChatInputLimit = 240;
const nextTrackBriefPlaceholder =
  "Song title, album mood, hook line, or quick track idea.";

function createChatId(role: MemberChatMessage["role"]) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getCandidateMemberNames(candidate: NextTrackVoteCandidate) {
  return candidate.memberCodes.map((code) => getMember(code).name).join(" / ");
}

function getBriefPreview(brief: string) {
  const trimmed = brief.trim();

  if (!trimmed) {
    return "No track cue attached yet.";
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

export function HarneVotePage() {
  const [selectedCode, setSelectedCode] = useState<MemberCode>(defaultMemberCode);
  const [localVotes, setLocalVotes] = useState<Partial<Record<MemberCode, string>>>({});
  const [receipt, setReceipt] = useState("Choose one member identity thread.");
  const [nextTrackBrief, setNextTrackBrief] = useState("");
  const [nextTrackVoteId, setNextTrackVoteId] = useState<string | undefined>();
  const [chatByMember, setChatByMember] = useState<Partial<Record<MemberCode, MemberChatMessage[]>>>({});
  const [chatDrafts, setChatDrafts] = useState<Partial<Record<MemberCode, string>>>({});
  const [chatLoaded, setChatLoaded] = useState(false);
  const [isChatDockOpen, setIsChatDockOpen] = useState(false);
  const [chatMemberCode, setChatMemberCode] = useState<MemberCode>(defaultMemberCode);
  const [sendingMemberCode, setSendingMemberCode] = useState<MemberCode | null>(null);
  const [chatStatus, setChatStatus] = useState("Vote to unlock a short member chat.");

  const selectedMember = useMemo(() => getMember(selectedCode), [selectedCode]);
  const chatMember = useMemo(() => getMember(chatMemberCode), [chatMemberCode]);
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
  const selectedNextTrackVote = useMemo(
    () => nextTrackVoteCandidates.find((candidate) => candidate.id === nextTrackVoteId) ?? null,
    [nextTrackVoteId]
  );
  const chatMessages = chatByMember[chatMember.code] ?? [];
  const chatDraft = chatDrafts[chatMember.code] ?? "";
  const chatUserCount = chatMessages.filter((message) => message.role === "user").length;
  const chatLimitReached = chatUserCount >= memberChatTurnLimit;
  const isSendingChat = sendingMemberCode === chatMember.code;

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", selectedMember.accent);
  }, [selectedMember]);

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
    if (!chatLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(chatStorageKey, JSON.stringify(chatByMember));
    } catch {
      setChatStatus("Chat is available, but local save is unavailable in this browser.");
    }
  }, [chatByMember, chatLoaded]);

  function selectMember(member: Member) {
    setSelectedCode(member.code);
    setChatMemberCode(member.code);
  }

  function selectChatMember(member: Member) {
    selectMember(member);
    setIsChatDockOpen(true);
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

  function recordVote(option: VoteOption) {
    const nextVotes = {
      ...localVotes,
      [selectedMember.code]: option.id
    };

    setLocalVotes(nextVotes);
    setChatMemberCode(selectedMember.code);
    setReceipt(`Thread recorded for ${selectedMember.name}: ${option.label}.`);

    try {
      window.localStorage.setItem(voteStorageKey, JSON.stringify(nextVotes));
    } catch {
      setReceipt(`Thread recorded for ${selectedMember.name}: ${option.label}. Local save unavailable.`);
    }
  }

  function openSelectedMemberChat() {
    setChatMemberCode(selectedMember.code);
    setIsChatDockOpen(true);
  }

  function openChatMemberVote() {
    setSelectedCode(chatMember.code);
    setIsChatDockOpen(false);
    document.getElementById("identity-vote")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  async function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!chatVote) {
      setChatStatus("Choose a member identity thread before opening chat.");
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
      <main className="shell vote-page-shell" id="app">
        <div className="stage-texture" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <SiteHeader active="vote" />

        <section className="section-hero vote-page-hero">
          <div>
            <p>Harne Vote</p>
            <h1>Vote</h1>
          </div>
          <span>
            Two local prototype votes only: who should enter the next track, and which
            identity thread each member should carry.
          </span>
        </section>

        <section className="vote-page-grid" aria-label="Harne vote workspace">
          <section className="vote-page-section vote-track-section" aria-label="Track participation vote">
            <div className="vote-section-heading">
              <p>Track Related</p>
              <h2>Who joins the next track?</h2>
              <span>
                Attach a short track cue, then choose the member or pair to test first.
              </span>
            </div>

            <label className="vote-track-cue">
              Track Cue
              <textarea
                onChange={(event) => updateNextTrackBrief(event.currentTarget.value)}
                placeholder={nextTrackBriefPlaceholder}
                value={nextTrackBrief}
              />
            </label>

            <div className="vote-track-options vote-page-track-options" aria-label="Next track candidates">
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
              <p>Local Track Signal</p>
              <h3>
                {selectedNextTrackVote ? getCandidateMemberNames(selectedNextTrackVote) : "No name selected yet"}
              </h3>
              <span>
                {selectedNextTrackVote
                  ? "This browser saved the selected track participation signal."
                  : "Choose a name to save a local next-track signal."}
              </span>
              <dl>
                <div>
                  <dt>Attached Cue</dt>
                  <dd>{getBriefPreview(nextTrackBrief)}</dd>
                </div>
                <div>
                  <dt>Boundary</dt>
                  <dd>Planning signal only. Founder review still locks the actual track.</dd>
                </div>
              </dl>
            </aside>
          </section>

          <section
            className="vote-page-section vote-identity-section"
            id="identity-vote"
            aria-label="Member identity vote"
          >
            <div className="vote-section-heading">
              <p>Member Identity</p>
              <h2>Which thread fits this member?</h2>
              <span>
                Pick one member, then save the identity direction that should color her future use.
              </span>
            </div>

            <div className="vote-member-rail" aria-label="Select member for identity vote">
              {members.map((member) => {
                const active = member.code === selectedMember.code;
                const hasSignal = Boolean(localVotes[member.code]);

                return (
                  <button
                    aria-pressed={active}
                    className={`${active ? "is-active" : ""}${hasSignal ? " has-signal" : ""}`}
                    key={`${member.code}-identity-tab`}
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

              <section className="vote-choice-panel" aria-label={`${selectedMember.name} identity options`}>
                <p className="vote-prompt">{selectedMember.votePrompt}</p>
                <div className="vote-options">
                  {selectedMember.voteOptions.map((option) => (
                    <button
                      aria-pressed={selectedVoteId === option.id}
                      className={selectedVoteId === option.id ? "is-selected" : undefined}
                      key={option.id}
                      onClick={() => recordVote(option)}
                      type="button"
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
                  <p>{selectedVote ? "Local Identity Signal" : "Waiting for thread"}</p>
                  <strong>{selectedVote?.label ?? "No thread selected yet"}</strong>
                  <span>
                    {selectedVote?.signal ??
                      "Pick one identity thread. The saved state stays only in this browser."}
                  </span>
                  <small>
                    {savedSignalCount}/13 member signals saved locally. {receipt}
                  </small>
                </section>

                <div className="vote-receipt-actions">
                  <button disabled={!selectedVote} type="button" onClick={openSelectedMemberChat}>
                    Open Member Chat
                  </button>
                </div>
              </section>
            </div>
          </section>
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
                    : "Vote for this member identity to unlock a short local chat."}
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
                    : "Choose one identity thread for this member to open chat."}
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
                        chatLimitReached ? "Local chat limit reached." : `Say something to ${chatMember.name}`
                      }
                      rows={3}
                      value={chatDraft}
                    />
                    <div className="member-chat-controls">
                      <span>{memberChatInputLimit - chatDraft.length} chars left</span>
                      <button disabled={isSendingChat || chatLimitReached || !chatDraft.trim()} type="submit">
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
                    The member chat opens only after this member has a local identity signal.
                  </p>
                  <button type="button" onClick={openChatMemberVote}>
                    Vote Identity
                  </button>
                </div>
              )}
            </section>
          </section>
        ) : null}
      </aside>
    </>
  );
}
