export type Track = {
  id: string;
  albumTitle: string;
  trackNumber: string;
  title: string;
  displayTitle: string;
  youtubeId: string;
  youtubeUrl: string;
  embedUrl: string;
  archiveHref: string;
  summary: string;
  credits: string[];
};

export const rootSignalTrack: Track = {
  id: "loom-track-root-signal",
  albumTitle: "Loom Track",
  trackNumber: "Root",
  title: "Root Signal",
  displayTitle: "Official Track: Root Signal",
  youtubeId: "DUyCAFHZ7X0",
  youtubeUrl: "https://youtu.be/DUyCAFHZ7X0",
  embedUrl: "https://www.youtube.com/embed/DUyCAFHZ7X0",
  archiveHref: "/archive#tracks",
  summary:
    "The first Loom track signal. Thirteen member paths converge into one stage line, then open the archive for profiles, boards, storyboards, and stage cuts.",
  credits: ["Official track", "13-member archive", "YouTube embed"]
};

export const tracks = [rootSignalTrack];
export const latestTracks = tracks.slice(0, 2);
