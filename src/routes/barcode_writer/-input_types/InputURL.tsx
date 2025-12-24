import type { BarcodeInputProps } from "..";

export default function InputURL({ updateText }: BarcodeInputProps) {
    let protocolRef: HTMLSelectElement | undefined;
    let urlRef: HTMLInputElement | undefined;

    function onChange() {
        if (protocolRef && urlRef) {
            updateText(protocolRef.value + urlRef.value);
        }
    }

    function onPaste(event: ClipboardEvent) {
        event.clipboardData?.items[0].getAsString((text) => {
            if (protocolRef && urlRef) {
                try {
                    const url = new URL(text);

                    if (url.protocol === "http:" || url.protocol === "https:") {
                        protocolRef.value = url.protocol + "//";
                        urlRef.value = url.href.substring(url.protocol.length + 2);
                    }
                }
                catch { /* empty */ }

                onChange();
            }
        });
    }

    return (
        <>
            <label class="form-label" for="barcode-url">URL:</label>
            <div class="input-group">
                <select class="form-select maxw-fit" id="barcode-url-protocol" value="https://" onChange={onChange} ref={protocolRef}>
                    <option value="https://">https://</option>
                    <option value="http://">http://</option>
                </select>
                <input type="url" class="form-control" id="barcode-url" onChange={onChange} onPaste={onPaste} ref={urlRef}></input>
            </div>
        </>
    );
}
