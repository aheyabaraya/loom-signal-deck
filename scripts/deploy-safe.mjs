#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, "..");
const projectConfigPath = join(appDir, ".vercel", "project.json");
const maxSizeMb = Number(process.env.SAFE_DEPLOY_MAX_MB ?? "80");
const maxSizeBytes = maxSizeMb * 1024 * 1024;

const includeEntries = [
  ".env.example",
  "app",
  "components",
  "data",
  "docs",
  "lib",
  "public",
  "next.config.mjs",
  "next-env.d.ts",
  "package.json",
  "pnpm-lock.yaml",
  "proxy.ts",
  "scripts",
  "styles",
  "styles.css",
  "supabase",
  "tsconfig.json",
  "tsconfig.typecheck.json",
];

const deployArgs = [];
let dryRun = false;
let createdStageRoot = "";
let retainCreatedStage = false;

for (const arg of process.argv.slice(2)) {
  if (arg === "--") {
    continue;
  }

  if (arg === "--dry-run") {
    dryRun = true;
    continue;
  }

  if (
    arg === "--prod" ||
    arg === "--force" ||
    arg === "--logs" ||
    arg === "--no-wait" ||
    arg.startsWith("--target=")
  ) {
    deployArgs.push(arg);
    continue;
  }

  console.error(`Unsupported deploy argument: ${arg}`);
  console.error("Allowed: --prod, --force, --logs, --no-wait, --target=<name>, --dry-run");
  process.exit(1);
}

if (!Number.isFinite(maxSizeMb) || maxSizeMb <= 0) {
  console.error("SAFE_DEPLOY_MAX_MB must be a positive number.");
  process.exit(1);
}

const cleanupCreatedStage = () => {
  if (!createdStageRoot || retainCreatedStage) {
    return;
  }

  rmSync(createdStageRoot, { recursive: true, force: true });
  createdStageRoot = "";
};

process.on("exit", cleanupCreatedStage);
process.once("SIGINT", () => process.exit(130));
process.once("SIGTERM", () => process.exit(143));

const abort = (message) => {
  cleanupCreatedStage();
  console.error(message);
  process.exit(1);
};

const posixRel = (from, to) => relative(from, to).split("\\").join("/");

const isInside = (parent, child) => {
  const rel = posixRel(resolve(parent), resolve(child));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
};

// Local tool caches are never payload. Skip them without reading contents.
const localOnlyArtifacts = new Set([
  ".git", ".cursor", ".grok", ".codex", ".DS_Store", ".next",
  "node_modules", ".turbo", ".cache", ".temp", ".playwright-cli",
  "__pycache__", "tsconfig.tsbuildinfo",
]);
const isLocalOnlyArtifact = (name) => localOnlyArtifacts.has(name);

const isSensitiveArtifact = (name) => {
  if (name === ".env.example") {
    return false;
  }

  if (name === ".env" || name.startsWith(".env.")) {
    return true;
  }

  if (
    name === ".next" ||
    name === "node_modules" ||
    name === ".vercel" ||
    name === ".turbo" ||
    name === ".cache" ||
    name === ".temp" ||
    name === ".playwright-cli" ||
    name === "tsconfig.tsbuildinfo"
  ) {
    return true;
  }

  if (/\.(?:pem|key|p12|pfx|keystore|jks|sqlite|sqlite3|db)$/i.test(name)) {
    return true;
  }

  if (/^id_(?:rsa|dsa|ecdsa|ed25519)(?:$|\.)/.test(name)) {
    return true;
  }

  if (name.endsWith(".log")) {
    return true;
  }

  return false;
};

const assertSafeStat = (info, rel) => {
  const name = basename(rel);

  if (info.isSymbolicLink()) {
    abort(`Safe deploy aborted: refused symlink: ${rel}`);
  }

  if (name !== ".env.example" && isSensitiveArtifact(name)) {
    abort(`Safe deploy aborted: refused nested sensitive artifact: ${rel}`);
  }

  if (!info.isDirectory() && !info.isFile()) {
    abort(`Safe deploy aborted: refused non-regular file: ${rel}`);
  }
};

const lstatOrMissingInclude = (absPath, entry) => {
  try {
    return lstatSync(absPath);
  } catch {
    abort(`Safe deploy aborted: listed include is missing: ${entry}`);
  }
};

const inspectTreeContents = (absPath, rel) => {
  for (const name of readdirSync(absPath)) {
    if (isLocalOnlyArtifact(name)) continue;
    const childRel = `${rel}/${name}`;
    const childAbs = join(absPath, name);
    const info = lstatSync(childAbs);
    assertSafeStat(info, childRel);

    if (info.isDirectory()) {
      inspectTreeContents(childAbs, childRel);
    }
  }
};

const inspectInclude = (entry) => {
  const from = join(appDir, entry);
  const info = lstatOrMissingInclude(from, entry);
  assertSafeStat(info, entry);

  if (info.isDirectory()) {
    inspectTreeContents(from, entry);
  }
};

const namedBuildValidationScriptFiles = (pkg) => {
  const scripts =
    pkg && typeof pkg === "object" && pkg.scripts && typeof pkg.scripts === "object"
      ? pkg.scripts
      : {};
  const names = new Set();
  const visiting = new Set();

  const visit = (name) => {
    if (typeof name !== "string" || name.startsWith("test:")) {
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(scripts, name) || visiting.has(name)) {
      return;
    }

    visiting.add(name);
    const command = String(scripts[name] ?? "");

    for (const match of command.matchAll(
      /\b(?:pnpm(?:\s+run)?|npm\s+run|yarn(?:\s+run)?)\s+([A-Za-z0-9:_-]+)/g,
    )) {
      visit(match[1]);
    }

    for (const match of command.matchAll(/\bnode\s+scripts\/([A-Za-z0-9._-]+\.mjs)/g)) {
      names.add(match[1]);
    }
  };

  visit("build");

  for (const name of Object.keys(scripts)) {
    if (name === "validate" || name.startsWith("validate:")) {
      visit(name);
    }
  }

  return names;
};

const extractRelativeSpecifiers = (sourceText) => {
  const specs = [];
  const pattern =
    /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["'](\.[^"']+)["']/g;
  let match = pattern.exec(sourceText);

  while (match) {
    specs.push(match[1]);
    match = pattern.exec(sourceText);
  }

  return specs;
};

const resolveImportedScript = (fromFile, spec) => {
  const trimmed = spec.split("#")[0].split("?")[0];
  const abs = resolve(dirname(fromFile), trimmed);
  const candidates = [abs];

  if (!extname(abs)) {
    candidates.push(`${abs}.mjs`, `${abs}.js`);
  }

  for (const candidate of candidates) {
    try {
      const info = lstatSync(candidate);

      if (info.isFile() || info.isSymbolicLink()) {
        return candidate;
      }
    } catch {
      // Try the next candidate without following or reading it.
    }
  }

  if (isInside(scriptDir, abs)) {
    return null;
  }

  return abs;
};

const collectScriptClosure = (entryNames) => {
  const allowed = new Set();
  const queue = [...entryNames];

  while (queue.length > 0) {
    const rel = String(queue.pop()).split("\\").join("/");

    if (allowed.has(rel)) {
      continue;
    }

    if (rel.startsWith("/") || rel.split("/").includes("..")) {
      abort(`Safe deploy aborted: refused script path: ${rel}`);
    }

    // Direct registry entries must not bypass directory-walk exclusions.
    const parts = rel.split("/");
    if (parts.some((name) => isLocalOnlyArtifact(name) || isSensitiveArtifact(name) ||
      ["private", "internal"].includes(name.toLowerCase()))) {
      abort(`Safe deploy aborted: refused excluded script path: ${rel}`);
    }
    let ancestor = scriptDir;
    for (const part of ["", ...parts.slice(0, -1)]) {
      if (part) ancestor = join(ancestor, part);
      try {
        lstatSync(join(ancestor, ".git"));
        abort(`Safe deploy aborted: refused nested repository script: ${rel}`);
      } catch (error) {
        if (error?.code !== "ENOENT") {
          abort(`Safe deploy aborted: could not inspect script owner: ${rel}`);
        }
      }
    }

    const abs = join(scriptDir, rel);
    let info;

    try {
      info = lstatSync(abs);
    } catch {
      abort(`Safe deploy aborted: package.json named script is missing: ${rel}`);
    }

    assertSafeStat(info, `scripts/${rel}`);

    if (!info.isFile()) {
      abort(`Safe deploy aborted: refused non-regular file: scripts/${rel}`);
    }

    allowed.add(rel);
    const text = readFileSync(abs, "utf8");

    for (const spec of extractRelativeSpecifiers(text)) {
      const resolved = resolveImportedScript(abs, spec);

      if (resolved === null) {
        abort(`Safe deploy aborted: required local script dependency is missing: ${spec}`);
      }

      if (!isInside(scriptDir, resolved)) {
        continue;
      }

      queue.push(posixRel(scriptDir, resolved));
    }
  }

  return allowed;
};

const copySafe = (from, to, rel) => {
  if (isLocalOnlyArtifact(basename(rel))) return;
  const info = lstatSync(from);
  assertSafeStat(info, rel);

  if (info.isDirectory()) {
    mkdirSync(to, { recursive: true });

    for (const name of readdirSync(from).sort()) {
      copySafe(join(from, name), join(to, name), `${rel}/${name}`);
    }

    return;
  }

  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to);
};

const collectManifest = (absPath, rel, manifest) => {
  const info = lstatSync(absPath);

  if (info.isSymbolicLink()) {
    abort(`Safe deploy aborted: refused symlink: ${rel}`);
  }

  if (info.isDirectory()) {
    for (const name of readdirSync(absPath).sort()) {
      const childRel = rel ? `${rel}/${name}` : name;
      collectManifest(join(absPath, name), childRel, manifest);
    }
    return;
  }

  if (!info.isFile()) {
    abort(`Safe deploy aborted: refused non-regular file: ${rel}`);
  }

  manifest.push({ path: rel, bytes: info.size });
};

let projectStat;

try {
  const projectDirectory = lstatSync(dirname(projectConfigPath));
  if (projectDirectory.isSymbolicLink() || !projectDirectory.isDirectory()) {
    abort("Safe deploy aborted: refused Vercel project directory symlink or non-directory");
  }
  projectStat = lstatSync(projectConfigPath);
} catch {
  console.error(`Missing Vercel project config: ${projectConfigPath}`);
  process.exit(1);
}

if (projectStat.isSymbolicLink()) {
  abort("Safe deploy aborted: refused symlink: .vercel/project.json");
}

if (!projectStat.isFile()) {
  abort("Safe deploy aborted: refused non-regular file: .vercel/project.json");
}

for (const entry of includeEntries) {
  inspectInclude(entry);
}

for (const validationScript of [
  "validate-web-governance.mjs",
  "validate-marketing-platform.mjs",
  "validate-public-images.mjs",
  "validate-content-data.mjs",
]) {
  const validation = spawnSync(process.execPath, [join(scriptDir, validationScript)], {
    cwd: appDir,
    stdio: "inherit",
  });

  if (validation.error) {
    console.error(validation.error.message);
    process.exit(1);
  }

  if (validation.status !== 0) {
    process.exit(validation.status ?? 1);
  }
}

let pkg;

try {
  pkg = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
} catch {
  abort("Safe deploy aborted: package.json is not valid JSON.");
}

// Source governance has already validated these artifact paths and hashes.
// Keep its registered script evidence available to the same validator in the stage.
const registry = JSON.parse(
  readFileSync(join(appDir, "docs/governance/version-registry.json"), "utf8"),
);
const scriptEntries = namedBuildValidationScriptFiles(pkg);
for (const contract of registry.contracts) {
  for (const artifact of contract.artifacts) {
    if (artifact.path.startsWith("scripts/")) {
      scriptEntries.add(artifact.path.slice("scripts/".length));
    }
  }
}
const allowedScripts = collectScriptClosure(scriptEntries);

createdStageRoot = mkdtempSync(join(tmpdir(), "loom-signal-deck-vercel-stage-"));
const stageWebDir = join(createdStageRoot, "web");

try {
  mkdirSync(stageWebDir, { recursive: true });
  mkdirSync(join(createdStageRoot, ".vercel"), { recursive: true });
  cpSync(projectConfigPath, join(createdStageRoot, ".vercel", "project.json"));

  for (const entry of includeEntries) {
    const from = join(appDir, entry);
    const to = join(stageWebDir, entry);

    if (entry === "scripts") {
      mkdirSync(to, { recursive: true });

      for (const relScript of [...allowedScripts].sort()) {
        copySafe(join(from, relScript), join(to, relScript), `scripts/${relScript}`);
      }

      continue;
    }

    copySafe(from, to, entry);
  }

  writeFileSync(
    join(createdStageRoot, ".vercelignore"),
    [
      ".git",
      ".DS_Store",
      "**/.DS_Store",
      "web/.env",
      "web/.env*",
      "!web/.env.example",
      "web/.next",
      "web/.vercel",
      "web/node_modules",
      "web/supabase/.temp",
      "web/tsconfig.tsbuildinfo",
      "*.log",
      "",
    ].join("\n"),
  );
} catch (error) {
  abort(error instanceof Error ? error.message : String(error));
}

const manifest = [];
collectManifest(createdStageRoot, "", manifest);
const sizeBytes = manifest.reduce((total, item) => total + item.bytes, 0);
const sizeMb = sizeBytes / 1024 / 1024;

if (sizeBytes > maxSizeBytes) {
  console.error(
    `Safe deploy aborted: staged upload is ${sizeMb.toFixed(1)}MB, above ${maxSizeMb}MB.`,
  );
  console.error("Check the staging include list before raising SAFE_DEPLOY_MAX_MB.");
  cleanupCreatedStage();
  process.exit(1);
}

console.log(`Prepared Vercel stage: ${createdStageRoot}`);
console.log("Staged path manifest:");

for (const item of manifest) {
  console.log(`  ${item.path}\t${item.bytes}`);
}

console.log(`Staged path count: ${manifest.length}`);
console.log(`Staged bytes: ${sizeBytes}`);
console.log(`Staged upload size: ${sizeMb.toFixed(1)}MB`);

if (dryRun) {
  retainCreatedStage = true;
  console.log("Dry run complete. Skipped Vercel deploy.");
  console.log(`Dry-run stage retained for inspection: ${createdStageRoot}`);
  console.log(`Cleanup this attempt only: rm -rf ${createdStageRoot}`);
  process.exit(0);
}

const result = spawnSync("vercel", ["deploy", createdStageRoot, "-y", "--archive=tgz", ...deployArgs], {
  cwd: appDir,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  cleanupCreatedStage();
  process.exit(1);
}

cleanupCreatedStage();
process.exit(result.status ?? 1);
