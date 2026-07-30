import type { MemberCode } from "./members";
import { cfCampaigns } from "./cf";
import { tiktokVideoShareUrl } from "./publicChannels";
import { tiktokMemberAssets } from "./tiktokAssets";

/**
 * Canonical member social-embed registry (TikTok + YouTube Shorts).
 *
 * Manage every public/draft social embed here. After a founder-requested
 * platform API upload:
 *   1. Append under the matching member in `manualClipsByMember`
 *   2. Set accurate `publishedAt` (upload time)
 *   3. Redeploy Signal Deck
 *
 * Sorting is always newest `publishedAt` first. No platform is preferred.
 */
export type SocialClipPlatform = "tiktok" | "youtube_shorts";

export type MemberSocialClip = {
  id: string;
  memberCode: MemberCode;
  platform: SocialClipPlatform;
  title: string;
  /** ISO timestamp used for newest-first ordering. */
  publishedAt: string;
  shareUrl: string;
  playerUrl: string;
  views: number | null;
  likes: number | null;
  duration: number | null;
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
};

function tiktokPlayerUrl(id: string) {
  return `https://www.tiktok.com/player/v1/${id}?music_info=0&description=0&controls=0&progress_bar=0&play_button=0&volume_control=0&fullscreen_button=0&timestamp=0&closed_caption=0&native_context_menu=0&autoplay=0&loop=0&rel=0`;
}

function youtubeShortsPlayerUrl(id: string) {
  return `https://www.youtube.com/embed/${id}?playsinline=1&rel=0`;
}

function youtubeShortsShareUrl(id: string) {
  return `https://youtube.com/shorts/${id}`;
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

function buildClip(memberCode: MemberCode, input: ManualClipInput): MemberSocialClip {
  const isYoutube = input.platform === "youtube_shorts";
  const id = `${isYoutube ? "yt" : "tt"}-${memberCode}-${input.videoId}`;

  return {
    id,
    memberCode,
    platform: input.platform,
    title: input.title,
    publishedAt: input.publishedAt,
    shareUrl:
      input.shareUrl ??
      (isYoutube ? youtubeShortsShareUrl(input.videoId) : tiktokVideoShareUrl(input.videoId)),
    playerUrl:
      input.playerUrl ??
      (isYoutube ? youtubeShortsPlayerUrl(input.videoId) : tiktokPlayerUrl(input.videoId)),
    views: input.views ?? null,
    likes: input.likes ?? null,
    duration: input.duration ?? null
  };
}

/**
 * Member-owned manual embeds (post-API uploads and curated overrides).
 * Add new rows under the member code — this is the primary write surface.
 */
const manualClipsByMember: Partial<Record<MemberCode, ManualClipInput[]>> = {
  M07: [
    {
      platform: "youtube_shorts",
      videoId: "br8NKQIHjOQ",
      title: "Bouquet Gaze · full brand film",
      publishedAt: "2026-07-30T17:08:00+09:00",
      duration: 19
    },
    {
      platform: "youtube_shorts",
      videoId: "xNfAkfhipSE",
      title: "Bouquet Gaze · mutual eyeline cut",
      publishedAt: "2026-07-30T16:52:00+09:00",
      duration: 4
    }
  ]
};

function expandManualClips(): MemberSocialClip[] {
  return (Object.entries(manualClipsByMember) as [MemberCode, ManualClipInput[]][]).flatMap(
    ([memberCode, clips]) => clips.map((clip) => buildClip(memberCode, clip))
  );
}

const cfYoutubeClips: MemberSocialClip[] = cfCampaigns.flatMap((campaign) => {
  if (campaign.videoPlatform !== "youtube_shorts") {
    return [];
  }

  const youtubeId = extractYoutubeId(campaign.videoUrl) ?? extractYoutubeId(campaign.videoEmbedUrl);
  if (!youtubeId) {
    return [];
  }

  // Skip when the same video id is already curated under manualClipsByMember.
  return campaign.memberCodes
    .filter((memberCode) => {
      const manuals = manualClipsByMember[memberCode] ?? [];
      return !manuals.some((clip) => clip.platform === "youtube_shorts" && clip.videoId === youtubeId);
    })
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
    const key = `${clip.platform}:${clip.shareUrl}`;
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
  ...expandManualClips(),
  ...cfYoutubeClips,
  ...legacyTikTokClips
]).sort(byNewest);

export function getSocialClipsForMember(memberCode: MemberCode) {
  return memberSocialClips.filter((clip) => clip.memberCode === memberCode);
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
  return platform === "youtube_shorts" ? "YouTube Shorts" : "TikTok";
}

// Backward-compatible aliases used during the featuredMemberClips transition.
export type FeaturedClipPlatform = SocialClipPlatform;
export type FeaturedMemberClip = MemberSocialClip;
export const featuredMemberClips = memberSocialClips;
export const getFeaturedClipsForMember = getSocialClipsForMember;
export function getLatestFeaturedClipByMember() {
  const latest = new Map<MemberCode, MemberSocialClip>();
  for (const clip of memberSocialClips) {
    if (!latest.has(clip.memberCode)) {
      latest.set(clip.memberCode, clip);
    }
  }
  return latest;
}
