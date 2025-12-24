import { Suspense, lazy, useMemo, useRef, useState } from "react";
import Loading from "../../components/common/Loading";
import type { Dispatch, MouseEvent, SetStateAction } from "react";

const InputURL = lazy(() => import("./input_types/InputURL"));
const InputWiFiConfig = lazy(() => import("./input_types/InputWiFiConfig"));
const InputNormalText = lazy(() => import("./input_types/InputNormalText"));
const InputEmail = lazy(() => import("./input_types/InputEmail"));

type BarcodeInputType = "url" | "wifi" | "text" | "mail" | "phone" | "sms" | "bitcoin";

export interface BarcodeInputProps {
    updateText: Dispatch<SetStateAction<string>>;
}

export function Component() {
    const [barcodeInputType, setBarcodeInputType] = useState<BarcodeInputType>("url");
    const [barcodeInputText, setBarcodeInputText] = useState<string>("");
    const barcodeFormatRef = useRef<HTMLSelectElement>(null);
    const barcodeEncodingRef = useRef<HTMLSelectElement>(null);
    const barcodeECCLevelRef = useRef<HTMLSelectElement>(null);
    const barcodeQuietZoneRef = useRef<HTMLInputElement>(null);
    const barcodeWidthRef = useRef<HTMLInputElement>(null);
    const barcodeHeightRef = useRef<HTMLInputElement>(null);
    const barcodeOutputImageRef = useRef<HTMLImageElement>(null);

    function generateBarcode() {
        if (barcodeInputText
            && barcodeFormatRef.current?.value
            && barcodeEncodingRef.current?.value
            && barcodeECCLevelRef.current?.value
            && barcodeQuietZoneRef.current?.value
            && barcodeWidthRef.current?.value
            && barcodeHeightRef.current?.value
        ) {
            const text = barcodeInputText;
            const format = barcodeFormatRef.current.value;
            const charset = barcodeEncodingRef.current.value;
            const margin = parseInt(barcodeQuietZoneRef.current.value);
            const width = parseInt(barcodeWidthRef.current.value);
            const height = parseInt(barcodeHeightRef.current.value);
            const eccLevel = parseInt(barcodeECCLevelRef.current.value);

            const result = zxing.generateBarcode(text, format, charset, margin, width, height, eccLevel);

            if (result.image) {
                if (barcodeOutputImageRef.current) {
                    barcodeOutputImageRef.current.src = window.URL.createObjectURL(new Blob([result.image], { type: "image/png" }));
                }
            }
        }
    }

    function changeBarcodeInputType(event: MouseEvent<HTMLButtonElement>) {
        const type = event.currentTarget.getAttribute("data-input-type") as BarcodeInputType;
        setBarcodeInputType(type);

        event.currentTarget.parentElement?.parentElement?.querySelectorAll(".active").forEach((element) => {
            element.classList.remove("active");
            element.removeAttribute("aria-current");
        });

        event.currentTarget.classList.add("active");
        event.currentTarget.setAttribute("aria-current", "page");
    }

    const inputElement = useMemo(() => {
        switch (barcodeInputType) {
            case "url":
                return <InputURL updateText={setBarcodeInputText} />;
            case "wifi":
                return <InputWiFiConfig updateText={setBarcodeInputText} />;
            case "text":
                return <InputNormalText updateText={setBarcodeInputText} />;
            case "mail":
                return <InputEmail updateText={setBarcodeInputText} />;
            default:
                return <></>;
        }
    }, [barcodeInputType]);

    return (
        <div class="container mt-5">
            <h1></h1>

            <div>
                <ul class="nav nav-tabs">
                    <li class="nav-item">
                        <button class="nav-link active" onClick={changeBarcodeInputType} data-input-type="url" aria-current="page">URL</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" onClick={changeBarcodeInputType} data-input-type="wifi">Wi-Fi</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" onClick={changeBarcodeInputType} data-input-type="text">Text</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" onClick={changeBarcodeInputType} data-input-type="mail">Email</button>
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
                    <Suspense fallback={<Loading />}>{inputElement}</Suspense>
                </div>
            </div>
            <hr />

            <div>
                <label class="form-label" for="barcode-writer-format">Format:</label>
                <select class="form-select" id="barcode-writer-format" defaultValue="QRCode" ref={barcodeFormatRef}>
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
                    <option value="QRCode">QR Code</option>
                    <option value="UPCA">UPC-A</option>
                    <option value="UPCE">UPC-E</option>
                </select>
            </div>

            <button class="btn btn-primary mt-3" onClick={generateBarcode}>
                Generate
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
                                <div class="col-12 col-md-6">
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
                                </div>
                                <div class="col-12 col-md-6">
                                    <label for="barcode-writer-ecclevel">ECC Level:</label>
                                    <select class="form-select" id="barcode-writer-ecclevel" defaultValue="-1" ref={barcodeECCLevelRef}>
                                        <option value="-1">Default</option>
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
                                </div>
                            </div>
                            <div class="row">
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <label class="form-label mt-3">Output:</label>
            <div class="text-center">
                <img class="max-vh-30 maxw-100" src="" alt="<Output image will be displayed here>" id="barcode-output-image" ref={barcodeOutputImageRef} />
            </div>
        </div>
    );
}
