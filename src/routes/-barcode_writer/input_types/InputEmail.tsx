import { useRef } from 'react';
import { type BarcodeInputProps } from '..';

export default function InputEmail({ updateText }: BarcodeInputProps) {
    const recipientRef = useRef<HTMLInputElement>(null);
    const ccRef = useRef<HTMLInputElement>(null);
    const bccRef = useRef<HTMLInputElement>(null);
    const subjectRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLTextAreaElement>(null);

    function onChange() {
        if (recipientRef.current?.value && ccRef.current && bccRef.current && subjectRef.current && bodyRef.current) {
            let output = `mailto:${recipientRef.current.value}`;

            const params = [];

            if (ccRef.current.value) {
                params.push(`cc=${encodeURIComponent(ccRef.current.value)}`);
            }

            if (bccRef.current.value) {
                params.push(`bcc=${encodeURIComponent(bccRef.current.value)}`);
            }

            if (subjectRef.current.value) {
                params.push(`subject=${encodeURIComponent(subjectRef.current.value)}`);
            }

            if (bodyRef.current.value) {
                params.push(`body=${encodeURIComponent(bodyRef.current.value)}`);
            }

            if (params.length > 0) {
                output += `?${params.join('&')}`;
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
