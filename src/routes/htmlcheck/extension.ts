export interface HTMLCheckResult {
    Name: string;
    Platform: string;
    Family: string;
    Version: string;
    Support: string;
    NoteNumber: string;
}

export interface HTMLCheckScore {
    Found: number;
    Supported: number;
    Partial: number;
    Unsupported: number;
}

export interface HTMLCheckWarning {
    Slug: string;
    Title: string;
    Description: string;
    URL: string;
    Category: string;
    Tags: Array<string>;
    Keywords: string;
    Results: Array<HTMLCheckResult>;
    NotesByNumber: Record<string, string>;
    Score: HTMLCheckScore;
}

export interface HTMLCheckTotal {
    Tests: number;
    Nodes: number;
    Supported: number;
    Partial: number;
    Unsupported: number;
}

export interface HTMLCheckResponse {
    Warnings: Array<HTMLCheckWarning>;
    Platforms: Record<string, Array<string>>;
    Total: HTMLCheckTotal;
}

interface GoWasm {
    importObject: WebAssembly.Imports;
    run: (instance: WebAssembly.Instance) => Promise<void>;
}

declare global {
    interface Window {
        Go: new () => GoWasm;
        htmlcheck?: (html: string) => { result: HTMLCheckResponse } | { error: string };
    }
}

let wasmLoadPromise: Promise<void> | null = null;

function loadHtmlcheckWasm(): Promise<void> {
    if (!wasmLoadPromise) {
        wasmLoadPromise = (async () => {
            if (typeof window.Go === "undefined") {
                throw new Error("wasm_exec.js has not loaded");
            }

            const go = new window.Go();
            const { instance } = await WebAssembly.instantiateStreaming(fetch("/htmlcheck/htmlcheck.wasm"), go.importObject);

            // go.run() only resolves when the program exits, and main() blocks
            // forever so the exported htmlcheck function stays callable
            go.run(instance).catch((error: unknown) => {
                console.error("htmlcheck wasm exited unexpectedly:", error);
            });

            while (typeof window.htmlcheck !== "function") {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        })();
    }

    return wasmLoadPromise;
}

export async function runHtmlCheck(html: string): Promise<HTMLCheckResponse> {
    await loadHtmlcheckWasm();

    if (typeof window.htmlcheck !== "function") {
        throw new Error("htmlcheck wasm module failed to load");
    }

    const response = window.htmlcheck(html);

    if ("error" in response) {
        throw new Error(response.error);
    }

    return response.result;
}
