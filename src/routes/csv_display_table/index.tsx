import { parse as csvParse } from "csv-parse/browser/esm/sync";
import { createSolidTable, flexRender, getCoreRowModel, getPaginationRowModel } from "@tanstack/solid-table";
import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { createFileRoute } from "@tanstack/solid-router";
import { Tooltip } from "bootstrap";
import type { ColumnDef } from "@tanstack/solid-table";
import type { ChangeEvent } from "../../utils";

export const Route = createFileRoute("/csv_display_table/")({
    head: () => ({
        meta: [
            {
                title: "CSV Display in table",
            },
        ],
    }),
    component: ToolComponent,
});

function ToolComponent() {
    let csvTextboxRef: HTMLTextAreaElement | undefined;
    const [processedData, setProcessedData] = createSignal<Array<Array<string>>>([]);
    const [isFirstRowHeader, setIsFirstRowHeader] = createSignal<boolean>(true);
    const [isFirstRowSticky, setIsFirstRowSticky] = createSignal<boolean>(true);
    const [isTableFixed, setIsTableFixed] = createSignal<boolean>(false);
    let tableFixedInfoRef: HTMLSpanElement | undefined;

    createEffect(() => {
        if (tableFixedInfoRef) {
            new Tooltip(tableFixedInfoRef);
        }
    });

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
        if (csvTextboxRef?.value) {
            const data = csvParse(csvTextboxRef.value, { relax_column_count: true });
            setProcessedData(data);
        }
    }

    const tableColumnDefs = createMemo<Array<ColumnDef<object>>>(() => {
        const data = processedData();
        if (data.length > 0) {
            // Get longest row (most columns) and use that as the number of columns
            const numColumns = data.reduce((a, b) => a.length - b.length > 0 ? a : b).length;

            const headers: Array<ColumnDef<object>> = [];

            for (let i = 0; i < numColumns; i++) {
                headers.push({
                    header: data[0][i] ?? `unkn-col-${i}`,
                    accessorKey: `col${i}`,
                });
            }

            return headers;
        }

        return [];
    });

    const tableData = createMemo<Array<object>>(() => {
        const data = processedData();
        if (data.length > 0) {
            return data.map((row) => {
                const returnData: Record<string, string> = {};

                row.forEach((cell, i) => {
                    returnData[`col${i}`] = cell;
                });

                return returnData;
            });
        }

        return [];
    });

    const table = createSolidTable({
        get data() {
            return tableData();
        },
        get columns() {
            return tableColumnDefs();
        },
        // Pipeline
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: 20,
            },
        },
    });

    const setTablePageIndex = (index: number) => {
        if (index >= 0 && index < table.getPageCount()) {
            table.setPageIndex(index);
        }
    };

    const setTablePageSize = (size: number) => {
        if (size > 0) {
            table.setPageSize(size);
        }
    };

    return (
        <div class="container mt-5">
            <h1>CSV Display in table</h1>

            <div class="mb-3">
                <div>
                    <label class="form-label" for="csv-input">Upload a CSV file or paste CSV text:</label>
                    <input type="file" class="form-control" id="csv-input" onChange={handleFileChange} />
                </div>
                <div class="my-3">
                    <textarea class="form-control" placeholder="Or paste CSV text here" rows={10} ref={csvTextboxRef}></textarea>
                </div>
                <button type="button" class="btn btn-primary" onClick={handleSubmit}>Display ✨</button>
            </div>

            <div class="container">
                <div class="row border p-3 my-3 rounded">
                    <div class="col-12 col-md-4 form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="is-first-row-header" checked={isFirstRowHeader()} onChange={() => { setIsFirstRowHeader(state => !state); }} />
                        <label class="form-check-label" for="is-first-row-header">First row is header</label>
                    </div>
                    <div class="col-12 col-md-4 form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="is-first-row-sticky" checked={isFirstRowSticky()} onChange={() => { setIsFirstRowSticky(state => !state); }} />
                        <label class="form-check-label" for="is-first-row-sticky">First row is sticky</label>
                    </div>
                    <div class="col-12 col-md-4 form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="is-table-fixed" checked={isTableFixed()} onChange={() => { setIsTableFixed(state => !state); }} />
                        <label class="form-check-label" for="is-table-fixed">{"Word-wrap cell content "}</label>
                        <span class="bg-dark text-light inline-circle" data-bs-toggle="tooltip" data-bs-title="If disabled, the table can be scrolled horizontally if it's too long" aria-label="Word wrap info" ref={tableFixedInfoRef}>
                            <i class="bi bi-info" />
                        </span>
                    </div>
                </div>
            </div>

            <div class="row mb-3" classList={{ "d-none": table.getPageCount() == 0 }}>
                <div class="col d-flex">
                    <nav aria-label="Table pages">
                        <ul class="pagination m-0">
                            <li classList={{ "page-item": true, "disabled": !table.getCanPreviousPage() }}>
                                <button class="page-link" onClick={() => { table.setPageIndex(0); }}>
                                    <i class="bi bi-chevron-double-left" />
                                    <span class="d-none d-md-inline">{" First"}</span>
                                </button>
                            </li>
                            <li classList={{ "page-item": true, "disabled": !table.getCanPreviousPage() }}>
                                <button class="page-link" onClick={() => { table.previousPage(); }}>
                                    <i class="bi bi-chevron-left" />
                                    <span class="d-none d-md-inline">{" Previous"}</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                    <div class="input-group mx-1 maxw-fit maxh-fit">
                        <span class="input-group-text">Page</span>
                        <input type="number" class="form-control" id="table-current-page" size={3} value={table.getState().pagination.pageIndex + 1} onChange={(e) => { setTablePageIndex(parseInt(e.target.value) - 1); }} />
                        <span class="input-group-text">
                            /
                            {" " + table.getPageCount()}
                        </span>
                    </div>
                    <nav aria-label="Table pages">
                        <ul class="pagination m-0">
                            <li classList={{ "page-item": true, "disabled": !table.getCanNextPage() }}>
                                <button class="page-link" onClick={() => { table.nextPage(); }}>
                                    <span class="d-none d-md-inline">{"Next "}</span>
                                    <i class="bi bi-chevron-right" />
                                </button>
                            </li>
                            <li classList={{ "page-item": true, "disabled": !table.getCanNextPage() }}>
                                <button class="page-link" onClick={() => { table.setPageIndex(table.getPageCount() - 1); }}>
                                    <span class="d-none d-md-inline">{"Last "}</span>
                                    <i class="bi bi-chevron-double-right" />
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>

                <div class="col d-flex justify-content-end align-items-center mt-3 mt-md-0">
                    <span>{"Show "}</span>
                    <select class="d-inline-block form-select maxw-fit maxh-fit" aria-label="Show rows per page" value={table.getState().pagination.pageSize} onChange={(e) => { setTablePageSize(parseInt(e.currentTarget.value)); }}>
                        <For each={[20, 50, 100, 200, 500, 1000, 5000, tableData().length]}>
                            {value => (
                                <option value={value}>{value === tableData().length ? "All" : value}</option>
                            )}
                        </For>
                    </select>
                    {" rows"}
                </div>
            </div>

            <div class="d-flex justify-content-center">
                <table class="table table-striped table-bordered" classList={{ "table-fixed": isTableFixed() }}>
                    <Show when={isFirstRowHeader()}>
                        <thead>
                            <For each={table.getHeaderGroups()}>
                                {headerGroup => (
                                    <tr>
                                        <For each={headerGroup.headers}>
                                            {header => (
                                                <th classList={{ "sticky-top": isFirstRowSticky() }} colSpan={header.colSpan}>
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext(),
                                                    )}
                                                </th>
                                            )}
                                        </For>
                                    </tr>
                                )}
                            </For>
                        </thead>
                    </Show>
                    <tbody classList={{ "table-group-divider": isFirstRowHeader() }}>
                        <For each={table.getRowModel().rows}>
                            {row => (
                                <Show when={!isFirstRowHeader() || row.index > 0}>
                                    <tr>
                                        <For each={row.getVisibleCells()}>
                                            {cell => (
                                                <td classList={{ "sticky-top": isFirstRowSticky() && row.index === 0 }}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext(),
                                                    )}
                                                </td>
                                            )}
                                        </For>
                                    </tr>
                                </Show>
                            )}
                        </For>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
