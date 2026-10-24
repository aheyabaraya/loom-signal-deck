#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const linkedRefPath = join(root, "supabase", ".temp", "project-ref");
const testFile = join(root, "supabase", "tests", "database", "loom_marketing_rls.integration.sql");
const expectedRef = process.env.LOOM_SUPABASE_TEST_PROJECT_REF?.trim();
const productionRef = process.env.LOOM_SUPABASE_PRODUCTION_PROJECT_REF?.trim();

function fail(message) {
  console.error(`Marketing RLS test aborted: ${message}`);
  process.exit(1);
}

if (!expectedRef || !/^[a-z0-9]{10,32}$/.test(expectedRef)) {
  fail("LOOM_SUPABASE_TEST_PROJECT_REF must name the isolated test branch.");
}

if (productionRef && expectedRef === productionRef) {
  fail("the test ref matches LOOM_SUPABASE_PRODUCTION_PROJECT_REF.");
}

if (!existsSync(linkedRefPath)) {
  fail("this checkout is not linked to a Supabase test project.");
}

const linkedRef = readFileSync(linkedRefPath, "utf8").trim();
if (linkedRef !== expectedRef) {
  fail("the linked Supabase project does not match the explicit test ref.");
}

if (!existsSync(testFile)) {
  fail("the database integration test file is missing.");
}

const result = spawnSync(
  "supabase",
  ["db", "query", "--linked", "--file", testFile, "--output", "table", "--agent=no"],
  { cwd: root, stdio: "inherit" }
);

if (result.error) fail(result.error.message);
process.exit(result.status ?? 1);
