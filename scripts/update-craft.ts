#!/usr/bin/env bun
// Updates the vendored *Craft web builds to GitHub releases.
// Usage: bun scripts/update-craft.ts [tool] [version] [--dry-run]   (default: all tools, latest releases)
//
// Every tool is vendored the same way:
//   public/<tool>-web/    patched index.html, assets that must be same-origin (workers), licenses
//   R2 bucket             the wasm and the ES modules (glue JS, wasm-bindgen snippets, see
//                         bucketModules) as-is at <slug>-web/<version>/<file>, and any other large
//                         asset (see bucketAssets) at <slug>-web/<version>/<file>, fetched
//                         at runtime from the bucket's public URL. Uploaded through R2's S3 API with
//                         Bun's S3Client, so the environment needs S3_ACCESS_KEY_ID,
//                         S3_SECRET_ACCESS_KEY and S3_ENDPOINT (see uploadToBucket).
//
// Flags: --dry-run  patch public/ but do not upload anything to R2

import { existsSync } from "fs";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client } from "bun";
import { unzipSync } from "fflate";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const R2_BUCKET = "artcraft-tools-wasm";
const R2_PUBLIC_URL = "https://artcraft-tools-wasm.buckets.tomng.dev";

interface Craft {
    slug: string; // repo name, directory prefix and route
    display: string;
    asset: RegExp; // release zip asset
    glue: RegExp; // JS glue to vendor
    wasm: RegExp; // wasm to upload to the bucket
    extra?: RegExp[]; // additional runtime assets to vendor as-is
    bucketModules?: RegExp[]; // additional ES modules served from the bucket next to the glue
    bucketAssets?: RegExp[]; // additional large runtime assets, uploaded to the bucket next to the wasm
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
        // The boot wasm fetches app/parts.txt and the app chunks itself, so they must be served
        // as-is next to index.html. The app glue is imported by the boot glue and lives with it.
        extra: [/^app\/parts\.txt$/, /^app\/.+\.part-/],
        bucketModules: [/^app\/.+\.js$/],
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
        bucketAssets: [/^lightcraft_zh_hans\.otf$/],
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

function moduleKey(craft: Craft, version: string, name: string): string {
    return `${craft.slug}-web/${version}/${name}`;
}

function moduleUrl(craft: Craft, version: string, name: string): string {
    return `${R2_PUBLIC_URL}/${moduleKey(craft, version, name)}`;
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
}

async function existsInBucket(url: string): Promise<boolean> {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
}

// R2's least-privilege API tokens only carry S3 credentials, which wrangler rejects, so the
// uploads go straight through R2's S3-compatible endpoint with Bun's S3 client. Credentials
// are read from the standard environment variables:
//   S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY  access keys of an R2 API token
//   S3_ENDPOINT                              https://<account-id>.r2.cloudflarestorage.com
//   S3_REGION                                optional (R2 takes any value, "auto" by convention)
// Bun's S3 client cannot set Cache-Control metadata yet (oven-sh/bun#16048); caching for the
// bucket's public hostname is handled by a Cloudflare Cache Rule instead.
const s3 = new S3Client({ bucket: R2_BUCKET, region: "auto" });

async function uploadToBucket(key: string, data: Uint8Array, type: string): Promise<void> {
    try {
        await s3.write(key, data, { type });
    }
    catch (err) {
        throw new Error(`S3 upload failed for ${key}`, { cause: err });
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

// The wasm is not bundled; it is downloaded from the R2 bucket.
const WASM_URL = '${wasmUrl}';

try {
  const wasm = await init({ module_or_path: WASM_URL });

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

  // The wasm is not bundled; it is downloaded from the R2 bucket.
  const WASM_URL = '${wasmUrl}';
  await init({ module_or_path: WASM_URL });
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

function lightcraftLoader(glueName: string, wasmUrl: string, fontUrl: string): string {
    return `<script type="module">
import init, { start, command } from "./${glueName}";
(async () => {
  // The Chinese font is a separate file: embedding it would exceed the host's WASM size limit.
  // Like the wasm, the font is downloaded from the R2 bucket.
  const FONT_URL = '${fontUrl}';
  const chineseFont = fetch(FONT_URL).then(async response => {
    if (!response.ok) throw new Error(\`HTTP \${response.status} fetching font\`);
    return new Uint8Array(await response.arrayBuffer());
  });

  // The wasm is not bundled; it is downloaded from the R2 bucket.
  const WASM_URL = '${wasmUrl}';
  // Compile once; the render workers (worker.js) instantiate the same compiled module.
  const [module, font] = await Promise.all([
    WebAssembly.compileStreaming(fetch(WASM_URL)),
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

function patchIndexHtml(craft: Craft, html: string, glueName: string, wasmUrl: string, bucketUrls: string[], moduleUrls: Map<string, string>): string {
    let patched: string;
    if (craft.kind === "filmcraft") {
        patched = html.replace(/<script type="module">[\s\S]*?<\/script>/, () => filmcraftLoader(glueName, wasmUrl, html));
    }
    else if (craft.kind === "lightcraft") {
        patched = html.replace(/<script type="module">[\s\S]*?<\/script>/, () => lightcraftLoader(glueName, wasmUrl, bucketUrls[0]));
    }
    else {
        patched = html.replace(/<script type="module">[\s\S]*?<\/script>/, () => trunkLoader(craft, glueName, wasmUrl));
    }
    if (!patched.includes("WASM_URL")) {
        throw new Error("Could not find the wasm loader script in index.html");
    }
    // Modules (and their modulepreload links) are served from the bucket.
    for (const [name, url] of moduleUrls) {
        patched = patched.replaceAll(`"./${name}"`, `"${url}"`).replaceAll(`'./${name}'`, `'${url}'`);
    }
    // Preloads that still point at a local path refer to files that are not served from here.
    patched = patched.replace(/<link rel="modulepreload" href="\.\/[^"]*"[^>]*>/g, "");
    // The raw wasm is not served from here, so a preload would just 404.
    patched = patched.replace(/<link rel="preload"[^>]*_bg\.wasm[^>]*>\n?/, "");
    // The tools run in an iframe, so favicons are dead weight (filmcraft shows one in its
    // loading screen; drop that too).
    patched = patched.replace(/<link rel="icon"[^>]*>\n?/g, "");
    patched = patched.replace(/<img src="favicon\.png"[^>]*>\n?/g, "");
    return patched;
}

// Relative imports of an ES module (static, side-effect and dynamic).
function relativeImports(source: string): string[] {
    const specifiers = new Set<string>();
    for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.{1,2}\/[^"']+)["']/g)) {
        specifiers.add(match[1]);
    }
    return [...specifiers];
}

// Adds every module that the bucket modules import, at the path the importer resolves it to.
// The zip may lay a file out differently than its importer expects (e.g. snippets/ at the root
// while app/<glue>.js imports ./snippets/), so a missing target falls back to the zip file with the
// same path relative to the zip root.
function addImportedModules(files: Map<string, Uint8Array>, modules: [string, Uint8Array][]): void {
    const included = new Set(modules.map(([name]) => name));
    for (let index = 0; index < modules.length; index++) {
        const [importer, data] = modules[index];
        for (const specifier of relativeImports(new TextDecoder().decode(data))) {
            const target = path.posix.join(path.posix.dirname(importer), specifier);
            if (included.has(target)) {
                continue;
            }
            const source = files.get(target) ?? files.get(path.posix.normalize(specifier).replace(/^(\.\.\/)+/, ""));
            if (!source) {
                throw new Error(`${importer} imports ${specifier}, which is not in the release zip`);
            }
            modules.push([target, source]);
            included.add(target);
        }
    }
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
    const modules: [string, Uint8Array][] = [
        [glueName, glue],
        ...(craft.bucketModules ?? []).flatMap(pattern => pickAll(files, pattern)),
    ];
    addImportedModules(files, modules);
    const bucketAssets = (craft.bucketAssets ?? []).flatMap(pattern => pickAll(files, pattern));
    const licenses = pickAll(files, /^(?:LICENSE-(?:MIT|APACHE)|OFL-.+\.txt)$/);
    const notices = craft.notice ? pickAll(files, /^NOTICE$/) : [];

    // fflate always hands out plain ArrayBuffer-backed views, but its types say ArrayBufferLike.
    const key = moduleKey(craft, version, wasmName);
    const wasmUrl = moduleUrl(craft, version, wasmName);

    const assetUrls = bucketAssets.map(([name]) => moduleUrl(craft, version, name));

    const moduleUrls = new Map(modules.map(([name]) => [name, moduleUrl(craft, version, name)]));
    const patchedHtml = patchIndexHtml(craft, new TextDecoder().decode(indexData), glueName, wasmUrl, assetUrls, moduleUrls);

    // Same-origin scripts (workers) that import the glue must import it from the bucket.
    const localExtras: [string, Uint8Array][] = extras.map(([name, data]) => {
        if (!name.endsWith(".js")) {
            return [name, data];
        }
        let text = new TextDecoder().decode(data);
        for (const [moduleName, url] of moduleUrls) {
            text = text.replaceAll(`"./${moduleName}"`, `"${url}"`);
        }
        return [name, new TextEncoder().encode(text)];
    });

    const publicDir = path.join(ROOT, "public", `${craft.slug}-web`);

    const currentHtml = existsSync(path.join(publicDir, "index.html"))
        ? await readFile(path.join(publicDir, "index.html"), "utf8")
        : null;
    const vendoredFiles = [...extras.map(([name]) => name), ...licenses.map(([name]) => name), ...notices.map(([name]) => name)];
    const allFilesPresent = vendoredFiles.every(name => existsSync(path.join(publicDir, name)));
    const uploaded = await existsInBucket(wasmUrl);
    const assetsUploaded = (await Promise.all([...assetUrls, ...moduleUrls.values()].map(existsInBucket))).every(Boolean);
    if (currentHtml === patchedHtml && allFilesPresent && ((uploaded && assetsUploaded) || dryRun)) {
        console.log(`  v${version} is already vendored, nothing to do.`);
        return;
    }

    console.log(`  wasm ${formatBytes(wasm.length)} -> ${key}`);

    if (uploaded) {
        console.log(`  ${key} is already in the bucket, skipping upload.`);
    }
    else if (dryRun) {
        console.log(`  dry run: not uploading ${key}`);
    }
    else {
        await uploadToBucket(key, wasm, "application/wasm");
    }

    for (const [name, data] of modules) {
        const moduleKeyName = moduleKey(craft, version, name);
        if (await existsInBucket(moduleUrls.get(name)!)) {
            console.log(`  ${moduleKeyName} is already in the bucket, skipping upload.`);
        }
        else if (dryRun) {
            console.log(`  dry run: not uploading ${moduleKeyName}`);
        }
        else {
            await uploadToBucket(moduleKeyName, data, "text/javascript");
        }
    }

    for (const [name, data] of bucketAssets) {
        const assetKey = moduleKey(craft, version, name);
        console.log(`  ${name} ${formatBytes(data.length)} -> ${assetKey}`);
        if (await existsInBucket(moduleUrl(craft, version, name))) {
            console.log(`  ${assetKey} is already in the bucket, skipping upload.`);
        }
        else if (dryRun) {
            console.log(`  dry run: not uploading ${assetKey}`);
        }
        else {
            await uploadToBucket(assetKey, data, "font/otf");
        }
    }

    await rm(publicDir, { recursive: true, force: true });
    await mkdir(publicDir, { recursive: true });
    await writeFile(path.join(publicDir, "index.html"), patchedHtml);
    for (const [name, data] of [...localExtras, ...licenses, ...notices] as [string, Uint8Array][]) {
        const dest = path.join(publicDir, name);
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest, data);
    }

    const vendored = ["index.html", ...extras.map(([name]) => name), ...licenses.map(([name]) => name), ...notices.map(([name]) => name)];
    console.log(`  public/${craft.slug}-web: ${vendored.join(", ")}`);
    console.log(`  ${wasmUrl}`);
    for (const url of moduleUrls.values()) {
        console.log(`  ${url}`);
    }
    for (const url of assetUrls) {
        console.log(`  ${url}`);
    }
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
