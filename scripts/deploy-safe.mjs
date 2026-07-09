#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, "..");
const stageRoot = join(tmpdir(), "loom-signal-deck-vercel-stage");
const stageWebDir = join(stageRoot, "web");
const projectConfigPath = join(appDir, ".vercel", "project.json");
const maxSizeMb = Number(process.env.SAFE_DEPLOY_MAX_MB ?? "80");
const maxSizeBytes = maxSizeMb * 1024 * 1024;

const includeEntries = [
  "app",
  "assets",
  "components",
  "data",
  "docs",
  "public",
  "scripts",
  "README.md",
  "next.config.mjs",
  "next-env.d.ts",
  "package.json",
  "pnpm-lock.yaml",
  "styles.css",
  "tsconfig.json",
  "tsconfig.typecheck.json",
];

const deployArgs = [];
let dryRun = false;

for (const arg of process.argv.slice(2)) {
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

if (!existsSync(projectConfigPath)) {
  console.error(`Missing Vercel project config: ${projectConfigPath}`);
  process.exit(1);
}

rmSync(stageRoot, { recursive: true, force: true });
mkdirSync(stageWebDir, { recursive: true });
mkdirSync(join(stageRoot, ".vercel"), { recursive: true });

cpSync(projectConfigPath, join(stageRoot, ".vercel", "project.json"));

for (const entry of includeEntries) {
  const from = join(appDir, entry);
  const to = join(stageWebDir, entry);

  if (existsSync(from)) {
    cpSync(from, to, { recursive: true });
  }
}

writeFileSync(
  join(stageRoot, ".vercelignore"),
  [
    ".git",
    ".DS_Store",
    "**/.DS_Store",
    "web/.env",
    "web/.env.*",
    "web/.next",
    "web/.vercel",
    "web/node_modules",
    "web/tsconfig.tsbuildinfo",
    "*.log",
    "",
  ].join("\n"),
);

const directorySizeBytes = (targetPath) => {
  const info = lstatSync(targetPath);

  if (info.isSymbolicLink()) {
    return 0;
  }

  if (info.isFile()) {
    return info.size;
  }

  if (!info.isDirectory()) {
    return 0;
  }

  return readdirSync(targetPath).reduce((total, child) => {
    return total + directorySizeBytes(join(targetPath, child));
  }, 0);
};

const sizeBytes = directorySizeBytes(stageRoot);
const sizeMb = sizeBytes / 1024 / 1024;

if (sizeBytes > maxSizeBytes) {
  console.error(
    `Safe deploy aborted: staged upload is ${sizeMb.toFixed(1)}MB, above ${maxSizeMb}MB.`,
  );
  console.error("Check the staging include list before raising SAFE_DEPLOY_MAX_MB.");
  process.exit(1);
}

console.log(`Prepared Vercel stage: ${stageRoot}`);
console.log(`Staged upload size: ${sizeMb.toFixed(1)}MB`);

if (dryRun) {
  console.log("Dry run complete. Skipped Vercel deploy.");
  process.exit(0);
}

const result = spawnSync("vercel", ["deploy", stageRoot, "-y", "--archive=tgz", ...deployArgs], {
  cwd: appDir,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
