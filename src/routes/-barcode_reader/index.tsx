import { useEffect, useRef, useState } from "react";
import { clampWidthHeight } from "../../utils";
import type { ChangeEvent, ClipboardEvent, DragEvent } from "react";

export function Component() {
    const [openCamera, setOpenCamera] = useState(false);
    const [selectedCamera, setSelectedCamera] = useState<string>("");
    const [cameraDevices, setCameraDevices] = useState<Array<MediaDeviceInfo>>([]);

    const barcodeFileUploadRef = useRef<HTMLInputElement>(null);
    const barcodeImageDisplayRef = useRef<HTMLImageElement>(null);

    const barcodeVideoRef = useRef<HTMLVideoElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const lastCameraFrameProcessedRef = useRef<number>(performance.now());

    const helperCanvasRef = useRef<HTMLCanvasElement>(null);
    const outputTextboxRef = useRef<HTMLTextAreaElement>(null);

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];

            if (barcodeImageDisplayRef.current) {
                barcodeImageDisplayRef.current.src = window.URL.createObjectURL(file);
            }
        }
    }

    function handlePaste(event: ClipboardEvent) {
        const items = event.clipboardData?.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith("image")) {
                    const file = items[i].getAsFile();
                    if (file) {
                        if (barcodeFileUploadRef.current) {
                            barcodeFileUploadRef.current.value = "";
                        }

                        if (barcodeImageDisplayRef.current) {
                            barcodeImageDisplayRef.current.src = window.URL.createObjectURL(file);
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

            if (barcodeImageDisplayRef.current) {
                barcodeImageDisplayRef.current.src = window.URL.createObjectURL(file);
            }
        }
    }

    function updateCanvas(element: HTMLImageElement | HTMLVideoElement) {
        if (outputTextboxRef.current) {
            outputTextboxRef.current.value = "";
        }

        const [width, height] = clampWidthHeight(element instanceof HTMLImageElement ? element.naturalWidth : element.videoWidth, element instanceof HTMLImageElement ? element.naturalHeight : element.videoHeight, 1024, 1024);

        const context = helperCanvasRef.current?.getContext("2d", { alpha: false, willReadFrequently: true });
        if (helperCanvasRef.current && context && width > 0 && height > 0) {
            helperCanvasRef.current.width = width;
            helperCanvasRef.current.height = height;
            context.fillStyle = "white";
            context.fillRect(0, 0, width, height);
            context.imageSmoothingEnabled = false;
            context.drawImage(element, 0, 0, width, height);
            const imageData = context.getImageData(0, 0, width, height);
            processBarcodeData(imageData.data, width, height);
        }
        else {
            if (outputTextboxRef.current) {
                outputTextboxRef.current.value = "Error: Cannot read image data!";
            }
        }
    }

    function processBarcodeData(barcodeImageData: ArrayBuffer | null, width: number, height: number) {
        if (barcodeImageData) {
            const fileData = new Uint8Array(barcodeImageData);

            const buffer = zxing._malloc(fileData.length);
            zxing.HEAPU8.set(fileData, buffer);
            const result = zxing.readBarcodeFromPixmap(buffer, width, height, "", "");
            zxing._free(buffer);

            if (outputTextboxRef.current) {
                if (result.error) {
                    outputTextboxRef.current.value = result.error;
                }
                else if (!result.text) {
                    outputTextboxRef.current.value = "Error: Cannot read barcode from image!";
                }
                else {
                    outputTextboxRef.current.value = result.text;
                    setOpenCamera(false);
                }
            }
        }
    }

    function processVideoFrame() {
        if (openCamera && barcodeVideoRef.current) {
            const now = performance.now();

            if (now - lastCameraFrameProcessedRef.current >= 1000) {
                lastCameraFrameProcessedRef.current = now;
                updateCanvas(barcodeVideoRef.current);
            }

            requestAnimationFrame(processVideoFrame);
        }
    }

    useEffect(() => {
        if (openCamera && navigator.mediaDevices) {
            navigator.mediaDevices.enumerateDevices().then((devices) => {
                setCameraDevices(devices.filter(device => device.kind === "videoinput"));
            }).catch((error) => {
                console.error("Error when enumerating camera devices:", error);
            });
        }
    }, [openCamera]);

    useEffect(() => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((track) => {
                track.stop();
            });
        }

        if (openCamera && navigator.mediaDevices) {
            const videoConstraints: MediaTrackConstraints = {};

            if (selectedCamera) {
                videoConstraints.deviceId = { exact: selectedCamera };
            }
            else {
                videoConstraints.facingMode = "environment";
            }

            navigator.mediaDevices
                .getUserMedia({ video: videoConstraints, audio: false })
                .then((stream) => {
                    if (barcodeVideoRef.current) {
                        cameraStreamRef.current = stream;
                        barcodeVideoRef.current.srcObject = stream;
                        barcodeVideoRef.current.play().catch(() => { console.error("Error when playing video!"); });
                        processVideoFrame();
                    }
                })
                .catch((error) => {
                    console.error("Error accessing camera:", error);
                });
        }
    }, [openCamera, selectedCamera]);

    return (
        <div class="container mt-5" onPaste={handlePaste} onDrop={handleFileDrop} onDragOver={(e) => { e.preventDefault(); }}>
            <h1></h1>

            <div>
                <label class="form-label" for="barcode-image-file-upload">Select an image or drag it here:</label>
                <input type="file" class="form-control" id="barcode-image-file-upload" onChange={handleFileChange} ref={barcodeFileUploadRef} />
            </div>
            <div class="mt-2">
                <small>Or open your camera to scan the barcode</small>
                <br />
                <button class="btn btn-primary mt-1" onClick={() => { setOpenCamera(state => !state); }}>
                    {openCamera ? "Close" : "Open"}
                    {" "}
                    camera 📷
                </button>
                {
                    openCamera
                    && (
                        <>
                            <select class="mt-3 form-select" onChange={(e) => { setSelectedCamera(e.currentTarget.value); }}>
                                <option value="" selected>Default camera</option>
                                {
                                    cameraDevices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index}`}</option>)
                                }
                            </select>
                            {
                                navigator.mediaDevices
                                    ? (
                                        <>
                                            <video class="mt-3 max-vh-80 w-100" id="barcode-video" autoPlay playsInline ref={barcodeVideoRef}></video>
                                            <br />
                                        </>
                                    )
                                    : <div class="mt-3 alert alert-danger">Your browser does not support camera streaming!</div>
                            }
                        </>
                    )
                }
            </div>
            <div class="mt-2">
                <small>Or simply paste the image on this page! (Don&apos;t paste a file though, you can drag & drop it)</small>
            </div>

            <button type="button" class="btn btn-primary mt-3" id="trigger-button" onClick={() => { updateCanvas(barcodeImageDisplayRef.current as HTMLImageElement); }}>Read 👀</button>

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
