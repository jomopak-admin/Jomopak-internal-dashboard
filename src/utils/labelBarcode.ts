/**
 * Code128 barcode encoder — Phase 65.
 *
 * Produces a scannable SVG barcode from an input string. Pure TypeScript,
 * no external dependencies. Implements Code128B (the most useful subset
 * for our identifiers — codes like SPR-202605-001, FGS-..., etc.) plus a
 * single Code128A fallback for any character outside the 32-127 ASCII
 * range.
 *
 * Why Code128B?
 *   • Spare-part / dispatch / job / tool codes all contain digits, dashes,
 *     and capital letters — all within ASCII 32-127.
 *   • A real thermal-printer barcode is much faster to scan than typing.
 *   • The Code128B pattern table is small (107 entries) and well-known,
 *     so no need to ship a heavy barcode library.
 *
 * The encoded SVG is sized in millimetres so it prints at a known
 * physical width regardless of viewport. Module width defaults to 0.35mm
 * which gives a reliable scan at 203dpi on a 50mm-wide thermal label.
 */

// Code128 pattern table — each entry is 11 modules (1 = bar, 0 = space).
// Values 0-103 are encodable characters; 103 is START_A, 104 is START_B,
// 105 is START_C. The stop pattern is appended separately and is wider
// (13 modules) so the scanner can find the trailing edge.
const PATTERNS: ReadonlyArray<string> = [
  '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
  '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
  '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
  '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
  '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
  '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
  '11011011000', '11011000110', '11000110110', '10100011000', '10001011000',
  '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
  '11000101000', '11000100010', '10110111000', '10110001110', '10001101110',
  '10111011000', '10111000110', '10001110110', '11101110110', '11010001110',
  '11000101110', '11011101000', '11011100010', '11011101110', '11101011000',
  '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
  '11101111010', '11001000010', '11110001010', '10100110000', '10100001100',
  '10010110000', '10010000110', '10000101100', '10000100110', '10110010000',
  '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
  '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
  '10100111100', '10010111100', '10010011110', '10111100100', '10011110100',
  '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
  '11011110110', '11110110110', '10101111000', '10100011110', '10001011110',
  '10111101000', '10111100010', '11110101000', '11110100010', '10111011110',
  '10111101110', '11101011110', '11110101110', '10100100110', '10011010000',
  '11010011000', '11010011110',
];
const STOP = '1100011101011';

const START_A = 103;
const START_B = 104;
// const START_C = 105; — Code C is digit-pair compression, not needed here.

/**
 * Encode `text` into a Code128 SVG string. Returns SVG markup that can be
 * dropped directly into the DOM or a printable HTML window.
 *
 * @param text Up to ~30 characters. Longer barcodes get unscannable at
 *             small label sizes — caller should truncate gracefully.
 * @param opts.moduleWidthMm Narrow-bar width in millimetres. Defaults to
 *                            0.35mm (203 DPI thermal). Increase to 0.5mm
 *                            for larger labels.
 * @param opts.heightMm Bar height in millimetres. Defaults to 12mm.
 * @param opts.showText Render the human-readable text below. Default true.
 */
export function encodeCode128(text: string, opts: {
  moduleWidthMm?: number;
  heightMm?: number;
  showText?: boolean;
} = {}): string {
  const moduleWidthMm = opts.moduleWidthMm ?? 0.35;
  const heightMm = opts.heightMm ?? 12;
  const showText = opts.showText !== false;
  const clean = String(text || '').slice(0, 60);
  if (!clean) {
    // Render an empty placeholder so the caller's layout doesn't shift.
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${moduleWidthMm * 20}mm" height="${heightMm}mm"></svg>`;
  }

  // Build the value list. Most of our codes use only Code B characters
  // (ASCII 32-127). We fall back to Code A for anything below ASCII 32.
  const values: number[] = [];
  let useA = false;
  for (const ch of clean) {
    const code = ch.charCodeAt(0);
    if (code < 32) { useA = true; break; }
  }
  values.push(useA ? START_A : START_B);
  for (const ch of clean) {
    const code = ch.charCodeAt(0);
    if (useA) {
      // Code A: maps ASCII 0-31 → 64-95, 32-95 → 0-63.
      if (code >= 0 && code <= 31) values.push(code + 64);
      else if (code >= 32 && code <= 95) values.push(code - 32);
      else values.push(0); // bail out for anything else (rare)
    } else {
      // Code B: ASCII 32-127 → value 0-95.
      if (code >= 32 && code <= 127) values.push(code - 32);
      else values.push(0);
    }
  }
  // Checksum: weighted modulo 103 of all values (start uses weight 1,
  // first data char uses weight 1, second uses 2, third uses 3, ...).
  let sum = values[0];
  for (let i = 1; i < values.length; i++) sum += values[i] * i;
  const check = sum % 103;
  values.push(check);

  // Concatenate the bar/space patterns + STOP.
  const bits = values.map((v) => PATTERNS[v]).join('') + STOP;

  // Walk the bit string and emit a <rect> for each bar (consecutive 1s).
  const rects: string[] = [];
  let xMm = 0;
  let i = 0;
  while (i < bits.length) {
    if (bits[i] === '1') {
      let runLen = 0;
      while (i < bits.length && bits[i] === '1') { runLen++; i++; }
      rects.push(`<rect x="${xMm.toFixed(3)}" y="0" width="${(runLen * moduleWidthMm).toFixed(3)}" height="${heightMm}" fill="#000" />`);
      xMm += runLen * moduleWidthMm;
    } else {
      let runLen = 0;
      while (i < bits.length && bits[i] === '0') { runLen++; i++; }
      xMm += runLen * moduleWidthMm;
    }
  }
  const totalWidthMm = xMm;
  const textBlock = showText
    ? `<text x="${(totalWidthMm / 2).toFixed(3)}" y="${(heightMm + 3).toFixed(3)}" font-family="-apple-system, sans-serif" font-size="3" text-anchor="middle" fill="#111">${escapeXml(clean)}</text>`
    : '';
  const svgHeight = heightMm + (showText ? 4 : 0);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidthMm.toFixed(3)}mm" height="${svgHeight.toFixed(3)}mm" viewBox="0 0 ${totalWidthMm.toFixed(3)} ${svgHeight.toFixed(3)}">${rects.join('')}${textBlock}</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
