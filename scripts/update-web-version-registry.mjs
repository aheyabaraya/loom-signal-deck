import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = join(root, "docs/governance/version-registry.json");

if (!process.argv.includes("--write")) {
  console.error("Refusing to modify the registry without --write. Use pnpm validate:governance for read-only checks.");
  process.exit(2);
}

const registry = JSON.parse(await readFile(registryPath, "utf8"));
for (const contract of registry.contracts ?? []) {
  for (const artifact of contract.artifacts ?? []) {
    const bytes = await readFile(join(root, artifact.path));
    artifact.sha256 = createHash("sha256").update(bytes).digest("hex");
  }
}

registry.updatedAt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(new Date());

const temporaryPath = `${registryPath}.tmp`;
await writeFile(temporaryPath, `${JSON.stringify(registry, null, 2)}\n`, { mode: 0o644 });
await rename(temporaryPath, registryPath);
console.log(`Updated SHA-256 values for ${registry.contracts.length} web contracts.`);
