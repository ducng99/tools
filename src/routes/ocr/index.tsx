import { For, Show, createSignal, onCleanup } from "solid-js";
import type { OcrFeatures, OcrResult, OcrWorkerRequest, OcrWorkerResponse } from "../../workers/ocr";
import OcrWorker from "../../workers/ocr?worker";
import type { ChangeEvent } from "../../utils";

interface FileProgress {
    file: string;
    /** 0–100, or null while indeterminate (no Content-Length); 100 = done. */
    progress: number | null;
}

type OcrState = "idle" | "loading" | "done" | "error";
type OutputView = "text" | "markdown";

const DEFAULT_FEATURES: OcrFeatures = { cjk: true, lm: true, math: false, tableHeads: false, furniture: false };

const FEATURE_OPTIONS: Array<{ key: keyof OcrFeatures; label: string; hint?: string }> = [
    { key: "cjk", label: "Recognise non-Latin scripts (CJK, Arabic/Hebrew, others)", hint: "~20 MB extra models" },
    { key: "lm", label: "Improve accuracy with language models", hint: "up to ~45 MB extra models" },
    { key: "math", label: "Read math as LaTeX", hint: "~20 MB extra models" },
    { key: "tableHeads", label: "Build markdown tables from the model's table heads" },
    { key: "furniture", label: "Keep page headers and footers in the markdown" },
];

export default function OcrPage() {
    document.title = "OCR";

    const [state, setState] = createSignal<OcrState>("idle");
    const [statusMessage, setStatusMessage] = createSignal("");
    const [progressItems, setProgressItems] = createSignal<Array<FileProgress>>([]);
    const [result, setResult] = createSignal<OcrResult | null>(null);
    const [view, setView] = createSignal<OutputView>("markdown");
    const [copied, setCopied] = createSignal(false);
    const [errorMessage, setErrorMessage] = createSignal("");
    const [hasImage, setHasImage] = createSignal(false);
    const [features, setFeatures] = createSignal<OcrFeatures>({ ...DEFAULT_FEATURES });

    // Markdown is null when the layout model didn't run; fall back to text.
    const hasMarkdown = () => result()?.markdown != null;
    const activeView = (): OutputView => (view() === "markdown" && hasMarkdown() ? "markdown" : "text");
    const outputText = () => {
        const current = result();
        if (!current) {
            return "";
        }
        return activeView() === "markdown" ? (current.markdown ?? "") : current.text;
    };

    let copiedTimeout: number | undefined;

    // eslint-disable-next-line no-unassigned-vars
    let ocrFileUploadRef: HTMLInputElement | undefined;
    // eslint-disable-next-line no-unassigned-vars
    let ocrImageDisplayRef: HTMLImageElement | undefined;

    let worker: Worker | undefined;
    let imageFile: File | undefined;

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
                    setResult(data.result);
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
        clearTimeout(copiedTimeout);
        if (ocrImageDisplayRef?.src.startsWith("blob:")) {
            window.URL.revokeObjectURL(ocrImageDisplayRef.src);
        }
    });

    function setImageFile(file: File) {
        if (ocrImageDisplayRef) {
            if (ocrImageDisplayRef.src.startsWith("blob:")) {
                window.URL.revokeObjectURL(ocrImageDisplayRef.src);
            }
            imageFile = file;
            ocrImageDisplayRef.src = window.URL.createObjectURL(file);
            setHasImage(true);
            setResult(null);
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

    function handleFeatureToggle(key: keyof OcrFeatures) {
        return (event: ChangeEvent<HTMLInputElement>) => {
            const checked = event.currentTarget.checked;
            setFeatures(prev => ({ ...prev, [key]: checked }));
        };
    }

    async function handleCopy() {
        const text = outputText();
        if (!text) {
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            clearTimeout(copiedTimeout);
            copiedTimeout = window.setTimeout(() => setCopied(false), 1500);
        }
        catch {
            setErrorMessage("Could not copy to the clipboard in this browser context.");
        }
    }

    function resultSummary(current: OcrResult) {
        const parts = [`${current.lineCount} line${current.lineCount === 1 ? "" : "s"}`];
        if (current.rotation) {
            parts.push(`rotated ${current.rotation}°`);
        }
        if (current.skew) {
            parts.push(`deskewed ${current.skew}°`);
        }
        if (current.vertical) {
            parts.push("vertical text");
        }
        if (current.pictureCount) {
            parts.push(`${current.pictureCount} picture${current.pictureCount === 1 ? "" : "s"}`);
        }
        parts.push(`${(current.runMs / 1000).toFixed(1)} s`);
        return parts.join(" · ");
    }

    function handleRunOcr() {
        if (!imageFile) {
            setErrorMessage("No image selected!");
            setState("error");
            return;
        }

        const requestFeatures = features();

        setErrorMessage("");
        setResult(null);
        setProgressItems([]);
        setState("loading");
        setStatusMessage("Preparing…");

        const request = { type: "run", image: imageFile, features: requestFeatures } satisfies OcrWorkerRequest;
        getWorker().postMessage(request);
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

            <div class="mt-3">
                <div class="form-label mb-0">Features:</div>
                <For each={FEATURE_OPTIONS}>
                    {option => (
                        <div class="form-check">
                            <input
                                class="form-check-input"
                                type="checkbox"
                                id={`ocr-feature-${option.key}`}
                                checked={features()[option.key]}
                                disabled={state() === "loading"}
                                onChange={handleFeatureToggle(option.key)}
                            />
                            <label class="form-check-label" for={`ocr-feature-${option.key}`}>
                                {option.label}
                                <Show when={option.hint}>
                                    {" "}
                                    <small class="text-muted">{`(${option.hint})`}</small>
                                </Show>
                            </label>
                        </div>
                    )}
                </For>
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
                <div class="d-flex align-items-end justify-content-between flex-wrap gap-2 mb-2">
                    <ul class="nav nav-tabs flex-grow-1" role="tablist" aria-label="Output format">
                        <li class="nav-item">
                            <button
                                type="button"
                                role="tab"
                                classList={{ "nav-link": true, "active": activeView() === "markdown" }}
                                aria-selected={activeView() === "markdown"}
                                disabled={result() !== null && !hasMarkdown()}
                                title={result() !== null && !hasMarkdown() ? "No layout information for this image." : undefined}
                                onClick={() => setView("markdown")}
                            >
                                <i class="bi bi-markdown" />
                                &nbsp;Markdown
                            </button>
                        </li>
                        <li class="nav-item">
                            <button
                                type="button"
                                role="tab"
                                classList={{ "nav-link": true, "active": activeView() === "text" }}
                                aria-selected={activeView() === "text"}
                                onClick={() => setView("text")}
                            >
                                <i class="bi bi-text-paragraph" />
                                &nbsp;Plain text
                            </button>
                        </li>
                    </ul>
                    <button type="button" class="btn btn-outline-secondary btn-sm" disabled={!outputText()} onClick={() => void handleCopy()}>
                        <i classList={{ "bi": true, "bi-clipboard": !copied(), "bi-clipboard-check": copied() }} />
                        &nbsp;
                        {copied() ? "Copied" : "Copy"}
                    </button>
                </div>
                <Show when={result()}>
                    {current => <div class="small text-muted mb-1">{resultSummary(current())}</div>}
                </Show>
                <textarea class="form-control font-monospace" id="output-textbox" aria-label="OCR output" rows={12} readOnly value={outputText()} />
            </div>

            <div class="mt-3 text-center">
                <img class="max-vh-30 maxw-100" src="" alt="<Image will be displayed here>" id="ocr-image" ref={ocrImageDisplayRef} />
            </div>
        </div>
    );
}
