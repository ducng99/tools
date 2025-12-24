import { useEffect, useMemo, useRef, useState } from "react";
import { parse as csvParse } from "csv-parse/browser/esm/sync";
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import type { ChangeEvent } from "react";
import type { ColumnDef } from "@tanstack/react-table";

export function Component() {
    const csvTextboxRef = useRef<HTMLTextAreaElement>(null);
    const [processedData, setProcessedData] = useState<Array<Array<string>>>([]);
    const [isFirstRowHeader, setIsFirstRowHeader] = useState<boolean>(true);
    const [isFirstRowSticky, setIsFirstRowSticky] = useState<boolean>(true);
    const [isTabbleFixed, setIsTableFixed] = useState<boolean>(true);
    const tableFixedInfoRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        (async () => {
            const Tooltip = (await import("bootstrap/js/dist/tooltip")).default;
            new Tooltip(tableFixedInfoRef.current as HTMLElement);
        })();
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
            setProcessedData(csvParse(csvTextboxRef.current?.value ?? "", { relax_column_count: true }));
        }
    }

    const tableHeaders = useMemo<Array<ColumnDef<object>>>(() => {
        if (processedData.length > 0) {
            // Get longest row (most columns) and use that as the number of columns
            const numColumns = processedData.reduce((a, b) => a.length - b.length > 0 ? a : b).length;

            const headers: Array<ColumnDef<object>> = [];

            for (let i = 0; i < numColumns; i++) {
                headers.push({
                    header: processedData[0][i] ?? "",
                    accessorKey: `col${i}`,
                });
            }

            return headers;
        }

        return [];
    }, [JSON.stringify(processedData)]);

    const tableData = useMemo<Array<object>>(() => {
        if (processedData.length > 0) {
            return processedData.map((row) => {
                const returnData: Record<string, string> = {};

                row.forEach((cell, i) => {
                    returnData[`col${i}`] = cell;
                });

                return returnData;
            });
        }

        return [];
    }, [JSON.stringify(processedData)]);

    const table = useReactTable({
        data: tableData,
        columns: tableHeaders,
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

    const currentPageIndex = table.getState().pagination.pageIndex;

    return (
        <div class="container mt-5">
            <h1></h1>

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
                        <input class="form-check-input" type="checkbox" id="is-first-row-header" checked={isFirstRowHeader} onChange={() => { setIsFirstRowHeader(state => !state); }} />
                        <label class="form-check-label" for="is-first-row-header">First row is header</label>
                    </div>
                    <div class="col-12 col-md-4 form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="is-first-row-sticky" checked={isFirstRowSticky} onChange={() => { setIsFirstRowSticky(state => !state); }} />
                        <label class="form-check-label" for="is-first-row-sticky">First row is sticky</label>
                    </div>
                    <div class="col-12 col-md-4 form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="is-table-fixed" checked={isTabbleFixed} onChange={() => { setIsTableFixed(state => !state); }} />
                        <label class="form-check-label" for="is-table-fixed">Word-wrap cell content&nbsp;</label>
                        <span class="bg-dark text-light inline-circle" data-bs-toggle="tooltip" data-bs-title="If disabled, the table can be scrolled horizontally if it's too long" aria-label="Word wrap info" ref={tableFixedInfoRef}>
                            <i class="bi bi-info" />
                        </span>
                    </div>
                </div>
            </div>

            <div class={"row mb-3" + (table.getPageCount() == 0 ? " d-none" : "")}>
                <div class="col d-flex">
                    <nav aria-label="Table pages">
                        <ul class="pagination m-0">
                            <li class={"page-item" + (table.getCanPreviousPage() ? "" : " disabled")}>
                                <button class="page-link" onClick={() => { table.setPageIndex(0); }}>
                                    <i class="bi bi-chevron-double-left" />
                                    <span class="d-none d-md-inline">&nbsp;First</span>
                                </button>
                            </li>
                            <li class={"page-item" + (table.getCanPreviousPage() ? "" : " disabled")}>
                                <button class="page-link" onClick={() => { table.previousPage(); }}>
                                    <i class="bi bi-chevron-left" />
                                    <span class="d-none d-md-inline">&nbsp;Previous</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                    <div class="input-group mx-1 maxw-fit maxh-fit">
                        <span class="input-group-text">Page</span>
                        <input type="number" class="form-control" id="table-current-page" size={3} value={currentPageIndex + 1} onChange={(e) => { setTablePageIndex(parseInt(e.target.value) - 1); }} />
                        <span class="input-group-text">
                            /&nbsp;
                            {table.getPageCount()}
                        </span>
                    </div>
                    <nav aria-label="Table pages">
                        <ul class="pagination m-0">
                            <li class={"page-item " + (table.getCanNextPage() ? "" : "disabled")}>
                                <button class="page-link" onClick={() => { table.nextPage(); }}>
                                    <span class="d-none d-md-inline">Next&nbsp;</span>
                                    <i class="bi bi-chevron-right" />
                                </button>
                            </li>
                            <li class={"page-item " + (table.getCanNextPage() ? "" : "disabled")}>
                                <button class="page-link" onClick={() => { table.setPageIndex(table.getPageCount() - 1); }}>
                                    <span class="d-none d-md-inline">Last&nbsp;</span>
                                    <i class="bi bi-chevron-double-right" />
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>

                <div class="col d-flex justify-content-end align-items-center mt-3 mt-md-0">
                    <span>Show&nbsp;</span>
                    <select class="d-inline-block form-select maxw-fit maxh-fit" aria-label="Show rows per page" value={table.getState().pagination.pageSize} onChange={(e) => { setTablePageSize(parseInt(e.currentTarget.value)); }}>
                        {[10, 20, 50, 100, 200, 500, 1000, 5000, tableData.length].map(value => (
                            <option key={value} value={value}>{value === tableData.length ? "All" : value}</option>
                        ))}
                    </select>
                    &nbsp;rows
                </div>
            </div>

            <div class="table-responsive">
                <table class={"table table-striped table-bordered" + (isTabbleFixed ? " table-fixed" : "")}>
                    {
                        isFirstRowHeader && (
                            <thead>
                                {
                                    table.getHeaderGroups().map(headerGroup => (
                                        <tr class={isFirstRowSticky ? "sticky-top bg-white" : ""} key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
                                                <th key={header.id} colSpan={header.colSpan}>
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext(),
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    ))
                                }
                            </thead>
                        )
                    }
                    <tbody class={isFirstRowHeader ? "table-group-divider" : ""}>
                        {
                            table.getRowModel().rows.map((row) => {
                                if (isFirstRowHeader && row.index === 0) return null;

                                return (
                                    <tr class={isFirstRowSticky && row.index === 0 ? "sticky-top bg-white" : ""} key={row.id}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
}
