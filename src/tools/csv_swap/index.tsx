import { type ChangeEvent, useState, useEffect, useRef } from 'react';
import { swapColumnsRows } from './extension';
import { useLoaderData } from 'react-router-dom';

export function Component() {
    const { title } = useLoaderData() as { title: string };

    const csvTextboxRef = useRef<HTMLTextAreaElement>(null);
    const [csvTextOutput, setCsvTextOutput] = useState('');

    useEffect(() => {
        document.title = title;
    }, []);

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
        if (csvTextboxRef.current?.value) {
            setCsvTextOutput(swapColumnsRows(csvTextboxRef.current.value));
        }
    }

    return (
        <div className="container mt-5">
            <h1>{title}</h1>

            <div className="mb-3">
                <div>
                    <label className="form-label" htmlFor="csv-file-upload">Upload a CSV file or paste CSV text:</label>
                    <input type="file" className="form-control" id="csv-file-upload" onChange={handleFileChange} />
                </div>
                <div className="my-3">
                    <textarea className="form-control" id="csv-textbox" placeholder="Or paste CSV text here" rows={10} ref={csvTextboxRef}></textarea>
                </div>
                <button type="button" className="btn btn-primary" id="trigger-button" onClick={handleSubmit}>Swap Columns and Rows</button>
            </div>

            <textarea className="form-control" id="output-textbox" rows={10} value={csvTextOutput} readOnly />
        </div>
    );
}
