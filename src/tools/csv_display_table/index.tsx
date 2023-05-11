import { type ChangeEvent, type FormEvent, useState } from 'react';
import * as csv from 'csv-parse/browser/esm/sync';

export default function CSV_Display_Table() {
    const [csvText, setCsvText] = useState('');
    const [processedData, setProcessedData] = useState<any[][]>([]);

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                setCsvText(e.target?.result as string);
            };
            reader.readAsText(file);
        }
    }

    function handlePaste(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setCsvText(event.currentTarget.value);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setProcessedData(csv.parse(csvText, { relax_column_count: true }));
    }

    return (
        <div className="container mt-5">
            <h1>CSV Display Table</h1>

            <form className="mb-3" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="csv-input">Upload a CSV file or paste CSV text:</label>
                    <input type="file" className="form-control" id="csv-input" onChange={handleFileChange} />
                </div>
                <div className="form-group my-3">
                    <textarea className="form-control" placeholder="Or paste CSV text here" onChange={handlePaste} value={csvText}></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Display ✨</button>
            </form>

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
