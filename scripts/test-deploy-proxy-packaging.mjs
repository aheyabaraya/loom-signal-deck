#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const deploySafePath = join(webRoot, "scripts/deploy-safe.mjs");
const marketingPath = join(webRoot, "scripts/validate-marketing-platform.mjs");
const proxyPath = join(webRoot, "proxy.ts");
const packageJsonPath = join(webRoot, "package.json");

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(proxyPath)) {
  fail("proxy.ts is missing from the web root.");
}

const deploySafe = readFileSync(deploySafePath, "utf8");
const marketing = readFileSync(marketingPath, "utf8");
const packageJsonText = readFileSync(packageJsonPath, "utf8");
const proxyBytes = readFileSync(proxyPath);
const proxySha256 = createHash("sha256").update(proxyBytes).digest("hex");

if (!deploySafe.includes('"proxy.ts"')) {
  fail("deploy-safe.mjs includeEntries does not list proxy.ts.");
}

if (!deploySafe.includes("listed include is missing")) {
  fail("deploy-safe.mjs does not fail closed on a missing listed include.");
}

if (!marketing.includes('"proxy.ts"')) {
  fail("validate-marketing-platform.mjs does not require staged entry proxy.ts.");
}

if (!marketing.includes('exists("proxy.ts")')) {
  fail("validate-marketing-platform.mjs does not require proxy.ts to exist.");
}

const includeMatch = deploySafe.match(/const includeEntries = \[([\s\S]*?)\];/);
if (!includeMatch) {
  fail("Could not parse includeEntries from deploy-safe.mjs.");
}

const includeEntries = [...includeMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
if (!includeEntries.includes("proxy.ts")) {
  fail("parsed includeEntries omitted proxy.ts.");
}

function childEnv(tmpDir) {
  return {
    PATH: process.env.PATH,
    TMPDIR: tmpDir
  };
}

function outputOf(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function stageRootFromOutput(output, tmpDir) {
  const match = output.match(/^Prepared Vercel stage: (.+)$/m);
  if (!match) {
    fail(`deploy-safe output did not report a prepared stage:\n${output}`);
  }

  const stageRoot = resolve(match[1].trim());
  const rel = relative(resolve(tmpDir), stageRoot);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    fail(`prepared stage is outside TMPDIR: ${stageRoot}`);
  }

  return stageRoot;
}

function writeStubTree(app, { omitProxy }) {
  mkdirSync(join(app, "scripts"), { recursive: true });
  mkdirSync(join(app, ".vercel"), { recursive: true });
  writeFileSync(
    join(app, ".vercel/project.json"),
    '{"projectId":"synthetic-no-network","orgId":"synthetic-no-network"}\n'
  );
  writeFileSync(join(app, "scripts/deploy-safe.mjs"), deploySafe);

  const named = new Set(
    [...packageJsonText.matchAll(/scripts\/([A-Za-z0-9._-]+\.mjs)/g)].map((match) => match[1])
  );
  for (const name of named) {
    if (name === "deploy-safe.mjs") {
      continue;
    }
    writeFileSync(join(app, "scripts", name), "process.exit(0);\n");
  }

  for (const entry of includeEntries) {
    if (omitProxy && entry === "proxy.ts") {
      continue;
    }
    if (entry === "scripts") {
      continue;
    }
    const target = join(app, entry);
    if (entry === "package.json") {
      writeFileSync(target, packageJsonText);
      continue;
    }
    if (entry === "proxy.ts") {
      writeFileSync(target, proxyBytes);
      continue;
    }
    if (entry.includes(".")) {
      writeFileSync(target, "");
      continue;
    }
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, ".keep"), "");
  }
  mkdirSync(join(app, "docs/governance"), { recursive: true });
  writeFileSync(join(app, "docs/governance/version-registry.json"), '{"contracts":[]}\n');
}

function runDryRun(app, tmpDir) {
  mkdirSync(tmpDir, { recursive: true });
  return spawnSync(process.execPath, [join(app, "scripts/deploy-safe.mjs"), "--dry-run"], {
    cwd: app,
    env: childEnv(tmpDir),
    encoding: "utf8"
  });
}

const work = mkdtempSync(join(tmpdir(), "loom-proxy-packaging-"));

try {
  const missingApp = join(work, "missing-proxy");
  writeStubTree(missingApp, { omitProxy: true });
  const missingTmp = join(work, "tmp-missing");
  const missingResult = runDryRun(missingApp, missingTmp);
  const missingOutput = outputOf(missingResult);

  if (missingResult.status === 0) {
    fail("deploy-safe --dry-run succeeded while proxy.ts was omitted from the staging tree.");
  }
  if (!missingOutput.includes("listed include is missing: proxy.ts")) {
    fail(`missing-proxy dry-run did not report the proxy.ts include miss:\n${missingOutput}`);
  }
  if (/^Prepared Vercel stage:/m.test(missingOutput)) {
    fail("missing-proxy dry-run prepared a stage.");
  }
  if (existsSync(missingTmp) && readdirSync(missingTmp).length > 0) {
    fail("missing-proxy dry-run left a TMPDIR stage.");
  }

  const presentApp = join(work, "present-proxy");
  writeStubTree(presentApp, { omitProxy: false });
  const presentTmp = join(work, "tmp-present");
  const presentResult = runDryRun(presentApp, presentTmp);
  const presentOutput = outputOf(presentResult);

  if (presentResult.status !== 0) {
    fail(`deploy-safe --dry-run failed with proxy.ts present:\n${presentOutput}`);
  }

  const presentStage = stageRootFromOutput(presentOutput, presentTmp);
  const presentStaged = join(presentStage, "web/proxy.ts");
  if (!existsSync(presentStaged)) {
    fail("present-proxy dry-run did not stage proxy.ts.");
  }
  const stagedSha256 = createHash("sha256").update(readFileSync(presentStaged)).digest("hex");
  if (stagedSha256 !== proxySha256) {
    fail("staged proxy.ts hash does not match the owner file.");
  }

  console.log(
    `deploy-proxy packaging PASS: missing include aborted, present proxy staged ${stagedSha256}.`
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
