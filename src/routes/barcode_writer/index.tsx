import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { writeBarcode } from "zxing-wasm";
import InputURL from "./-input_types/InputURL";
import InputWiFiConfig from "./-input_types/InputWiFiConfig";
import InputEmail from "./-input_types/InputEmail";
import InputNormalText from "./-input_types/InputNormalText";
import type { EcLevel, WriteInputBarcodeFormat } from "zxing-wasm";
import type { JSX } from "solid-js";

type BarcodeInputType = "url" | "wifi" | "text" | "mail";

export interface BarcodeInputProps {
    updateText: (text: string) => void;
}

export const Route = createFileRoute("/barcode_writer/")({
    head: () => ({
        meta: [
            {
                title: "Barcode Writer",
            },
        ],
    }),
    component: ToolComponent,
});

const inputComponents: Record<BarcodeInputType, (_: BarcodeInputProps) => JSX.Element> = {
    url: InputURL,
    wifi: InputWiFiConfig,
    mail: InputEmail,
    text: InputNormalText,
};

function ToolComponent() {
    const [barcodeInputType, setBarcodeInputType] = createSignal<BarcodeInputType>("url");
    const [barcodeInputText, setBarcodeInputText] = createSignal<string>("");
    const [barcodeResult, setBarcodeResult] = createSignal<{
        image: Blob | null;
        svg: string;
        utf8: string;
        error: string;
    } | null>(null);
    let barcodeFormatRef: HTMLSelectElement | undefined;
    let barcodeSizeHintRef: HTMLInputElement | undefined;
    let barcodeECLevelRef: HTMLSelectElement | undefined;
    let barcodeQuietZoneRef: HTMLInputElement | undefined;
    let barcodeWithHrtRef: HTMLInputElement | undefined;

    function generateBarcode() {
        const text = barcodeInputText();

        if (text && barcodeFormatRef?.value) {
            const format = barcodeFormatRef.value as WriteInputBarcodeFormat;
            const sizeHint = barcodeSizeHintRef ? parseInt(barcodeSizeHintRef.value) : 512;
            const ecLevel = barcodeECLevelRef ? barcodeECLevelRef.value as EcLevel : "";
            const withQuietZones = barcodeQuietZoneRef?.checked ?? true;
            const withHRT = barcodeWithHrtRef?.checked ?? true;

            writeBarcode(text, { format, sizeHint, ecLevel, withQuietZones, withHRT }).then((result) => {
                if (result.error) {
                    console.error("Error generating barcode:", result.error);
                }
                else {
                    setBarcodeResult(result);
                }
            }).catch((error) => {
                console.error("Error generating barcode:", error);
            });
        }
    }

    function downloadSvg() {
        const result = barcodeResult();
        if (result?.svg) {
            const blob = new Blob([result.svg], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "barcode.svg";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    function downloadPng() {
        const result = barcodeResult();
        if (result?.image) {
            const url = URL.createObjectURL(result.image);
            const a = document.createElement("a");
            a.href = url;
            a.type = result.image.type;
            a.download = "barcode.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    return (
        <div class="container mt-5">
            <h1>Barcode Writer</h1>

            <div>
                <ul class="nav nav-tabs">
                    <li class="nav-item">
                        <button
                            classList={{ "nav-link": true, "active": barcodeInputType() === "url" }}
                            onClick={() => setBarcodeInputType("url")}
                            aria-current={barcodeInputType() === "url" ? "page" : undefined}
                        >
                            URL
                        </button>
                    </li>
                    <li class="nav-item">
                        <button
                            classList={{ "nav-link": true, "active": barcodeInputType() === "wifi" }}
                            onClick={() => setBarcodeInputType("wifi")}
                            aria-current={barcodeInputType() === "wifi" ? "page" : undefined}
                        >
                            Wi-Fi
                        </button>
                    </li>
                    <li class="nav-item">
                        <button
                            classList={{ "nav-link": true, "active": barcodeInputType() === "text" }}
                            onClick={() => setBarcodeInputType("text")}
                            aria-current={barcodeInputType() === "text" ? "page" : undefined}
                        >
                            Text
                        </button>
                    </li>
                    <li class="nav-item">
                        <button
                            classList={{ "nav-link": true, "active": barcodeInputType() === "mail" }}
                            onClick={() => setBarcodeInputType("mail")}
                            aria-current={barcodeInputType() === "mail" ? "page" : undefined}
                        >
                            Email
                        </button>
                    </li>
                </ul>
                <div class="tab-content my-2" id="barcode-input-type-container">
                    <Dynamic component={inputComponents[barcodeInputType()]} updateText={setBarcodeInputText} />
                </div>
            </div>
            <hr />

            <div>
                <label class="form-label" for="barcode-writer-format">Format:</label>
                <select class="form-select" id="barcode-writer-format" ref={barcodeFormatRef}>
                    <option value="Aztec">Aztec</option>
                    <option value="Codabar">Codabar</option>
                    <option value="Code39">Code 39</option>
                    <option value="Code93">Code 93</option>
                    <option value="Code128">Code 128</option>
                    <option value="DataMatrix">DataMatrix</option>
                    <option value="EAN8">EAN-8</option>
                    <option value="EAN13">EAN-13</option>
                    <option value="ITF">ITF</option>
                    <option value="PDF417">PDF417</option>
                    <option value="QRCode" selected>QR Code</option>
                    <option value="UPCA">UPC-A</option>
                    <option value="UPCE">UPC-E</option>
                </select>
            </div>

            <div class="mt-3">
                <button class="btn btn-primary" onClick={generateBarcode}>
                    {"Generate "}
                    <i class="bi bi-qr-code" />
                </button>
            </div>

            <div class="accordion mt-3" id="advancedOptionsContainer">
                <div class="accordion-item">
                    <div class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#advancedOptions" aria-expanded="false" aria-controls="advancedOptions">Advanced options</button>
                    </div>
                    <div id="advancedOptions" class="accordion-collapse collapse" data-bs-parent="#advancedOptionsContainer">
                        <div class="accordion-body">
                            <div class="row">
                                <div class="col-12 col-md-6">
                                    <label for="barcode-writer-size-hint">Image size (hint):</label>
                                    <input type="number" class="form-control" id="barcode-writer-size-hint" min={1} step={1} value="512" ref={barcodeSizeHintRef} />
                                </div>
                                <div class="col-12 col-md-6">
                                    <label for="barcode-writer-ecclevel">Error Correction Level:</label>
                                    <select class="form-select" id="barcode-writer-ecclevel" ref={barcodeECLevelRef}>
                                        <option value="L">Low</option>
                                        <option value="M" selected>Medium</option>
                                        <option value="Q">Quartile</option>
                                        <option value="H">High</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-12">
                                    <div class="form-check form-switch">
                                        <input type="checkbox" class="form-check-input" id="barcode-writer-margin" role="switch" checked ref={barcodeQuietZoneRef} />
                                        <label class="form-check-label" for="barcode-writer-margin">Quiet Zone</label>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-check form-switch">
                                        <input type="checkbox" class="form-check-input" id="barcode-writer-with-hrt" role="switch" checked ref={barcodeWithHrtRef} />
                                        <label class="form-check-label" for="barcode-writer-with-hrt">Include human readable text</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Show when={barcodeResult()}>
                {result => (
                    <>
                        <label class="form-label mt-3">Output:</label>
                        <div class="text-center">
                            <img class="max-vh-30 w-100 object-fit-contain" src={`data:image/svg+xml,${encodeURIComponent(result().svg)}`} />
                        </div>

                        <div class="mt-2 d-flex justify-content-center gap-2">
                            <button class="btn btn-primary" onClick={downloadSvg}>
                                Save as SVG
                            </button>
                            <button class="btn btn-primary" onClick={downloadPng}>
                                Save as PNG
                            </button>
                        </div>
                    </>
                )}
            </Show>
        </div>
    );
}
