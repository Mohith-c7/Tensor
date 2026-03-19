/**
 * Export data as a CSV file download.
 * Requirements: 6.14, 8.10
 */
export function exportToCsv(
  filename: string,
  rows: Record<string, unknown>[],
  headers: { key: string; label: string }[]
): void {
  const escape = (val: unknown): string => {
    const str = val === null || val === undefined ? '' : String(val);
    // Wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map((h) => escape(h.label)).join(',');
  const dataRows = rows.map((row) =>
    headers.map((h) => escape(row[h.key])).join(',')
  );

  const csv = [headerRow, ...dataRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
