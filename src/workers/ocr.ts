import { AutoModelForImageTextToText, AutoProcessor, RawImage } from "@huggingface/transformers";
import type { PreTrainedModel, Processor, ProgressInfo, Tensor } from "@huggingface/transformers";

const MODEL_ID = "onnx-community/LightOnOCR-2-1B-ONNX";

export interface OcrWorkerRequest {
    type: "run";
    prompt: string;
    imageData: ImageData;
}

export type OcrWorkerResponse
    = | { type: "progress"; progress: ProgressInfo }
        | { type: "status"; message: string }
        | { type: "result"; text: string }
        | { type: "error"; message: string };

let modelPromise: Promise<{ processor: Processor; model: PreTrainedModel }> | null = null;

function loadModel() {
    if (!modelPromise) {
        modelPromise = (async () => {
            postMessage({ type: "status", message: "Loading OCR model…" } satisfies OcrWorkerResponse);

            const progress_callback = (progress: ProgressInfo) => {
                postMessage({ type: "progress", progress } satisfies OcrWorkerResponse);
            };

            const [processor, model] = await Promise.all([
                AutoProcessor.from_pretrained(MODEL_ID, { progress_callback }),
                AutoModelForImageTextToText.from_pretrained(MODEL_ID, {
                    dtype: {
                        embed_tokens: "fp16",
                        vision_encoder: "q4",
                        decoder_model_merged: "q4",
                    },
                    progress_callback,
                    device: typeof navigator !== "undefined" && "gpu" in navigator ? "webgpu" : "auto",
                }),
            ]);

            return { processor, model };
        })();
    }

    return modelPromise;
}

async function runOcr(prompt: string, imageData: ImageData) {
    const { processor, model } = await loadModel();

    postMessage({ type: "status", message: "Running inference…" } satisfies OcrWorkerResponse);

    const image = new RawImage(imageData.data, imageData.width, imageData.height, 4);

    const content: Array<{ type: string; text?: string }> = [{ type: "image" }];
    if (prompt.trim()) {
        content.push({ type: "text", text: prompt });
    }

    const messages = [
        { role: "user", content },
    ] as Parameters<Processor["apply_chat_template"]>[0];

    const text = processor.apply_chat_template(messages, { add_generation_prompt: true, tokenize: false }) as string;
    const inputs = await processor(image, text) as Record<string, Tensor> & { input_ids: Tensor };

    const generated = await model.generate({
        ...inputs,
        max_new_tokens: 1024,
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
        runOcr(data.prompt, data.imageData)
            .then((text) => {
                postMessage({ type: "result", text } satisfies OcrWorkerResponse);
            })
            .catch((error: unknown) => {
                postMessage({ type: "error", message: error instanceof Error ? error.message : String(error) } satisfies OcrWorkerResponse);
            });
    }
});
