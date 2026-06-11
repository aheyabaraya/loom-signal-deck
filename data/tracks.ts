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
  id: "loom-track-01-root-signal",
  albumTitle: "Loom Track 01",
  trackNumber: "01",
  title: "Root Signal",
  displayTitle: "Loom Track 01 Root Signal",
  youtubeId: "DUyCAFHZ7X0",
  youtubeUrl: "https://youtu.be/DUyCAFHZ7X0",
  embedUrl: "https://www.youtube.com/embed/DUyCAFHZ7X0",
  archiveHref: "/archive#tracks",
  summary:
    "The first Loom album signal. Thirteen member paths converge into one stage line, then open the archive for profiles, boards, storyboards, and stage cuts.",
  credits: ["First album signal", "13-member archive", "YouTube official embed"]
};

export const tracks = [rootSignalTrack];
