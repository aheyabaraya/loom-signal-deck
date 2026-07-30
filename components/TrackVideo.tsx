import type { Track } from "../data/tracks";
import { MEDIA_IFRAME_ALLOW } from "../data/embedSources";

type TrackVideoProps = {
  track: Track;
  variant?: "home" | "archive";
};

export function TrackVideo({ track, variant = "archive" }: TrackVideoProps) {
  const hasEmbed = Boolean(track.embedUrl);
  const description = track.embedDescription ?? track.summary;

  return (
    <section
      className={`track-showcase track-showcase-${variant}`}
      aria-label={track.displayTitle}
    >
      <div className="track-copy">
        <p>{track.albumTitle}</p>
        <h2>{track.title}</h2>
        <span>{track.displayTitle}</span>
        <p className="track-description">{description}</p>
        <div className="track-credits" aria-label="Track archive tags">
          {track.credits.map((credit) => (
            <strong key={credit}>{credit}</strong>
          ))}
        </div>
        {track.youtubeUrl ? (
          <a className="track-link" href={track.youtubeUrl} rel="noreferrer" target="_blank">
            Open YouTube
          </a>
        ) : null}
      </div>
      <div className="track-video-frame">
        {hasEmbed ? (
          <iframe
            src={track.embedUrl}
            title={track.displayTitle}
            allow={MEDIA_IFRAME_ALLOW}
            allowFullScreen
          />
        ) : (
          <div className="track-video-placeholder">
            <p>{track.archiveStatus ?? "Embed pending"}</p>
            <strong>{track.title}</strong>
            <span>Contact sheets and member boards are live in the archive.</span>
          </div>
        )}
      </div>
    </section>
  );
}
