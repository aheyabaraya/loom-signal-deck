import type { Track } from "../data/tracks";

type TrackVideoProps = {
  track: Track;
  variant?: "home" | "archive";
};

export function TrackVideo({ track, variant = "archive" }: TrackVideoProps) {
  return (
    <section
      className={`track-showcase track-showcase-${variant}`}
      aria-label={track.displayTitle}
    >
      <div className="track-copy">
        <p>{track.albumTitle}</p>
        <h2>{track.title}</h2>
        <span>{track.displayTitle}</span>
        <p>{track.summary}</p>
        <div className="track-credits" aria-label="Track archive tags">
          {track.credits.map((credit) => (
            <strong key={credit}>{credit}</strong>
          ))}
        </div>
      </div>
      <div className="track-video-frame">
        <iframe
          src={track.embedUrl}
          title={track.displayTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </section>
  );
}
