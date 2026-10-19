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

    export interface OcrPage {
        /** Lines in reading order. */
        lines: Array<OcrLine>;
        /** Detected quarter-turn in degrees (0 / 90 / 180 / 270). */
        rotation: number;
        /** Deskew angle applied, in degrees (0 when no deskew). */
        skew: number;
        /** Assembled markdown (headings, tables, etc.). */
        markdown: string;
        /** Layout blocks with classes and bounding boxes. */
        blocks: Array<Record<string, unknown>>;
        /** All lines joined by newlines. */
        text: string;
        /** Per-phase timings (ms). */
        timings: Record<string, number>;
    }

    export interface LoadIndraOptions {
        /** Skip the script classifier and CJK recognizer (Latin-only output). */
        cjk?: boolean;
        /** Skip order.onnx and fall back to geometric reading order. */
        order?: boolean;
        /** Skip orient.onnx and disable rotation detection. */
        orient?: boolean;
        /** Toggle the second, higher-resolution detection pass. */
        adaptive?: boolean;
        /** Load the math models (mathcls/enc/dec .onnx + math_meta.json). */
        math?: boolean;
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
        session: (name: string) => Promise<{
            run: (inputs: never) => Promise<Record<string, unknown>>;
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

        /** Per line: {text, conf}. */
        recognize(gray: GrayImage, boxes: Array<Array<number>>): Promise<Array<{ text: string; conf: number }>>;

        /** Quarter turns (counter-clockwise) the page content is turned by. */
        orientation(gray: GrayImage): Promise<number>;
    }

    /**
     * Load the pipeline, fetching det/rec/order/script/rec_cjk/orient .onnx
     * and meta.json from `base` (URL, local directory in Node, or HF repo
     * shorthand "user/repo[@rev]").
     */
    export function loadIndra(base: string, opts?: LoadIndraOptions): Promise<IndraOCR>;

    /** Decode an image URL or Blob to the grayscale image the pipeline takes. */
    export function readGray(source: string | Blob): Promise<GrayImage>;
}
