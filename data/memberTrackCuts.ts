import type { MemberCode } from "./members";
import type { StageCut } from "./media";
import { getPulsoTrackCutsForMember, type PulsoTrackCut } from "./pulsoAssets";

export type DisplayTrackCutKind = "root-signal" | "pulso-face" | "pulso-stagewear";

export type DisplayTrackCut = {
  id: string;
  image: string;
  kind: DisplayTrackCutKind;
  sourceLabel: string;
  subtitle: string;
  title: string;
  /** ISO date used for newest-first ordering. */
  releasedAt: string;
};

/**
 * Project release dates for track-cut ordering.
 * Newer track packages surface first on member Track Cuts grids.
 */
const TRACK_CUT_RELEASED_AT: Record<DisplayTrackCutKind, string> = {
  // World Cup Pulso visual package (face + stagewear)
  "pulso-face": "2026-06-18T12:00:00+09:00",
  "pulso-stagewear": "2026-06-18T12:30:00+09:00",
  // Root Signal stage archive (earlier title package)
  "root-signal": "2026-05-29T00:00:00+09:00"
};

function rootSignalLabel(cut: StageCut) {
  return cut.sourceType === "duo" ? "Root Signal Duo" : "Root Signal Solo";
}

function pulsoLabel(cut: PulsoTrackCut) {
  return cut.sourceType === "pulso-face" ? "Pulso Face" : "Pulso Stagewear";
}

function byNewest(a: DisplayTrackCut, b: DisplayTrackCut) {
  const timeDiff = Date.parse(b.releasedAt) - Date.parse(a.releasedAt);
  if (timeDiff !== 0) {
    return timeDiff;
  }
  // Same package: reverse id so later catalog rows win ties.
  return b.id.localeCompare(a.id);
}

/** Member Track Cuts for profile + archive pages, newest package first. */
export function getMemberDisplayTrackCuts(
  memberCode: MemberCode,
  rootSignalCuts: StageCut[] = []
): DisplayTrackCut[] {
  const rootCuts: DisplayTrackCut[] = rootSignalCuts.map((cut) => ({
    id: cut.id,
    image: cut.image,
    kind: "root-signal",
    sourceLabel: rootSignalLabel(cut),
    subtitle: cut.subtitle,
    title: cut.title,
    releasedAt: TRACK_CUT_RELEASED_AT["root-signal"]
  }));

  const pulsoCuts: DisplayTrackCut[] = getPulsoTrackCutsForMember(memberCode).map((cut) => ({
    id: cut.id,
    image: cut.image,
    kind: cut.sourceType,
    sourceLabel: pulsoLabel(cut),
    subtitle: cut.subtitle,
    title: cut.title,
    releasedAt: TRACK_CUT_RELEASED_AT[cut.sourceType]
  }));

  return [...rootCuts, ...pulsoCuts].sort(byNewest);
}
