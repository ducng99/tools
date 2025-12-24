import { useRef, type ClipboardEvent } from 'react';
import { type BarcodeInputProps } from '..';

export default function InputURL({ updateText }: BarcodeInputProps) {
    const protocolRef = useRef<HTMLSelectElement>(null);
    const urlRef = useRef<HTMLInputElement>(null);

    function onChange() {
        if (protocolRef.current && urlRef.current) {
            updateText(protocolRef.current.value + urlRef.current.value);
        }
    }

    function onPaste(event: ClipboardEvent<HTMLInputElement>) {
        event.clipboardData.items[0].getAsString((text) => {
            if (protocolRef.current && urlRef.current) {
                try {
                    const url = new URL(text);

                    if (url.protocol === 'http:' || url.protocol === 'https:') {
                        protocolRef.current.value = url.protocol + '//';
                        urlRef.current.value = url.href.substring(url.protocol.length + 2);
                    }
                } catch (_) {}

                onChange();
            }
        });
    }

    return (
        <>
            <label class="form-label" for="barcode-url">URL:</label>
            <div class="input-group">
                <select class="form-select maxw-fit" id="barcode-url-protocol" defaultValue="https://" onChange={onChange} ref={protocolRef}>
                    <option value="https://">https://</option>
                    <option value="http://">http://</option>
                </select>
                <input type="url" class="form-control" id="barcode-url" onChange={onChange} onPaste={onPaste} ref={urlRef}></input>
            </div>
        </>
    );
}
