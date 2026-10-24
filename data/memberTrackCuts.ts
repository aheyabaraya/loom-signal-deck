import type { MemberCode } from "./memberAssets";
import type { StageCut } from "./memberTrackAssets";
import { getPulsoTrackCutsForMember, type PulsoTrackCut } from "./pulsoAssets";
import {
  getSignalDeckVisualsForMember,
  signalDeckPlatformLabel
} from "./signalDeckPublications";

type BuiltInTrackCutKind = "root-signal" | "pulso-face" | "pulso-stagewear";

export type DisplayTrackCutKind = BuiltInTrackCutKind | (string & {});

export type DisplayTrackCut = {
  id: string;
  image: string;
  kind: DisplayTrackCutKind;
  sourceLabel: string;
  subtitle: string;
  title: string;
  trackId?: string;
  /** ISO date used for newest-first ordering. */
  releasedAt: string;
};

/**
 * Project release dates for track-cut ordering.
 * Newer track packages surface first on member Track Cuts grids.
 */
const TRACK_CUT_RELEASED_AT: Record<BuiltInTrackCutKind, string> = {
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
  catalogCuts: StageCut[] = []
): DisplayTrackCut[] {
  const rootCuts: DisplayTrackCut[] = catalogCuts.map((cut) => ({
    id: cut.id,
    image: cut.image,
    kind: cut.display?.kind ?? "root-signal",
    sourceLabel: cut.display?.sourceLabel ?? rootSignalLabel(cut),
    subtitle: cut.subtitle,
    title: cut.title,
    releasedAt: cut.display?.releasedAt ?? TRACK_CUT_RELEASED_AT["root-signal"],
    trackId: cut.trackId
  }));

  const pulsoCuts: DisplayTrackCut[] = getPulsoTrackCutsForMember(memberCode).map((cut) => ({
    id: cut.id,
    image: cut.image,
    kind: cut.sourceType,
    sourceLabel: pulsoLabel(cut),
    subtitle: cut.subtitle,
    title: cut.title,
    releasedAt: TRACK_CUT_RELEASED_AT[cut.sourceType],
    trackId: cut.trackId
  }));

  const publishedVisuals: DisplayTrackCut[] = getSignalDeckVisualsForMember(memberCode).map(
    ({ publication, visual }) => ({
      id: `public-${publication.post_id}-${visual.id}-${memberCode}`,
      image: visual.src,
      kind: "public-social",
      sourceLabel: `${publication.content_label} · ${signalDeckPlatformLabel(publication.platform)}`,
      subtitle: publication.content_kind === "mv" ? "Published track visual" : "Published CF visual",
      title: publication.title,
      releasedAt: publication.published_at,
      trackId: publication.track_id
    })
  );

  return [...rootCuts, ...pulsoCuts, ...publishedVisuals].sort(byNewest);
}
