import { pipeline } from "@huggingface/transformers";
import type { ProgressInfo } from "@huggingface/transformers";

const MODEL_ID = "onnx-community/translategemma-text-4b-it-ONNX";
const DTYPE = "q4";
const MAX_NEW_TOKENS = 1024;

export interface TranslateWorkerInitRequest {
    type: "init";
}

export interface TranslateWorkerRunRequest {
    type: "translate";
    text: string;
    sourceLang: string;
    targetLang: string;
}

export type TranslateWorkerRequest = TranslateWorkerInitRequest | TranslateWorkerRunRequest;

export type TranslateWorkerResponse
    = | { type: "progress"; progress: ProgressInfo }
        | { type: "status"; message: string }
        | { type: "ready" }
        | { type: "result"; text: string }
        | { type: "error"; message: string };

let pipelinePromise: Promise<(...args: unknown[]) => Promise<Array<{ generated_text: Array<{ content: string }> }>>> | null = null;

function loadPipeline() {
    if (!pipelinePromise) {
        pipelinePromise = (async () => {
            postMessage({ type: "status", message: "Loading the on-device model…" } satisfies TranslateWorkerResponse);

            const progress_callback = (progress: ProgressInfo) => {
                postMessage({ type: "progress", progress } satisfies TranslateWorkerResponse);
            };

            const textGenerator = await pipeline("text-generation", MODEL_ID, {
                progress_callback,
                device: "webgpu",
                dtype: DTYPE,
            });

            postMessage({ type: "ready" } satisfies TranslateWorkerResponse);
            return textGenerator as unknown as (...args: unknown[]) => Promise<Array<{ generated_text: Array<{ content: string }> }>>;
        })();
    }

    return pipelinePromise;
}

async function runTranslation(text: string, sourceLang: string, targetLang: string) {
    const textGenerator = await loadPipeline();

    postMessage({ type: "status", message: "Translating on-device…" } satisfies TranslateWorkerResponse);

    const messages = [
        {
            role: "user",
            content: [
                {
                    type: "text",
                    source_lang_code: sourceLang,
                    target_lang_code: targetLang,
                    text,
                },
            ],
        },
    ];

    const output = await textGenerator(messages, { max_new_tokens: MAX_NEW_TOKENS });
    const lastMessage = output[0]?.generated_text?.at(-1);
    const content = lastMessage?.content;
    if (typeof content !== "string" || content.length === 0) {
        throw new Error("Translator returned an empty response.");
    }
    return content;
}

self.addEventListener("message", (event: MessageEvent<TranslateWorkerRequest>) => {
    const data = event.data;

    if (data.type === "init") {
        loadPipeline().catch((error: unknown) => {
            postMessage({ type: "error", message: error instanceof Error ? error.message : String(error) } satisfies TranslateWorkerResponse);
        });
    }
    else if (data.type === "translate") {
        runTranslation(data.text, data.sourceLang, data.targetLang)
            .then((result) => {
                postMessage({ type: "result", text: result } satisfies TranslateWorkerResponse);
            })
            .catch((error: unknown) => {
                postMessage({ type: "error", message: error instanceof Error ? error.message : String(error) } satisfies TranslateWorkerResponse);
            });
    }
});
