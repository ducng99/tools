#!/usr/bin/env bun
// Updates the vendored *Craft web builds to GitHub releases.
// Usage: bun scripts/update-craft.ts [tool] [version] [--dry-run]   (default: all tools, latest releases)
//
// Every tool is vendored the same way:
//   public/<tool>-web/    patched index.html, glue JS and other runtime assets, licenses
//   R2 bucket             the gzipped wasm at <slug>-web/<version>/<wasm>.gz, fetched at runtime
//                         from the bucket's public URL. Uploaded with wrangler, so the
//                         environment needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
//
// Flags: --dry-run  patch public/ but do not upload anything to R2

import { existsSync } from "fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath } from "url";
import { unzipSync } from "fflate";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const R2_BUCKET = "artcraft-tools-wasm";
const R2_PUBLIC_URL = "https://artcraft-tools-wasm.buckets.tomng.dev";

interface Craft {
    slug: string; // repo name, directory prefix and route
    display: string;
    asset: RegExp; // release zip asset
    glue: RegExp; // JS glue to vendor
    wasm: RegExp; // wasm to vendor gzipped under vendor/<slug>-web/
    extra?: RegExp[]; // additional runtime assets to vendor as-is
    notice?: boolean; // zip has a NOTICE file to preserve
    kind: "trunk" | "filmcraft" | "lightcraft";
    loadingId?: string; // trunk only: element that shows load errors (none in pdfcraft)
}

const CRAFTS: Craft[] = [
    {
        slug: "wordcraft",
        display: "WordCraft",
        asset: /^wordcraft-web-\d+\.\d+\.\d+\.zip$/,
        glue: /^wordcraft-web-.+\.js$/,
        wasm: /^wordcraft-web-.+_bg\.wasm$/,
        kind: "trunk",
        loadingId: "wordcraft_loading",
    },
    {
        slug: "gridcraft",
        display: "GridCraft",
        asset: /^gridcraft-web-\d+\.\d+\.\d+\.zip$/,
        glue: /^gridcraft-web-.+\.js$/,
        wasm: /^gridcraft-web-.+_bg\.wasm$/,
        kind: "trunk",
        loadingId: "gridcraft_loading",
    },
    {
        slug: "deckcraft",
        display: "DeckCraft",
        asset: /^deckcraft-web-\d+\.\d+\.\d+\.zip$/,
        glue: /^deckcraft-web-.+\.js$/,
        wasm: /^deckcraft-web-.+_bg\.wasm$/,
        kind: "trunk",
        loadingId: "deckcraft_loading",
    },
    {
        slug: "photocraft",
        display: "PhotoCraft",
        asset: /^photocraft-web-\d+\.\d+\.\d+\.zip$/,
        glue: /^photocraft-web-boot-.+\.js$/,
        wasm: /^photocraft-web-boot-.+_bg\.wasm$/,
        // The boot wasm fetches app/parts.txt and the app chunks itself, so the app/ folder
        // must be served as-is next to index.html.
        extra: [/^app\//],
        kind: "trunk",
        loadingId: "photocraft_loading",
    },
    {
        slug: "filmcraft",
        display: "FilmCraft",
        asset: /^filmcraft-web-\d+\.\d+\.\d+\.zip$/,
        glue: /^filmcraft_web\.js$/,
        wasm: /^filmcraft_web_bg\.wasm$/,
        extra: [/^audio-worklet\.js$/],
        kind: "filmcraft",
    },
    {
        slug: "lightcraft",
        display: "LightCraft",
        asset: /^lightcraft-web-\d+\.\d+\.\d+\.zip$/,
        glue: /^lightcraft_web\.js$/,
        wasm: /^lightcraft_web_bg\.wasm$/,
        extra: [/^worker\.js$/],
        notice: true,
        kind: "lightcraft",
    },
    {
        slug: "pdfcraft",
        display: "PdfCraft",
        asset: /^pdfcraft-web-\d+\.\d+\.\d+\.zip$/,
        glue: /^pdfcraft-web-.+\.js$/,
        wasm: /^pdfcraft-web-.+_bg\.wasm$/,
        notice: true,
        kind: "trunk",
    },
];

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

function gzKey(craft: Craft, version: string, wasmName: string): string {
    return `${craft.slug}-web/${version}/${wasmName}.gz`;
}

function gzUrl(craft: Craft, version: string, wasmName: string): string {
    return `${R2_PUBLIC_URL}/${gzKey(craft, version, wasmName)}`;
}

async function existsInBucket(url: string): Promise<boolean> {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
}

async function uploadToBucket(key: string, data: Uint8Array): Promise<void> {
    const dir = await mkdtemp(path.join(tmpdir(), "update-craft-"));
    const file = path.join(dir, "wasm.gz");
    try {
        await writeFile(file, data);
        const proc = Bun.spawn(
            [
                "bunx", "wrangler", "r2", "object", "put", `${R2_BUCKET}/${key}`,
                "--remote",
                "--file", file,
                "--content-type", "application/gzip",
                "--cache-control", "public, max-age=31536000, immutable",
            ],
            { cwd: ROOT, stdout: "inherit", stderr: "inherit" },
        );
        const code = await proc.exited;
        if (code !== 0) {
            throw new Error(`wrangler r2 object put exited with ${code} for ${key}`);
        }
    }
    finally {
        await rm(dir, { recursive: true, force: true });
    }
}

async function findWebZip(craft: Craft, version?: string): Promise<{ url: string; version: string }> {
    const endpoint = version
        ? `https://api.github.com/repos/storytold/${craft.slug}/releases/tags/v${version}`
        : `https://api.github.com/repos/storytold/${craft.slug}/releases/latest`;
    const response = await fetch(endpoint, {
        headers: { "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    });
    if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status} for ${endpoint}`);
    }
    const release = (await response.json()) as Release;
    const asset = release.assets.find(entry => craft.asset.test(entry.name));
    if (!asset) {
        throw new Error(`Release ${release.tag_name} has no ${craft.slug}-web-<version>.zip asset`);
    }
    return { url: asset.browser_download_url, version: release.tag_name.replace(/^v/, "") };
}

// --- loaders: the only per-tool part is how the wasm is fetched and started ---

function trunkLoader(craft: Craft, glueName: string, wasmUrl: string): string {
    const on_error = craft.loadingId
        ? `document.getElementById('${craft.loadingId}').textContent = \`Failed to load ${craft.display}: \${err}\`;`
        : "console.error(err);";
    return `<script type="module">
import init, * as bindings from './${glueName}';

// The gzipped wasm is not bundled; it is downloaded from the R2 bucket.
const WASM_GZ_URL = '${wasmUrl}';

try {
  const gz = await fetch(WASM_GZ_URL);
  if (!gz.ok) throw new Error(\`HTTP \${gz.status} fetching wasm\`);
  const wasmStream = gz.body.pipeThrough(new DecompressionStream('gzip'));
  const wasmResponse = new Response(wasmStream, { headers: { 'Content-Type': 'application/wasm' } });
  const wasm = await init({ module_or_path: wasmResponse });

  window.wasmBindings = bindings;

  dispatchEvent(new CustomEvent("TrunkApplicationStarted", {detail: {wasm}}));
} catch (err) {
  ${on_error}
  throw err;
}
</script>`;
}

function filmcraftLoader(glueName: string, wasmUrl: string, html: string): string {
    const build = html.match(/const build = "([0-9a-f_]+)";/);
    if (!build) {
        throw new Error("Could not find the filmcraft build hash in index.html");
    }
    return `<script type="module">
// \`${build[1]}\` is replaced by \`cargo xtask web\` with a hash of the build: the glue is cached as
// immutable, so its URL must change with every build.
const build = "${build[1]}";
const v = build.startsWith("__") ? "" : "?v=" + build;
const t0 = performance.now();
const params = new URLSearchParams(location.search);
try {
  const { default: init, start } = await import("./${glueName}" + v);

  // The gzipped wasm is not bundled; it is downloaded from the R2 bucket.
  const WASM_GZ_URL = '${wasmUrl}';
  const gz = await fetch(WASM_GZ_URL);
  if (!gz.ok) throw new Error(\`HTTP \${gz.status} fetching wasm\`);
  const wasmResponse = new Response(gz.body.pipeThrough(new DecompressionStream('gzip')), { headers: { 'Content-Type': 'application/wasm' } });
  await init({ module_or_path: wasmResponse });
  window.filmcraftLoad.wasmMs = performance.now() - t0;
  await start("filmcraft_canvas");
  window.filmcraftLoad.readyMs = performance.now() - t0;
} catch (e) {
  const text = String(e && e.stack || e);
  window.filmcraftLoad.error = String(e);
  // WebGPU was found but could not be started: try again on WebGL2 (once)
  if (!params.has("webgl") && !params.has("cpu") && /wgpu|webgpu|requestDevice|requestAdapter|GPUDevice|surface/i.test(text)) {
    params.set("webgl", "");
    location.replace(location.pathname + "?" + params.toString().replace(/=(&|$)/g, "$1") + location.hash);
  } else {
    const s = document.getElementById("status");
    if (s) { s.className = "err"; s.textContent = "FilmCraft failed to start:\\n" + text; }
  }
  throw e;
}
</script>`;
}

function lightcraftLoader(glueName: string, wasmUrl: string): string {
    return `<script type="module">
import init, { start, command } from "./${glueName}";
(async () => {
  // The Chinese font is a separate file: embedding it would exceed the host's WASM size limit.
  // Font-free development builds can still run, with the same missing-glyph warning as before.
  const chineseFont = fetch("./lightcraft_zh_hans.otf")
    .then(async response => response.ok ? new Uint8Array(await response.arrayBuffer()) : new Uint8Array())
    .catch(() => new Uint8Array());

  // The gzipped wasm is not bundled; it is downloaded from the R2 bucket.
  const WASM_GZ_URL = '${wasmUrl}';
  const gz = await fetch(WASM_GZ_URL);
  if (!gz.ok) throw new Error(\`HTTP \${gz.status} fetching wasm\`);
  const wasmResponse = new Response(gz.body.pipeThrough(new DecompressionStream('gzip')), { headers: { 'Content-Type': 'application/wasm' } });
  // Compile once; the render workers (worker.js) instantiate the same compiled module.
  const [module, font] = await Promise.all([
    WebAssembly.compileStreaming(wasmResponse),
    chineseFont,
  ]);
  globalThis.lightcraftModule = module;
  await init({ module_or_path: module });
  // automation: \`await lightcraft.command("library.info", "{}")\` → JSON text
  globalThis.lightcraft = { command };
  start(font);
})().catch((e) => {
  console.error(e);
  const el = document.getElementById("lightcraft_loading");
  if (el) el.textContent = "LightCraft failed to load: " + e;
});
</script>`;
}

function patchIndexHtml(craft: Craft, html: string, glueName: string, wasmUrl: string): string {
    let patched: string;
    if (craft.kind === "filmcraft") {
        patched = html.replace(/<script type="module">[\s\S]*?<\/script>/, () => filmcraftLoader(glueName, wasmUrl, html));
    }
    else if (craft.kind === "lightcraft") {
        patched = html.replace(/<script type="module">[\s\S]*?<\/script>/, () => lightcraftLoader(glueName, wasmUrl));
    }
    else {
        patched = html.replace(/<script type="module">[\s\S]*?<\/script>/, () => trunkLoader(craft, glueName, wasmUrl));
    }
    if (!patched.includes("WASM_GZ_URL")) {
        throw new Error("Could not find the wasm loader script in index.html");
    }
    // The raw wasm is not served from here, so a preload would just 404.
    patched = patched.replace(/<link rel="preload"[^>]*_bg\.wasm[^>]*>\n?/, "");
    // The tools run in an iframe, so favicons are dead weight (filmcraft shows one in its
    // loading screen; drop that too).
    patched = patched.replace(/<link rel="icon"[^>]*>\n?/g, "");
    patched = patched.replace(/<img src="favicon\.png"[^>]*>\n?/g, "");
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

function pickAll(files: Map<string, Uint8Array>, pattern: RegExp): [string, Uint8Array][] {
    const matches = [...files].filter(([name]) => pattern.test(name));
    if (matches.length === 0) {
        throw new Error(`Release zip has no file matching ${pattern}`);
    }
    return matches;
}

async function updateCraft(craft: Craft, versionArg: string | undefined, dryRun: boolean): Promise<void> {
    const { url, version } = await findWebZip(craft, versionArg);
    console.log(`${craft.slug}-web release: v${version}`);

    const zipResponse = await fetch(url);
    if (!zipResponse.ok) {
        throw new Error(`Download failed with ${zipResponse.status}: ${url}`);
    }
    const zip = unzipSync(new Uint8Array(await zipResponse.arrayBuffer()));

    // Zip entries are prefixed with <slug>-web-<version>/; key them by their path below that.
    // Skip directory entries (they end with "/").
    const files = new Map<string, Uint8Array>();
    for (const [name, data] of Object.entries(zip)) {
        const relative = name.replace(/^[^/]+\//, "");
        if (relative && !relative.endsWith("/")) {
            files.set(relative, data);
        }
    }

    const indexData = files.get("index.html");
    if (!indexData) {
        throw new Error("Release zip has no index.html");
    }
    const [glueName, glue] = pick(files, craft.glue);
    const [wasmName, wasm] = pick(files, craft.wasm);
    const extras = (craft.extra ?? []).flatMap(pattern => pickAll(files, pattern));
    const licenses = pickAll(files, /^LICENSE-(?:MIT|APACHE)$/);
    const notices = craft.notice ? pickAll(files, /^NOTICE$/) : [];

    // fflate always hands out plain ArrayBuffer-backed views, but its types say ArrayBufferLike.
    const gz = Bun.gzipSync(wasm as Uint8Array<ArrayBuffer>, { level: 9 });
    const key = gzKey(craft, version, wasmName);
    const wasmUrl = gzUrl(craft, version, wasmName);

    const patchedHtml = patchIndexHtml(craft, new TextDecoder().decode(indexData), glueName, wasmUrl);

    const publicDir = path.join(ROOT, "public", `${craft.slug}-web`);

    const currentHtml = existsSync(path.join(publicDir, "index.html"))
        ? await readFile(path.join(publicDir, "index.html"), "utf8")
        : null;
    const uploaded = await existsInBucket(wasmUrl);
    if (currentHtml === patchedHtml && (uploaded || dryRun)) {
        console.log(`  v${version} is already vendored, nothing to do.`);
        return;
    }

    console.log(`  wasm ${formatBytes(wasm.length)} -> ${key} ${formatBytes(gz.length)}`);

    if (uploaded) {
        console.log(`  ${key} is already in the bucket, skipping upload.`);
    }
    else if (dryRun) {
        console.log(`  dry run: not uploading ${key}`);
    }
    else {
        await uploadToBucket(key, gz);
    }

    await rm(publicDir, { recursive: true, force: true });
    await mkdir(publicDir, { recursive: true });
    await writeFile(path.join(publicDir, "index.html"), patchedHtml);
    for (const [name, data] of [[glueName, glue], ...extras, ...licenses, ...notices] as [string, Uint8Array][]) {
        const dest = path.join(publicDir, name);
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest, data);
    }

    const vendored = ["index.html", glueName, ...extras.map(([name]) => name), ...licenses.map(([name]) => name), ...notices.map(([name]) => name)];
    console.log(`  public/${craft.slug}-web: ${vendored.join(", ")}`);
    console.log(`  ${wasmUrl}`);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const positional = args.filter(arg => !arg.startsWith("--"));
const toolArg = positional[0]?.toLowerCase();
const versionArg = positional[1]?.replace(/^v/, "");

const selected = toolArg ? CRAFTS.filter(craft => craft.slug === toolArg) : CRAFTS;
if (selected.length === 0) {
    console.error(`Unknown tool "${toolArg}". Available: ${CRAFTS.map(craft => craft.slug).join(", ")}`);
    process.exit(1);
}

try {
    for (const craft of selected) {
        await updateCraft(craft, versionArg, dryRun);
    }
    console.log(dryRun ? "Done (dry run, nothing uploaded)." : "Done.");
}
catch (err) {
    console.error(err);
    process.exit(1);
}
