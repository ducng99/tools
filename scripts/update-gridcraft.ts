#!/usr/bin/env bun
// Updates the vendored GridCraft web build to a GitHub release.
// Usage: bun scripts/update-gridcraft.ts [version]   (default: latest release)

import { existsSync } from "fs";
import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { unzipSync } from "fflate";

const REPO = "storytold/gridcraft";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public", "gridcraft-web");
const VENDOR_DIR = path.join(ROOT, "vendor", "gridcraft-web");
const WASM_GZ_URL_PREFIX = "https://cdn.jsdelivr.net/gh/ducng99/tools@main/vendor/gridcraft-web/";

interface ReleaseAsset {
    name: string;
    browser_download_url: string;
}

interface Release {
    tag_name: string;
    assets: ReleaseAsset[];
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
}

async function findWebZip(version?: string): Promise<{ url: string; version: string }> {
    const endpoint = version
        ? `https://api.github.com/repos/${REPO}/releases/tags/v${version}`
        : `https://api.github.com/repos/${REPO}/releases/latest`;
    const response = await fetch(endpoint, {
        headers: { "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    });
    if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status} for ${endpoint}`);
    }
    const release = (await response.json()) as Release;
    const asset = release.assets.find(entry => /^gridcraft-web-\d+\.\d+\.\d+\.zip$/.test(entry.name));
    if (!asset) {
        throw new Error(`Release ${release.tag_name} has no gridcraft-web-<version>.zip asset`);
    }
    return { url: asset.browser_download_url, version: release.tag_name.replace(/^v/, "") };
}

function loaderScript(glueName: string, wasmName: string): string {
    return `<script type="module">
import init, * as bindings from './${glueName}';

// The gzipped wasm is not bundled; it is vendored under /vendor/gridcraft-web
// (see that folder's README.md) and downloaded from jsDelivr.
const WASM_GZ_URL = '${WASM_GZ_URL_PREFIX}${wasmName}.gz';

try {
  const gz = await fetch(WASM_GZ_URL);
  if (!gz.ok) throw new Error(\`HTTP \${gz.status} fetching wasm\`);
  const wasmStream = gz.body.pipeThrough(new DecompressionStream('gzip'));
  const wasmResponse = new Response(wasmStream, { headers: { 'Content-Type': 'application/wasm' } });
  const wasm = await init({ module_or_path: wasmResponse });

  window.wasmBindings = bindings;

  dispatchEvent(new CustomEvent("TrunkApplicationStarted", {detail: {wasm}}));
} catch (err) {
  document.getElementById('gridcraft_loading').textContent = \`Failed to load GridCraft: \${err}\`;
  throw err;
}
</script>`;
}

function patchIndexHtml(html: string, glueName: string, wasmName: string, gzMegabytes: number): string {
    let patched = html.replace(/<script type="module">[\s\S]*?<\/script>/, () => loaderScript(glueName, wasmName));
    if (!patched.includes("WASM_GZ_URL")) {
        throw new Error("Could not find the trunk loader script in index.html");
    }
    patched = patched.replace(/<link rel="preload"[^>]*_bg\.wasm[^>]*>\n?/, "");
    if (patched.includes("rel=\"preload\"")) {
        throw new Error("Could not remove the wasm preload link in index.html");
    }
    patched = patched.replace("#gridcraft_loading {", "#gridcraft_loading { white-space: pre-wrap;");
    patched = patched.replace(
        "Loading GridCraft&hellip;</div>",
        `Loading GridCraft&hellip;\nAbout ${gzMegabytes} MB on first load.</div>`,
    );
    return patched;
}

function pick(files: Map<string, Uint8Array>, pattern: RegExp): [string, Uint8Array] {
    for (const [name, data] of files) {
        if (pattern.test(name)) {
            return [name, data];
        }
    }
    throw new Error(`Release zip has no file matching ${pattern}`);
}

async function main() {
    const versionArg = process.argv[2]?.replace(/^v/, "");
    const { url, version } = await findWebZip(versionArg);
    console.log(`gridcraft-web release: v${version}`);

    console.log("Downloading release zip...");
    const zipResponse = await fetch(url);
    if (!zipResponse.ok) {
        throw new Error(`Download failed with ${zipResponse.status}: ${url}`);
    }
    const zip = unzipSync(new Uint8Array(await zipResponse.arrayBuffer()));

    // Zip entries are prefixed with gridcraft-web-<version>/; key them by basename.
    const files = new Map<string, Uint8Array>();
    for (const [name, data] of Object.entries(zip)) {
        const base = name.split("/").pop() ?? "";
        if (base) {
            files.set(base, data);
        }
    }

    const indexData = files.get("index.html");
    if (!indexData) {
        throw new Error("Release zip has no index.html");
    }
    const [glueName, glue] = pick(files, /^gridcraft-web-.+\.js$/);
    const [icoName, ico] = pick(files, /^gridcraft-.+\.ico$/);
    const [wasmName, wasm] = pick(files, /^gridcraft-web-.+_bg\.wasm$/);
    const [mitName, mit] = pick(files, /^LICENSE-MIT$/);
    const [apacheName, apache] = pick(files, /^LICENSE-APACHE$/);

    // fflate always hands out plain ArrayBuffer-backed views, but its types say ArrayBufferLike.
    const gz = Bun.gzipSync(wasm as Uint8Array<ArrayBuffer>, { level: 9 });
    const gzName = `${wasmName}.gz`;
    console.log(`wasm ${formatBytes(wasm.length)} -> ${gzName} ${formatBytes(gz.length)}`);

    const patchedHtml = patchIndexHtml(new TextDecoder().decode(indexData), glueName, wasmName, Math.round(gz.length / (1024 * 1024)));

    const currentHtml = existsSync(path.join(PUBLIC_DIR, "index.html"))
        ? await readFile(path.join(PUBLIC_DIR, "index.html"), "utf8")
        : null;
    if (currentHtml === patchedHtml && existsSync(path.join(VENDOR_DIR, gzName))) {
        console.log(`v${version} is already vendored, nothing to do.`);
        return;
    }

    await rm(PUBLIC_DIR, { recursive: true, force: true });
    await mkdir(PUBLIC_DIR, { recursive: true });
    await writeFile(path.join(PUBLIC_DIR, "index.html"), patchedHtml);
    await writeFile(path.join(PUBLIC_DIR, glueName), glue);
    await writeFile(path.join(PUBLIC_DIR, icoName), ico);
    await writeFile(path.join(PUBLIC_DIR, mitName), mit);
    await writeFile(path.join(PUBLIC_DIR, apacheName), apache);

    await mkdir(VENDOR_DIR, { recursive: true });
    for (const file of await readdir(VENDOR_DIR)) {
        if (file.endsWith(".wasm.gz") && file !== gzName) {
            await rm(path.join(VENDOR_DIR, file));
        }
    }
    await writeFile(path.join(VENDOR_DIR, gzName), gz);

    console.log(`public/gridcraft-web: index.html, ${glueName}, ${icoName}, ${mitName}, ${apacheName}`);
    console.log(`vendor/gridcraft-web: ${gzName}`);
    console.log("Done. Commit and push to main - the jsDelivr URL 404s until the gz is pushed.");
}

try {
    await main();
}
catch (err) {
    console.error(err);
    process.exit(1);
}
