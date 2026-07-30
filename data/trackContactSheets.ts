import { inkContactSheetGroups } from "./inkAssets";
import { pulsoContactSheetGroups } from "./pulsoAssets";
import {
  inkFinalMasterTrack,
  pulsoTrack,
  rootSignalTrack
} from "./tracks";

export type ContactSheet = {
  image: string;
  label: string;
  title: string;
};

export type ContactSheetGroup = {
  eyebrow: string;
  sheets: ContactSheet[];
  title: string;
};

export type TrackContactSheetGroup = {
  groups: ContactSheetGroup[];
  id?: string;
  summary: string;
  title: string;
  trackId?: string;
  trackLabel: string;
};

const rootSignalContactSheetBasePath = "/assets/tracks/code-root-signal/contact-sheets";
const lowContactSheetBasePath = "/assets/tracks/low/contact-sheets";

const beatContactSheetFiles = [
  "beat-03-b03-bassline-walk.webp",
  "beat-09-b09-set-the-motion.webp",
  "beat-10-b10-let-it-rise.webp",
  "beat-11-b11-one-more-step-ignition.webp",
  "beat-12-b12-turn-before-speak.webp",
  "beat-13-b13-low-key-high-control-1.webp",
  "beat-14-b14-click-hush-roll-1.webp",
  "beat-15-b15-whole-room-turn-1.webp",
  "beat-16-b16-low-roll-floor-talks.webp",
  "beat-17-b17-light-pop-bounce-1.webp",
  "beat-18-b18-la-da-false-stop.webp",
  "beat-19-b19-back-to-line-reset.webp",
  "beat-20-b20-check-the-line.webp",
  "beat-21-b21-clean-attack-return.webp",
  "beat-22-b22-smooth-move.webp",
  "beat-23-b23-circle-handoff.webp",
  "beat-24-b24-set-the-motion-2.webp",
  "beat-25-b25-let-it-rise-2.webp",
  "beat-26-b26-before-speak-eye-turn.webp",
  "beat-27-b27-second-lift-ignition.webp",
  "beat-28-b28-high-control-return.webp",
  "beat-29-b29-click-hush-return.webp",
  "beat-30-b30-whole-room-turn-2.webp",
  "beat-31-b31-low-roll-repeat-2.webp",
  "beat-32-b32-floor-talks-metal.webp",
  "beat-33-b33-make-it-pop-memory.webp",
  "beat-34-b34-lights-go-quiet.webp",
  "beat-35-b35-motion-remains.webp",
  "beat-36-b36-fingertip-pulls-closer.webp",
  "beat-37-b37-small-sound-still-heard.webp",
  "beat-38-b38-final-high-control.webp",
  "beat-39-b39-final-click-hush.webp",
  "beat-40-b40-final-room-turn.webp",
  "beat-41-b41-final-low-seal.webp"
];

const storyboardContactSheets: ContactSheet[] = [
  {
    image: `${rootSignalContactSheetBasePath}/storyboards/storyboard-v2-sheet-01.webp`,
    label: "Storyboard",
    title: "Sheet 01"
  },
  {
    image: `${rootSignalContactSheetBasePath}/storyboards/storyboard-v2-sheet-02.webp`,
    label: "Storyboard",
    title: "Sheet 02"
  },
  {
    image: `${rootSignalContactSheetBasePath}/storyboards/storyboard-v2-sheet-03.webp`,
    label: "Storyboard",
    title: "Sheet 03"
  },
  {
    image: `${rootSignalContactSheetBasePath}/storyboards/storyboard-v2-sheet-04.webp`,
    label: "Storyboard",
    title: "Sheet 04"
  }
];

const lowStoryboardContactSheets: ContactSheet[] = [
  {
    image: `${lowContactSheetBasePath}/storyboards/airport-wardrobe-storyboard.webp`,
    label: "LOW v6",
    title: "Airport Wardrobe Storyboard"
  },
  {
    image: `${lowContactSheetBasePath}/storyboards/airport-wardrobe-lock.webp`,
    label: "LOW v6",
    title: "Airport Wardrobe Lock"
  },
  {
    image: `${lowContactSheetBasePath}/storyboards/solo-group-hook.webp`,
    label: "LOW v7",
    title: "Solo Group Hook"
  },
  {
    image: `${lowContactSheetBasePath}/storyboards/solo-group-hook-strict-wide.webp`,
    label: "LOW v7",
    title: "Solo Group Hook Wide"
  }
];

const lowGroupedContactSheets: ContactSheet[] = [
  {
    image: `${lowContactSheetBasePath}/groups/low-duo-angle-change-two-cut-v1-all-24-founder-passed-contact-sheet.png`,
    label: "LOW duo",
    title: "Duo Angle Change 24"
  },
  {
    image: `${lowContactSheetBasePath}/groups/low-active-5member-group-originals-overview.png`,
    label: "LOW group",
    title: "Active Five Member Originals"
  },
  {
    image: `${lowContactSheetBasePath}/groups/low-previous-02b-keyframes-all-41-overview.png`,
    label: "LOW 02B",
    title: "Previous Keyframes All 41"
  },
  {
    image: `${lowContactSheetBasePath}/groups/low-original-group-five-member-keyframes-overview.png`,
    label: "LOW group",
    title: "Original Five Member Keyframes"
  }
];

const lowSectionContactSheets: ContactSheet[] = Array.from({ length: 15 }, (_, index) => {
  const sectionCode = `S${String(index).padStart(2, "0")}`;

  return {
    image: `${lowContactSheetBasePath}/sections/low-latest-${sectionCode.toLowerCase()}-section-contact-sheet.png`,
    label: "LOW section",
    title: `${sectionCode} Latest Section`
  };
});

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getBeatContactSheet(fileName: string): ContactSheet {
  const parts = fileName.replace(".webp", "").split("-");
  const beatNumber = parts[1] ?? "00";
  const beatCode = parts[2] ?? "beat";
  const titleParts = parts.slice(3);

  return {
    image: `${rootSignalContactSheetBasePath}/beats/${fileName}`,
    label: `Beat ${beatNumber}`,
    title: titleCaseSlug(titleParts.length > 0 ? titleParts.join("-") : beatCode)
  };
}

const beatContactSheets = beatContactSheetFiles.map(getBeatContactSheet);

export const trackContactSheetGroups: TrackContactSheetGroup[] = [
  {
    id: "ink",
    trackId: inkFinalMasterTrack.id,
    trackLabel: "Latest",
    title: "Ink",
    summary:
      "Ink final master with section-level contact sheets only. Preview embeds and non-section frame boards are not listed.",
    groups: inkContactSheetGroups
  },
  {
    id: "pulso",
    trackId: pulsoTrack.id,
    trackLabel: "Latest",
    title: "Pulso",
    summary:
      "Pulso is cleaned to the final v6 master; preview contact-sheet mirrors were removed from the web archive.",
    groups: pulsoContactSheetGroups
  },
  {
    id: "root-signal",
    trackId: rootSignalTrack.id,
    trackLabel: "Track 01",
    title: "Root Signal",
    summary: "Root Signal beat sheets and core storyboard boards grouped under the first track.",
    groups: [
      {
        eyebrow: "Root Signal Beat",
        title: "Beat Contact Sheets",
        sheets: beatContactSheets
      },
      {
        eyebrow: "Root Signal Storyboard",
        title: "Storyboard Contact Sheets",
        sheets: storyboardContactSheets
      }
    ]
  },
  {
    id: "low",
    trackLabel: "Legacy Preview",
    title: "LOW",
    summary: "LOW storyboard boards, grouped source versions, and section-level contact sheets.",
    groups: [
      {
        eyebrow: "LOW Storyboard",
        title: "Storyboard Contact Sheets",
        sheets: lowStoryboardContactSheets
      },
      {
        eyebrow: "LOW Grouped Versions",
        title: "Grouped Contact Sheets",
        sheets: lowGroupedContactSheets
      },
      {
        eyebrow: "LOW Sections",
        title: "Latest Section Contact Sheets",
        sheets: lowSectionContactSheets
      }
    ]
  }
];

export function getTrackContactSheetGroup(trackId: string) {
  return trackContactSheetGroups.find((track) => track.trackId === trackId) ?? null;
}
