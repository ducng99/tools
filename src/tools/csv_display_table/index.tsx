import { type ChangeEvent, useState, useEffect, useRef, useMemo } from 'react';
import { parse as csvParse } from 'csv-parse/browser/esm/sync';
import { useLoaderData } from 'react-router-dom';
import { type ColumnDef, useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';

export function Component() {
    const { title } = useLoaderData() as { title: string };

    const csvTextboxRef = useRef<HTMLTextAreaElement>(null);
    const [processedData, setProcessedData] = useState<string[][]>([]);
    const [isFirstRowHeader, setIsFirstRowHeader] = useState<boolean>(false);
    const [isFirstRowSticky, setIsFirstRowSticky] = useState<boolean>(false);

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
            setProcessedData(csvParse(csvTextboxRef.current?.value ?? '', { relax_column_count: true }));
        }
    }

    const tableHeaders = useMemo<Array<ColumnDef<object>>>(() => {
        if (processedData.length > 0) {
            // Get longest row (most columns) and use that as the header
            return processedData.reduce((a, b) => a.length - b.length > 0 ? a : b).map((cell, i) => (
                {
                    header: cell,
                    accessorKey: `col${i}`
                }
            ));
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
        getCoreRowModel: getCoreRowModel()
    });

    return (
        <div className="container mt-5">
            <h1>{title}</h1>

            <div className="mb-3">
                <div className="form-group">
                    <label className="form-label" htmlFor="csv-input">Upload a CSV file or paste CSV text:</label>
                    <input type="file" className="form-control" id="csv-input" onChange={handleFileChange} />
                </div>
                <div className="form-group my-3">
                    <textarea className="form-control" placeholder="Or paste CSV text here" rows={10} ref={csvTextboxRef}></textarea>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>Display ✨</button>
            </div>

            <div className="border p-3 my-3 rounded">
                <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="is-first-row-header" checked={isFirstRowHeader} onChange={() => { setIsFirstRowHeader(state => !state); }} />
                    <label className="form-check-label" htmlFor="is-first-row-header">First row is header</label>
                </div>
                <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="is-first-row-sticky" checked={isFirstRowSticky} onChange={() => { setIsFirstRowSticky(state => !state); }} />
                    <label className="form-check-label" htmlFor="is-first-row-sticky">First row is sticky</label>
                </div>
            </div>

            <table className="table table-striped table-bordered">
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
    );
}
