import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(projectRoot, "out-pages");
const clientDir = resolve(projectRoot, "dist/client");
const serverEntry = resolve(projectRoot, "dist/server/index.js");
const repository = process.env.GITHUB_REPOSITORY?.split("/").at(-1) || "shouchuan";
const basePath = `/${repository}`;

const { default: worker } = await import(serverEntry);
const response = await worker.fetch(new Request("https://nanamiqa.github.io/"));

if (!response.ok) {
  throw new Error(`Unable to render the home page: HTTP ${response.status}`);
}

let html = await response.text();
html = html
  .replaceAll("/assets/", `${basePath}/assets/`)
  .replaceAll('content="/og.png"', `content="${basePath}/og.png"`)
  .replaceAll('href="/favicon.svg"', `href="${basePath}/favicon.svg"`);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(clientDir, outputDir, { recursive: true });
await writeFile(resolve(outputDir, "index.html"), html);
await writeFile(resolve(outputDir, "404.html"), html);
await writeFile(resolve(outputDir, ".nojekyll"), "");

console.log(`GitHub Pages export created in ${outputDir}`);
