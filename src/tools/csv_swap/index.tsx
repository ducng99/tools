import { type ChangeEvent, type FormEvent, useState, useEffect, useRef } from 'react';
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

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCsvTextOutput(swapColumnsRows(csvTextboxRef.current?.value ?? ''));
    }

    return (
        <div className="container mt-5">
            <h1>{title}</h1>

            <form className="mb-3" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="csv-input">Upload a CSV file or paste CSV text:</label>
                    <input type="file" className="form-control" id="csv-input" onChange={handleFileChange} />
                </div>
                <div className="form-group my-3">
                    <textarea className="form-control" placeholder="Or paste CSV text here" rows={10} ref={csvTextboxRef}></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Swap Columns and Rows</button>
            </form>

            <textarea className="form-control" rows={10} value={csvTextOutput} readOnly />
        </div>
    );
}
