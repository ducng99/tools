export function swapColumnsRows(csvText: string): string {
    const lines = csvText.split("\n").filter(line => line.trim() !== "");
    const rows = lines.map(line => line.split(","));
    const columns = rows[0].map((_, i) => rows.map(row => row[i]));
    const swappedRows = columns.map(column => column.join(","));
    return swappedRows.join("\n");
}
