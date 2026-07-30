#!/usr/bin/env node
import { readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const publicRoot = resolve(process.cwd(), "public");
const rasterExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".tif",
  ".tiff",
  ".webp",
]);
const nonWebpRasterFiles = [];
let webpCount = 0;

const inspectDirectory = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      inspectDirectory(entryPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = extname(entry.name).toLowerCase();

    if (!rasterExtensions.has(extension)) {
      continue;
    }

    if (extension === ".webp") {
      webpCount += 1;
      continue;
    }

    nonWebpRasterFiles.push(relative(publicRoot, entryPath));
  }
};

inspectDirectory(publicRoot);

if (nonWebpRasterFiles.length > 0) {
  console.error(
    `Public raster assets must be WebP:\n${nonWebpRasterFiles.join("\n")}`,
  );
  process.exit(1);
}

console.log(`Public image format valid: ${webpCount} WebP files.`);
