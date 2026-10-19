import { IndraOCR } from "@ducng99/indra-ocr-js/browser";
import type { GrayImage } from "@ducng99/indra-ocr-js/browser";
import { InferenceSession, Tensor, env as ortEnv } from "onnxruntime-web";

// Pinned upstream revision: CORS-enabled, so it works straight from the
// browser (see the package README for self-hosting the ~18 MB model files).
const MODEL_BASE = "datalab-to/indra-ocr";

// The ort .wasm binary is stripped from the build output (see the
// excludeOnnxWasm plugin in vite.config.ts), so it is fetched from the CDN
// matching the installed onnxruntime-web version instead.
const ORT_WASM_PATHS = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";

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

export interface OcrWorkerRequest {
    type: "run";
    gray: GrayImage;
}

export interface OcrFileProgress {
    file: string;
    /** 0–100; 100 means the file finished loading. */
    progress: number;
}

export type OcrWorkerResponse
    = | { type: "progress"; progress: OcrFileProgress }
        | { type: "status"; message: string }
        | { type: "result"; text: string; lineCount: number }
        | { type: "error"; message: string };

async function fetchBuffer(url: string, onProgress: (fraction: number) => void) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} for ${url}`);
    }

    const total = Number(response.headers.get("content-length"));
    if (!response.body || !total) {
        onProgress(1);
        return new Uint8Array(await response.arrayBuffer());
    }

    const reader = response.body.getReader();
    const chunks: Array<Uint8Array> = [];
    let loaded = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        chunks.push(value);
        loaded += value.byteLength;
        onProgress(Math.min(loaded / total, 1));
    }

    const data = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return data;
}

let ocrPromise: Promise<IndraOCR> | null = null;

function loadOcr() {
    if (!ocrPromise) {
        ocrPromise = (async () => {
            postMessage({ type: "status", message: "Loading OCR models…" } satisfies OcrWorkerResponse);

            ortEnv.wasm.wasmPaths = ORT_WASM_PATHS;
            ortEnv.wasm.numThreads = detectThreadCount();

            const reportProgress = (file: string) => {
                return (fraction: number) => {
                    postMessage({ type: "progress", progress: { file, progress: fraction * 100 } } satisfies OcrWorkerResponse);
                };
            };

            // A custom backend (instead of loadIndra) so downloads can report
            // per-file progress to the UI. Optional models (order, orient,
            // script/rec_cjk) degrade silently when their fetch fails.
            return await IndraOCR.create({
                Tensor,
                meta: async () => {
                    const data = await fetchBuffer(`${MODEL_BASE}meta.json`, reportProgress("meta.json"));
                    return JSON.parse(new TextDecoder().decode(data));
                },
                session: async (name) => {
                    const data = await fetchBuffer(MODEL_BASE + name, reportProgress(name));
                    const session = await InferenceSession.create(data, {
                        executionProviders: ["wasm"],
                        graphOptimizationLevel: "all",
                    });
                    return { run: (inputs: never) => session.run(inputs) };
                },
            });
        })();
    }

    return ocrPromise;
}

async function runOcr(gray: GrayImage) {
    const ocr = await loadOcr();

    postMessage({ type: "status", message: "Running OCR…" } satisfies OcrWorkerResponse);

    const page = await ocr.run(gray);
    return { text: page.text, lineCount: page.lines.length };
}

self.addEventListener("message", (event: MessageEvent<OcrWorkerRequest>) => {
    const data = event.data;

    if (data.type === "run") {
        runOcr(data.gray)
            .then((result) => {
                postMessage({ type: "result", ...result } satisfies OcrWorkerResponse);
            })
            .catch((error: unknown) => {
                postMessage({ type: "error", message: error instanceof Error ? error.message : String(error) } satisfies OcrWorkerResponse);
            });
    }
});
