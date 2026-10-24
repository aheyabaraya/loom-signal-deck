import type { MemberCode } from "./members";
import { cfCampaigns } from "./cf";
import {
  tiktokPlayerUrl,
  youtubeEmbedUrl,
  youtubeShortsShareUrl
} from "./embedSources";
import { tiktokVideoShareUrl } from "./publicChannels";
import {
  signalDeckPlatformLabel,
  signalDeckPublications,
  type SignalDeckPublicationPlatform,
  type SignalDeckPublicationVisual
} from "./signalDeckPublications";
import { tiktokMemberAssets } from "./tiktokAssets";

/**
 * Member-scoped read model for the public Signal Deck publication registry.
 *
 * New public posts are written to `signalDeckPublications.json` only through
 * the hash-bound public closeout. Legacy TikTok and older CF rows remain
 * read-only compatibility inputs until they receive exact publication mapping.
 *
 * Sorting is always newest `publishedAt` first. No platform is preferred.
 */
export type SocialClipPlatform = SignalDeckPublicationPlatform;

export type MemberSocialClip = {
  id: string;
  memberCode: MemberCode | null;
  platform: SocialClipPlatform;
  title: string;
  /** ISO timestamp used for newest-first ordering. */
  publishedAt: string;
  shareUrl: string;
  playerUrl: string;
  views: number | null;
  likes: number | null;
  duration: number | null;
  postId?: string;
  contentId?: string;
  contentKind?: "mv" | "cf";
  contentLabel?: string;
  memberCodes: MemberCode[];
  trackId?: string;
  cfId?: string;
  visual?: SignalDeckPublicationVisual;
};

type ManualClipInput = {
  platform: SocialClipPlatform;
  /** Platform-native id (TikTok video id or YouTube video id). */
  videoId: string;
  title: string;
  publishedAt: string;
  shareUrl?: string;
  playerUrl?: string;
  views?: number | null;
  likes?: number | null;
  duration?: number | null;
  postId?: string;
  contentId?: string;
  contentKind?: "mv" | "cf";
  contentLabel?: string;
  memberCodes?: MemberCode[];
  trackId?: string;
  cfId?: string;
  visual?: SignalDeckPublicationVisual;
};

function youtubeShortsPlayerUrl(id: string) {
  return youtubeEmbedUrl(id, "playsinline=1&rel=0");
}

function extractYoutubeId(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  const shorts = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);
  if (shorts?.[1]) {
    return shorts[1];
  }

  const watch = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (watch?.[1]) {
    return watch[1];
  }

  const youtuBe = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  return youtuBe?.[1] ?? null;
}

function buildClip(memberCode: MemberCode | null, input: ManualClipInput): MemberSocialClip {
  const isYoutube = input.platform === "youtube" || input.platform === "youtube_shorts";
  const platformPrefix = isYoutube ? "yt" : input.platform === "instagram_reels" ? "ig" : "tt";
  const id = `${platformPrefix}-${memberCode ?? "loom"}-${input.videoId}`;

  const fallbackShareUrl =
    input.platform === "instagram_reels"
      ? `https://www.instagram.com/reel/${input.videoId}/`
      : input.platform === "youtube"
        ? `https://youtu.be/${input.videoId}`
        : isYoutube
          ? youtubeShortsShareUrl(input.videoId)
          : tiktokVideoShareUrl(input.videoId);
  const fallbackPlayerUrl =
    input.platform === "instagram_reels"
      ? `https://www.instagram.com/reel/${input.videoId}/embed`
      : isYoutube
        ? youtubeShortsPlayerUrl(input.videoId)
        : tiktokPlayerUrl(input.videoId);

  return {
    id,
    memberCode,
    platform: input.platform,
    title: input.title,
    publishedAt: input.publishedAt,
    shareUrl: input.shareUrl ?? fallbackShareUrl,
    playerUrl: input.playerUrl ?? fallbackPlayerUrl,
    views: input.views ?? null,
    likes: input.likes ?? null,
    duration: input.duration ?? null,
    postId: input.postId,
    contentId: input.contentId,
    contentKind: input.contentKind,
    contentLabel: input.contentLabel,
    memberCodes: input.memberCodes ?? (memberCode ? [memberCode] : []),
    trackId: input.trackId,
    cfId: input.cfId,
    visual: input.visual
  };
}

const publicCloseoutClips: MemberSocialClip[] = signalDeckPublications.flatMap((publication) => {
  const owners: Array<MemberCode | null> = publication.member_codes.length
    ? publication.member_codes
    : [null];

  return owners.map((memberCode) =>
    buildClip(memberCode, {
      platform: publication.platform,
      videoId: publication.platform_post_id,
      title: publication.title,
      publishedAt: publication.published_at,
      shareUrl: publication.published_url,
      playerUrl: publication.embed_url,
      views: publication.views,
      likes: publication.likes,
      duration: publication.duration,
      postId: publication.post_id,
      contentId: publication.content_id,
      contentKind: publication.content_kind,
      contentLabel: publication.content_label,
      memberCodes: publication.member_codes,
      trackId: publication.track_id,
      cfId: publication.cf_id,
      visual:
        (memberCode
          ? publication.visuals.find((visual) => visual.member_codes.includes(memberCode))
          : undefined) ??
        publication.visuals[0]
    })
  );
});

const cfYoutubeClips: MemberSocialClip[] = cfCampaigns.flatMap((campaign) => {
  if (campaign.videoPlatform !== "youtube_shorts") {
    return [];
  }

  const youtubeId = extractYoutubeId(campaign.videoUrl) ?? extractYoutubeId(campaign.videoEmbedUrl);
  if (!youtubeId) {
    return [];
  }

  // Skip when the same member/video pair is already closed in the public registry.
  return campaign.memberCodes
    .filter(
      (memberCode) =>
        !signalDeckPublications.some(
          (publication) =>
            publication.platform === "youtube_shorts" &&
            publication.platform_post_id === youtubeId &&
            publication.member_codes.includes(memberCode)
        )
    )
    .map((memberCode) =>
      buildClip(memberCode, {
        platform: "youtube_shorts",
        videoId: youtubeId,
        title: campaign.shortTitle,
        publishedAt: "2026-07-01T00:00:00+09:00",
        shareUrl: campaign.videoUrl,
        playerUrl: campaign.videoEmbedUrl
      })
    );
});

const legacyTikTokClips: MemberSocialClip[] = tiktokMemberAssets.map((asset) =>
  buildClip(asset.memberCode, {
    platform: "tiktok",
    videoId: asset.id,
    title: asset.title,
    publishedAt: asset.capturedAt,
    shareUrl: asset.shareUrl,
    playerUrl: asset.playerUrl,
    views: asset.views,
    likes: asset.likes,
    duration: asset.duration
  })
);

function dedupeClips(clips: MemberSocialClip[]) {
  const seen = new Set<string>();
  const out: MemberSocialClip[] = [];

  for (const clip of clips) {
    const key = `${clip.memberCode}:${clip.platform}:${clip.shareUrl}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(clip);
  }

  return out;
}

function byNewest(a: MemberSocialClip, b: MemberSocialClip) {
  const timeDiff = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  if (timeDiff !== 0) {
    return timeDiff;
  }
  // Stable tie-break only — never prefer a platform.
  return a.id.localeCompare(b.id);
}

/** Flat catalog, newest first. Single source for home + member social proof. */
export const memberSocialClips: MemberSocialClip[] = dedupeClips([
  ...publicCloseoutClips,
  ...cfYoutubeClips,
  ...legacyTikTokClips
]).sort(byNewest);

export function getSocialClipsForMember(memberCode: MemberCode) {
  return memberSocialClips.filter((clip) => clip.memberCode === memberCode);
}

function uniquePosts(clips: MemberSocialClip[]) {
  const seen = new Set<string>();
  return clips.filter((clip) => {
    const key = clip.postId ?? `${clip.platform}:${clip.shareUrl}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getSocialClipsForTrack(trackId: string) {
  return uniquePosts(memberSocialClips.filter((clip) => clip.trackId === trackId));
}

export function getSocialClipsForCf(cfId: string) {
  return uniquePosts(memberSocialClips.filter((clip) => clip.cfId === cfId));
}

/**
 * Home Featured: one latest clip per member, then order those cards by
 * upload date (newest first). TikTok is not preferred over YouTube.
 * Optional `memberCodes` limits to home-visible members only.
 */
export function getFeaturedHomeClips(memberCodes?: readonly MemberCode[]) {
  const allow = memberCodes ? new Set(memberCodes) : null;
  const latestByMember = new Map<MemberCode, MemberSocialClip>();

  for (const clip of memberSocialClips) {
    if (!clip.memberCode) {
      continue;
    }
    if (allow && !allow.has(clip.memberCode)) {
      continue;
    }
    if (!latestByMember.has(clip.memberCode)) {
      latestByMember.set(clip.memberCode, clip);
    }
  }

  return Array.from(latestByMember.values()).sort(byNewest);
}

export function platformLabel(platform: SocialClipPlatform) {
  return signalDeckPlatformLabel(platform);
}

// Backward-compatible aliases used during the featuredMemberClips transition.
export type FeaturedClipPlatform = SocialClipPlatform;
export type FeaturedMemberClip = MemberSocialClip;
export const featuredMemberClips = memberSocialClips;
export const getFeaturedClipsForMember = getSocialClipsForMember;
export function getLatestFeaturedClipByMember() {
  const latest = new Map<MemberCode, MemberSocialClip>();
  for (const clip of memberSocialClips) {
    if (!clip.memberCode) {
      continue;
    }
    if (!latest.has(clip.memberCode)) {
      latest.set(clip.memberCode, clip);
    }
  }
  return latest;
}
