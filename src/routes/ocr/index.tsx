import { createFileRoute } from "@tanstack/solid-router";
import { Show, createSignal, onCleanup } from "solid-js";
import { clampWidthHeight } from "../../utils";
import type { OcrWorkerRequest, OcrWorkerResponse } from "./-worker";
import type { ChangeEvent } from "../../utils";

interface FileProgress {
    file: string;
    progress: number;
}

export const Route = createFileRoute("/ocr/")({
    head: () => ({
        meta: [
            {
                title: "OCR",
            },
        ],
    }),
    component: ToolComponent,
});

type OcrState = "idle" | "loading" | "processing" | "done" | "error";

function ToolComponent() {
    const [state, setState] = createSignal<OcrState>("idle");
    const [statusMessage, setStatusMessage] = createSignal("");
    const [progressItems, setProgressItems] = createSignal<Array<FileProgress>>([]);
    const [outputText, setOutputText] = createSignal("");
    const [errorMessage, setErrorMessage] = createSignal("");
    const [prompt, setPrompt] = createSignal("");
    const [hasImage, setHasImage] = createSignal(false);

    // eslint-disable-next-line no-unassigned-vars
    let ocrFileUploadRef: HTMLInputElement | undefined;
    // eslint-disable-next-line no-unassigned-vars
    let ocrImageDisplayRef: HTMLImageElement | undefined;
    // eslint-disable-next-line no-unassigned-vars
    let helperCanvasRef: HTMLCanvasElement | undefined;

    let worker: Worker | undefined;

    function getWorker() {
        if (!worker) {
            worker = new Worker(new URL("./-worker.ts", import.meta.url), { type: "module" });
            worker.addEventListener("message", (event: MessageEvent<OcrWorkerResponse>) => {
                const data = event.data;

                if (data.type === "status") {
                    setStatusMessage(data.message);
                }
                else if (data.type === "progress") {
                    const progress = data.progress;
                    setProgressItems((items) => {
                        if (progress.status === "done") {
                            return items.filter(item => item.file !== progress.file);
                        }

                        if (progress.status !== "progress") {
                            return items;
                        }

                        const index = items.findIndex(item => item.file === progress.file);
                        if (index === -1) {
                            return [...items, progress];
                        }
                        const next = [...items];
                        next[index] = progress;
                        return next;
                    });
                }
                else if (data.type === "result") {
                    setOutputText(data.text);
                    setState("done");
                }
                else if (data.type === "error") {
                    setErrorMessage(data.message);
                    setState("error");
                }
            });
        }

        return worker;
    }

    onCleanup(() => {
        worker?.terminate();
    });

    function setImageFile(file: File) {
        if (ocrImageDisplayRef) {
            ocrImageDisplayRef.src = window.URL.createObjectURL(file);
            setHasImage(true);
            setOutputText("");
            setErrorMessage("");
            setState("idle");
        }
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.currentTarget.files && event.currentTarget.files.length > 0) {
            setImageFile(event.currentTarget.files[0]);
        }
    }

    function handlePaste(event: ClipboardEvent) {
        const items = event.clipboardData?.items;
        if (items) {
            for (const item of items) {
                if (item.type.startsWith("image")) {
                    const file = item.getAsFile();
                    if (file) {
                        if (ocrFileUploadRef) {
                            ocrFileUploadRef.value = "";
                        }
                        setImageFile(file);
                    }
                }
            }
        }
    }

    function handleFileDrop(event: DragEvent) {
        event.preventDefault();

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            setImageFile(files[0]);
        }
    }

    function getImageData(): ImageData | null {
        const imageElement = ocrImageDisplayRef;
        if (!imageElement || !imageElement.naturalWidth) {
            return null;
        }

        const [width, height] = clampWidthHeight(imageElement.naturalWidth, imageElement.naturalHeight, 1024, 1024);

        const context = helperCanvasRef?.getContext("2d", { alpha: false, willReadFrequently: true });
        if (!helperCanvasRef || !context || width <= 0 || height <= 0) {
            return null;
        }

        helperCanvasRef.width = width;
        helperCanvasRef.height = height;
        context.fillStyle = "white";
        context.fillRect(0, 0, width, height);
        context.drawImage(imageElement, 0, 0, width, height);
        return context.getImageData(0, 0, width, height);
    }

    function handleRunOcr() {
        const imageData = getImageData();
        if (!imageData) {
            setErrorMessage("Cannot read image data!");
            setState("error");
            return;
        }

        setErrorMessage("");
        setOutputText("");
        setProgressItems([]);
        setState("loading");
        setStatusMessage("Preparing…");

        getWorker().postMessage({ type: "run", prompt: prompt(), imageData } satisfies OcrWorkerRequest);
    }

    return (
        <div class="container mt-5" onPaste={handlePaste} onDrop={handleFileDrop} onDragOver={(e) => { e.preventDefault(); }}>
            <h1>OCR</h1>
            <p class="text-muted">
                {"Extract text from images entirely in your browser using "}
                <a href="https://huggingface.co/onnx-community/LightOnOCR-2-1B-ONNX" target="_blank" rel="noopener noreferrer">LightOnOCR</a>
                {" via "}
                <a href="https://huggingface.co/docs/transformers.js" target="_blank" rel="noopener noreferrer">transformers.js</a>
                {" (WebGPU). The model is downloaded and cached on first use, no data leaves your device."}
            </p>

            <div>
                <label class="form-label" for="ocr-image-file-upload">Select an image or drag it here:</label>
                <input type="file" accept="image/*" class="form-control" id="ocr-image-file-upload" onChange={handleFileChange} ref={ocrFileUploadRef} />
            </div>
            <div class="mt-2">
                <small>Or simply paste the image on this page!</small>
            </div>

            <div class="mt-3">
                <label class="form-label" for="ocr-prompt-input">Instruction (optional):</label>
                <input
                    type="text"
                    class="form-control"
                    id="ocr-prompt-input"
                    placeholder="Leave empty to extract all text, or e.g. Extract the table as markdown"
                    value={prompt()}
                    onInput={(e) => { setPrompt(e.currentTarget.value); }}
                />
            </div>

            <button
                type="button"
                class="btn btn-primary mt-3"
                id="trigger-button"
                disabled={!hasImage() || state() === "loading" || state() === "processing"}
                onClick={handleRunOcr}
            >
                <Show when={state() === "loading" || state() === "processing"} fallback="Run OCR 🔎">
                    <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Working…
                </Show>
            </button>

            <Show when={state() === "loading" || state() === "processing"}>
                <div class="mt-3">
                    <div class="text-muted">{statusMessage()}</div>
                    <Show when={progressItems().length > 0}>
                        <ul class="list-unstyled mt-2">
                            {progressItems().map(item => (
                                <li class="small">
                                    {item.file}
                                    {" - "}
                                    {item.progress.toFixed(0)}
                                    %
                                    <div class="progress" style={{ height: "4px" }}>
                                        <div class="progress-bar" style={{ width: `${item.progress}%` }}></div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Show>
                </div>
            </Show>

            <Show when={errorMessage()}>
                <div class="mt-3 alert alert-danger">{errorMessage()}</div>
            </Show>

            <div class="mt-3">
                <label class="form-label" for="output-textbox">Output:</label>
                <textarea class="form-control" id="output-textbox" rows={10} readOnly value={outputText()} />
            </div>

            <div class="mt-3 text-center">
                <img class="max-vh-30 maxw-100" src="" alt="<Image will be displayed here>" id="ocr-image" ref={ocrImageDisplayRef} />
                <div class="d-none">
                    <canvas ref={helperCanvasRef}></canvas>
                </div>
            </div>
        </div>
    );
}
