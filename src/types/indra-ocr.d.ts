/**
 * Ambient types for @ducng99/indra-ocr-js (published as untyped .mjs).
 * The shapes mirror the package README and src/pipeline.mjs.
 */

declare module "@ducng99/indra-ocr-js/browser" {
    /** Grayscale image: one Uint8 luma value per pixel, row-major. */
    export interface GrayImage {
        data: Uint8Array;
        width: number;
        height: number;
    }

    export interface OcrLine {
        /** [x0, y0, x1, y1] in page pixels. */
        box: Array<number>;
        text: string;
        conf: number;
    }

    export interface OcrBlock {
        /** Layout class, e.g. "Text", "Section-Header", "Table", "Picture". */
        label: string;
        /** [x0, y0, x1, y1] in page pixels. */
        bbox: Array<number>;
        text: string;
    }

    export interface OcrPage {
        /** Lines in reading order. */
        lines: Array<OcrLine>;
        source: "ocr";
        /** Detected quarter-turn in degrees (0 / 90 / 180 / 270); 0 for vertical pages. */
        rotation: number;
        /** Deskew angle applied, in degrees (0 when no deskew). */
        skew: number;
        /** True for a vertical (top-to-bottom CJK) page. */
        vertical: boolean;
        /** Assembled markdown (headings, tables, etc.); null without the layout heads. */
        markdown: string | null;
        /** Layout blocks in reading order. */
        blocks: Array<OcrBlock>;
        /** Picture regions [x0, y0, x1, y1] in page pixels. */
        pictures: Array<Array<number>>;
        /** All lines joined by newlines. */
        text: string;
        /** Pipeline note, e.g. "order=model" or "order=xycut". */
        note: string;
        /** Per-phase timings (ms). */
        timings: Record<string, number>;
    }

    export interface LoadIndraOptions {
        /** Skip the script classifier and the group recognizers (Latin-only output). */
        cjk?: boolean;
        /** Skip the n-gram language models (lm*.npz). */
        lm?: boolean;
        /** Skip order.onnx and fall back to geometric reading order. */
        order?: boolean;
        /** Skip orient.onnx and disable rotation detection. */
        orient?: boolean;
        /** Toggle the second, higher-resolution detection pass. */
        adaptive?: boolean;
        /** Load the math models (mathcls/enc/dec .onnx + math_meta.json). */
        math?: boolean;
        /** Load rec.int8.onnx instead of rec.onnx. */
        recInt8?: boolean;
        /** Build tables from the order model's table heads instead of from geometry. */
        tableHeads?: boolean;
        /** Keep page headers and footers in the markdown. */
        furniture?: boolean;
        /** Wasm worker threads (default 4; needs cross-origin isolation, else 1). */
        threads?: number;
        /** onnxruntime-web `env.wasm.wasmPaths` override. */
        wasmPaths?: string;
        /** Per-file download progress: streamed chunks, then one `done: true`. */
        progress?: (info: DownloadProgress) => void;
    }

    export interface DownloadProgress {
        file: string;
        loaded: number;
        /** null when the response has no Content-Length. */
        total: number | null;
        /** true on the final event for a file. */
        done?: boolean;
    }

    /** Backend contract for IndraOCR.create: ONNX sessions and Tensor, injected. */
    export interface IndraBackend {
        Tensor: abstract new (...args: Array<never>) => unknown;
        meta: () => Promise<unknown>;
        /** Optional JSON loader (used by the math models). */
        json?: (name: string) => Promise<unknown>;
        /** Optional raw-bytes loader (used by the language models). */
        bytes?: (name: string) => Promise<Uint8Array>;
        session: (name: string) => Promise<{
            run: (inputs: never) => Promise<Record<string, unknown>>;
            inputNames?: ReadonlyArray<string>;
            outputNames?: ReadonlyArray<string>;
        }>;
    }

    export class IndraOCR {
        /** "wasm" for the browser entry. */
        device: string;

        static create(backend: IndraBackend, opts?: LoadIndraOptions): Promise<IndraOCR>;

        /** OCR of a grayscale page: {lines in reading order, rotation, text}. */
        run(gray: GrayImage, turn?: boolean): Promise<OcrPage>;

        /** Line boxes (x0, y0, x1, y1, score) of a page, in page pixels. */
        detect(gray: GrayImage): Promise<Array<Array<number>>>;

        /** Text-line boxes and picture boxes [x0, y0, x1, y1]. */
        detectAll(gray: GrayImage): Promise<[Array<Array<number>>, Array<Array<number>>]>;

        /** Per line: {text, conf, toks}. */
        recognize(gray: GrayImage, boxes: Array<Array<number>>, batch?: number, vertical?: boolean): Promise<Array<{ text: string; conf: number }>>;

        /** Quarter turns (counter-clockwise) the page content is turned by. */
        orientation(gray: GrayImage): Promise<number>;
    }

    /**
     * Load the pipeline, fetching det/rec/order/script/rec_cjk/orient .onnx
     * and meta.json from `base` (URL, local directory in Node, or HF repo
     * shorthand "user/repo[@rev]"; the revision defaults to the release the
     * package was exported against, currently v1.1.0).
     */
    export function loadIndra(base: string, opts?: LoadIndraOptions): Promise<IndraOCR>;

    export interface ReadGrayOptions {
        /** Downscale (aspect kept, never upscaled) so the longer side is at most this many pixels. */
        maxSide?: number;
    }

    /**
     * Decode an image to the grayscale image the pipeline takes. Transparent
     * pixels are composited over white; uses OffscreenCanvas, so it works in
     * a Web Worker.
     */
    export function readGray(source: string | URL | ImageBitmapSource, opts?: ReadGrayOptions): Promise<GrayImage>;
}
