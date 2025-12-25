import { parse as csvParse } from "csv-parse/browser/esm/sync";
import { createSolidTable, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, sortingFns } from "@tanstack/solid-table";
import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { createFileRoute } from "@tanstack/solid-router";
import { compareItems, rankItem, type RankingInfo } from "@tanstack/match-sorter-utils";
import type { ColumnDef, FilterFn, SortingFn } from "@tanstack/solid-table";
import type { ChangeEvent } from "../../utils";

export const Route = createFileRoute("/csv_to_table/")({
    head: () => ({
        meta: [
            {
                title: "CSV Display in table",
            },
        ],
    }),
    component: ToolComponent,
});

declare module "@tanstack/solid-table" {
    // add fuzzy filter to the filterFns
    interface FilterFns {
        fuzzy: FilterFn<unknown>;
    }
    interface FilterMeta {
        itemRank: RankingInfo;
    }
}

function ToolComponent() {
    let csvTextboxRef: HTMLTextAreaElement | undefined;
    const [processedData, setProcessedData] = createSignal<Array<Array<string>>>([]);
    const [isFirstRowHeader, setIsFirstRowHeader] = createSignal<boolean>(true);
    const [isFirstRowSticky, setIsFirstRowSticky] = createSignal<boolean>(true);
    const [isTableFixed, setIsTableFixed] = createSignal<boolean>(false);
    let tableFixedInfoRef: HTMLSpanElement | undefined;
    const [filterQuery, setFilterQuery] = createSignal<string>("");

    createEffect(() => {
        if (tableFixedInfoRef) {
            new globalThis.bootstrap.Tooltip(tableFixedInfoRef);
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

    const tableColumnDefs = createMemo<Array<ColumnDef<Record<string, string>>>>(() => {
        const data = processedData();
        if (data.length > 0) {
            // Get longest row (most columns) and use that as the number of columns
            const numColumns = data.reduce((a, b) => a.length - b.length > 0 ? a : b).length;

            const headers: Array<ColumnDef<Record<string, string>>> = [{
                id: "__row_index",
                accessorKey: "__row_index",
                sortingFn: fuzzySort,
            }];

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

    const tableData = createMemo<Array<Record<string, string>>>(() => {
        const data = processedData();
        if (data.length > 0) {
            return data.map((row, rowIndex) => {
                const returnData: Record<string, string> = {
                    __row_index: rowIndex.toString(),
                };

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
        state: {
            get globalFilter() {
                return filterQuery();
            },
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        globalFilterFn: "fuzzy",
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        onGlobalFilterChange: setFilterQuery,
        initialState: {
            sorting: [
                { id: "__row_index", desc: false },
            ],
            columnVisibility: {
                __row_index: false,
            },
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
            <h1>CSV to table</h1>

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

            <Show when={processedData().length > 0}>
                <div class="row mb-3">
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

                <div class="my-3">
                    <input type="text" class="form-control" placeholder="Filter rows..." value={filterQuery()} onInput={(e) => { setFilterQuery(e.currentTarget.value); }} />
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
            </Show>
        </div>
    );
}

const fuzzyFilter: FilterFn<Record<string, string>> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value);

    // Store the itemRank info
    addMeta({
        itemRank,
    });

    // Return if the item should be filtered in/out
    return itemRank.passed;
};

// Define a custom fuzzy sort function that will sort by rank if the row has ranking information
const fuzzySort: SortingFn<Record<string, string>> = (rowA, rowB, columnId) => {
    // Helper to find the best (highest `rank`) itemRank from all column metas of a row
    const getBestItemRank = (row: typeof rowA) => {
        let best: RankingInfo | undefined = undefined;

        for (const metaKey in row.columnFiltersMeta) {
            if (row.columnFiltersMeta[metaKey]?.itemRank) {
                const ir = row.columnFiltersMeta[metaKey].itemRank;
                const rVal = ir.rank;
                if (best === undefined || rVal > best.rank) {
                    best = ir;
                }
            }
        }

        return best;
    };

    const bestA = getBestItemRank(rowA);
    const bestB = getBestItemRank(rowB);

    // If we have ranking info for both, use compareItems
    if (bestA && bestB) {
        const dir = compareItems(bestA, bestB);
        return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
    }

    // Fallback: alphanumeric comparison on the requested column
    return sortingFns.alphanumeric(rowA, rowB, columnId);
};
