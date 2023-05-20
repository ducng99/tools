import { type ChangeEvent, type ClipboardEvent, useRef, useEffect } from 'react';
import ZXing from '../../libs/zxing/zxing';

export function Component() {
    const qrFileUploadRef = useRef<HTMLInputElement>(null);
    const qrImageRef = useRef<HTMLImageElement>(null);
    const qrFileRef = useRef<File | null>(null);
    const outputTextboxRef = useRef<HTMLTextAreaElement>(null);

    const zxing = useRef<any>(null);

    useEffect(() => {
        zxing.current = ZXing().then(function (instance: any) {
            zxing.current = instance; // this line is supposedly not required but with current emsdk it is :-/
        });
    }, []);

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];

            qrFileRef.current = file;

            if (qrImageRef.current) {
                qrImageRef.current.src = window.URL.createObjectURL(file);
            }

            processQRImage();
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
                        qrFileRef.current = file;

                        if (qrImageRef.current) {
                            qrImageRef.current.src = window.URL.createObjectURL(file);
                        }

                        processQRImage();
                    }
                }
            }
        }
    }

    function processQRImage() {
        qrFileRef.current?.arrayBuffer().then((arrBuffer) => {
            const fileData = new Uint8Array(arrBuffer);

            const buffer = zxing.current._malloc(fileData.length);
            zxing.current.HEAPU8.set(fileData, buffer);
            const result = zxing.current.readBarcodeFromImage(buffer, fileData.length, true, '');
            zxing.current._free(buffer);

            if (outputTextboxRef.current) {
                outputTextboxRef.current.value = result.text;
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    return (
        <div className="container mt-5" onPaste={handlePaste}>
            <h1>{document.title}</h1>

            <div className="mb-3">
                <div>
                    <label className="form-label" htmlFor="qr-image-file-upload">Select an image or drag it here:</label>
                    <input type="file" className="form-control" id="qr-image-file-upload" onChange={handleFileChange} ref={qrFileUploadRef} />
                    <small>Or paste the image on this page (NOT a file)</small>
                </div>
                <div className="my-3 text-center">
                    <img className="maxh-50" src="" alt="<QR image will be displayed here>" id="qr-image" ref={qrImageRef} />
                </div>
                <button type="button" className="btn btn-primary" id="trigger-button" onClick={processQRImage}>See 👀</button>
            </div>

            <textarea className="form-control" id="output-textbox" rows={10} readOnly ref={outputTextboxRef} />
        </div>
    );
}
