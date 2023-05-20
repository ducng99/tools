import { type ChangeEvent, useRef } from 'react';
import { swapColumnsRows } from './extension';

export function Component() {
    const csvTextboxRef = useRef<HTMLTextAreaElement>(null);
    const csvTextOutputRef = useRef<HTMLTextAreaElement>(null);

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                if (csvTextboxRef.current) {
                    csvTextboxRef.current.value = e.target?.result as string;
                }
            };
            reader.readAsText(file);
        }
    }

    function handleSubmit() {
        if (csvTextOutputRef.current && csvTextboxRef.current?.value) {
            csvTextOutputRef.current.value = swapColumnsRows(csvTextboxRef.current.value);
        }
    }

    return (
        <div className="container mt-5">
            <h1>{document.title}</h1>

            <div className="mb-3">
                <div>
                    <label className="form-label" htmlFor="csv-input">Upload a CSV file or paste CSV text:</label>
                    <input type="file" className="form-control" id="csv-input" onChange={handleFileChange} />
                </div>
                <div className="my-3">
                    <textarea className="form-control" placeholder="Or paste CSV text here" rows={10} ref={csvTextboxRef}></textarea>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>Swap Columns and Rows</button>
            </div>

            <textarea className="form-control" id="output-textbox" rows={10} readOnly ref={csvTextOutputRef} />
        </div>
    );
}
