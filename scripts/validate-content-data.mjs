#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const projectRoot = process.cwd();
const publicRoot = resolve(projectRoot, "public");
const tempRoot = mkdtempSync(join(tmpdir(), "loom-content-data-"));
const require = createRequire(import.meta.url);
const issues = [];
const checkedAssetPaths = new Set();

const dataEntrypoints = [
  "data/cf.ts",
  "data/inkAssets.ts",
  "data/media.ts",
  "data/memberAssets.ts",
  "data/memberTrackAssets.ts",
  "data/pulsoAssets.ts",
  "data/signalDeckPublications.ts",
  "data/trackContactSheets.ts",
  "data/tracks.ts",
];

function addIssue(owner, message) {
  issues.push(`${owner}: ${message}`);
}

function validateUnique(items, getKey, label) {
  const seen = new Set();

  for (const item of items) {
    const key = getKey(item);
    if (!key) {
      addIssue(label, "missing id");
      continue;
    }
    if (seen.has(key)) {
      addIssue(label, `duplicate id ${key}`);
      continue;
    }
    seen.add(key);
  }
}

function validateMemberCode(code, memberCodeSet, owner) {
  if (!memberCodeSet.has(code)) {
    addIssue(owner, `unknown member code ${String(code)}`);
  }
}

function validateUrl(value, owner) {
  if (!value) return;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      addIssue(owner, `URL must use https: ${value}`);
    }
  } catch {
    addIssue(owner, `invalid URL ${value}`);
  }
}

function validateAsset(assetPath, owner, expectedSha256) {
  if (typeof assetPath !== "string" || !assetPath.startsWith("/assets/")) {
    addIssue(owner, `invalid public asset path ${String(assetPath)}`);
    return;
  }

  const absolutePath = join(publicRoot, assetPath.slice(1));
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    addIssue(owner, `missing public asset ${assetPath}`);
    return;
  }

  checkedAssetPaths.add(assetPath);

  if (expectedSha256) {
    const actualSha256 = createHash("sha256").update(readFileSync(absolutePath)).digest("hex");
    if (actualSha256 !== expectedSha256) {
      addIssue(owner, `SHA-256 mismatch for ${assetPath}`);
    }
  }
}

function getUnreferencedWebpAssets(directory = join(publicRoot, "assets")) {
  const unreferenced = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      unreferenced.push(...getUnreferencedWebpAssets(entryPath));
      continue;
    }
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".webp")) {
      continue;
    }

    const publicPath = `/${entryPath.slice(publicRoot.length + 1).replaceAll("\\", "/")}`;
    if (!checkedAssetPaths.has(publicPath)) {
      unreferenced.push(publicPath);
    }
  }

  return unreferenced.sort();
}

function compileDataModules() {
  const tscPath = join(projectRoot, "node_modules", ".bin", "tsc");
  if (!existsSync(tscPath)) {
    throw new Error("Missing local TypeScript compiler. Run pnpm install first.");
  }

  const result = spawnSync(
    tscPath,
    [
      "--outDir",
      tempRoot,
      "--module",
      "commonjs",
      "--moduleResolution",
      "node",
      "--target",
      "ES2020",
      "--esModuleInterop",
      "--resolveJsonModule",
      "--skipLibCheck",
      "--noEmit",
      "false",
      "--declaration",
      "false",
      "--incremental",
      "false",
      ...dataEntrypoints,
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(detail || "Could not compile content data for validation.");
  }
}

function loadDataModule(name) {
  return require(join(tempRoot, `${name}.js`));
}

function validateContentData() {
  compileDataModules();

  const memberAssets = loadDataModule("memberAssets");
  const memberData = loadDataModule("members");
  const memberTrackData = loadDataModule("memberTrackAssets");
  const mediaData = loadDataModule("media");
  const pulsoData = loadDataModule("pulsoAssets");
  const trackData = loadDataModule("tracks");
  const contactSheetData = loadDataModule("trackContactSheets");
  const cfData = loadDataModule("cf");
  const publicationData = loadDataModule("signalDeckPublications");

  const memberCodeSet = new Set(memberAssets.memberCodes);
  const trackIdSet = new Set(trackData.tracks.map((track) => track.id));
  const cfIdSet = new Set(cfData.cfCampaigns.map((campaign) => campaign.id));

  validateUnique(memberAssets.memberCodes, (code) => code, "member codes");
  validateUnique(memberData.members, (member) => member.code, "members");

  if (memberData.members.length !== memberAssets.memberCodes.length) {
    addIssue(
      "members",
      `expected ${memberAssets.memberCodes.length} identity rows, found ${memberData.members.length}`,
    );
  }

  for (const code of memberAssets.memberCodes) {
    const member = memberData.members.find((item) => item.code === code);
    const assets = memberAssets.memberAssetsByCode[code];
    if (!member) {
      addIssue("members", `missing identity row for ${code}`);
    }
    if (!assets) {
      addIssue("member assets", `missing core asset row for ${code}`);
      continue;
    }
    validateAsset(assets.profile, `member ${code} profile`);
    validateAsset(assets.characterBoard, `member ${code} character board`);
  }

  validateUnique(memberTrackData.memberTrackAssets, (asset) => asset.id, "member track assets");
  for (const asset of memberTrackData.memberTrackAssets) {
    if (!trackIdSet.has(asset.trackId)) {
      addIssue(`member track asset ${asset.id}`, `unknown or missing track id ${String(asset.trackId)}`);
    }
    for (const code of asset.memberCodes) {
      validateMemberCode(code, memberCodeSet, `member track asset ${asset.id}`);
    }
    if (asset.sourceType === "solo") {
      if (!asset.memberCode || asset.memberCodes.length !== 1 || asset.memberCodes[0] !== asset.memberCode) {
        addIssue(`member track asset ${asset.id}`, "solo ownership must resolve to one member code");
      }
    }
    if (asset.sourceType === "duo" && asset.memberCodes.length < 2) {
      addIssue(`member track asset ${asset.id}`, "duo ownership requires at least two member codes");
    }
    validateAsset(asset.image, `member track asset ${asset.id}`);
  }

  validateUnique(pulsoData.pulsoTrackCuts, (asset) => asset.id, "Pulso track cuts");
  for (const asset of pulsoData.pulsoTrackCuts) {
    if (!trackIdSet.has(asset.trackId)) {
      addIssue(`Pulso track cut ${asset.id}`, `unknown or missing track id ${String(asset.trackId)}`);
    }
    validateMemberCode(asset.memberCode, memberCodeSet, `Pulso track cut ${asset.id}`);
    for (const code of asset.memberCodes) {
      validateMemberCode(code, memberCodeSet, `Pulso track cut ${asset.id}`);
    }
    validateAsset(asset.image, `Pulso track cut ${asset.id}`);
  }

  for (const image of mediaData.storyboardImages) {
    validateAsset(image, "storyboard image");
  }

  validateUnique(trackData.tracks, (track) => track.id, "tracks");
  for (const track of trackData.tracks) {
    validateUrl(track.youtubeUrl, `track ${track.id}`);
    validateUrl(track.embedUrl, `track ${track.id}`);
  }

  validateUnique(contactSheetData.trackContactSheetGroups, (group) => group.id, "track contact groups");
  validateUnique(
    contactSheetData.trackContactSheetGroups,
    (group) => group.trackId,
    "track contact group ownership",
  );
  for (const trackGroup of contactSheetData.trackContactSheetGroups) {
    if (!trackGroup.trackId || !trackIdSet.has(trackGroup.trackId)) {
      addIssue(
        `track contact group ${trackGroup.id ?? trackGroup.title}`,
        `unknown or missing track id ${String(trackGroup.trackId)}`,
      );
    }
    for (const group of trackGroup.groups) {
      for (const sheet of group.sheets) {
        validateAsset(
          sheet.image,
          `track contact group ${trackGroup.id ?? trackGroup.title} / ${sheet.title}`,
        );
      }
    }
  }
  for (const track of trackData.tracks) {
    if (!contactSheetData.trackContactSheetGroups.some((group) => group.trackId === track.id)) {
      addIssue(`track ${track.id}`, "missing track contact-sheet group");
    }
  }

  validateUnique(cfData.cfCampaigns, (campaign) => campaign.id, "CF campaigns");
  for (const campaign of cfData.cfCampaigns) {
    for (const code of campaign.memberCodes) {
      validateMemberCode(code, memberCodeSet, `CF campaign ${campaign.id}`);
    }
    validateAsset(campaign.image, `CF campaign ${campaign.id}`);
    validateUrl(campaign.videoUrl, `CF campaign ${campaign.id}`);
    validateUrl(campaign.videoEmbedUrl, `CF campaign ${campaign.id}`);
    if (Boolean(campaign.videoUrl) !== Boolean(campaign.videoEmbedUrl)) {
      addIssue(`CF campaign ${campaign.id}`, "public video URL and embed URL must be set together");
    }
  }

  validateUnique(
    publicationData.signalDeckPublications,
    (publication) => publication.post_id,
    "publications",
  );
  for (const publication of publicationData.signalDeckPublications) {
    const owner = `publication ${publication.post_id}`;
    validateUrl(publication.published_url, owner);
    validateUrl(publication.embed_url, owner);

    if (Number.isNaN(Date.parse(publication.published_at))) {
      addIssue(owner, `invalid published_at ${publication.published_at}`);
    }
    if (publication.content_kind === "mv" && !trackIdSet.has(publication.track_id)) {
      addIssue(owner, `unknown or missing track_id ${String(publication.track_id)}`);
    }
    if (publication.content_kind === "cf" && !cfIdSet.has(publication.cf_id)) {
      addIssue(owner, `unknown or missing cf_id ${String(publication.cf_id)}`);
    }
    if (publication.member_visibility === "none" && publication.member_codes.length > 0) {
      addIssue(owner, "member_visibility none must have no member codes");
    }
    if (publication.member_visibility === "visible" && publication.member_codes.length === 0) {
      addIssue(owner, "member_visibility visible requires member codes");
    }
    for (const code of publication.member_codes) {
      validateMemberCode(code, memberCodeSet, owner);
    }

    validateUnique(publication.visuals, (visual) => visual.id, `${owner} visuals`);
    for (const visual of publication.visuals) {
      const visualOwner = `${owner} visual ${visual.id}`;
      for (const code of visual.member_codes) {
        validateMemberCode(code, memberCodeSet, visualOwner);
        if (!publication.member_codes.includes(code)) {
          addIssue(visualOwner, `member ${code} is not declared on the publication`);
        }
      }
      if (visual.web_path !== `web/public${visual.src}`) {
        addIssue(visualOwner, `web_path does not match src ${visual.src}`);
      }
      validateAsset(visual.src, visualOwner, visual.web_sha256);
    }
  }

  const contactSheetCount = contactSheetData.trackContactSheetGroups.reduce(
    (total, trackGroup) =>
      total + trackGroup.groups.reduce((groupTotal, group) => groupTotal + group.sheets.length, 0),
    0,
  );
  const unreferencedAssets = getUnreferencedWebpAssets();

  return {
    assets: checkedAssetPaths.size,
    cfCampaigns: cfData.cfCampaigns.length,
    contactSheets: contactSheetCount,
    memberTrackAssets: memberTrackData.memberTrackAssets.length,
    members: memberAssets.memberCodes.length,
    publications: publicationData.signalDeckPublications.length,
    tracks: trackData.tracks.length,
    unreferencedAssets,
  };
}

try {
  const summary = validateContentData();

  if (issues.length > 0) {
    console.error(`Content data validation failed with ${issues.length} issue(s):`);
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
  } else {
    console.log(
      `Content data valid: ${summary.members} members, ${summary.memberTrackAssets} member track assets, ` +
        `${summary.tracks} tracks, ${summary.contactSheets} contact sheets, ${summary.cfCampaigns} CF campaigns, ` +
        `${summary.publications} publications, ${summary.assets} unique public assets.`,
    );
    if (summary.unreferencedAssets.length > 0) {
      console.warn(
        `Content data note: ${summary.unreferencedAssets.length} WebP asset(s) are deployed but not referenced by active data:`,
      );
      for (const assetPath of summary.unreferencedAssets) {
        console.warn(`- ${assetPath}`);
      }
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
