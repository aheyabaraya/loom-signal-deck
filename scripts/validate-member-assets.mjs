import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const publicRoot = path.join(projectRoot, "public");
const memberAssetsSource = fs.readFileSync(
  path.join(projectRoot, "data/memberAssets.ts"),
  "utf8"
);
const memberTrackAssetsSource = fs.readFileSync(
  path.join(projectRoot, "data/memberTrackAssets.ts"),
  "utf8"
);
const pulsoAssetsSource = fs.readFileSync(
  path.join(projectRoot, "data/pulsoAssets.ts"),
  "utf8"
);

const memberCodeBlock = memberAssetsSource.match(
  /export const memberCodes = \[([\s\S]*?)\] as const;/
);

if (!memberCodeBlock) {
  throw new Error("Could not read memberCodes from data/memberAssets.ts");
}

const memberCodes = [...memberCodeBlock[1].matchAll(/"(M\d{2})"/g)].map((match) => match[1]);
const expectedPaths = new Set();
const memberCoreAssetOverrides =
  memberAssetsSource.match(/const memberCoreAssetOverrides[^=]*= \{([\s\S]*?)\};/)?.[1] ?? "";

for (const memberCode of memberCodes) {
  const overrideBody =
    memberCoreAssetOverrides.match(new RegExp(`${memberCode}:\\s*\\{([\\s\\S]*?)\\}`))?.[1] ?? "";
  const profileOverride = overrideBody.match(/profile:\s*"([^"]+)"/)?.[1];
  const characterBoardOverride = overrideBody.match(/characterBoard:\s*"([^"]+)"/)?.[1];

  expectedPaths.add(profileOverride ?? `/assets/members/${memberCode}/profile.webp`);
  expectedPaths.add(
    characterBoardOverride ?? `/assets/members/${memberCode}/character-board.webp`
  );
}

for (const match of memberTrackAssetsSource.matchAll(
  /memberAlbumImage\(\s*"(M\d{2})",\s*"([^"]+)",\s*"([^"]+)"\s*\)/g
)) {
  expectedPaths.add(`/assets/members/${match[1]}/albums/${match[2]}/${match[3]}`);
}

for (const match of memberTrackAssetsSource.matchAll(
  /memberUnitAlbumImage\(\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\s*\)/g
)) {
  expectedPaths.add(`/assets/members/duos/albums/${match[2]}/${match[1]}/${match[3]}`);
}

for (const match of pulsoAssetsSource.matchAll(
  /"(\/assets\/tracks\/world-cup-pulso\/members\/[^"]+)"/g
)) {
  expectedPaths.add(match[1]);
}

const stageIds = [...memberTrackAssetsSource.matchAll(/"id": "([^"]+)"/g)].map(
  (match) => match[1]
);
const duplicateStageIds = stageIds.filter((id, index) => stageIds.indexOf(id) !== index);
const missingPaths = [...expectedPaths].filter(
  (assetPath) => !fs.existsSync(path.join(publicRoot, assetPath.replace(/^\/assets\//, "assets/")))
);

if (duplicateStageIds.length || missingPaths.length) {
  if (duplicateStageIds.length) {
    console.error(`Duplicate member asset ids: ${[...new Set(duplicateStageIds)].join(", ")}`);
  }
  if (missingPaths.length) {
    console.error(`Missing member asset files:\n${missingPaths.join("\n")}`);
  }
  process.exit(1);
}

console.log(
  `Member asset registry valid: ${memberCodes.length} members, ${stageIds.length} catalog rows, ${expectedPaths.size} files.`
);
