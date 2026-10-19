import { loadIndra } from "@ducng99/indra-ocr-js/browser";
import type { GrayImage, IndraOCR } from "@ducng99/indra-ocr-js/browser";
import { env as ortEnv } from "onnxruntime-web";

const MODEL_BASE = "datalab-to/indra-ocr";

// The ort .wasm binary is stripped from the build output (see the
// excludeOnnxWasm plugin in vite.config.ts), so it is fetched from the CDN
// matching the installed onnxruntime-web version instead.
const ORT_WASM_PATHS = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";

export interface OcrWorkerRequest {
    type: "run";
    gray: GrayImage;
}

export interface OcrFileProgress {
    file: string;
    /** 0–100, or null while indeterminate (no Content-Length); 100 = done. */
    progress: number | null;
}

export type OcrWorkerResponse
    = | { type: "progress"; progress: OcrFileProgress }
        | { type: "status"; message: string }
        | { type: "result"; text: string; lineCount: number }
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

function loadOcr() {
    if (!ocrPromise) {
        ocrPromise = (async () => {
            postMessage({ type: "status", message: "Loading OCR models…" } satisfies OcrWorkerResponse);

            ortEnv.wasm.numThreads = detectThreadCount();

            return await loadIndra(MODEL_BASE, {
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
