import publicationData from "./signalDeckPublications.json";
import type { MemberCode } from "./memberAssets";

export type SignalDeckPublicationPlatform =
  | "tiktok"
  | "youtube"
  | "youtube_shorts"
  | "instagram_reels";

export type SignalDeckPublicationVisual = {
  id: string;
  member_codes: MemberCode[];
  src: string;
  alt: string;
  source_path: string;
  source_sha256: string;
  web_path: string;
  web_sha256: string;
  lineage_mode: "exact_copy" | "web_derivative";
  derivative_note?: string;
};

export type SignalDeckPublication = {
  post_id: string;
  content_id: string;
  content_kind: "mv" | "cf";
  content_label: string;
  platform: SignalDeckPublicationPlatform;
  platform_post_id: string;
  published_url: string;
  embed_url: string;
  published_at: string;
  title: string;
  member_visibility: "visible" | "none";
  member_codes: MemberCode[];
  track_id?: string;
  cf_id?: string;
  duration?: number | null;
  views?: number | null;
  likes?: number | null;
  visuals: SignalDeckPublicationVisual[];
};

type SignalDeckPublicationDocument = {
  schema_version: "idol_signal_deck_publication.v1";
  status: "active";
  publications: SignalDeckPublication[];
};

const document = publicationData as SignalDeckPublicationDocument;

function byNewest(a: SignalDeckPublication, b: SignalDeckPublication) {
  const timeDiff = Date.parse(b.published_at) - Date.parse(a.published_at);
  return timeDiff || a.post_id.localeCompare(b.post_id);
}

export const signalDeckPublications = [...document.publications].sort(byNewest);

export function getSignalDeckPublicationsForMember(memberCode: MemberCode) {
  return signalDeckPublications.filter((publication) => publication.member_codes.includes(memberCode));
}

export function getSignalDeckPublicationsForTrack(trackId: string) {
  return signalDeckPublications.filter((publication) => publication.track_id === trackId);
}

export function getSignalDeckPublicationsForCf(cfId: string) {
  return signalDeckPublications.filter((publication) => publication.cf_id === cfId);
}

export function getLatestSignalDeckPublicationForCf(cfId: string) {
  return getSignalDeckPublicationsForCf(cfId)[0] ?? null;
}

export function getSignalDeckVisualsForMember(memberCode: MemberCode) {
  return getSignalDeckPublicationsForMember(memberCode).flatMap((publication) =>
    publication.visuals
      .filter((visual) => visual.member_codes.includes(memberCode))
      .map((visual) => ({ publication, visual }))
  );
}

export function signalDeckPlatformLabel(platform: SignalDeckPublicationPlatform) {
  if (platform === "youtube_shorts") return "YouTube Shorts";
  if (platform === "youtube") return "YouTube";
  if (platform === "instagram_reels") return "Instagram Reel";
  return "TikTok";
}
