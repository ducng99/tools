import { type ChangeEvent, type ClipboardEvent, useRef, type DragEvent } from 'react';

let zxing: any = null;

import('../../libs/zxing/zxing').then(ZXing => {
    zxing = ZXing.default().then(function (instance: any) {
        zxing = instance;
    }).catch(() => {
        console.error('Failed when loading ZXing library!');
    });
}).catch(() => {
    console.error('Failed when loading ZXing library!');
});

export function Component() {
    const barcodeFileUploadRef = useRef<HTMLInputElement>(null);
    const barcodeImageDisplayRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
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
                if (items[i].type.includes('image')) {
                    const file = items[i].getAsFile();
                    if (file) {
                        if (barcodeFileUploadRef.current) {
                            barcodeFileUploadRef.current.value = '';
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

    function updateCanvas() {
        if (outputTextboxRef.current) {
            outputTextboxRef.current.value = '';
        }

        const context = canvasRef.current?.getContext('2d', { alpha: false });
        if (canvasRef.current && context && barcodeImageDisplayRef.current) {
            canvasRef.current.width = barcodeImageDisplayRef.current.width;
            canvasRef.current.height = barcodeImageDisplayRef.current.height;
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            context.imageSmoothingEnabled = false;
            context.drawImage(barcodeImageDisplayRef.current, 0, 0, barcodeImageDisplayRef.current.width, barcodeImageDisplayRef.current.height);
            canvasRef.current?.toBlob((blob) => {
                blob?.arrayBuffer().then((buffer) => {
                    processBarcodeData(buffer);
                }).catch(() => {
                    if (outputTextboxRef.current) {
                        outputTextboxRef.current.value = 'Error: Cannot read image data!';
                    }
                });
            }, 'image/jpg');
        } else {
            if (outputTextboxRef.current) {
                outputTextboxRef.current.value = 'Error: Cannot read image data!';
            }
        }
    }

    function processBarcodeData(barcodeImageData: ArrayBuffer | null) {
        if (barcodeImageData) {
            const fileData = new Uint8Array(barcodeImageData);

            const buffer = zxing._malloc(fileData.length);
            zxing.HEAPU8.set(fileData, buffer);
            const result = zxing.readBarcodeFromImage(buffer, fileData.length, true, '');
            zxing._free(buffer);

            if (outputTextboxRef.current) {
                if (result.error) {
                    outputTextboxRef.current.value = result.error;
                } else if (!result.text) {
                    outputTextboxRef.current.value = 'Error: Cannot read barcode from image!';
                } else {
                    outputTextboxRef.current.value = result.text;
                }
            }
        }
    }

    return (
        <div className="container mt-5" onPaste={handlePaste} onDrop={handleFileDrop} onDragOver={(e) => { e.preventDefault(); }}>
            <h1>{document.title}</h1>

            <div>
                <label className="form-label" htmlFor="barcode-image-file-upload">Select an image or drag it here:</label>
                <input type="file" className="form-control" id="barcode-image-file-upload" onChange={handleFileChange} ref={barcodeFileUploadRef} />
                <small>Or simply paste the image on this page! (Don&apos;t paste a file)</small>
            </div>

            <button type="button" className="btn btn-primary mt-3" id="trigger-button" onClick={updateCanvas}>See 👀</button>

            <textarea className="form-control mt-3" id="output-textbox" rows={5} readOnly ref={outputTextboxRef} />

            <div className="mt-3 text-center">
                <img className="maxh-30vh" src="" alt="<Image will be displayed here>" id="barcode-image" onLoad={updateCanvas} ref={barcodeImageDisplayRef} />
                <div className="d-none">
                    <canvas ref={canvasRef}></canvas>
                </div>
            </div>
        </div>
    );
}
