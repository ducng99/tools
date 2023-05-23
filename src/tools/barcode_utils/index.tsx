import { type ChangeEvent, type ClipboardEvent, useRef, useEffect } from 'react';
import ZXing from '../../libs/zxing/zxing';

export function Component() {
    const barcodeFileUploadRef = useRef<HTMLInputElement>(null);
    const barcodeImageDisplayRef = useRef<HTMLImageElement>(null);
    const barcodeImageDataRef = useRef<ArrayBuffer | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const outputTextboxRef = useRef<HTMLTextAreaElement>(null);

    const zxing = useRef<any>(null);

    useEffect(() => {
        zxing.current = ZXing().then(function (instance: any) {
            zxing.current = instance;
        });
    }, []);

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

    function updateCanvas() {
        const context = canvasRef.current?.getContext('2d');
        if (canvasRef.current && context && barcodeImageDisplayRef.current) {
            canvasRef.current.width = barcodeImageDisplayRef.current.width;
            canvasRef.current.height = barcodeImageDisplayRef.current.height;
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            context.imageSmoothingEnabled = false;
            context.drawImage(barcodeImageDisplayRef.current, 0, 0, barcodeImageDisplayRef.current.width, barcodeImageDisplayRef.current.height);
            canvasRef.current?.toBlob((blob) => {
                blob?.arrayBuffer().then((buffer) => {
                    barcodeImageDataRef.current = buffer;

                    processBarcodeData();
                }).catch(() => {});
            }, 'image/jpg');
        }
    }

    function processBarcodeData() {
        if (barcodeImageDataRef.current) {
            const fileData = new Uint8Array(barcodeImageDataRef.current);

            const buffer = zxing.current._malloc(fileData.length);
            zxing.current.HEAPU8.set(fileData, buffer);
            const result = zxing.current.readBarcodeFromImage(buffer, fileData.length, true, '');
            zxing.current._free(buffer);

            if (outputTextboxRef.current) {
                outputTextboxRef.current.value = result.text;
            }
        }
    }

    return (
        <div className="container mt-5" onPaste={handlePaste}>
            <h1>{document.title}</h1>

            <div>
                <label className="form-label" htmlFor="barcode-image-file-upload">Select an image or drag it here:</label>
                <input type="file" className="form-control" id="barcode-image-file-upload" onChange={handleFileChange} ref={barcodeFileUploadRef} />
                <small>Or simply paste the image on this page! (Don&apos;t paste a file)</small>
            </div>

            <button type="button" className="btn btn-primary mt-3" id="trigger-button" onClick={processBarcodeData}>See 👀</button>

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
