/**
 * Public SNS channel constants for Loom (X excluded — managed separately).
 *
 * Target handle is `loom_m` (underscore). Hyphen form `loom-m` is not allowed
 * as a username on Instagram or TikTok; use display name "Loom" / "Loom-M".
 *
 * Live IG / TikTok / YouTube renames must be done in each app/studio.
 * This file only keeps Signal Deck + share URL construction consistent.
 */
export const LOOM_PUBLIC = {
  displayName: "Loom",
  /** Unified handle for TikTok, Instagram, YouTube (not X). */
  handle: "loom_m",
  /** Display-only variant if Founder wants a hyphen look in bios. */
  displayHandleStyle: "loom-m",
  fanName: "Harne",
  signalDeckUrl: "https://loom-signal-deck.vercel.app/",
  aiMadeLine: "AI-made with Grok and GPT.",
  stackShort: "Grok plan · GPT image · Grok Imagine · Grok Build",
  tiktokProfileUrl: "https://www.tiktok.com/@loom_m",
  instagramProfileUrl: "https://www.instagram.com/loom_m/",
  youtubeHandleUrl: "https://www.youtube.com/@loom_m"
} as const;

export function tiktokVideoShareUrl(videoId: string) {
  return `https://www.tiktok.com/@${LOOM_PUBLIC.handle}/video/${videoId}`;
}
