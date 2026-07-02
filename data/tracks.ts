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
  embedDescription?: string;
  credits: string[];
};

export const inkFinalMasterTrack: Track = {
  id: "loom-track-ink-final-master-v24",
  albumTitle: "Loom Ink",
  trackNumber: "Final",
  title: "Ink Final Master V24",
  displayTitle: "Loom - Ink Final Master V24",
  youtubeId: "TyONE0lKI2s",
  youtubeUrl: "https://youtu.be/TyONE0lKI2s",
  embedUrl: "https://www.youtube.com/embed/TyONE0lKI2s",
  archiveHref: "/track#ink",
  summary:
    "Final S00-S12 1080p HQ master. The private draft is live on YouTube, and the web intake now points to the matching visual master set.",
  embedDescription: `No matter what the world says, we do not quit.
Even under pressure, we break through and keep moving beyond the lines they set for us.

Ink is about refusing the script someone else writes for you. Saeyan, Yeul, Faye, and Rena turn erasure into proof: a mark comes back, a line becomes a route, and a closed page opens into a door.

Members: Saeyan, Yeul, Faye, Rena
Group: Loom

#Loom #AURORAM #Ink #AIIdol #Kpop #VirtualIdol #AIMusic #AIMV #AI #AIKpop #Harne`,
  credits: ["Ink final master", "YouTube draft", "Visual master"]
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
  summary: "Heartbeats gather into one pulse.",
  embedDescription: "Heartbeats gather into one pulse.",
  credits: ["Official track", "YouTube embed", "Local package record"]
};

export const tracks = [
  inkFinalMasterTrack,
  pulsoTrack,
  rootSignalTrack
];
export const latestTracks = tracks;
