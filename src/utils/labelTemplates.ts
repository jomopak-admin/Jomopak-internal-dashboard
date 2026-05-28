/**
 * Label templates + print helper — Phase 65.
 *
 * Generates HTML+CSS for printable stock labels and opens them in a new
 * window with `window.print()` queued up. The browser's standard print
 * dialog hosts any label printer the OS knows about (Zebra ZD420,
 * Brother QL, Dymo, plain laser), so we don't have to maintain a separate
 * driver for each.
 *
 * Two label families:
 *
 *   • Thermal (1-up roll labels) — 50×30, 100×50, 100×100mm. Each item
 *     prints on its own page; the printer driver chops at the page break.
 *
 *   • A4 sheet labels — 2×7 (105×42), 3×8 (70×37), 4×10 (47×27). Items
 *     fill the sheet grid; the next sheet starts when the current page
 *     fills.
 *
 * Each label carries a code, a name, a small footer with extra context,
 * and a real Code128 barcode (via labelBarcode.ts) so it scans.
 */

import { encodeCode128 } from './labelBarcode';

export type LabelSize =
  | 'thermal-50x30'
  | 'thermal-100x50'
  | 'thermal-100x100'
  | 'a4-2x7'
  | 'a4-3x8'
  | 'a4-4x10';

export const LABEL_SIZES: { value: LabelSize; label: string; description: string }[] = [
  { value: 'thermal-50x30',  label: 'Thermal 50 × 30 mm',  description: 'Small thermal roll labels — spare parts, ink, glue, kitchen' },
  { value: 'thermal-100x50', label: 'Thermal 100 × 50 mm', description: 'Medium thermal roll labels — finished goods, materials, drums' },
  { value: 'thermal-100x100', label: 'Thermal 100 × 100 mm', description: 'Large thermal roll labels — pallets, big drums, finished bag stacks' },
  { value: 'a4-2x7',  label: 'A4 sheet — 2 × 7 (14 up, 105 × 42 mm)', description: 'Bulk runs on a laser/inkjet printer' },
  { value: 'a4-3x8',  label: 'A4 sheet — 3 × 8 (24 up, 70 × 37 mm)',  description: 'Standard Avery-compatible address labels' },
  { value: 'a4-4x10', label: 'A4 sheet — 4 × 10 (40 up, 47 × 27 mm)', description: 'High-density runs for small items' },
];

export interface LabelGeometry {
  pageWidthMm: number;
  pageHeightMm: number;
  cols: number;
  rows: number;
  labelWidthMm: number;
  labelHeightMm: number;
  gutterMm: number;
  /** Module width passed to the Code128 generator. Smaller labels need a
   *  thinner module to fit the barcode inside the printable area. */
  moduleWidthMm: number;
  barcodeHeightMm: number;
}

export function geometryFor(size: LabelSize): LabelGeometry {
  switch (size) {
    case 'thermal-50x30':
      return { pageWidthMm: 50, pageHeightMm: 30, cols: 1, rows: 1, labelWidthMm: 50, labelHeightMm: 30, gutterMm: 0, moduleWidthMm: 0.25, barcodeHeightMm: 8 };
    case 'thermal-100x50':
      return { pageWidthMm: 100, pageHeightMm: 50, cols: 1, rows: 1, labelWidthMm: 100, labelHeightMm: 50, gutterMm: 0, moduleWidthMm: 0.35, barcodeHeightMm: 12 };
    case 'thermal-100x100':
      return { pageWidthMm: 100, pageHeightMm: 100, cols: 1, rows: 1, labelWidthMm: 100, labelHeightMm: 100, gutterMm: 0, moduleWidthMm: 0.4, barcodeHeightMm: 16 };
    case 'a4-2x7':
      return { pageWidthMm: 210, pageHeightMm: 297, cols: 2, rows: 7, labelWidthMm: 105, labelHeightMm: 42, gutterMm: 0, moduleWidthMm: 0.3, barcodeHeightMm: 10 };
    case 'a4-3x8':
      return { pageWidthMm: 210, pageHeightMm: 297, cols: 3, rows: 8, labelWidthMm: 70, labelHeightMm: 37, gutterMm: 0, moduleWidthMm: 0.25, barcodeHeightMm: 9 };
    case 'a4-4x10':
      return { pageWidthMm: 210, pageHeightMm: 297, cols: 4, rows: 10, labelWidthMm: 52.5, labelHeightMm: 29.7, gutterMm: 0, moduleWidthMm: 0.2, barcodeHeightMm: 7 };
  }
}

/**
 * One label's worth of content. Keep these short: even the biggest
 * thermal label only has room for a code, a name, and 2-3 short footer
 * lines without overflowing.
 */
export interface LabelData {
  /** Main scannable identifier — printed as a Code128 barcode AND as
   *  large text above the bars. Examples: SPR-202605-001, RUN-..., FGS-... */
  code: string;
  /** Headline name — the part everyone reads. Truncated automatically
   *  at the relevant label width. */
  name: string;
  /** 1-4 short footer lines (each ~40 chars). Examples: client name,
   *  storage location, supplier batch number, quantity, GHS pictograms. */
  details?: string[];
  /** Optional small subtitle (printed at the top, above the name). E.g.
   *  category badge ("INK", "CHEMICAL", "DIE"). */
  badge?: string;
}

interface BuildOpts {
  size: LabelSize;
  /** Top of every page — printed once on thermal, once per page on A4. */
  brandName?: string;
}

/**
 * Build the full printable HTML for `labels` items at the requested
 * size. The caller hands the result to `openPrintWindow`.
 */
export function buildLabelSheetHtml(labels: LabelData[], opts: BuildOpts): string {
  const g = geometryFor(opts.size);
  const isThermal = opts.size.startsWith('thermal-');
  const labelsPerPage = g.cols * g.rows;
  const labelHtml = labels.map((l) => renderLabel(l, g, opts.brandName)).join('');

  // For thermal sizes we use one label per page. For A4 sheets we put
  // them in a CSS grid that wraps automatically; the page break logic
  // is handled by the printer driver / CSS @page rules.
  const sheetCss = isThermal
    ? `
      .label-page {
        width: ${g.pageWidthMm}mm;
        height: ${g.pageHeightMm}mm;
        page-break-after: always;
        overflow: hidden;
        box-sizing: border-box;
      }
      .label-page:last-child { page-break-after: auto; }
      @page { size: ${g.pageWidthMm}mm ${g.pageHeightMm}mm; margin: 0; }
    `
    : `
      .label-sheet {
        width: ${g.pageWidthMm}mm;
        display: grid;
        grid-template-columns: repeat(${g.cols}, ${g.labelWidthMm}mm);
        grid-auto-rows: ${g.labelHeightMm}mm;
      }
      .label-page {
        width: ${g.labelWidthMm}mm;
        height: ${g.labelHeightMm}mm;
        overflow: hidden;
        box-sizing: border-box;
        page-break-inside: avoid;
      }
      @page { size: A4; margin: 0; }
    `;

  // For A4 we have to manually insert page breaks between groups of
  // (cols × rows) labels so the printer knows when to advance.
  let body: string;
  if (isThermal) {
    body = labelHtml;
  } else {
    const pages: string[] = [];
    for (let i = 0; i < labels.length; i += labelsPerPage) {
      const slice = labels.slice(i, i + labelsPerPage)
        .map((l) => renderLabel(l, g, opts.brandName))
        .join('');
      pages.push(`<div class="label-sheet" style="page-break-after: always">${slice}</div>`);
    }
    body = pages.join('');
  }

  return `<!DOCTYPE html><html><head>
    <title>Labels — ${labels.length} item${labels.length === 1 ? '' : 's'}</title>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body { font-family: -apple-system, sans-serif; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .label-page {
        padding: 2mm;
        display: flex;
        flex-direction: column;
        gap: 1mm;
        border: ${isThermal ? '0' : '1px dashed #ccc'};
        font-size: 9pt;
        line-height: 1.15;
      }
      .label-brand { font-size: 6pt; text-transform: uppercase; letter-spacing: 0.04em; color: #555; }
      .label-badge { font-size: 6pt; text-transform: uppercase; letter-spacing: 0.05em; padding: 1px 4px; border: 1px solid #000; border-radius: 2px; display: inline-block; align-self: flex-start; }
      .label-code  { font-size: 11pt; font-weight: 700; letter-spacing: 0.02em; }
      .label-name  { font-weight: 600; font-size: 10pt; overflow: hidden; text-overflow: ellipsis; }
      .label-detail { font-size: 7pt; color: #222; }
      .label-barcode-wrap { margin-top: auto; }
      .label-barcode-wrap svg { width: 100%; height: auto; display: block; }
      ${sheetCss}
    </style></head>
    <body>${body}<script>window.print();</script></body></html>`;
}

function renderLabel(l: LabelData, g: LabelGeometry, brand?: string): string {
  const barcodeSvg = encodeCode128(l.code, {
    moduleWidthMm: g.moduleWidthMm,
    heightMm: g.barcodeHeightMm,
    showText: false,
  });
  const detailHtml = (l.details || [])
    .filter(Boolean)
    .map((d) => `<div class="label-detail">${escapeHtml(d)}</div>`)
    .join('');
  return `<div class="label-page">
    ${brand ? `<div class="label-brand">${escapeHtml(brand)}</div>` : ''}
    ${l.badge ? `<span class="label-badge">${escapeHtml(l.badge)}</span>` : ''}
    <div class="label-name">${escapeHtml(l.name)}</div>
    ${detailHtml}
    <div class="label-barcode-wrap">${barcodeSvg}<div class="label-code">${escapeHtml(l.code)}</div></div>
  </div>`;
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Open the print window with the prepared HTML. Returns false if the
 *  browser blocked the popup (in which case the caller can show a
 *  fallback "Save as PDF" link). */
export function openPrintWindow(html: string): boolean {
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}
