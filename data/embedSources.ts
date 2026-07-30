export const MEDIA_IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

export function youtubeEmbedUrl(videoId: string, options = "") {
  const query = options ? `?${options}` : "";
  return `https://www.youtube.com/embed/${videoId}${query}`;
}

export function youtubeShortsShareUrl(videoId: string) {
  return `https://youtube.com/shorts/${videoId}`;
}

export function tiktokPlayerUrl(videoId: string) {
  return `https://www.tiktok.com/player/v1/${videoId}?music_info=0&description=0&controls=0&progress_bar=0&play_button=0&volume_control=0&fullscreen_button=0&timestamp=0&closed_caption=0&native_context_menu=0&autoplay=0&loop=0&rel=0`;
}
