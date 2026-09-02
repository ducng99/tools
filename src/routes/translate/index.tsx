import { createFileRoute } from "@tanstack/solid-router";
import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { JSX } from "solid-js";
import type { ChangeEvent } from "../../utils";
import {
    DEFAULT_API_BASE,
    DEFAULT_MAX_TOKENS,
    DEFAULT_MODEL,
    DEFAULT_SOURCE_LANG,
    DEFAULT_TARGET_LANG,
    LANGUAGE_CODES,
    LANGUAGES,
    MAX_TOKENS_LIMIT,
    buildChatRequest,
    clampNumber,
    type InputMode,
    type TranslateOptions,
} from "./-extension";
import InputImage from "./-input_types/InputImage";
import InputText from "./-input_types/InputText";
import Translator from "./-webgpu/Translator";
import type { ProgressInfo } from "@huggingface/transformers";

interface FileProgress {
    file: string;
    progress: number;
}

const STORED_CONFIG_KEY = "translate-webapp-config";

type Backend = "remote" | "webgpu";
type TranslateInputType = "text" | "image";

const DEFAULT_BACKEND: Backend = "remote";
const WEBGPU_MODEL_ID = "onnx-community/translategemma-text-4b-it-ONNX";

export interface TranslateInputProps {
    sourceText: () => string;
    setSourceText: (value: string) => void;
    imageUrl: () => string;
    setImageUrl: (value: string) => void;
    uploadedImageDataUrl: () => string;
    setUploadedImageDataUrl: (value: string) => void;
}

const inputComponents: Record<TranslateInputType, (_: TranslateInputProps) => JSX.Element> = {
    text: InputText,
    image: InputImage,
};

export const Route = createFileRoute("/translate/")({
    head: () => ({
        meta: [
            {
                title: "Translate",
            },
        ],
    }),
    component: ToolComponent,
});

type TranslationStatus
    = | { kind: "idle"; message: string }
        | { kind: "info"; message: string }
        | { kind: "error"; message: string };

const PLACEHOLDER_OUTPUT = "The streamed translation will appear here.";

function ToolComponent() {
    // eslint-disable-next-line no-unassigned-vars
    let copyButtonRef: HTMLButtonElement | undefined;
    let copyTooltip: globalThis.bootstrap.Tooltip | undefined;
    let copyTooltipTimeout = 0;

    const [apiBase, setApiBase] = createSignal(DEFAULT_API_BASE);
    const [model, setModel] = createSignal(DEFAULT_MODEL);
    const [apiKey, setApiKey] = createSignal("");
    const [maxTokens, setMaxTokens] = createSignal(DEFAULT_MAX_TOKENS);
    const [sourceLang, setSourceLang] = createSignal(DEFAULT_SOURCE_LANG);
    const [targetLang, setTargetLang] = createSignal(DEFAULT_TARGET_LANG);
    const [inputMode, setInputMode] = createSignal<InputMode>("text");
    const [backend, setBackend] = createSignal<Backend>(DEFAULT_BACKEND);
    const [sourceText, setSourceText] = createSignal("");
    const [imageUrl, setImageUrl] = createSignal("");
    const [uploadedImageDataUrl, setUploadedImageDataUrl] = createSignal("");
    const [output, setOutput] = createSignal("");
    const [isStreaming, setIsStreaming] = createSignal(false);
    const [webgpuProgressItems, setWebgpuProgressItems] = createSignal<Array<FileProgress>>([]);
    const [webgpuLoading, setWebgpuLoading] = createSignal(false);
    const [status, setStatus] = createSignal<TranslationStatus>({ kind: "idle", message: "Ready." });

    const isWebGpuReady = () => Translator.getInstance().isReady();
    const imageTabDisabled = () => backend() === "webgpu";

    createEffect(() => {
        if (copyButtonRef) {
            copyTooltip = new globalThis.bootstrap.Tooltip(copyButtonRef, {
                title: "Copied!",
                trigger: "manual",
            });
        }
    });

    // Force text input mode when the WebGPU backend is selected; the
    // current on-device model is text-only.
    createEffect(() => {
        if (backend() === "webgpu" && inputMode() !== "text") {
            setInputMode("text");
        }
    });

    onCleanup(() => {
        clearTimeout(copyTooltipTimeout);
        copyTooltip?.dispose();
    });

    // Restore persisted config once on mount (API key is never persisted).
    let didRestore = false;
    createEffect(() => {
        if (didRestore) {
            return;
        }
        didRestore = true;
        const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORED_CONFIG_KEY) : null;
        if (!raw) {
            return;
        }
        try {
            const parsed = JSON.parse(raw) as Partial<TranslateOptions & { inputMode?: InputMode }>;
            if (typeof parsed.apiBase === "string") {
                setApiBase(parsed.apiBase || DEFAULT_API_BASE);
            }
            if (typeof parsed.model === "string") {
                setModel(parsed.model || DEFAULT_MODEL);
            }
            if (typeof parsed.maxTokens === "number") {
                setMaxTokens(clampNumber(parsed.maxTokens, 1, MAX_TOKENS_LIMIT, DEFAULT_MAX_TOKENS));
            }
            if (typeof parsed.sourceLang === "string" && LANGUAGE_CODES.has(parsed.sourceLang)) {
                setSourceLang(parsed.sourceLang);
            }
            if (typeof parsed.targetLang === "string" && LANGUAGE_CODES.has(parsed.targetLang)) {
                setTargetLang(parsed.targetLang);
            }
            if (parsed.inputMode === "text" || parsed.inputMode === "image") {
                setInputMode(parsed.inputMode);
            }
        }
        catch {
            localStorage.removeItem(STORED_CONFIG_KEY);
        }
    });

    let activeController: AbortController | undefined;

    const persistConfig = () => {
        const config: TranslateOptions & { inputMode: InputMode } = {
            apiBase: apiBase(),
            model: model(),
            maxTokens: maxTokens(),
            sourceLang: sourceLang(),
            targetLang: targetLang(),
            inputMode: inputMode(),
        };
        try {
            localStorage.setItem(STORED_CONFIG_KEY, JSON.stringify(config));
        }
        catch {
            // Ignore quota errors; the form still works without persistence.
        }
    };

    const handleApiBaseChange = (event: ChangeEvent<HTMLInputElement>) => {
        setApiBase(event.currentTarget.value);
        persistConfig();
    };

    const handleModelChange = (event: ChangeEvent<HTMLInputElement>) => {
        setModel(event.currentTarget.value);
        persistConfig();
    };

    const handleApiKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
        setApiKey(event.currentTarget.value);
    };

    const handleMaxTokensChange = (event: ChangeEvent<HTMLInputElement>) => {
        const next = clampNumber(Number(event.currentTarget.value), 1, MAX_TOKENS_LIMIT, DEFAULT_MAX_TOKENS);
        setMaxTokens(next);
        event.currentTarget.value = String(next);
        persistConfig();
    };

    const handleSourceLangChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setSourceLang(event.currentTarget.value);
        persistConfig();
    };

    const handleTargetLangChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setTargetLang(event.currentTarget.value);
        persistConfig();
    };

    const handleSwapClick = () => {
        const previousSource = sourceLang();
        setSourceLang(targetLang());
        setTargetLang(previousSource);
        persistConfig();
    };

    const handleBackendChange = (next: Backend) => {
        if (next === backend()) {
            return;
        }
        setBackend(next);
    };

    const ensureWebGpuPipeline = async () => {
        if (isWebGpuReady()) {
            return;
        }
        setWebgpuLoading(true);
        setWebgpuProgressItems([]);
        setStatus({ kind: "info", message: "Loading the on-device model (first run downloads ~3.1 GB)..." });
        try {
            await Translator.getInstance().init((info: ProgressInfo) => {
                if (!("file" in info) || !info.file) {
                    return;
                }
                setWebgpuProgressItems((items) => {
                    if (info.status === "done") {
                        return items.filter(item => item.file !== info.file);
                    }
                    if (info.status !== "progress") {
                        return items;
                    }
                    const file = info.file;
                    const progress = info.progress;
                    const index = items.findIndex(item => item.file === file);
                    if (index === -1) {
                        return [...items, { file, progress }];
                    }
                    const next = [...items];
                    next[index] = { file, progress };
                    return next;
                });
            });
            setStatus({ kind: "info", message: "On-device model is ready." });
        }
        catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setStatus({ kind: "error", message: `Failed to load on-device model: ${message}` });
            throw error;
        }
        finally {
            setWebgpuLoading(false);
        }
    };

    const handleStopClick = () => {
        activeController?.abort();
    };

    const handlePagePaste = (event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) {
            return;
        }
        for (const item of items) {
            if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (!file) {
                    return;
                }
                setInputMode("image");
                persistConfig();
                const reader = new FileReader();
                reader.addEventListener("load", () => {
                    setUploadedImageDataUrl(String(reader.result || ""));
                });
                reader.readAsDataURL(file);
                event.preventDefault();
                return;
            }
        }
    };

    const handleCopyClick = async () => {
        const text = output().trim();
        if (!text || text === PLACEHOLDER_OUTPUT) {
            setStatus({ kind: "error", message: "There is no translation to copy yet." });
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            clearTimeout(copyTooltipTimeout);
            copyTooltip?.show();
            copyTooltipTimeout = window.setTimeout(() => {
                copyTooltip?.hide();
            }, 1000);
            setStatus({ kind: "info", message: "Translation copied." });
        }
        catch {
            setStatus({ kind: "error", message: "Could not copy from this browser context." });
        }
    };

    const handleSubmit = (event: Event & { preventDefault: () => void }) => {
        event.preventDefault();

        const source = sourceLang();
        const target = targetLang();
        if (!LANGUAGE_CODES.has(source) || !LANGUAGE_CODES.has(target)) {
            setStatus({ kind: "error", message: "Choose supported source and target language codes." });
            return;
        }
        if (source === target) {
            setStatus({ kind: "error", message: "Choose different source and target languages." });
            return;
        }

        const mode = inputMode();
        const text = sourceText().trim();
        const trimmedImageUrl = imageUrl().trim();
        const dataUrl = uploadedImageDataUrl();

        if (mode === "text") {
            if (!text) {
                setStatus({ kind: "error", message: "Enter text to translate." });
                return;
            }
        }
        else if (!trimmedImageUrl && !dataUrl) {
            setStatus({ kind: "error", message: "Provide an image URL or choose an image file." });
            return;
        }

        if (backend() === "webgpu") {
            persistConfig();
            void runWebGpuTranslation(text, source, target);
            return;
        }

        const trimmedApiBase = apiBase().trim().replace(/\/+$/, "");
        if (!trimmedApiBase) {
            setStatus({ kind: "error", message: "Enter an API base URL." });
            return;
        }

        persistConfig();

        const body = buildChatRequest(
            {
                apiBase: apiBase(),
                model: model(),
                maxTokens: maxTokens(),
                sourceLang: source,
                targetLang: target,
            },
            {
                mode,
                text,
                imageUrl: trimmedImageUrl,
                uploadedImageDataUrl: dataUrl,
            },
        );

        setOutput("");
        setIsStreaming(true);
        setStatus({ kind: "info", message: "Connecting to the translation server..." });

        activeController = new AbortController();
        streamChatCompletion(trimmedApiBase, body, apiKey().trim(), activeController.signal)
            .then((finalText) => {
                setOutput(finalText);
                setStatus({
                    kind: "info",
                    message: finalText.trim()
                        ? "Translation complete."
                        : "The stream finished without translated text.",
                });
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") {
                    setStatus({ kind: "info", message: "Translation stopped." });
                    return;
                }
                const message = error instanceof Error ? error.message : String(error);
                setStatus({ kind: "error", message });
            })
            .finally(() => {
                activeController = undefined;
                setIsStreaming(false);
            });
    };

    const runWebGpuTranslation = async (text: string, source: string, target: string) => {
        setOutput("");
        setIsStreaming(true);
        try {
            await ensureWebGpuPipeline();
            setStatus({ kind: "info", message: "Translating on-device..." });
            const result = await Translator.getInstance().translate(text, source, target);
            setOutput(result);
            setStatus({
                kind: "info",
                message: result.trim()
                    ? "Translation complete (on-device)."
                    : "The model returned an empty translation.",
            });
        }
        catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setStatus({ kind: "error", message: `On-device translation failed: ${message}` });
        }
        finally {
            setIsStreaming(false);
        }
    };

    return (
        <div class="container mt-5" onPaste={handlePagePaste}>
            <h1>Translate</h1>
            <p class="text-muted">
                Send a TranslateGemma-style chat-completion request to any OpenAI-compatible endpoint. The translation streams back as it is generated.
            </p>

            <form onSubmit={handleSubmit}>
                <div class="mb-3">
                    <ul class="nav nav-tabs" role="tablist" aria-label="Translation backend">
                        <li class="nav-item">
                            <button
                                type="button"
                                role="tab"
                                classList={{ "nav-link": true, "active": backend() === "remote" }}
                                aria-selected={backend() === "remote"}
                                onClick={() => handleBackendChange("remote")}
                            >
                                <i class="bi bi-cloud-arrow-up-fill" />
                                <span class="d-none d-md-inline">&nbsp;Remote API</span>
                            </button>
                        </li>
                        <li class="nav-item">
                            <button
                                type="button"
                                role="tab"
                                classList={{ "nav-link": true, "active": backend() === "webgpu" }}
                                aria-selected={backend() === "webgpu"}
                                onClick={() => handleBackendChange("webgpu")}
                            >
                                <i class="bi bi-cpu" />
                                <span class="d-none d-md-inline">&nbsp;WebGPU (local)</span>
                            </button>
                        </li>
                    </ul>
                </div>

                <Show when={backend() === "remote"}>
                    <div class="row g-3 mb-3">
                        <div class="col-12 col-md-6">
                            <label class="form-label" for="translate-api-base">API base URL</label>
                            <input
                                class="form-control"
                                id="translate-api-base"
                                type="url"
                                autocomplete="url"
                                value={apiBase()}
                                onInput={handleApiBaseChange}
                            />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label" for="translate-model">Model</label>
                            <input
                                class="form-control"
                                id="translate-model"
                                type="text"
                                autocomplete="off"
                                value={model()}
                                onInput={handleModelChange}
                            />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label" for="translate-max-tokens">Max output tokens</label>
                            <input
                                class="form-control"
                                id="translate-max-tokens"
                                type="number"
                                min={1}
                                max={MAX_TOKENS_LIMIT}
                                value={maxTokens()}
                                onInput={handleMaxTokensChange}
                            />
                        </div>
                        <div class="col-12 col-md-6">
                            <label class="form-label" for="translate-api-key">
                                {"API key "}
                                <small class="text-muted">(optional, never persisted)</small>
                            </label>
                            <input
                                class="form-control"
                                id="translate-api-key"
                                type="password"
                                autocomplete="off"
                                placeholder="sk-..."
                                value={apiKey()}
                                onInput={handleApiKeyChange}
                            />
                        </div>
                    </div>
                </Show>

                <Show when={backend() === "webgpu"}>
                    <div class="mb-3 p-3 border rounded">
                        <label class="form-label" for="translate-webgpu-model">Model</label>
                        <input
                            class="form-control"
                            id="translate-webgpu-model"
                            type="text"
                            value={WEBGPU_MODEL_ID}
                            readOnly
                        />
                        <small class="text-muted d-block mt-1">
                            Runs entirely in your browser via
                            {" "}
                            <a href="https://huggingface.co/docs/transformers.js" target="_blank" rel="noopener noreferrer">transformers.js</a>
                            {" "}
                            with the WebGPU device. The first run downloads ~3.1&nbsp;GB and is cached afterwards; press Translate to start.
                        </small>
                        <Show when={webgpuProgressItems().length > 0}>
                            <div class="mt-3" aria-live="polite">
                                <ul class="list-unstyled mb-0">
                                    <For each={webgpuProgressItems()}>
                                        {item => (
                                            <li class="small mb-1">
                                                {item.file}
                                                {" - "}
                                                {item.progress.toFixed(0)}
                                                %
                                                <div class="progress" style={{ height: "4px" }}>
                                                    <div
                                                        class="progress-bar"
                                                        role="progressbar"
                                                        style={{ width: `${item.progress}%` }}
                                                        aria-valuenow={Math.round(item.progress)}
                                                        aria-valuemin={0}
                                                        aria-valuemax={100}
                                                    >
                                                    </div>
                                                </div>
                                            </li>
                                        )}
                                    </For>
                                </ul>
                            </div>
                        </Show>
                        <Show when={!isWebGpuReady() && !webgpuLoading()}>
                            <div class="alert alert-warning mt-3 mb-0 small">
                                The on-device model is text-only. Image translation is only available via the remote API.
                            </div>
                        </Show>
                    </div>
                </Show>

                <div class="row g-3 align-items-end mb-3">
                    <div class="col-12 col-md-5">
                        <label class="form-label" for="translate-source-lang">From</label>
                        <select
                            class="form-select"
                            id="translate-source-lang"
                            value={sourceLang()}
                            onChange={handleSourceLangChange}
                        >
                            <For each={LANGUAGES}>
                                {language => (
                                    <option value={language.code}>{`${language.name} (${language.code})`}</option>
                                )}
                            </For>
                        </select>
                    </div>
                    <div class="col-12 col-md-2 d-grid">
                        <button
                            type="button"
                            class="btn btn-outline-secondary"
                            id="translate-swap-languages"
                            aria-label="Swap source and target languages"
                            onClick={handleSwapClick}
                        >
                            <i class="bi bi-arrow-left-right" />
                            <span class="d-none d-md-inline">&nbsp;Swap</span>
                        </button>
                    </div>
                    <div class="col-12 col-md-5">
                        <label class="form-label" for="translate-target-lang">To</label>
                        <select
                            class="form-select"
                            id="translate-target-lang"
                            value={targetLang()}
                            onChange={handleTargetLangChange}
                        >
                            <For each={LANGUAGES}>
                                {language => (
                                    <option value={language.code}>{`${language.name} (${language.code})`}</option>
                                )}
                            </For>
                        </select>
                    </div>
                </div>

                <div class="mb-3">
                    <ul class="nav nav-tabs" role="tablist" aria-label="Input type">
                        <li class="nav-item">
                            <button
                                type="button"
                                role="tab"
                                classList={{ "nav-link": true, "active": inputMode() === "text" }}
                                aria-selected={inputMode() === "text"}
                                onClick={() => setInputMode("text")}
                            >
                                <i class="bi bi-text-paragraph" />
                                <span class="d-none d-md-inline">&nbsp;Text</span>
                            </button>
                        </li>
                        <li class="nav-item">
                            <button
                                type="button"
                                role="tab"
                                classList={{ "nav-link": true, "active": inputMode() === "image", "disabled": imageTabDisabled() }}
                                aria-selected={inputMode() === "image"}
                                aria-disabled={imageTabDisabled()}
                                disabled={imageTabDisabled()}
                                title={imageTabDisabled() ? "The on-device model is text-only." : undefined}
                                onClick={() => {
                                    if (imageTabDisabled()) {
                                        return;
                                    }
                                    setInputMode("image");
                                }}
                            >
                                <i class="bi bi-image" />
                                <span class="d-none d-md-inline">&nbsp;Image</span>
                            </button>
                        </li>
                    </ul>
                    <Show when={imageTabDisabled()}>
                        <small class="text-muted d-block mt-1">
                            Image input is disabled while the on-device (WebGPU) backend is selected; switch to Remote API to translate images.
                        </small>
                    </Show>
                    <div class="tab-content my-3" id="translate-input-container">
                        <Dynamic
                            component={inputComponents[inputMode()]}
                            sourceText={sourceText}
                            setSourceText={setSourceText}
                            imageUrl={imageUrl}
                            setImageUrl={setImageUrl}
                            uploadedImageDataUrl={uploadedImageDataUrl}
                            setUploadedImageDataUrl={setUploadedImageDataUrl}
                        />
                    </div>
                </div>

                <div class="mb-3 d-flex flex-wrap gap-2">
                    <button
                        type="submit"
                        class="btn btn-primary"
                        id="translate-submit"
                        disabled={isStreaming() || (backend() === "webgpu" && webgpuLoading())}
                    >
                        <Show
                            when={isStreaming() || (backend() === "webgpu" && webgpuLoading())}
                            fallback={backend() === "webgpu" && !isWebGpuReady() ? "Load model & translate" : "Translate"}
                        >
                            <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            {backend() === "webgpu" ? "Translating..." : "Streaming..."}
                        </Show>
                    </button>
                    <Show when={backend() === "remote"}>
                        <button
                            type="button"
                            class="btn btn-secondary"
                            id="translate-stop"
                            disabled={!isStreaming()}
                            onClick={handleStopClick}
                        >
                            <i class="bi bi-stop-fill" />
                            <span class="d-none d-md-inline">&nbsp;Stop</span>
                        </button>
                    </Show>
                </div>
            </form>

            <Show when={status().kind === "error"}>
                <div class="alert alert-danger" role="alert">{status().message}</div>
            </Show>
            <Show when={status().kind !== "error" && status().message !== "Ready."}>
                <div class="text-muted small mb-3">{status().message}</div>
            </Show>

            <div class="mb-2 d-flex justify-content-between align-items-center">
                <label class="form-label mb-0" for="translate-output">Translation</label>
                <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    id="translate-copy-output"
                    onClick={handleCopyClick}
                    ref={copyButtonRef}
                >
                    <i class="bi bi-clipboard-fill" />
                    <span class="d-none d-md-inline">&nbsp;Copy</span>
                </button>
            </div>
            <textarea
                class="form-control"
                id="translate-output"
                rows={10}
                readOnly
                value={output() || PLACEHOLDER_OUTPUT}
            />

        </div>
    );
}

async function streamChatCompletion(
    apiBase: string,
    body: ReturnType<typeof buildChatRequest>,
    apiKey: string,
    signal: AbortSignal,
): Promise<string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${apiBase}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal,
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`API request failed (${response.status}): ${detail || response.statusText}`);
    }

    if (!response.body) {
        throw new Error("This browser did not expose a response stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
            result += extractTextFromSseBlock(part);
        }
    }

    if (buffer.trim()) {
        result += extractTextFromSseBlock(buffer);
    }

    return result;
}

function extractTextFromSseBlock(block: string): string {
    const lines = block.split("\n");
    const data = lines
        .filter(line => line.startsWith("data:"))
        .map(line => line.slice(5).trim())
        .join("\n");

    if (!data || data === "[DONE]") {
        return "";
    }

    let chunk: unknown;
    try {
        chunk = JSON.parse(data);
    }
    catch {
        return "";
    }

    if (!chunk || typeof chunk !== "object") {
        return "";
    }

    const candidate = chunk as { choices?: Array<{ delta?: { content?: unknown }; message?: { content?: unknown }; text?: unknown }> };
    const choice = candidate.choices?.[0];
    if (!choice) {
        return "";
    }

    const text = choice.delta?.content ?? choice.message?.content ?? choice.text ?? "";
    if (Array.isArray(text)) {
        return text.map(part => (typeof part === "object" && part && "text" in part ? String(part.text ?? "") : "")).join("");
    }
    return typeof text === "string" ? text : "";
}
