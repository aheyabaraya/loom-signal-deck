import type { MemberCode } from "./members";

export type NextTrackVoteCandidate = {
  id: string;
  label: string;
  memberCodes: MemberCode[];
  role: string;
  direction: string;
  evidence: string;
  founderUse: string;
};

export const nextTrackVoteCandidates: NextTrackVoteCandidate[] = [
  {
    id: "aria-hook-carrier",
    label: "Aria Hook Carrier",
    memberCodes: ["M09"],
    role: "Hook ignition",
    direction:
      "Bring Aria forward when the next song needs an instant catch point, bright attack, and chorus memory.",
    evidence: "Best for tracks where the first public read should be energetic and easy to repeat.",
    founderUse: "Use this signal when the album brief needs a hook-first member lead."
  },
  {
    id: "seira-compass-carrier",
    label: "Seira Compass Carrier",
    memberCodes: ["M12"],
    role: "Direction lock",
    direction:
      "Bring Seira forward when the next song needs cool control, a precise opening cue, and quiet pressure.",
    evidence: "Best for tracks where the viewer should feel the stage direction changing before the hook lands.",
    founderUse: "Use this signal when the album brief needs a controlled center of gravity."
  },
  {
    id: "rena-command-center",
    label: "Rena Command Center",
    memberCodes: ["M07"],
    role: "Album axis",
    direction:
      "Bring Rena forward when the next album track needs a leader line, tall posture, and a strong public face.",
    evidence: "Best for tracks that should feel like a formal title moment or a clean group reset.",
    founderUse: "Use this signal when the album brief needs a commanding center."
  },
  {
    id: "faye-vocal-lift",
    label: "Faye Vocal Lift",
    memberCodes: ["M05"],
    role: "Chorus clarity",
    direction:
      "Bring Faye forward when the next song needs a clear vocal lift, open face, and emotional readability.",
    evidence: "Best for tracks where the chorus should feel transparent, bright, and easy to receive.",
    founderUse: "Use this signal when the album brief needs a voice-first emotional anchor."
  },
  {
    id: "saeyan-shion-frame",
    label: "Saeyan / Shion Frame",
    memberCodes: ["M01", "M13"],
    role: "Open and seal",
    direction:
      "Bring Saeyan and Shion together when the next track needs a first-signal opener and a final identity seal.",
    evidence: "Best for album chapters that need a clean beginning, a symbolic ending, or a prologue-to-finale feel.",
    founderUse: "Use this signal when the album brief needs a frame pair instead of one solo lead."
  },
  {
    id: "eryn-karin-impact-unit",
    label: "Eryn / Karin Impact",
    memberCodes: ["M06", "M10"],
    role: "Performance impact",
    direction:
      "Bring Eryn and Karin together when the next song needs edge, grounded force, and visible performance weight.",
    evidence: "Best for tracks where the vote should test appetite for a harder movement-led lane.",
    founderUse: "Use this signal when the album brief needs a performance-impact unit."
  }
];
