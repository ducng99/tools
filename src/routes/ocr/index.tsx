import { Show, createSignal, onCleanup } from "solid-js";
import { clampWidthHeight } from "../../utils";
import type { OcrWorkerRequest, OcrWorkerResponse } from "../../workers/ocr";
import OcrWorker from "../../workers/ocr?worker";
import type { ChangeEvent } from "../../utils";

interface FileProgress {
    file: string;
    /** 0–100, or null while indeterminate (no Content-Length); 100 = done. */
    progress: number | null;
}

type OcrState = "idle" | "loading" | "done" | "error";

export default function OcrPage() {
    document.title = "OCR";

    const [state, setState] = createSignal<OcrState>("idle");
    const [statusMessage, setStatusMessage] = createSignal("");
    const [progressItems, setProgressItems] = createSignal<Array<FileProgress>>([]);
    const [outputText, setOutputText] = createSignal("");
    const [lineCount, setLineCount] = createSignal<number | null>(null);
    const [errorMessage, setErrorMessage] = createSignal("");
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
            worker = new OcrWorker();
            worker.addEventListener("message", (event: MessageEvent<OcrWorkerResponse>) => {
                const data = event.data;

                if (data.type === "status") {
                    setStatusMessage(data.message);
                }
                else if (data.type === "progress") {
                    const progress = data.progress;
                    setProgressItems((items) => {
                        if (progress.progress !== null && progress.progress >= 100) {
                            return items.filter(item => item.file !== progress.file);
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
                    setLineCount(data.lineCount);
                    setStatusMessage("");
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
            setLineCount(null);
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

    function getImageGray(): OcrWorkerRequest["gray"] | null {
        const imageElement = ocrImageDisplayRef;
        if (!imageElement || !imageElement.naturalWidth) {
            return null;
        }

        const [width, height] = clampWidthHeight(imageElement.naturalWidth, imageElement.naturalHeight, 2048, 2048);

        const context = helperCanvasRef?.getContext("2d", { alpha: false, willReadFrequently: true });
        if (!helperCanvasRef || !context || width <= 0 || height <= 0) {
            return null;
        }

        helperCanvasRef.width = width;
        helperCanvasRef.height = height;
        context.fillStyle = "white";
        context.fillRect(0, 0, width, height);
        context.drawImage(imageElement, 0, 0, width, height);
        const imageData = context.getImageData(0, 0, width, height);

        // Rec.601 luma, matching the package's readGray preprocessing.
        const gray = new Uint8Array(width * height);
        for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
            gray[i] = Math.round(0.299 * imageData.data[p] + 0.587 * imageData.data[p + 1] + 0.114 * imageData.data[p + 2]);
        }
        return { data: gray, width, height };
    }

    function handleRunOcr() {
        const gray = getImageGray();
        if (!gray) {
            setErrorMessage("Cannot read image data!");
            setState("error");
            return;
        }

        setErrorMessage("");
        setOutputText("");
        setLineCount(null);
        setProgressItems([]);
        setState("loading");
        setStatusMessage("Preparing…");

        const request = { type: "run", gray } satisfies OcrWorkerRequest;
        getWorker().postMessage(request, [gray.data.buffer]);
    }

    return (
        <div class="container mt-5" onPaste={handlePaste} onDrop={handleFileDrop} onDragOver={(e) => { e.preventDefault(); }}>
            <h1>OCR</h1>
            <p class="text-muted">
                {"Extract text from images entirely in your browser using "}
                <a href="https://huggingface.co/datalab-to/indra-ocr" target="_blank" rel="noopener noreferrer">indra-ocr</a>
                {" via "}
                <a href="https://github.com/ducng99/indra-ocr-js" target="_blank" rel="noopener noreferrer">indra-ocr-js</a>
            </p>

            <div>
                <label class="form-label" for="ocr-image-file-upload">Select an image or drag it here:</label>
                <input type="file" accept="image/*" class="form-control" id="ocr-image-file-upload" onChange={handleFileChange} ref={ocrFileUploadRef} />
            </div>
            <div class="mt-2">
                <small>Or simply paste the image on this page!</small>
            </div>

            <button
                type="button"
                class="btn btn-primary mt-3"
                id="trigger-button"
                disabled={!hasImage() || state() === "loading"}
                onClick={handleRunOcr}
            >
                <Show when={state() === "loading"} fallback="Run OCR 🔎">
                    <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Working…
                </Show>
            </button>

            <Show when={state() === "loading"}>
                <div class="mt-3">
                    <div class="text-muted">{statusMessage()}</div>
                    <Show when={progressItems().length > 0}>
                        <ul class="list-unstyled mt-2">
                            {progressItems().map(item => (
                                <li class="small">
                                    {item.file}
                                    {" - "}
                                    {item.progress === null ? "downloading…" : item.progress.toFixed(0)}
                                    {item.progress !== null && "%"}
                                    <div class="progress" style={{ height: "4px" }}>
                                        <div
                                            class="progress-bar"
                                            classList={{ "progress-bar-striped progress-bar-animated": item.progress === null }}
                                            style={{ width: `${item.progress ?? 100}%` }}
                                        >
                                        </div>
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
                <label class="form-label" for="output-textbox">
                    Output
                    <Show when={lineCount() !== null}>
                        {` (${lineCount()} line${lineCount() === 1 ? "" : "s"})`}
                    </Show>
                    :
                </label>
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
