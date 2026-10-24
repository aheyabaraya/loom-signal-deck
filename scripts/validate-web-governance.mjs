import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = join(root, "docs/governance/version-registry.json");
const ledgerPath = join(root, "docs/governance/release-ledger.jsonl");
const errors = [];

function error(message) {
  errors.push(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const registry = await readJson(registryPath);
if (registry.schemaVersion !== "loom-web-version-registry.v1") error("Registry schemaVersion must be loom-web-version-registry.v1.");
if (!/^\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/i.test(registry.productVersion ?? "")) error("Registry productVersion is invalid.");
if (!["development", "local_verified", "preview_ready", "production_ready", "released"].includes(registry.releaseState)) {
  error("Registry releaseState is invalid.");
}
if (registry.owner !== "web") error("Registry owner must remain web.");
if (!Array.isArray(registry.contracts) || registry.contracts.length < 6) error("Registry must declare at least six web contracts.");

const validatorPath = join(root, registry.validator ?? "");
try {
  await stat(validatorPath);
} catch {
  error(`Registry validator does not exist: ${registry.validator}`);
}

const contractIds = new Set();
const artifactPaths = new Set();
for (const contract of registry.contracts ?? []) {
  if (!/^[a-z0-9][a-z0-9-]+$/.test(contract.id ?? "")) error(`Invalid contract id: ${contract.id}`);
  if (contractIds.has(contract.id)) error(`Duplicate contract id: ${contract.id}`);
  contractIds.add(contract.id);
  if (!/^\d+\.\d+\.\d+$/.test(contract.version ?? "")) error(`Invalid semantic version for ${contract.id}.`);
  if (!["development", "local_verified", "preview_ready", "production_ready", "released"].includes(contract.status)) {
    error(`Invalid status for ${contract.id}.`);
  }
  if (!Array.isArray(contract.artifacts) || contract.artifacts.length === 0) {
    error(`${contract.id} must bind at least one canonical artifact.`);
    continue;
  }

  for (const artifact of contract.artifacts) {
    if (typeof artifact.path !== "string" || isAbsolute(artifact.path) || artifact.path.includes("..")) {
      error(`${contract.id} has an unsafe artifact path.`);
      continue;
    }
    if (artifactPaths.has(artifact.path)) error(`Artifact is owned by more than one contract: ${artifact.path}`);
    artifactPaths.add(artifact.path);

    const absolutePath = join(root, artifact.path);
    try {
      const [rootRealpath, fileRealpath, bytes] = await Promise.all([
        realpath(root),
        realpath(absolutePath),
        readFile(absolutePath)
      ]);
      if (relative(rootRealpath, fileRealpath).startsWith("..")) error(`Artifact escapes web root: ${artifact.path}`);
      const actualHash = sha256(bytes);
      if (!/^[a-f0-9]{64}$/.test(artifact.sha256 ?? "")) error(`Artifact hash is invalid: ${artifact.path}`);
      else if (actualHash !== artifact.sha256) error(`Artifact hash drift: ${artifact.path}`);
    } catch {
      error(`Artifact does not exist or is unreadable: ${artifact.path}`);
    }
  }
}

const requiredArtifacts = [
  "docs/README.md",
  "docs/architecture/business-marketing-platform.md",
  "docs/architecture/data-and-security.md",
  "docs/architecture/testing-and-release.md",
  "data/marketingCampaigns.json",
  "data/membershipPlans.json",
  "lib/marketing/contracts.ts",
  "supabase/migrations/20260809132835_loom_marketing_platform.sql"
];
for (const path of requiredArtifacts) {
  if (!artifactPaths.has(path)) error(`Required canonical artifact is not version-bound: ${path}`);
}

const ledgerLines = (await readFile(ledgerPath, "utf8"))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);
if (!ledgerLines.length) error("Release ledger must contain at least one event.");

const releaseEvents = [];
for (const [index, line] of ledgerLines.entries()) {
  try {
    const event = JSON.parse(line);
    releaseEvents.push(event);
    if (event.schemaVersion !== "loom-web-release-event.v1") error(`Ledger line ${index + 1} has an invalid schemaVersion.`);
    if (!event.releaseId || !event.event || !event.occurredAt) error(`Ledger line ${index + 1} is missing event identity.`);
    if (typeof event.remoteDatabaseApplied !== "boolean" || typeof event.productionDeployed !== "boolean") {
      error(`Ledger line ${index + 1} must record remote and production booleans.`);
    }
  } catch {
    error(`Release ledger line ${index + 1} is not valid JSON.`);
  }
}

for (let index = 1; index < releaseEvents.length; index += 1) {
  if (Date.parse(releaseEvents[index].occurredAt) < Date.parse(releaseEvents[index - 1].occurredAt)) {
    error("Release ledger timestamps must be append-ordered.");
  }
}

const latestEvent = releaseEvents.at(-1);
if (latestEvent && latestEvent.state !== registry.releaseState) error("Registry releaseState must match the latest ledger event.");
if (registry.releaseState === "released" && (!latestEvent?.remoteDatabaseApplied || !latestEvent?.productionDeployed)) {
  error("Released state requires actual remote DB and production deployment evidence.");
}

if (errors.length) {
  console.error(`Web governance validation failed (${errors.length}):`);
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}

console.log(
  `Web governance PASS: ${registry.contracts.length} contracts, ${artifactPaths.size} hash-bound artifacts, ${releaseEvents.length} release events.`
);
