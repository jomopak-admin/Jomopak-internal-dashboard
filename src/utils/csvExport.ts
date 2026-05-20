/**
 * Tiny CSV export helper. Used by bulk actions to export selected rows.
 *
 * Why home-grown instead of papaparse? We already have csv read paths via
 * native browser APIs and the bulk export shape is simple — header row +
 * primitive cells. Keeping the dep surface small.
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Quote if it contains a delimiter, quote, or newline. Inner quotes get doubled.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(','));
  }
  // Prepend a UTF-8 BOM so Excel opens it without mangling diacritics — common
  // for client names like "Müller" or "Côté".
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
