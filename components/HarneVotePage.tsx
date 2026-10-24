"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  clearHarneThread,
  ensureHarneSession,
  getHarneSession,
  getHarneSnapshot,
  observeHarneSessionUser,
  getHarneThread,
  HarneClientError,
  sendHarneMessage,
  signOutHarne,
  submitHarneVote
} from "../lib/harne/client";
import type { HarneChatMessage, HarneVoteQuestion, HarneVoteSnapshot } from "../lib/harne/contracts";
import {
  defaultMemberCode,
  getMember,
  members,
  type Member,
  type MemberCode,
  type VoteOption
} from "../data/members";
import { nextTrackVoteCandidates, type NextTrackVoteCandidate } from "../data/trackVotes";
import { SiteHeader } from "./SiteHeader";
import { recordMarketingEvent } from "../lib/marketing/client";

const memberChatTurnLimit = 15;
const memberChatInputLimit = 240;
const nextTrackBriefPlaceholder = "Song title, album mood, hook line, or quick track idea.";

type SessionState = {
  anonymous: boolean;
  userId?: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof HarneClientError) {
    return error.message;
  }

  return error instanceof Error ? error.message : "Harne request failed.";
}
type ChatApplyGuard = {
  memberCode: MemberCode;
  userId: string;
  epoch: number;
  memberEpoch: number;
};

type ChatGuardDecision = "apply" | "stale" | "unverified";

type ChatIdentity =
  | { ok: true; userId: string | null }
  | { ok: false };

async function captureHarneUserId(): Promise<ChatIdentity> {
  try {
    const authSession = await getHarneSession();
    return { ok: true, userId: authSession?.user?.id ?? null };
  } catch {
    return { ok: false };
  }
}

function consumeObservedOwner(
  seenRef: { current: string | null | undefined },
  userId: string | null
): "first" | "same" | "changed" {
  if (seenRef.current === undefined) {
    seenRef.current = userId;
    return "first";
  }
  if (seenRef.current === userId) return "same";
  seenRef.current = userId;
  return "changed";
}

function decideChatGuard(
  guard: ChatApplyGuard,
  currentEpoch: number,
  identity: ChatIdentity,
  loadSeq?: { request: number; current: number }
): ChatGuardDecision {
  if (loadSeq && loadSeq.request !== loadSeq.current) return "stale";
  if (!identity.ok) return "unverified";
  if (identity.userId !== guard.userId) return "stale";
  if (guard.epoch !== currentEpoch) return "stale";
  return "apply";
}

function getMemberQuestion(snapshot: HarneVoteSnapshot | null, memberCode: MemberCode) {
  return snapshot?.questions.find(
    (question) => question.kind === "member_identity" && question.subjectKey === memberCode
  );
}

function getLocalOption(member: Member, optionKey: string | undefined) {
  return member.voteOptions.find((option) => option.id === optionKey) ?? null;
}

function getCandidateMemberNames(candidate: NextTrackVoteCandidate) {
  return candidate.memberCodes.map((code) => getMember(code).name).join(" / ");
}

function getBriefPreview(brief: string) {
  const trimmed = brief.trim();
  if (!trimmed) return "No track cue attached yet.";
  return trimmed.length > 140 ? `${trimmed.slice(0, 140)}...` : trimmed;
}

export function HarneVotePage() {
  const [selectedCode, setSelectedCode] = useState<MemberCode>(defaultMemberCode);
  const [snapshot, setSnapshot] = useState<HarneVoteSnapshot | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [nextTrackBrief, setNextTrackBrief] = useState("");
  const [receipt, setReceipt] = useState("Connect to Harne to load the live round.");
  const [pageError, setPageError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [chatByMember, setChatByMember] = useState<Partial<Record<MemberCode, HarneChatMessage[]>>>({});
  const [chatDrafts, setChatDrafts] = useState<Partial<Record<MemberCode, string>>>({});
  const [chatLoading, setChatLoading] = useState(false);
  const [isChatDockOpen, setIsChatDockOpen] = useState(false);
  const [chatMemberCode, setChatMemberCode] = useState<MemberCode>(defaultMemberCode);
  const [sendingMemberCode, setSendingMemberCode] = useState<MemberCode | null>(null);
  const [chatStatus, setChatStatus] = useState("Vote to unlock a member chat.");
  const chatEpochRef = useRef(0); // Account generation; member actions never change it.
  const chatMemberEpochRef = useRef<Partial<Record<MemberCode, number>>>({});
  const chatLoadSeqRef = useRef<Partial<Record<MemberCode, number>>>({});
  const chatSendInFlightRef = useRef<ChatApplyGuard | null>(null);
  const chatClearInFlightRef = useRef<ChatApplyGuard | null>(null);
  const voteInFlightRef = useRef<{ userId: string | null; epoch: number } | null>(null);
  const chatMemberCodeRef = useRef(chatMemberCode);
  const chatUiOwnerRef = useRef<string | null>(null);
  const seenChatUserIdRef = useRef<string | null | undefined>(undefined);
  chatMemberCodeRef.current = chatMemberCode;

  function memberEpoch(memberCode: MemberCode) {
    return chatMemberEpochRef.current[memberCode] ?? 0;
  }

  function advanceMemberEpoch(memberCode: MemberCode) {
    const epoch = memberEpoch(memberCode) + 1;
    chatMemberEpochRef.current[memberCode] = epoch;
    if (chatMemberCodeRef.current === memberCode) setChatLoading(false);
    return epoch;
  }

  function forgetStaleChatOwner() {
    chatEpochRef.current += 1;
    chatMemberEpochRef.current = {};
    chatLoadSeqRef.current = {};
    chatUiOwnerRef.current = null;
    chatSendInFlightRef.current = null;
    chatClearInFlightRef.current = null;
    voteInFlightRef.current = null;
    setChatByMember({});
    setChatDrafts({});
    setSendingMemberCode(null);
    setSubmittingVote(false);
    setChatLoading(false);
    setSession(null);
    setSnapshot(null);
    setNextTrackBrief("");
    setReceipt("The signed-in account changed. Reload Harne to continue.");
    setPageError("The signed-in account changed. Reload Harne to continue.");
    setChatStatus("The signed-in account changed. Reload Harne to continue.");
  }

  function isCurrentChatGuard(guard: ChatApplyGuard, loadSeq?: number) {
    return guard.epoch === chatEpochRef.current &&
      guard.memberEpoch === memberEpoch(guard.memberCode) &&
      guard.userId === chatUiOwnerRef.current &&
      (loadSeq === undefined || loadSeq === chatLoadSeqRef.current[guard.memberCode]);
  }

  function applyChatGuard(guard: ChatApplyGuard, identity: ChatIdentity, loadSeq?: number): ChatGuardDecision {
    // A late identity result must not change ownership or erase a newer account.
    if (!isCurrentChatGuard(guard, loadSeq)) return "stale";
    if (seenChatUserIdRef.current !== undefined && seenChatUserIdRef.current !== guard.userId) return "stale";
    if (!identity.ok) return "unverified";
    if (identity.userId !== guard.userId) {
      consumeObservedOwner(seenChatUserIdRef, identity.userId);
      forgetStaleChatOwner();
      return "stale";
    }
    consumeObservedOwner(seenChatUserIdRef, identity.userId);
    return decideChatGuard(guard, chatEpochRef.current, identity);
  }

  function currentAccountOperation(operation: ChatApplyGuard | null) {
    return operation !== null && operation.epoch === chatEpochRef.current &&
      operation.userId === chatUiOwnerRef.current;
  }

  const selectedMember = useMemo(() => getMember(selectedCode), [selectedCode]);
  const chatMember = useMemo(() => getMember(chatMemberCode), [chatMemberCode]);
  const selectedQuestion = useMemo(
    () => getMemberQuestion(snapshot, selectedMember.code),
    [selectedMember.code, snapshot]
  );
  const chatQuestion = useMemo(() => getMemberQuestion(snapshot, chatMember.code), [chatMember.code, snapshot]);
  const selectedServerOption = selectedQuestion?.options.find(
    (option) => option.id === selectedQuestion.selectedOptionId
  );
  const selectedVote = getLocalOption(selectedMember, selectedServerOption?.optionKey);
  const chatServerOption = chatQuestion?.options.find((option) => option.id === chatQuestion.selectedOptionId);
  const chatVote = getLocalOption(chatMember, chatServerOption?.optionKey);
  const nextTrackQuestion = snapshot?.questions.find((question) => question.kind === "next_track");
  const selectedNextTrackOption = nextTrackQuestion?.options.find(
    (option) => option.id === nextTrackQuestion.selectedOptionId
  );
  const selectedNextTrackVote = nextTrackVoteCandidates.find(
    (candidate) => candidate.id === selectedNextTrackOption?.optionKey
  );
  const savedSignalCount =
    snapshot?.questions.filter((question) => question.kind === "member_identity" && question.selectedOptionId).length ??
    0;
  const chatMessages = chatByMember[chatMember.code] ?? [];
  const chatDraft = chatDrafts[chatMember.code] ?? "";
  const chatUserCount = chatMessages.filter((message) => message.role === "user").length;
  const chatLimitReached = chatUserCount >= memberChatTurnLimit;
  const isSendingChat = sendingMemberCode === chatMember.code;
  const featureReady = Boolean(snapshot?.ready && session);

  const loadChat = useCallback(async (memberCode: MemberCode) => {
    const userId = chatUiOwnerRef.current;
    if (!userId) return;
    const seq = (chatLoadSeqRef.current[memberCode] ?? 0) + 1;
    chatLoadSeqRef.current[memberCode] = seq;
    const guard: ChatApplyGuard = { memberCode, userId, epoch: chatEpochRef.current, memberEpoch: memberEpoch(memberCode) };
    if (chatMemberCodeRef.current === memberCode) setChatLoading(true);
    try {
      const startedIdentity = await captureHarneUserId();
      if (applyChatGuard(guard, startedIdentity, seq) !== "apply") return;
      const result = await getHarneThread(memberCode, { expectedUserId: userId });
      const identity = await captureHarneUserId();
      if (applyChatGuard(guard, identity, seq) !== "apply") return;
      setChatByMember((current) => isCurrentChatGuard(guard, seq)
        ? { ...current, [memberCode]: result.thread?.messages ?? [] } : current);
    } catch (error) {
      const identity = await captureHarneUserId();
      if (applyChatGuard(guard, identity, seq) !== "apply") return;
      if (chatMemberCodeRef.current === memberCode) setChatStatus(getErrorMessage(error));
    } finally {
      if (isCurrentChatGuard(guard, seq) && chatMemberCodeRef.current === memberCode) setChatLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrapEpoch = chatEpochRef.current;
    let unsubscribe = () => {};

    async function bootstrap() {
      setIsLoading(true);
      setPageError("");
      void recordMarketingEvent("vote_started", { contentType: "vote", contentKey: "harne-live-round" });
      try {
        unsubscribe = observeHarneSessionUser((userId) => {
          if (active && chatUiOwnerRef.current !== null && userId !== chatUiOwnerRef.current) {
            consumeObservedOwner(seenChatUserIdRef, userId);
            forgetStaleChatOwner();
          }
        });
        const currentSession = await ensureHarneSession();
        const currentSnapshot = await getHarneSnapshot({ expectedUserId: currentSession.user?.id ?? null });
        const confirmedSession = await getHarneSession();
        if (confirmedSession?.user?.id !== currentSession.user?.id) {
          throw new HarneClientError("The signed-in account changed while loading Harne. Reload to continue.", 401);
        }
        if (!active || chatEpochRef.current !== bootstrapEpoch) return;
        chatUiOwnerRef.current = currentSession.user?.id ?? null;
        consumeObservedOwner(seenChatUserIdRef, chatUiOwnerRef.current);

        setSession({
          anonymous: Boolean((currentSession.user as { is_anonymous?: boolean } | null)?.is_anonymous),
          userId: currentSession.user?.id
        });
        setSnapshot(currentSnapshot);
        const persistedTrackQuestion = currentSnapshot.questions.find((question) => question.kind === "next_track");
        setNextTrackBrief(persistedTrackQuestion?.selectedBrief ?? "");
        setReceipt(currentSnapshot.ready ? "Live round loaded. Select a signal to save it." : "No open Harne round is available.");
      } catch (error) {
        if (!active) return;
        setPageError(getErrorMessage(error));
        setReceipt("The live round could not be loaded.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      active = false;
      unsubscribe();
      chatEpochRef.current += 1;
      chatSendInFlightRef.current = null;
      chatClearInFlightRef.current = null;
      voteInFlightRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isChatDockOpen && chatVote) {
      void loadChat(chatMember.code);
    }
  }, [chatMember.code, chatVote, isChatDockOpen, loadChat]);

  function selectMember(member: Member) {
    setSelectedCode(member.code);
    setChatMemberCode(member.code);
  }

  function selectChatMember(member: Member) {
    selectMember(member);
    setIsChatDockOpen(true);
  }

  async function saveVote(question: HarneVoteQuestion | undefined, optionKey: string, brief?: string) {
    if (!question) {
      setReceipt("The live question is not available yet.");
      return;
    }

    const option = question.options.find((candidate) => candidate.optionKey === optionKey);
    if (!option) {
      setReceipt("The selected option is not available in the live round.");
      return;
    }

    const intentUserId = chatUiOwnerRef.current;
    if (!intentUserId) return;
    const operation = { userId: intentUserId, epoch: chatEpochRef.current };
    voteInFlightRef.current = operation;
    setSubmittingVote(true);
    setPageError("");
    try {
      const result = await submitHarneVote({
        questionId: question.id,
        optionId: option.id,
        ...(brief?.trim() ? { brief: brief.trim() } : {})
      }, { expectedUserId: intentUserId });
      if (voteInFlightRef.current !== operation || operation.epoch !== chatEpochRef.current ||
          operation.userId !== chatUiOwnerRef.current) return;
      setSnapshot(result.snapshot);
      setReceipt(`Saved to Supabase: ${option.label}.`);
      void recordMarketingEvent("vote_saved", {
        contentType: "vote",
        contentKey: question.subjectKey,
        properties: { vote_kind: question.kind, option_key: option.optionKey }
      });
    } catch (error) {
      if (voteInFlightRef.current !== operation || operation.epoch !== chatEpochRef.current ||
          operation.userId !== chatUiOwnerRef.current) return;
      setPageError(getErrorMessage(error));
      setReceipt("The signal could not be confirmed. Retry this choice to check it.");
    } finally {
      if (voteInFlightRef.current === operation && operation.epoch === chatEpochRef.current &&
          operation.userId === chatUiOwnerRef.current) {
        voteInFlightRef.current = null;
        setSubmittingVote(false);
      }
    }
  }

  function selectNextTrackCandidate(candidate: NextTrackVoteCandidate) {
    void saveVote(nextTrackQuestion, candidate.id, nextTrackBrief);
  }

  function selectIdentityOption(option: VoteOption) {
    void saveVote(selectedQuestion, option.id);
    setChatMemberCode(selectedMember.code);
  }

  function openSelectedMemberChat() {
    if (!chatVote) return;
    setChatMemberCode(selectedMember.code);
    setIsChatDockOpen(true);
    setChatStatus(`${selectedMember.name}'s persisted thread is ready.`);
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

  async function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentAccountOperation(chatSendInFlightRef.current) || currentAccountOperation(chatClearInFlightRef.current)) return;
    const userId = chatUiOwnerRef.current;
    const text = chatDraft.trim();
    if (!userId || !chatVote || !text || chatLimitReached) {
      if (!chatVote) setChatStatus("Vote for this member before starting chat.");
      return;
    }
    const memberCode = chatMember.code;
    const memberName = chatMember.name;
    const usedSends = chatUserCount + 1;
    const operation: ChatApplyGuard = { memberCode, userId, epoch: chatEpochRef.current, memberEpoch: memberEpoch(memberCode) };
    chatSendInFlightRef.current = operation;
    try {
      const startedIdentity = await captureHarneUserId();
      if (chatSendInFlightRef.current !== operation || applyChatGuard(operation, startedIdentity) !== "apply") return;
      setSendingMemberCode(memberCode);
      setChatStatus(`Sending to ${memberName}...`);
      setChatDrafts((current) => ({ ...current, [memberCode]: "" }));
      try {
        const result = await sendHarneMessage(memberCode, text, { expectedUserId: userId });
        if (!isCurrentChatGuard(operation) || chatSendInFlightRef.current !== operation) return;
        const ackGuard: ChatApplyGuard = { ...operation, memberEpoch: advanceMemberEpoch(memberCode) };
        const ackIdentity = await captureHarneUserId();
        if (applyChatGuard(ackGuard, ackIdentity) !== "apply") return;
        const acknowledgedAt = new Date().toISOString();
        const acknowledgedMessages: HarneChatMessage[] = [
          { id: `local-${acknowledgedAt}-user`, role: "user", content: text, createdAt: acknowledgedAt },
          { id: `local-${acknowledgedAt}-assistant`, role: "assistant", content: result.reply, createdAt: acknowledgedAt }
        ];
        setChatByMember((current) => isCurrentChatGuard(ackGuard)
          ? { ...current, [memberCode]: [...(current[memberCode] ?? []), ...acknowledgedMessages] } : current);
        if (chatMemberCodeRef.current === memberCode) {
          setChatStatus(`${memberName} replied. ${usedSends}/${memberChatTurnLimit} sends used (${result.usage.outputTokens} output tokens).`);
        }
        const historySeq = (chatLoadSeqRef.current[memberCode] ?? 0) + 1;
        chatLoadSeqRef.current[memberCode] = historySeq;
        try {
          const thread = await getHarneThread(memberCode, { expectedUserId: userId });
          const historyIdentity = await captureHarneUserId();
          if (applyChatGuard(ackGuard, historyIdentity, historySeq) !== "apply") return;
          const messages = thread.thread?.messages ?? [];
          if (messages.length > 0) {
            setChatByMember((current) => isCurrentChatGuard(ackGuard, historySeq)
              ? { ...current, [memberCode]: messages } : current);
            if (chatMemberCodeRef.current === memberCode) {
              setChatStatus(`${memberName} replied. ${(messages.filter((message) => message.role === "user").length || usedSends)}/${memberChatTurnLimit} sends used (${result.usage.outputTokens} output tokens).`);
            }
          }
        } catch {
          // Acknowledged sends remain visible; a history read never resends the model request.
        }
      } catch (error) {
        const failedIdentity = await captureHarneUserId();
        if (applyChatGuard(operation, failedIdentity) !== "apply") return;
        setChatDrafts((current) => {
          if (!isCurrentChatGuard(operation) || (current[memberCode] ?? "").trim()) return current;
          return { ...current, [memberCode]: text };
        });
        if (chatMemberCodeRef.current === memberCode) setChatStatus(getErrorMessage(error));
      }
    } finally {
      if (chatSendInFlightRef.current === operation && currentAccountOperation(operation)) {
        chatSendInFlightRef.current = null;
        setSendingMemberCode((current) => current === memberCode ? null : current);
      }
    }
  }

  async function clearChatMemberThread() {
    if (currentAccountOperation(chatClearInFlightRef.current)) return;
    const userId = chatUiOwnerRef.current;
    if (!userId) return;
    const memberCode = chatMember.code;
    const memberName = chatMember.name;
    const operation: ChatApplyGuard = { memberCode, userId, epoch: chatEpochRef.current, memberEpoch: advanceMemberEpoch(memberCode) };
    chatClearInFlightRef.current = operation;
    if (chatMemberCodeRef.current === memberCode) setChatStatus("Clearing");
    try {
      const startedIdentity = await captureHarneUserId();
      if (chatClearInFlightRef.current !== operation || applyChatGuard(operation, startedIdentity) !== "apply") return;
      try {
        await clearHarneThread(memberCode, { expectedUserId: userId });
        const identity = await captureHarneUserId();
        if (applyChatGuard(operation, identity) !== "apply") return;
        const completedGuard = { ...operation, memberEpoch: advanceMemberEpoch(memberCode) };
        setChatByMember((current) => isCurrentChatGuard(completedGuard)
          ? { ...current, [memberCode]: [] } : current);
        if (chatMemberCodeRef.current === memberCode) setChatStatus(`${memberName}'s persisted chat was cleared.`);
      } catch (error) {
        const identity = await captureHarneUserId();
        const decision = applyChatGuard(operation, identity);
        if (isCurrentChatGuard(operation)) advanceMemberEpoch(memberCode);
        if (decision !== "apply") return;
        if (chatMemberCodeRef.current === memberCode) setChatStatus(getErrorMessage(error));
      }
    } finally {
      if (chatClearInFlightRef.current === operation && currentAccountOperation(operation)) {
        chatClearInFlightRef.current = null;
      }
    }
  }

  async function handleSignOut() {
    try {
      await signOutHarne();
      window.location.assign("/login");
    } catch (error) {
      setPageError(getErrorMessage(error));
    }
  }

  return (
    <>
      <main
        className="shell vote-page-shell"
        id="app"
        style={{ "--accent": selectedMember.accent } as CSSProperties}
      >
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
            Live Supabase participation: every identity and next-track signal is authenticated,
            idempotent, and saved to the current demo round.
          </span>
        </section>

        <section className="harne-auth-bar" aria-label="Harne session status">
          <div>
            <p>{session?.anonymous ? "Anonymous demo session" : session ? "Authenticated session" : "Connecting session"}</p>
            <span>
              {session?.anonymous
                ? "Your demo votes and chat are private to this browser account. Sign in to keep them after switching devices."
                : session
                  ? `Account ${session.userId?.slice(0, 8) ?? "ready"} is connected to the live API.`
                  : "Creating a secure session before loading the round."}
            </span>
          </div>
          <div className="harne-auth-actions">
            {session?.anonymous ? <a href="/login">Sign in</a> : null}
            {session ? (
              <button onClick={handleSignOut} type="button">
                Sign out
              </button>
            ) : null}
          </div>
        </section>

        {pageError ? (
          <div className="harne-inline-error" role="alert">
            {pageError}
            <div className="harne-auth-actions">
              <a href="/login">Open auth</a>
              <button onClick={() => window.location.reload()} type="button">
                Retry
              </button>
            </div>
          </div>
        ) : null}

        <section className="vote-page-grid" aria-label="Harne live vote workspace">
          <section className="vote-page-section vote-track-section" aria-label="Track participation vote">
            <div className="vote-section-heading">
              <p>Track Related</p>
              <h2>Who joins the next track?</h2>
              <span>
                Attach a short track cue, then choose the candidate. The selected cue and candidate are persisted to the live round.
              </span>
            </div>

            <label className="vote-track-cue">
              Track Cue
              <textarea
                disabled={!featureReady || submittingVote}
                maxLength={240}
                onChange={(event) => setNextTrackBrief(event.currentTarget.value)}
                placeholder={nextTrackBriefPlaceholder}
                value={nextTrackBrief}
              />
            </label>

            <div className="vote-track-options vote-page-track-options" aria-label="Next track candidates">
              {nextTrackVoteCandidates.map((candidate) => {
                const active = candidate.id === selectedNextTrackVote?.id;
                const accent = getMember(candidate.memberCodes[0]).accent;

                return (
                  <button
                    aria-pressed={active}
                    className={active ? "is-active" : undefined}
                    disabled={!featureReady || submittingVote}
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
              <p>{isLoading ? "Connecting" : "Live Track Signal"}</p>
              <h3>{selectedNextTrackVote ? getCandidateMemberNames(selectedNextTrackVote) : "No name selected yet"}</h3>
              <span>
                {selectedNextTrackVote
                  ? "This signal is stored in the current Supabase round."
                  : "Choose a candidate to save a live next-track signal."}
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
                const hasSignal = Boolean(getMemberQuestion(snapshot, member.code)?.selectedOptionId);

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
                  <strong>{selectedMember.code === "M12" ? "Ash Compass" : `${selectedMember.word} Signal`}</strong>
                  <span>{selectedMember.role}</span>
                </div>
              </section>

              <section className="vote-choice-panel" aria-label={`${selectedMember.name} identity options`}>
                <p className="vote-prompt">{selectedMember.votePrompt}</p>
                <div className="vote-options">
                  {selectedMember.voteOptions.map((option) => (
                    <button
                      aria-pressed={selectedVote?.id === option.id}
                      className={selectedVote?.id === option.id ? "is-selected" : undefined}
                      disabled={!featureReady || submittingVote}
                      key={option.id}
                      onClick={() => selectIdentityOption(option)}
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
                  <p>{selectedVote ? "Live Identity Signal" : "Waiting for thread"}</p>
                  <strong>{selectedVote?.label ?? "No thread selected yet"}</strong>
                  <span>{selectedVote?.signal ?? "Pick one identity thread. The saved state is account-bound in Supabase."}</span>
                  <small>
                    {savedSignalCount}/13 member signals saved to the live round. {receipt}
                  </small>
                </section>

                <div className="vote-receipt-actions">
                  <button disabled={!selectedVote || submittingVote} onClick={openSelectedMemberChat} type="button">
                    Open Member Chat
                  </button>
                  {selectedVote ? (
                    <a href={`/share/${selectedMember.code.toLowerCase()}/${selectedVote.id}`}>
                      Share Signal
                    </a>
                  ) : null}
                </div>
              </section>
            </div>
          </section>
        </section>
      </main>

      <aside
        className={`member-chat-dock member-chat-dock-vote-page${isChatDockOpen ? " is-open" : ""}`}
        aria-label="Harne member chat"
        style={{ "--accent": chatMember.accent } as CSSProperties}
      >
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
                    ? `${chatVote.label} thread unlocked in Supabase.`
                    : "Vote for this member identity to unlock chat."}
                </span>
              </div>
              <button onClick={() => setIsChatDockOpen(false)} type="button">
                Close
              </button>
            </div>

            <div className="member-chat-member-rail" aria-label="Select chat member">
              {members.map((member) => {
                const active = member.code === chatMember.code;
                const hasSignal = Boolean(getMemberQuestion(snapshot, member.code)?.selectedOptionId);

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
                    ? `${chatUserCount}/${memberChatTurnLimit} daily sends used. API moderation and quota are active.`
                    : "Choose one identity thread for this member to open chat."}
                </span>
              </div>

              {chatVote ? (
                <>
                  <div className="member-chat-log" aria-live="polite">
                    {chatLoading ? <p className="member-chat-empty">Loading the persisted thread...</p> : null}
                    {!chatLoading && chatMessages.length
                      ? chatMessages.map((message) => (
                          <p className={`member-chat-message is-${message.role}`} key={message.id}>
                            <span>{message.role === "user" ? "Harne" : chatMember.name}</span>
                            {message.content}
                          </p>
                        ))
                      : null}
                    {!chatLoading && !chatMessages.length ? (
                      <p className="member-chat-empty">
                        Send one line. The reply will follow the selected {chatVote.label} thread.
                      </p>
                    ) : null}
                  </div>

                  <form className="member-chat-form" onSubmit={sendChatMessage}>
                    <label htmlFor={`member-chat-${chatMember.code}`}>Message</label>
                    <textarea
                      disabled={isSendingChat || chatLimitReached}
                      id={`member-chat-${chatMember.code}`}
                      maxLength={memberChatInputLimit}
                      onChange={(event) => updateChatDraft(chatMember.code, event.target.value)}
                      placeholder={chatLimitReached ? "Daily chat limit reached." : `Say something to ${chatMember.name}`}
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
                      <button onClick={() => void clearChatMemberThread()} type="button">
                        Clear
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="member-chat-locked">
                  <p className="member-chat-empty">The member chat opens only after a live identity signal.</p>
                  <button onClick={openChatMemberVote} type="button">
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
