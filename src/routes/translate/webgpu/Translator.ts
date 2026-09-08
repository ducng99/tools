import TranslateWorker from "../../../workers/translate?worker";
import type { TranslateWorkerRequest, TranslateWorkerResponse } from "../../../workers/translate";
import type { ProgressInfo } from "@huggingface/transformers";

type ProgressFn = (info: ProgressInfo) => void;

class Translator {
    private static instance: Translator | null = null;
    private worker: Worker | null = null;
    private ready = false;
    private readyPromise: Promise<void> | null = null;
    private onProgress: ProgressFn | undefined;
    private pendingTranslate: ((text: string) => void) | null = null;
    private pendingReject: ((error: Error) => void) | null = null;

    private constructor() {}

    public static getInstance(): Translator {
        if (!Translator.instance) {
            Translator.instance = new Translator();
        }
        return Translator.instance;
    }

    public isReady(): boolean {
        return this.ready;
    }

    private getWorker(): Worker {
        if (!this.worker) {
            this.worker = new TranslateWorker();
            this.worker.addEventListener("message", (event: MessageEvent<TranslateWorkerResponse>) => {
                const data = event.data;

                if (data.type === "progress") {
                    this.onProgress?.(data.progress);
                }
                else if (data.type === "ready") {
                    this.ready = true;
                }
                else if (data.type === "result") {
                    this.pendingTranslate?.(data.text);
                    this.clearPending();
                }
                else if (data.type === "error") {
                    this.pendingReject?.(new Error(data.message));
                    this.clearPending();
                }
            });
        }

        return this.worker;
    }

    private clearPending() {
        this.pendingTranslate = null;
        this.pendingReject = null;
    }

    public async init(onProgress?: ProgressFn): Promise<void> {
        if (this.ready) {
            return;
        }
        this.onProgress = onProgress;

        if (!this.readyPromise) {
            this.readyPromise = new Promise<void>((resolve, reject) => {
                const worker = this.getWorker();
                const onMessage = (event: MessageEvent<TranslateWorkerResponse>) => {
                    const data = event.data;
                    if (data.type === "ready") {
                        worker.removeEventListener("message", onMessage);
                        resolve();
                    }
                    else if (data.type === "error") {
                        worker.removeEventListener("message", onMessage);
                        // Allow a retry on the next init() call.
                        this.readyPromise = null;
                        reject(new Error(data.message));
                    }
                };
                worker.addEventListener("message", onMessage);
                worker.postMessage({ type: "init" } satisfies TranslateWorkerRequest);
            });
        }

        return this.readyPromise;
    }

    public async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
        await this.init();

        return new Promise<string>((resolve, reject) => {
            this.pendingTranslate = resolve;
            this.pendingReject = reject;
            this.getWorker().postMessage({ type: "translate", text, sourceLang, targetLang } satisfies TranslateWorkerRequest);
        });
    }
}

export default Translator;
