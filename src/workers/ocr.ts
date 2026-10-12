import { AutoProcessor, Qwen3_5ForConditionalGeneration, RawImage } from "@huggingface/transformers";
import type { Processor, ProgressInfo, Tensor } from "@huggingface/transformers";

const MODEL_ID = "superpdf/LightOnOCR-3-0.8B-ONNX-web";

// Qwen3.5 chat template: disable the <think> reasoning block for plain transcription output.
type ChatTemplateOptions = Parameters<Processor["apply_chat_template"]>[1];
const CHAT_TEMPLATE_OPTIONS = {
    add_generation_prompt: true,
    tokenize: false,
    enable_thinking: false,
} as ChatTemplateOptions;

const GENERATE_OPTIONS = {
    max_new_tokens: 6144,
    do_sample: false,
} as const;

export interface OcrWorkerRequest {
    type: "run";
    imageData: ImageData;
}

export type OcrWorkerResponse
    = | { type: "progress"; progress: ProgressInfo }
        | { type: "status"; message: string }
        | { type: "result"; text: string }
        | { type: "error"; message: string };

let modelPromise: Promise<{
    processor: Processor;
    model: InstanceType<typeof Qwen3_5ForConditionalGeneration>;
}> | null = null;

function loadModel() {
    if (!modelPromise) {
        modelPromise = (async () => {
            postMessage({ type: "status", message: "Loading OCR model…" } satisfies OcrWorkerResponse);

            const progress_callback = (progress: ProgressInfo) => {
                postMessage({ type: "progress", progress } satisfies OcrWorkerResponse);
            };

            const [processor, model] = await Promise.all([
                AutoProcessor.from_pretrained(MODEL_ID, { progress_callback }),
                Qwen3_5ForConditionalGeneration.from_pretrained(MODEL_ID, {
                    dtype: {
                        embed_tokens: "q4",
                        decoder_model_merged: "q4",
                        vision_encoder: "fp16",
                    },
                    progress_callback,
                    device: typeof navigator !== "undefined" && "gpu" in navigator ? "webgpu" : "auto",
                // from_pretrained is typed as Promise<PreTrainedModel>, but returns the concrete class instance.
                }) as Promise<InstanceType<typeof Qwen3_5ForConditionalGeneration>>,
            ]);

            return { processor, model };
        })();
    }

    return modelPromise;
}

async function runOcr(imageData: ImageData) {
    const { processor, model } = await loadModel();

    postMessage({ type: "status", message: "Running inference…" } satisfies OcrWorkerResponse);

    const image = new RawImage(imageData.data, imageData.width, imageData.height, 4);

    const messages = [
        { role: "user", content: [{ type: "image" }] },
    ] as Parameters<Processor["apply_chat_template"]>[0];

    const text = processor.apply_chat_template(messages, CHAT_TEMPLATE_OPTIONS) as string;
    const inputs = await processor(text, image) as Record<string, Tensor> & { input_ids: Tensor };

    const generated = await model.generate({
        ...inputs,
        ...GENERATE_OPTIONS,
    }) as Tensor;

    const inputLength = inputs.input_ids.dims.at(-1) as number;
    const totalLength = generated.dims.at(-1) as number;
    const decoded = processor.batch_decode(
        generated.slice(null, [inputLength, totalLength]),
        { skip_special_tokens: true },
    ) as Array<string>;

    return decoded[0]?.trim() ?? "";
}

self.addEventListener("message", (event: MessageEvent<OcrWorkerRequest>) => {
    const data = event.data;

    if (data.type === "run") {
        runOcr(data.imageData)
            .then((text) => {
                postMessage({ type: "result", text } satisfies OcrWorkerResponse);
            })
            .catch((error: unknown) => {
                postMessage({ type: "error", message: error instanceof Error ? error.message : String(error) } satisfies OcrWorkerResponse);
            });
    }
});
