// Local in-browser translation using @huggingface/transformers with the
// WebGPU device. This is a direct port of the upstream Translator class
// (https://huggingface.co/spaces/webml-community/TranslateGemma-WebGPU),
// adjusted for the SolidStart tool: ESM exports, dynamic import so the
// transformers runtime is not pulled into the initial bundle, and an
// isReady() accessor for UI state.

import type { ProgressInfo } from "@huggingface/transformers";
import type * as Transformers from "@huggingface/transformers";

const MODEL_ID = "onnx-community/translategemma-text-4b-it-ONNX";
const DTYPE = "q4";
const MAX_NEW_TOKENS = 1024;

// Mirror the OCR worker: forward the library's per-file ProgressInfo and
// let the UI aggregate. This avoids hardcoding the model's total byte size
// (which silently changes when weights are re-uploaded) and renders one
// progress bar per file, like the upstream WebGPU examples.
type ProgressFn = (info: ProgressInfo) => void;

class Translator {
    private static instance: Translator | null = null;
    private pipeline: ((...args: unknown[]) => Promise<Array<{ generated_text: Array<{ content: string }> }>>) | null = null;
    private transformers: typeof Transformers | null = null;

    private constructor() {}

    public static getInstance(): Translator {
        if (!Translator.instance) {
            Translator.instance = new Translator();
        }
        return Translator.instance;
    }

    public isReady(): boolean {
        return this.pipeline !== null;
    }

    public async init(onProgress?: ProgressFn): Promise<void> {
        if (this.pipeline) {
            return;
        }

        // Dynamic import so the transformers runtime + WASM/ORT shims are not
        // pulled into the initial route bundle.
        this.transformers = await import("@huggingface/transformers");
        if (this.pipeline) {
            return;
        }

        const transformers = this.transformers;
        if (!transformers) {
            throw new Error("Translator module failed to load.");
        }
        this.pipeline = await transformers.pipeline("text-generation", MODEL_ID, {
            progress_callback: (e: ProgressInfo) => {
                onProgress?.(e);
            },
            device: "webgpu",
            dtype: DTYPE,
        }) as Translator["pipeline"];
    }

    public async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
        if (!this.pipeline) {
            throw new Error("Translator not initialized. Call init() first.");
        }

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

        const output = await this.pipeline(messages, { max_new_tokens: MAX_NEW_TOKENS });
        const lastMessage = output[0]?.generated_text?.at(-1);
        const content = lastMessage?.content;
        if (typeof content !== "string" || content.length === 0) {
            throw new Error("Translator returned an empty response.");
        }
        return content;
    }
}

export default Translator;
