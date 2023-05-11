import { type ChangeEvent, useState, useEffect, useRef } from 'react';
import * as csv from 'csv-parse/browser/esm/sync';

export default function CSV_Display_Table() {
    const csvTextboxRef = useRef<HTMLTextAreaElement>(null);
    const [processedData, setProcessedData] = useState<string[][]>([]);

    useEffect(() => {
        document.title = 'CSV Display Table';
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
        setProcessedData(csv.parse(csvTextboxRef.current?.value ?? '', { relax_column_count: true }));
    }

    return (
        <div className="container mt-5">
            <h1>CSV Display Table</h1>

            <div className="mb-3">
                <div className="form-group">
                    <label htmlFor="csv-input">Upload a CSV file or paste CSV text:</label>
                    <input type="file" className="form-control" id="csv-input" onChange={handleFileChange} />
                </div>
                <div className="form-group my-3">
                    <textarea className="form-control" placeholder="Or paste CSV text here" ref={csvTextboxRef}></textarea>
                </div>
                <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Display ✨</button>
            </div>

            <table className="table table-striped table-bordered">
                <tbody>
                    {processedData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
