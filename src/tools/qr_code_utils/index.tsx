import { type ChangeEvent, type ClipboardEvent, useRef, useEffect } from 'react';
import ZXing from '../../libs/zxing/zxing';

export function Component() {
    const qrFileUploadRef = useRef<HTMLInputElement>(null);
    const qrImageDisplayRef = useRef<HTMLImageElement>(null);
    const qrImageDataRef = useRef<ArrayBuffer | null>(null);
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

            if (qrImageDisplayRef.current) {
                qrImageDisplayRef.current.src = window.URL.createObjectURL(file);
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
                        if (qrFileUploadRef.current) {
                            qrFileUploadRef.current.value = '';
                        }

                        if (qrImageDisplayRef.current) {
                            qrImageDisplayRef.current.src = window.URL.createObjectURL(file);
                        }
                    }
                }
            }
        }
    }

    function updateCanvas() {
        const context = canvasRef.current?.getContext('2d');
        if (canvasRef.current && context && qrImageDisplayRef.current) {
            canvasRef.current.width = qrImageDisplayRef.current.width;
            canvasRef.current.height = qrImageDisplayRef.current.height;
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            context.imageSmoothingEnabled = false;
            context.drawImage(qrImageDisplayRef.current, 0, 0, qrImageDisplayRef.current.width, qrImageDisplayRef.current.height);
            canvasRef.current?.toBlob((blob) => {
                blob?.arrayBuffer().then((buffer) => {
                    qrImageDataRef.current = buffer;

                    processQRImage();
                }).catch(() => {});
            }, 'image/jpg');
        }
    }

    function processQRImage() {
        if (qrImageDataRef.current) {
            const fileData = new Uint8Array(qrImageDataRef.current);

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
                <label className="form-label" htmlFor="qr-image-file-upload">Select an image or drag it here:</label>
                <input type="file" className="form-control" id="qr-image-file-upload" onChange={handleFileChange} ref={qrFileUploadRef} />
                <small>Or simply paste the image on this page! (Don&apos;t paste a file)</small>
            </div>

            <button type="button" className="btn btn-primary mt-3" id="trigger-button" onClick={processQRImage}>See 👀</button>

            <textarea className="form-control mt-3" id="output-textbox" rows={10} readOnly ref={outputTextboxRef} />

            <div className="mt-3 text-center">
                <img className="maxh-30vh" src="" alt="<QR image will be displayed here>" id="qr-image" onLoad={updateCanvas} ref={qrImageDisplayRef} />
                <div className="d-none">
                    <canvas ref={canvasRef}></canvas>
                </div>
            </div>
        </div>
    );
}
