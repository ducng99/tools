import type { BarcodeInputProps } from "..";

export default function InputEmail({ updateText }: BarcodeInputProps) {
    let recipientRef: HTMLInputElement | undefined;
    let ccRef: HTMLInputElement | undefined;
    let bccRef: HTMLInputElement | undefined;
    let subjectRef: HTMLInputElement | undefined;
    let bodyRef: HTMLTextAreaElement | undefined;

    function onChange() {
        if (recipientRef?.value && ccRef && bccRef && subjectRef && bodyRef) {
            let output = `mailto:${recipientRef.value}`;

            const params = [];

            if (ccRef.value) {
                params.push(`cc=${encodeURIComponent(ccRef.value)}`);
            }

            if (bccRef.value) {
                params.push(`bcc=${encodeURIComponent(bccRef.value)}`);
            }

            if (subjectRef.value) {
                params.push(`subject=${encodeURIComponent(subjectRef.value)}`);
            }

            if (bodyRef.value) {
                params.push(`body=${encodeURIComponent(bodyRef.value)}`);
            }

            if (params.length > 0) {
                output += `?${params.join("&")}`;
            }

            updateText(output);
        }
    };

    return (
        <>
            <div>
                <label class="form-label" for="barcode-email-to">To:</label>
                <input class="form-control" id="barcode-email-to" placeholder="john.doe@example.com" onChange={onChange} ref={recipientRef}></input>
            </div>
            <div class="mt-1">
                <label class="form-label" for="barcode-email-cc">Cc:</label>
                <input class="form-control" id="barcode-email-cc" placeholder="alice@example.com,bob@example.com" onChange={onChange} ref={ccRef}></input>
            </div>
            <div class="mt-1">
                <label class="form-label" for="barcode-email-bcc">Bcc:</label>
                <input class="form-control" id="barcode-email-bcc" onChange={onChange} ref={bccRef}></input>
            </div>
            <div class="mt-1">
                <label class="form-label" for="barcode-email-subject">Subject:</label>
                <input class="form-control" id="barcode-email-subject" placeholder="OMG OMG!!!" onChange={onChange} ref={subjectRef}></input>
            </div>
            <div class="mt-1">
                <label class="form-label" for="barcode-email-body">Body:</label>
                <textarea class="form-control" id="barcode-email-body" placeholder="SEND IT" onChange={onChange} ref={bodyRef} rows={5}></textarea>
            </div>
        </>
    );
}
