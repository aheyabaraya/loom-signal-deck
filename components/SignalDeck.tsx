"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultMemberCode,
  getMember,
  members,
  type Member,
  type MemberCode,
  type VoteOption
} from "../data/members";
import { SiteHeader, type SiteHeaderActive } from "./SiteHeader";

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
const voteStorageKey = "loom-harne-identity-votes-v1";
const emptyVoteReceipt = "Choose one thread. This prototype saves only in this browser.";

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
  const [selectedCode, setSelectedCode] = useState<MemberCode>(initialCode);
  const [isChanging, setIsChanging] = useState(false);
  const [receipt, setReceipt] = useState(emptyVoteReceipt);
  const [localVotes, setLocalVotes] = useState<Partial<Record<MemberCode, string>>>({});
  const voteModal = useRef<HTMLDialogElement>(null);

  const selectedMember = useMemo(() => getMember(selectedCode), [selectedCode]);
  const mantra = useMemo(() => getMantra(selectedMember), [selectedMember]);
  const selectedVoteId = localVotes[selectedMember.code];
  const selectedVote = useMemo(
    () => selectedMember.voteOptions.find((option) => option.id === selectedVoteId) ?? null,
    [selectedMember, selectedVoteId]
  );
  const savedSignalCount = useMemo(
    () => members.filter((member) => Boolean(localVotes[member.code])).length,
    [localVotes]
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
    setIsChanging(true);
    window.setTimeout(() => setIsChanging(false), 220);
  }

  function openVoteModal() {
    if (voteModal.current && !voteModal.current.open) {
      voteModal.current.showModal();
    }
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
                      } as React.CSSProperties
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
              <a href={`/member/${selectedMember.code.toLowerCase()}`}>
                View Profile <i />
              </a>
              <button type="button" onClick={openVoteModal}>
                Vote Signal <i />
              </button>
            </div>
          </aside>
        </section>

      </main>

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
                style={{ "--member-accent": member.accent } as React.CSSProperties}
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
          </section>
        </div>
      </dialog>
    </>
  );
}
