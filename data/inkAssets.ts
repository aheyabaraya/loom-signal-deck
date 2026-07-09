export type InkVisualAsset = {
  image: string;
  label: string;
  title: string;
};

export type InkVisualGroup = {
  eyebrow: string;
  sheets: InkVisualAsset[];
  summary?: string;
  title: string;
};

const inkAssetBase = "/assets/tracks/ink";

function titleFromFile(fileName: string) {
  return fileName
    .replace(/\.(jpe?g|png|webp)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b(KF|INS|S\d{2}|S\d{2}S\d{2}|V\d+|QC)\b/g, (match) => match)
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function makeAsset(directory: string, fileName: string, label: string): InkVisualAsset {
  return {
    image: `${inkAssetBase}/${directory}/${fileName}`,
    label,
    title: titleFromFile(fileName)
  };
}

const sectionV2ReviewSheetFiles = [
  "section-S02-v2-inserts-part-01.webp",
  "section-S02-v2-inserts-part-02.webp",
  "section-S03-v2-inserts.webp",
  "section-S06-v2-inserts.webp",
  "section-S07-v2-inserts-part-01.webp",
  "section-S07-v2-inserts-part-02.webp",
  "section-S08-v2-inserts-part-01.webp",
  "section-S08-v2-inserts-part-02.webp",
  "section-S10-v2-inserts-part-01.webp",
  "section-S10-v2-inserts-part-02.webp"
];

const passed02ASectionSheetFiles = [
  "ink-s00-s03-keyframe-sheet-v2.webp",
  "ink-s04-s07-keyframe-sheet-v3.webp",
  "ink-s08-s10-keyframe-sheet-v3.webp",
  "ink-s11-s12-keyframe-sheet-v3.webp"
];

export const inkContactSheetGroups: InkVisualGroup[] = [
  {
    eyebrow: "Ink Sections",
    title: "Final Section Contact Sheets",
    summary: "Final Ink section contact sheets only; preview QC, visual-lock boards, and individual frame sets are not listed.",
    sheets: passed02ASectionSheetFiles.map((fileName) =>
      makeAsset("contact-sheets/02a-passed", fileName, "02A pass")
    )
  },
  {
    eyebrow: "Ink Sections",
    title: "Final Insert Section Sheets",
    summary: "Section-level insert contact sheets retained for checking the final Ink master.",
    sheets: sectionV2ReviewSheetFiles.map((fileName) =>
      makeAsset("contact-sheets/02b-v2-review", fileName, "02B v2")
    )
  }
];
