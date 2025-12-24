import { createFileRoute } from "@tanstack/solid-router";
import { swapColumnsRows } from "./-extension";
import type { ChangeEvent } from "../../utils";

export const Route = createFileRoute("/csv_swap/")({
    head: () => ({
        meta: [
            {
                title: "CSV Swap Columns and Rows",
            },
        ],
    }),
    component: ToolComponent,
});

function ToolComponent() {
    let csvTextboxRef: HTMLTextAreaElement | undefined;
    let csvTextOutputRef: HTMLTextAreaElement | undefined;

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.currentTarget.files && event.currentTarget.files.length > 0) {
            const file = event.currentTarget.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                if (csvTextboxRef) {
                    csvTextboxRef.value = e.target?.result as string;
                }
            };
            reader.readAsText(file);
        }
    }

    function handleSubmit() {
        if (csvTextOutputRef && csvTextboxRef?.value) {
            csvTextOutputRef.value = swapColumnsRows(csvTextboxRef.value);
        }
    }

    return (
        <div class="container mt-5">
            <h1>CSV Swap Columns and Rows</h1>

            <div class="mb-3">
                <div>
                    <label class="form-label" for="csv-file-upload">Upload a CSV file or paste CSV text:</label>
                    <input type="file" class="form-control" id="csv-file-upload" onChange={handleFileChange} />
                </div>
                <div class="my-3">
                    <textarea class="form-control" id="csv-textbox" placeholder="Or paste CSV text here" rows={10} ref={csvTextboxRef}></textarea>
                </div>
                <button type="button" class="btn btn-primary" id="trigger-button" onClick={handleSubmit}>Swap Columns and Rows</button>
            </div>

            <textarea class="form-control" id="output-textbox" rows={10} readOnly ref={csvTextOutputRef} />
        </div>
    );
}
