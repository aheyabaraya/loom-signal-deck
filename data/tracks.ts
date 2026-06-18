export type Track = {
  id: string;
  albumTitle: string;
  archiveStatus?: string;
  trackNumber: string;
  title: string;
  displayTitle: string;
  youtubeId?: string;
  youtubeUrl?: string;
  embedUrl?: string;
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
    "The first Loom track signal. Thirteen member paths converge into one stage line, then open the archive for profiles, boards, storyboards, and track cuts.",
  credits: ["Official track", "13-member archive", "YouTube embed"]
};

export const pulsoTrack: Track = {
  id: "loom-track-pulso",
  albumTitle: "Loom Track",
  trackNumber: "Pulso",
  title: "Pulso",
  displayTitle: "Official Track: Pulso",
  youtubeId: "0vV4CXL3_Qk",
  youtubeUrl: "https://www.youtube.com/watch?v=0vV4CXL3_Qk",
  embedUrl: "https://www.youtube.com/embed/0vV4CXL3_Qk",
  archiveHref: "/story#pulso",
  summary:
    "Pulso is the cleaned World Cup track package served from the official YouTube embed after local single-media cleanup.",
  credits: ["Official track", "YouTube embed", "Local package record"]
};

export const tracks = [pulsoTrack, rootSignalTrack];
export const latestTracks = tracks.slice(0, 2);
