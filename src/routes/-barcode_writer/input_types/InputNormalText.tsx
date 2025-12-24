import { type ChangeEvent } from 'react';
import { type BarcodeInputProps } from '..';

export default function InputNormalText({ updateText }: BarcodeInputProps) {
    function onChange(event: ChangeEvent<HTMLTextAreaElement>) {
        updateText(event.currentTarget.value);
    };

    return (
        <>
            <label class="form-label" for="barcode-text">Text:</label>
            <textarea class="form-control" id="barcode-text" rows={5} onChange={onChange}></textarea>
        </>
    );
}
