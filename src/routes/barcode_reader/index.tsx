import { createFileRoute } from "@tanstack/solid-router";
import { For, Show, createEffect, createSignal } from "solid-js";
import { readBarcodes } from "zxing-wasm";
import { clampWidthHeight } from "../../utils";
import type { ChangeEvent } from "../../utils";

export const Route = createFileRoute("/barcode_reader/")({
    head: () => ({
        meta: [
            {
                title: "Barcode Reader",
            },
        ],
    }),
    component: ToolComponent,
});

function ToolComponent() {
    const [openCamera, setOpenCamera] = createSignal(false);
    const [selectedCamera, setSelectedCamera] = createSignal<string>("");
    const [cameraDevices, setCameraDevices] = createSignal<Array<MediaDeviceInfo>>([]);

    let barcodeFileUploadRef: HTMLInputElement | undefined;
    let barcodeImageDisplayRef: HTMLImageElement | undefined;

    let barcodeVideoRef: HTMLVideoElement | undefined;
    let cameraStreamRef: MediaStream | undefined;
    let lastCameraFrameProcessedRef = performance.now();

    let helperCanvasRef: HTMLCanvasElement | undefined;
    let outputTextboxRef: HTMLTextAreaElement | undefined;

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.currentTarget.files && event.currentTarget.files.length > 0) {
            const file = event.currentTarget.files[0];

            if (barcodeImageDisplayRef) {
                barcodeImageDisplayRef.src = window.URL.createObjectURL(file);
            }
        }
    }

    function handlePaste(event: ClipboardEvent) {
        const items = event.clipboardData?.items;
        if (items) {
            for (const item of items) {
                if (item.type.startsWith("image")) {
                    const file = item.getAsFile();
                    if (file) {
                        if (barcodeFileUploadRef) {
                            barcodeFileUploadRef.value = "";
                        }

                        if (barcodeImageDisplayRef) {
                            barcodeImageDisplayRef.src = window.URL.createObjectURL(file);
                        }
                    }
                }
            }
        }
    }

    function handleFileDrop(event: DragEvent) {
        event.preventDefault();

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];

            if (barcodeImageDisplayRef) {
                barcodeImageDisplayRef.src = window.URL.createObjectURL(file);
            }
        }
    }

    function updateCanvas(element: HTMLImageElement | HTMLVideoElement) {
        if (outputTextboxRef) {
            outputTextboxRef.value = "";
        }

        const [width, height] = clampWidthHeight(element instanceof HTMLImageElement ? element.naturalWidth : element.videoWidth, element instanceof HTMLImageElement ? element.naturalHeight : element.videoHeight, 1024, 1024);

        const context = helperCanvasRef?.getContext("2d", { alpha: false, willReadFrequently: true });
        if (helperCanvasRef && context && width > 0 && height > 0) {
            helperCanvasRef.width = width;
            helperCanvasRef.height = height;
            context.fillStyle = "white";
            context.fillRect(0, 0, width, height);
            context.imageSmoothingEnabled = false;
            context.drawImage(element, 0, 0, width, height);
            const imageData = context.getImageData(0, 0, width, height);
            processBarcodeData(imageData);
        }
        else {
            if (outputTextboxRef) {
                outputTextboxRef.value = "Error: Cannot read image data!";
            }
        }
    }

    function processBarcodeData(barcodeImageData: ImageData | null) {
        if (barcodeImageData) {
            readBarcodes(barcodeImageData).then((result) => {
                if (outputTextboxRef) {
                    if (result.length > 0) {
                        if (result[0].error) {
                            outputTextboxRef.value = result[0].error;
                        }
                        else if (!result[0].text) {
                            outputTextboxRef.value = "Error: Cannot read barcode from image!";
                        }
                        else {
                            outputTextboxRef.value = result[0].text;
                            setOpenCamera(false);
                        }
                    }
                }
            }).catch((error) => {
                if (outputTextboxRef) {
                    outputTextboxRef.value = `Error: ${error}`;
                }
            });
        }
    }

    function processVideoFrame() {
        if (openCamera() && barcodeVideoRef) {
            const now = performance.now();

            if (now - lastCameraFrameProcessedRef >= 1000) {
                lastCameraFrameProcessedRef = now;
                updateCanvas(barcodeVideoRef);
            }

            requestAnimationFrame(processVideoFrame);
        }
    }

    createEffect(() => {
        if (openCamera() && navigator.mediaDevices) {
            navigator.mediaDevices.enumerateDevices().then((devices) => {
                setCameraDevices(devices.filter(device => device.kind === "videoinput"));
            }).catch((error) => {
                console.error("Error when enumerating camera devices:", error);
            });
        }
    });

    createEffect(() => {
        if (cameraStreamRef) {
            cameraStreamRef.getTracks().forEach((track) => {
                track.stop();
            });
        }

        if (openCamera() && navigator.mediaDevices) {
            const videoConstraints: MediaTrackConstraints = {};

            if (selectedCamera()) {
                videoConstraints.deviceId = { exact: selectedCamera() };
            }
            else {
                videoConstraints.facingMode = "environment";
            }

            navigator.mediaDevices
                .getUserMedia({ video: videoConstraints, audio: false })
                .then((stream) => {
                    if (barcodeVideoRef) {
                        cameraStreamRef = stream;
                        barcodeVideoRef.srcObject = stream;
                        barcodeVideoRef.play().catch(() => console.error("Error when playing video!"));
                        processVideoFrame();
                    }
                })
                .catch((error) => {
                    console.error("Error accessing camera:", error);
                });
        }
    });

    return (
        <div class="container mt-5" onPaste={handlePaste} onDrop={handleFileDrop} onDragOver={(e) => { e.preventDefault(); }}>
            <h1>Barcode reader</h1>

            <div>
                <label class="form-label" for="barcode-image-file-upload">Select an image or drag it here:</label>
                <input type="file" class="form-control" id="barcode-image-file-upload" onChange={handleFileChange} ref={barcodeFileUploadRef} />
            </div>
            <div class="mt-2">
                <small>Or open your camera to scan the barcode</small>
                <br />
                <button class="btn btn-primary mt-1" onClick={() => { setOpenCamera(state => !state); }}>
                    {openCamera() ? "Close" : "Open"}
                    {" "}
                    camera 📷
                </button>
                <Show when={openCamera()}>
                    <>
                        <select class="mt-3 form-select" onChange={(e) => { setSelectedCamera(e.currentTarget.value); }}>
                            <option value="" selected>Default camera</option>
                            <For each={cameraDevices()}>
                                {(device, index) => <option value={device.deviceId}>{device.label || `Camera ${index()}`}</option>}
                            </For>
                        </select>
                        <Show when={navigator.mediaDevices} fallback={<div class="mt-3 alert alert-danger">Your browser does not support camera streaming!</div>}>
                            <video class="mt-3 max-vh-80 w-100" id="barcode-video" autoplay playsinline ref={barcodeVideoRef}></video>
                            <br />
                        </Show>
                    </>
                </Show>
            </div>
            <div class="mt-2">
                <small>Or simply paste the image on this page! (Don&apos;t paste a file though, you can drag & drop it)</small>
            </div>

            <button type="button" class="btn btn-primary mt-3" id="trigger-button" onClick={() => { updateCanvas(barcodeImageDisplayRef as HTMLImageElement); }}>Read 👀</button>

            <div class="mt-3">
                <label class="form-label" for="output-textbox">Output:</label>
                <textarea class="form-control" id="output-textbox" rows={5} readOnly ref={outputTextboxRef} />
            </div>

            <div class="mt-3 text-center">
                <img class="max-vh-30 maxw-100" src="" alt="<Image will be displayed here>" id="barcode-image" onLoad={(e) => { updateCanvas(e.currentTarget); }} ref={barcodeImageDisplayRef} />
                <div class="d-none">
                    <canvas ref={helperCanvasRef}></canvas>
                </div>
            </div>
        </div>
    );
}
