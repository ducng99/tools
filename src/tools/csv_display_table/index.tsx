import { type ChangeEvent, useState, useEffect, useRef, useMemo } from 'react';
import { parse as csvParse } from 'csv-parse/browser/esm/sync';
import { type ColumnDef, useReactTable, getCoreRowModel, flexRender, getPaginationRowModel } from '@tanstack/react-table';

export function Component() {
    const csvTextboxRef = useRef<HTMLTextAreaElement>(null);
    const [processedData, setProcessedData] = useState<string[][]>([]);
    const [isFirstRowHeader, setIsFirstRowHeader] = useState<boolean>(true);
    const [isFirstRowSticky, setIsFirstRowSticky] = useState<boolean>(true);
    const [isTabbleFixed, setIsTableFixed] = useState<boolean>(true);
    const tableFixedInfoRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        (async () => {
            const Tooltip = (await import('bootstrap/js/dist/tooltip')).default;
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
            setProcessedData(csvParse(csvTextboxRef.current?.value ?? '', { relax_column_count: true }));
        }
    }

    const tableHeaders = useMemo<Array<ColumnDef<object>>>(() => {
        if (processedData.length > 0) {
            // Get longest row (most columns) and use that as the number of columns
            const numColumns = processedData.reduce((a, b) => a.length - b.length > 0 ? a : b).length;

            const headers: Array<ColumnDef<object>> = [];

            for (let i = 0; i < numColumns; i++) {
                headers.push({
                    header: processedData[0][i] ?? '',
                    accessorKey: `col${i}`
                });
            }

            return headers;
        }

        return [];
    }, [JSON.stringify(processedData)]);

    const tableData = useMemo<object[]>(() => {
        if (processedData.length > 0) {
            return processedData.map(row => {
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
                pageSize: 20
            }
        }
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
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>Display ✨</button>
            </div>

            <div className="container">
                <div className="row border p-3 my-3 rounded">
                    <div className="col-12 col-md-4 form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="is-first-row-header" checked={isFirstRowHeader} onChange={() => { setIsFirstRowHeader(state => !state); }} />
                        <label className="form-check-label" htmlFor="is-first-row-header">First row is header</label>
                    </div>
                    <div className="col-12 col-md-4 form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="is-first-row-sticky" checked={isFirstRowSticky} onChange={() => { setIsFirstRowSticky(state => !state); }} />
                        <label className="form-check-label" htmlFor="is-first-row-sticky">First row is sticky</label>
                    </div>
                    <div className="col-12 col-md-4 form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="is-table-fixed" checked={isTabbleFixed} onChange={() => { setIsTableFixed(state => !state); }} />
                        <label className="form-check-label" htmlFor="is-table-fixed">Word-wrap cell content&nbsp;</label>
                        <span className="bg-dark text-light inline-circle" data-bs-toggle="tooltip" data-bs-title="If disabled, the table can be scrolled horizontally if it's too long" aria-label="Word wrap info" ref={tableFixedInfoRef}>
                            <i className="bi bi-info" />
                        </span>
                    </div>
                </div>
            </div>

            <div className={'row mb-3' + (table.getPageCount() == 0 ? ' d-none' : '')}>
                <div className="col d-flex">
                    <nav aria-label="Table pages">
                        <ul className="pagination m-0">
                            <li className={'page-item' + (table.getCanPreviousPage() ? '' : ' disabled')}>
                                <button className="page-link" onClick={() => { table.setPageIndex(0); }}>
                                    <i className="bi bi-chevron-double-left" />
                                    <span className="d-none d-md-inline">&nbsp;First</span>
                                </button>
                            </li>
                            <li className={'page-item' + (table.getCanPreviousPage() ? '' : ' disabled')}>
                                <button className="page-link" onClick={() => { table.previousPage(); }}>
                                    <i className="bi bi-chevron-left" />
                                    <span className="d-none d-md-inline">&nbsp;Previous</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                    <div className="input-group mx-1 w-fit-content h-fit-content">
                        <span className="input-group-text">Page</span>
                        <input type="number" className="form-control" id="table-current-page" size={3} value={currentPageIndex + 1} onChange={(e) => { setTablePageIndex(parseInt(e.target.value) - 1); }} />
                        <span className="input-group-text">/&nbsp;{table.getPageCount()}</span>
                    </div>
                    <nav aria-label="Table pages">
                        <ul className="pagination m-0">
                            <li className={'page-item ' + (table.getCanNextPage() ? '' : 'disabled')}>
                                <button className="page-link" onClick={() => { table.nextPage(); }}>
                                    <span className="d-none d-md-inline">Next&nbsp;</span>
                                    <i className="bi bi-chevron-right" />
                                </button>
                            </li>
                            <li className={'page-item ' + (table.getCanNextPage() ? '' : 'disabled')}>
                                <button className="page-link" onClick={() => { table.setPageIndex(table.getPageCount() - 1); }}>
                                    <span className="d-none d-md-inline">Last&nbsp;</span>
                                    <i className="bi bi-chevron-double-right" />
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>

                <div className="col d-flex justify-content-end align-items-center mt-3 mt-md-0">
                    <span>Show&nbsp;</span>
                    <select className="d-inline-block form-select w-fit-content h-fit-content" aria-label="Show rows per page" value={table.getState().pagination.pageSize} onChange={(e) => { setTablePageSize(parseInt(e.currentTarget.value)); }}>
                        {[10, 20, 50, 100, 200, 500, 1000, 5000, tableData.length].map(value => (
                            <option key={value} value={value}>{value === tableData.length ? 'All' : value}</option>
                        ))}
                    </select>
                    &nbsp;rows
                </div>
            </div>

            <div className="table-responsive">
                <table className={'table table-striped table-bordered' + (isTabbleFixed ? ' table-fixed' : '')}>
                    {
                        isFirstRowHeader && (
                            <thead>
                                {
                                    table.getHeaderGroups().map(headerGroup => (
                                        <tr className={ isFirstRowSticky ? 'sticky-top bg-white' : ''} key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
                                                <th key={header.id} colSpan={header.colSpan}>
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    ))
                                }
                            </thead>
                        )
                    }
                    <tbody className={isFirstRowHeader ? 'table-group-divider' : ''}>
                        {
                            table.getRowModel().rows.map(row => {
                                if (isFirstRowHeader && row.index === 0) return null;

                                return (
                                    <tr className={isFirstRowSticky && row.index === 0 ? 'sticky-top bg-white' : ''} key={row.id}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
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
