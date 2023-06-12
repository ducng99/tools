import { type ChangeEvent } from 'react';
import { type BarcodeInputProps } from '..';

export default function InputNormalText({ updateText }: BarcodeInputProps) {
    function onChange(event: ChangeEvent<HTMLTextAreaElement>) {
        updateText(event.currentTarget.value);
    };

    return (
        <>
            <label className="form-label" htmlFor="barcode-text">Text:</label>
            <textarea className="form-control" id="barcode-text" rows={5} onChange={onChange}></textarea>
        </>
    );
}
