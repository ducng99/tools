import { ChangeEvent, FormEvent, useState } from "react";
import { swapColumnsRows } from "./extension";

function CSV_Swap() {
	const [csvText, setCsvText] = useState('');
	const [csvTextOutput, setCsvTextOutput] = useState('');

	function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files![0];
		const reader = new FileReader();
		reader.onload = (e) => {
			setCsvText(e.target?.result as string);
		};
		reader.readAsText(file);
	}

	function handlePaste(event: ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) {
		setCsvText(event.currentTarget.value);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setCsvTextOutput(swapColumnsRows(csvText));
	}

	return (
		<div className="container mt-5">
			<h1>CSV Column Swapper</h1>

			<form className="mb-3" onSubmit={handleSubmit}>
				<div className="form-group">
					<label htmlFor="csv-input">Upload a CSV file or paste CSV text:</label>
					<input type="file" className="form-control" id="csv-input" onChange={handleFileChange} />
				</div>
				<div className="form-group my-3">
					<textarea className="form-control" placeholder="Or paste CSV text here" onChange={handlePaste} value={csvText}></textarea>
				</div>
				<button type="submit" className="btn btn-primary">Swap Columns and Rows</button>
			</form>

			<textarea className="form-control" rows={10} value={csvTextOutput} readOnly />
		</div>
	);
}

export default CSV_Swap;