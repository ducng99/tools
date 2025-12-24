import { createFileRoute } from "@tanstack/solid-router";
import { createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { writeBarcode } from "zxing-wasm";
import InputURL from "./-input_types/InputURL";
import InputWiFiConfig from "./-input_types/InputWiFiConfig";
import InputEmail from "./-input_types/InputEmail";
import InputNormalText from "./-input_types/InputNormalText";
import type { WriteInputBarcodeFormat } from "zxing-wasm";
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

const inputComponents: Record<BarcodeInputType, ({ updateText }: BarcodeInputProps) => JSX.Element> = {
    url: InputURL,
    wifi: InputWiFiConfig,
    mail: InputEmail,
    text: InputNormalText,
};

function ToolComponent() {
    const [barcodeInputType, setBarcodeInputType] = createSignal<BarcodeInputType>("url");
    const [barcodeInputText, setBarcodeInputText] = createSignal<string>("");
    let barcodeFormatRef: HTMLSelectElement | undefined;
    let barcodeOutputImageRef: HTMLImageElement | undefined;

    function generateBarcode() {
        if (barcodeInputText()
            && barcodeFormatRef?.value
        ) {
            const text = barcodeInputText();
            const format = barcodeFormatRef.value as WriteInputBarcodeFormat;

            writeBarcode(text, { format }).then((result) => {
                if (result.svg) {
                    if (barcodeOutputImageRef) {
                        barcodeOutputImageRef.src = `data:image/svg+xml,${encodeURIComponent(result.svg)}`;
                    }
                }
            }).catch((error) => {
                console.error("Error generating barcode:", error);
            });
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
                    {/* <li class="nav-item">
                        <button class="nav-link" onClick={changeBarcodeInputType} data-input-type='phone'>Phone</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" onClick={changeBarcodeInputType} data-input-type='sms'>SMS</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" onClick={changeBarcodeInputType} data-input-type='bitcoin'>Bitcoin</button>
                    </li> */}
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

            <button class="btn btn-primary mt-3" onClick={generateBarcode}>
                {"Generate "}
                <i class="bi bi-qr-code" />
            </button>

            <div class="accordion mt-3" id="advancedOptionsContainer">
                <div class="accordion-item">
                    <div class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#advancedOptions" aria-expanded="false" aria-controls="advancedOptions">Advanced options</button>
                    </div>
                    <div id="advancedOptions" class="accordion-collapse collapse" data-bs-parent="#advancedOptionsContainer">
                        <div class="accordion-body">
                            <div class="row">
                                {/* <div class="col-12 col-md-6">
                                    <label for="barcode-writer-charset">Encoding:</label>
                                    <select class="form-select" id="barcode-writer-charset" defaultValue="UTF-8" ref={barcodeEncodingRef}>
                                        <option value="Cp437">Cp437</option>
                                        <option value="ISO-8859-1">ISO-8859-1</option>
                                        <option value="ISO-8859-2">ISO-8859-2</option>
                                        <option value="ISO-8859-3">ISO-8859-3</option>
                                        <option value="ISO-8859-4">ISO-8859-4</option>
                                        <option value="ISO-8859-5">ISO-8859-5</option>
                                        <option value="ISO-8859-6">ISO-8859-6</option>
                                        <option value="ISO-8859-7">ISO-8859-7</option>
                                        <option value="ISO-8859-8">ISO-8859-8</option>
                                        <option value="ISO-8859-9">ISO-8859-9</option>
                                        <option value="ISO-8859-10">ISO-8859-10</option>
                                        <option value="ISO-8859-11">ISO-8859-11</option>
                                        <option value="ISO-8859-13">ISO-8859-13</option>
                                        <option value="ISO-8859-14">ISO-8859-14</option>
                                        <option value="ISO-8859-15">ISO-8859-15</option>
                                        <option value="ISO-8859-16">ISO-8859-16</option>
                                        <option value="Shift_JIS">Shift_JIS</option>
                                        <option value="windows-1250">windows-1250</option>
                                        <option value="windows-1251">windows-1251</option>
                                        <option value="windows-1252">windows-1252</option>
                                        <option value="windows-1256">windows-1256</option>
                                        <option value="UTF-16BE">UTF-16BE</option>
                                        <option value="UTF-8">UTF-8</option>
                                        <option value="ASCII">ASCII</option>
                                        <option value="Big5">Big5</option>
                                        <option value="GB2312">GB2312</option>
                                        <option value="GB18030">GB18030</option>
                                        <option value="EUC-CN">EUC-CN</option>
                                        <option value="GBK">GBK</option>
                                        <option value="EUC-KR">EUC-KR</option>
                                    </select>
                                </div> */}
                                {/* <div class="col-12 col-md-6">
                                    <label for="barcode-writer-ecclevel">ECC Level:</label>
                                    <select class="form-select" id="barcode-writer-ecclevel" ref={barcodeECCLevelRef}>
                                        <option value="" selected>Default</option>
                                        <option value="0">0</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        <option value="6">6</option>
                                        <option value="7">7</option>
                                        <option value="8">8</option>
                                    </select>
                                </div> */}
                            </div>
                            {/* <div class="row">
                                <div class="col-12 col-md-4">
                                    <label for="barcode-writer-margin">Quiet Zone:</label>
                                    <input class="form-control" id="barcode-writer-margin" type="number" defaultValue="10" ref={barcodeQuietZoneRef} />
                                </div>
                                <div class="col-12 col-md-4">
                                    <label for="barcode-writer-width">Image Width:</label>
                                    <input class="form-control" id="barcode-writer-width" type="number" defaultValue="512" ref={barcodeWidthRef} />
                                </div>
                                <div class="col-12 col-md-4">
                                    <label for="barcode-writer-height">Image Height:</label>
                                    <input class="form-control" id="barcode-writer-height" type="number" defaultValue="512" ref={barcodeHeightRef} />
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>

            <label class="form-label mt-3">Output:</label>
            <div class="text-center">
                <img class="max-vh-30 w-100" style={{ "object-fit": "contain" }} src="" alt="<Output image will be displayed here>" id="barcode-output-image" ref={barcodeOutputImageRef} />
            </div>
        </div>
    );
}
