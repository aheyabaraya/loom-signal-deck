#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const deploySafePath = join(webRoot, "scripts/deploy-safe.mjs");
const proxyPath = join(webRoot, "proxy.ts");
const packageJsonPath = join(webRoot, "package.json");

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(proxyPath)) {
  fail("proxy.ts is missing from the web root.");
}

if (!existsSync(deploySafePath)) {
  fail("deploy-safe.mjs is missing.");
}

if (!existsSync(packageJsonPath)) {
  fail("package.json is missing.");
}

const deploySafe = readFileSync(deploySafePath, "utf8");
const packageJsonText = readFileSync(packageJsonPath, "utf8");
const proxyBytes = readFileSync(proxyPath);
const proxySha256 = createHash("sha256").update(proxyBytes).digest("hex");

const includeMatch = deploySafe.match(/const includeEntries = \[([\s\S]*?)\];/);
if (!includeMatch) {
  fail("Could not parse includeEntries from deploy-safe.mjs.");
}

const includeEntries = [...includeMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
if (!includeEntries.includes("proxy.ts")) {
  fail("parsed includeEntries omitted proxy.ts.");
}

function childEnv(tmpDir, extraEnv = {}) {
  return {
    PATH: process.env.PATH,
    TMPDIR: tmpDir,
    ...extraEnv,
  };
}

function outputOf(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function tmpChildren(tmpDir) {
  if (!existsSync(tmpDir)) {
    return [];
  }

  return readdirSync(tmpDir);
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

function walkFiles(root) {
  const files = [];

  const walk = (absPath) => {
    const info = lstatSync(absPath);

    if (info.isDirectory()) {
      for (const name of readdirSync(absPath)) {
        walk(join(absPath, name));
      }
      return;
    }

    files.push(absPath);
  };

  if (existsSync(root)) {
    walk(root);
  }

  return files;
}

function assertNoSentinel(dir, sentinel) {
  for (const filePath of walkFiles(dir)) {
    let bytes;

    try {
      bytes = readFileSync(filePath);
    } catch {
      continue;
    }

    if (bytes.includes(Buffer.from(sentinel))) {
      fail(`sentinel leaked into ${filePath}`);
    }
  }
}

function writeStubTree(app, { omitProxy = false } = {}) {
  mkdirSync(join(app, "scripts"), { recursive: true });
  mkdirSync(join(app, ".vercel"), { recursive: true });
  writeFileSync(
    join(app, ".vercel/project.json"),
    '{"projectId":"synthetic-no-network","orgId":"synthetic-no-network"}\n',
  );
  writeFileSync(join(app, "scripts/deploy-safe.mjs"), deploySafe);

  const named = new Set(
    [...packageJsonText.matchAll(/scripts\/([A-Za-z0-9._-]+\.mjs)/g)].map((match) => match[1]),
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

function runDryRun(app, tmpDir, extraEnv = {}) {
  mkdirSync(tmpDir, { recursive: true });
  return spawnSync(process.execPath, [join(app, "scripts/deploy-safe.mjs"), "--dry-run"], {
    cwd: app,
    env: childEnv(tmpDir, extraEnv),
    encoding: "utf8",
  });
}

function assertAbortedWithoutStage(result, tmpDir, needle, detail) {
  const output = outputOf(result);

  if (result.status === 0) {
    fail(`${detail} succeeded:\n${output}`);
  }

  if (!output.includes(needle)) {
    fail(`${detail} did not report ${needle}:\n${output}`);
  }

  if (/^Prepared Vercel stage:/m.test(output)) {
    fail(`${detail} prepared a stage:\n${output}`);
  }

  if (tmpChildren(tmpDir).length > 0) {
    fail(`${detail} left files in TMPDIR: ${tmpChildren(tmpDir).join(", ")}`);
  }
}

const work = mkdtempSync(join(tmpdir(), "loom-deploy-safety-"));

try {
  const missingApp = join(work, "missing-proxy");
  writeStubTree(missingApp, { omitProxy: true });
  const missingTmp = join(work, "tmp-missing");
  const missingResult = runDryRun(missingApp, missingTmp);
  assertAbortedWithoutStage(
    missingResult,
    missingTmp,
    "listed include is missing: proxy.ts",
    "missing-proxy",
  );

  const envSentinel = "SENTINEL_ENV_VALUE_NOT_FOR_DEPLOY";
  const envApp = join(work, "nested-env");
  writeStubTree(envApp);
  mkdirSync(join(envApp, "app/subdir"), { recursive: true });
  writeFileSync(join(envApp, "app/subdir/.env"), envSentinel);
  const envTmp = join(work, "tmp-env");
  const envResult = runDryRun(envApp, envTmp);
  assertAbortedWithoutStage(
    envResult,
    envTmp,
    "refused nested sensitive artifact: app/subdir/.env",
    "nested-env",
  );
  assertNoSentinel(envTmp, envSentinel);

  const keySentinel = "SENTINEL_KEY_VALUE_NOT_FOR_DEPLOY";
  const keyApp = join(work, "nested-key");
  writeStubTree(keyApp);
  writeFileSync(join(keyApp, "lib/nested.key"), keySentinel);
  const keyTmp = join(work, "tmp-key");
  const keyResult = runDryRun(keyApp, keyTmp);
  assertAbortedWithoutStage(
    keyResult,
    keyTmp,
    "refused nested sensitive artifact: lib/nested.key",
    "nested-key",
  );
  assertNoSentinel(keyTmp, keySentinel);

  const fileLinkApp = join(work, "file-symlink");
  writeStubTree(fileLinkApp);
  writeFileSync(join(fileLinkApp, "lib/ok.txt"), "not-a-secret");
  symlinkSync("ok.txt", join(fileLinkApp, "lib/alias.txt"));
  const fileLinkTmp = join(work, "tmp-file-symlink");
  const fileLinkResult = runDryRun(fileLinkApp, fileLinkTmp);
  assertAbortedWithoutStage(
    fileLinkResult,
    fileLinkTmp,
    "refused symlink: lib/alias.txt",
    "file-symlink",
  );

  const dirLinkApp = join(work, "dir-symlink");
  writeStubTree(dirLinkApp);
  symlinkSync("../app", join(dirLinkApp, "lib/app-alias"));
  const dirLinkTmp = join(work, "tmp-dir-symlink");
  const dirLinkResult = runDryRun(dirLinkApp, dirLinkTmp);
  assertAbortedWithoutStage(
    dirLinkResult,
    dirLinkTmp,
    "refused symlink: lib/app-alias",
    "directory-symlink",
  );

  const rootLinkApp = join(work, "root-symlink");
  writeStubTree(rootLinkApp);
  rmSync(join(rootLinkApp, "docs"), { recursive: true, force: true });
  symlinkSync(join(rootLinkApp, "lib"), join(rootLinkApp, "docs"));
  const rootLinkTmp = join(work, "tmp-root-symlink");
  const rootLinkResult = runDryRun(rootLinkApp, rootLinkTmp);
  assertAbortedWithoutStage(
    rootLinkResult,
    rootLinkTmp,
    "refused symlink: docs",
    "root-symlink",
  );

  const fifoApp = join(work, "nonregular");
  writeStubTree(fifoApp);
  const fifoPath = join(fifoApp, "lib/queue.fifo");
  const fifo = spawnSync("mkfifo", [fifoPath], { encoding: "utf8" });
  if (fifo.status !== 0) {
    fail(`mkfifo failed: ${fifo.stderr || fifo.stdout || "unknown error"}`);
  }
  const fifoTmp = join(work, "tmp-nonregular");
  const fifoResult = runDryRun(fifoApp, fifoTmp);
  assertAbortedWithoutStage(
    fifoResult,
    fifoTmp,
    "refused non-regular file: lib/queue.fifo",
    "nonregular",
  );

  const overApp = join(work, "overbudget");
  writeStubTree(overApp);
  const overTmp = join(work, "tmp-overbudget");
  const overResult = runDryRun(overApp, overTmp, { SAFE_DEPLOY_MAX_MB: "0.000001" });
  const overOutput = outputOf(overResult);
  if (overResult.status === 0) {
    fail(`overbudget succeeded:\n${overOutput}`);
  }
  if (!overOutput.includes("above")) {
    fail(`overbudget did not abort on the size envelope:\n${overOutput}`);
  }
  if (tmpChildren(overTmp).length > 0) {
    fail(`overbudget left files in TMPDIR: ${tmpChildren(overTmp).join(", ")}`);
  }

  const presentApp = join(work, "present");
  writeStubTree(presentApp);
  writeFileSync(join(presentApp, "app/ok.txt"), "EXPECTED_STAGE_BYTES_OK");
  writeFileSync(
    join(presentApp, "scripts/not-in-package.mjs"),
    "UNLISTED_SCRIPT_SENTINEL_NOT_FOR_DEPLOY\n",
  );
  writeFileSync(join(presentApp, "scripts/test-deploy-proxy-packaging.mjs"), "process.exit(0);\n");
  mkdirSync(join(presentApp, "supabase/.temp"), { recursive: true });
  writeFileSync(join(presentApp, "supabase/.temp/cli-latest"), "LOCAL_CACHE_NOT_FOR_PAYLOAD");
  // Use the actual registry, bound artifacts and validator for this dependency check.
  const actualRegistryText = readFileSync(join(webRoot, "docs/governance/version-registry.json"), "utf8");
  const actualRegistry = JSON.parse(actualRegistryText);
  for (const contract of actualRegistry.contracts) {
    for (const artifact of contract.artifacts) {
      if (isAbsolute(artifact.path) || artifact.path.includes("..")) fail("Unsafe fixture artifact path.");
      const ownerFile = join(webRoot, artifact.path);
      const info = lstatSync(ownerFile);
      if (!info.isFile() || info.isSymbolicLink()) fail("Non-regular fixture artifact.");
      const target = join(presentApp, artifact.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(ownerFile));
    }
  }
  writeFileSync(join(presentApp, "docs/governance/version-registry.json"), actualRegistryText);
  writeFileSync(join(presentApp, "scripts/validate-web-governance.mjs"), readFileSync(join(webRoot, "scripts/validate-web-governance.mjs")));
  const presentTmp = join(work, "tmp-present");
  const presentResult = runDryRun(presentApp, presentTmp);
  const presentOutput = outputOf(presentResult);
  if (presentResult.status !== 0) {
    fail(`present dry-run failed:\n${presentOutput}`);
  }

  const presentStage = stageRootFromOutput(presentOutput, presentTmp);
  const stagedGovernance = spawnSync(process.execPath, [join(presentStage, "web/scripts/validate-web-governance.mjs")], {
    cwd: join(presentStage, "web"), env: childEnv(presentTmp), encoding: "utf8",
  });
  if (stagedGovernance.status !== 0) fail(`Real staged governance failed:\n${outputOf(stagedGovernance)}`);
  const stagedProxy = join(presentStage, "web/proxy.ts");
  if (!existsSync(stagedProxy)) {
    fail("present dry-run did not stage proxy.ts.");
  }

  const stagedSha256 = createHash("sha256").update(readFileSync(stagedProxy)).digest("hex");
  if (stagedSha256 !== proxySha256) {
    fail("staged proxy.ts hash does not match the owner file.");
  }

  const stagedOk = join(presentStage, "web/app/ok.txt");
  if (!existsSync(stagedOk) || readFileSync(stagedOk, "utf8") !== "EXPECTED_STAGE_BYTES_OK") {
    fail("present dry-run did not preserve expected app file bytes.");
  }

  if (!existsSync(join(presentStage, "web/.env.example"))) {
    fail("present dry-run did not stage .env.example.");
  }

  if (!existsSync(join(presentStage, ".vercel/project.json"))) {
    fail("present dry-run did not preserve Vercel project linkage.");
  }

  for (const requiredScript of [
    "validate-web-governance.mjs",
    "validate-marketing-platform.mjs",
    "validate-content-data.mjs",
    "validate-harne.mjs",
    "validate-member-assets.mjs",
    "validate-public-images.mjs",
  ]) {
    if (!existsSync(join(presentStage, "web/scripts", requiredScript))) {
      fail(`present dry-run omitted named validation script ${requiredScript}.`);
    }
  }

  if (existsSync(join(presentStage, "web/scripts/not-in-package.mjs"))) {
    fail("present dry-run staged an unlisted scripts file.");
  }

  if (existsSync(join(presentStage, "web/scripts/test-deploy-proxy-packaging.mjs"))) {
    fail("present dry-run staged a test script.");
  }

  assertNoSentinel(presentStage, "UNLISTED_SCRIPT_SENTINEL_NOT_FOR_DEPLOY");
  assertNoSentinel(presentStage, "LOCAL_CACHE_NOT_FOR_PAYLOAD");
  if (existsSync(join(presentStage, "web/supabase/.temp"))) fail("local Supabase cache staged");

  const unsafeRegistryApp = join(work, "unsafe-registry-script");
  writeStubTree(unsafeRegistryApp);
  writeFileSync(join(unsafeRegistryApp, "docs/governance/version-registry.json"), JSON.stringify({
    contracts: [{ artifacts: [{ path: "scripts/../app/outside.mjs", sha256: "0".repeat(64) }] }],
  }));
  const unsafeRegistryTmp = join(work, "tmp-unsafe-registry");
  const unsafeRegistryResult = runDryRun(unsafeRegistryApp, unsafeRegistryTmp);
  assertAbortedWithoutStage(unsafeRegistryResult, unsafeRegistryTmp,
    "refused script path: ../app/outside.mjs", "unsafe registry-script reference");

  for (const [label, relScript, nestedRepo, errorText] of [
    ["local-only", ".git/fixture.mjs", false, "refused excluded script path"],
    ["private", "private/fixture.mjs", false, "refused excluded script path"],
    ["nested-repo", "vendor/fixture.mjs", true, "refused nested repository script"],
  ]) {
    const app = join(work, `registry-${label}`);
    writeStubTree(app);
    const sentinel = `SYNTHETIC_EXCLUDED_REGISTRY_${label}`;
    const target = join(app, "scripts", relScript);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, sentinel);
    if (nestedRepo) writeFileSync(join(dirname(target), ".git"), "synthetic nested repository marker");
    writeFileSync(join(app, "docs/governance/version-registry.json"), JSON.stringify({
      contracts: [{ artifacts: [{ path: `scripts/${relScript}`, sha256: createHash("sha256").update(sentinel).digest("hex") }] }],
    }));
    const tmp = join(work, `tmp-registry-${label}`);
    const result = runDryRun(app, tmp);
    assertAbortedWithoutStage(result, tmp, errorText, `excluded registry script ${label}`);
    assertNoSentinel(tmp, sentinel);
  }

  const collisionTmp = join(work, "tmp-collision");
  const collisionA = join(work, "collision-a");
  const collisionB = join(work, "collision-b");
  writeStubTree(collisionA);
  writeStubTree(collisionB);
  writeFileSync(join(collisionA, "data/.keep"), "STAGE_A_PAYLOAD");
  writeFileSync(join(collisionB, "data/.keep"), "STAGE_B_PAYLOAD");
  const collisionAResult = runDryRun(collisionA, collisionTmp);
  const collisionBResult = runDryRun(collisionB, collisionTmp);
  const collisionAOutput = outputOf(collisionAResult);
  const collisionBOutput = outputOf(collisionBResult);

  if (collisionAResult.status !== 0) {
    fail(`collision stage A failed:\n${collisionAOutput}`);
  }

  if (collisionBResult.status !== 0) {
    fail(`collision stage B failed:\n${collisionBOutput}`);
  }

  const stageA = stageRootFromOutput(collisionAOutput, collisionTmp);
  const stageB = stageRootFromOutput(collisionBOutput, collisionTmp);
  if (stageA === stageB) {
    fail("two dry-runs reused the same stage path.");
  }

  if (!existsSync(stageA) || !existsSync(stageB)) {
    fail("collision dry-runs did not retain both named stages.");
  }

  const payloadA = readFileSync(join(stageA, "web/data/.keep"), "utf8");
  const payloadB = readFileSync(join(stageB, "web/data/.keep"), "utf8");
  if (payloadA !== "STAGE_A_PAYLOAD" || payloadB !== "STAGE_B_PAYLOAD") {
    fail("collision dry-runs overwrote another attempt's staged bytes.");
  }

  console.log(
    `deploy-safety PASS: missing proxy aborted, nested env/key rejected before copy, symlink and non-regular files refused, overbudget cleaned, real staged governance passed, unsafe/local-only/private/nested-repo registry scripts rejected, unique stages retained distinct payloads, expected files staged ${stagedSha256}.`,
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
