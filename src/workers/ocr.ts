import { loadIndra, readGray } from "@ducng99/indra-ocr-js/browser";
import type { IndraOCR } from "@ducng99/indra-ocr-js/browser";

const MODEL_BASE = "datalab-to/indra-ocr";

/** Longer image side fed to the pipeline; larger photos are downscaled. */
const MAX_SIDE = 2048;

// The ort .wasm binary is stripped from the build output (see the
// excludeOnnxWasm plugin in vite.config.ts), so it is fetched from the CDN
// matching the installed onnxruntime-web version instead.
const ORT_WASM_PATHS = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";

/** loadIndra feature toggles exposed in the UI. */
export interface OcrFeatures {
    /** Non-Latin scripts: script classifier + CJK / RTL / world recognizers (package default on). */
    cjk: boolean;
    /** Rerank recognition with the n-gram language models (package default on). */
    lm: boolean;
    /** Read math lines as LaTeX (downloads the extra math models). */
    math: boolean;
    /** Build tables from the order model's table heads instead of from geometry. */
    tableHeads: boolean;
    /** Keep page headers and footers in the markdown output. */
    furniture: boolean;
}

export interface OcrWorkerRequest {
    type: "run";
    /** The image file; decoded to grayscale in the worker. */
    image: Blob;
    features: OcrFeatures;
}

export interface OcrFileProgress {
    file: string;
    /** 0–100, or null while indeterminate (no Content-Length); 100 = done. */
    progress: number | null;
}

export interface OcrResult {
    /** Lines in reading order, newline-joined. */
    text: string;
    /** Page markdown (headings, lists, tables, math); null without the layout heads. */
    markdown: string | null;
    lineCount: number;
    /** Quarter-turn undone, in degrees (0 / 90 / 180 / 270). */
    rotation: number;
    /** Deskew angle undone, in degrees. */
    skew: number;
    /** Vertical (top-to-bottom) CJK page. */
    vertical: boolean;
    pictureCount: number;
    /** ocr.run() wall time in ms (excludes model loading). */
    runMs: number;
}

export type OcrWorkerResponse
    = | { type: "progress"; progress: OcrFileProgress }
        | { type: "status"; message: string }
        | { type: "result"; result: OcrResult }
        | { type: "error"; message: string };

// ORT derives its default thread count from self.crossOriginIsolated, which
// newer Chrome builds no longer expose — probe the actual capability (SAB
// transfer, the same check ort runs at init) and pick the count ourselves.
// Requires the COOP/COEP headers (public/_headers); ort also re-gates this
// at wasm init and falls back to single-threading gracefully.
function detectThreadCount() {
    try {
        if (typeof SharedArrayBuffer === "undefined") {
            return 1;
        }
        new MessageChannel().port1.postMessage(new SharedArrayBuffer(1));
    }
    catch {
        return 1;
    }
    return Math.max(1, Math.min(4, Math.ceil((navigator.hardwareConcurrency || 2) / 2)));
}

let ocrPromise: Promise<IndraOCR> | null = null;
let loadedFeatures: OcrFeatures | null = null;

function sameFeatures(a: OcrFeatures, b: OcrFeatures) {
    return (Object.keys(a) as Array<keyof OcrFeatures>).every(key => a[key] === b[key]);
}

// Feature flags are loadIndra options, so a changed set means a fresh load
// (`cjk`, `lm` and `math` change what gets downloaded; files are HTTP-cached).
function loadOcr(features: OcrFeatures) {
    if (!ocrPromise || !loadedFeatures || !sameFeatures(loadedFeatures, features)) {
        loadedFeatures = { ...features };
        ocrPromise = (async () => {
            postMessage({ type: "status", message: "Loading OCR models…" } satisfies OcrWorkerResponse);

            return await loadIndra(MODEL_BASE, {
                ...features,
                // loadIndra sets ort's env.wasm.numThreads from this (default 4).
                threads: detectThreadCount(),
                wasmPaths: ORT_WASM_PATHS,
                progress: (info) => {
                    postMessage({
                        type: "progress",
                        progress: {
                            file: info.file,
                            progress: info.done ? 100 : info.total ? (info.loaded / info.total) * 100 : null,
                        },
                    } satisfies OcrWorkerResponse);
                },
            });
        })();
    }

    return ocrPromise;
}

async function runOcr(image: Blob, features: OcrFeatures): Promise<OcrResult> {
    // Decode first so an unreadable file fails before any model download.
    postMessage({ type: "status", message: "Reading image…" } satisfies OcrWorkerResponse);
    const gray = await readGray(image, { maxSide: MAX_SIDE });

    const ocr = await loadOcr(features);

    postMessage({ type: "status", message: "Running OCR…" } satisfies OcrWorkerResponse);

    const start = performance.now();
    const page = await ocr.run(gray);
    const runMs = performance.now() - start;
    return {
        text: page.text,
        markdown: page.markdown,
        lineCount: page.lines.length,
        rotation: page.rotation,
        skew: page.skew,
        vertical: page.vertical,
        pictureCount: page.pictures.length,
        runMs,
    };
}

self.addEventListener("message", (event: MessageEvent<OcrWorkerRequest>) => {
    const data = event.data;

    if (data.type === "run") {
        runOcr(data.image, data.features)
            .then((result) => {
                postMessage({ type: "result", result } satisfies OcrWorkerResponse);
            })
            .catch((error: unknown) => {
                postMessage({ type: "error", message: error instanceof Error ? error.message : String(error) } satisfies OcrWorkerResponse);
            });
    }
});
