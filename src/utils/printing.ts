/**
 * Phase 114 — Shared print letterhead.
 *
 * Every printable document the dashboard generates (warnings, stock
 * statements, invoices, delivery notes, payslips, UI-19, IRP5, POD, etc.)
 * must use the same letterhead pulled from app_settings.company. Without
 * this helper each page rebuilt its own header inline — so uploading a new
 * logo only propagated to a handful of docs.
 *
 * Two exports:
 *   - buildLetterhead(company, opts) — the top-of-page logo + black bar
 *   - buildPrintShell(company, title, bodyHtml) — full <!doctype html>
 *     wrapper with a standard print stylesheet, the letterhead, and a
 *     footer slot. Use this for any new printable.
 *
 * Logo behaviour:
 *   - If company.logoUrl is set, renders <img src=...>. Works with any URL
 *     the dashboard supports (Supabase Storage public URL, data:..., http).
 *   - If empty, falls back to the bubble JomoPak / "PAPER BAGS" wordmark
 *     so a fresh-install dashboard still prints a presentable letterhead.
 *
 * The HTML is fully inlined (no <style> blocks) so it survives Gmail /
 * Outlook stripping when used as the body of an outbound email.
 */

import { AppSettingsCompany, BrandLogo, DocumentKind } from '../types';

/** Sensible defaults so a missing company config doesn't blow up the render. */
const FALLBACK_COMPANY: AppSettingsCompany = {
  name: 'JomoPak',
  legalName: '',
  addressLine1: '',
  addressLine2: '',
  phone: '',
  email: '',
  vatNumber: '',
  logoUrl: '',
};

export interface LetterheadOptions {
  /** Optional document title shown to the right of the logo (e.g. "Stock Statement"). */
  rightTitle?: string;
  /** Optional sub-line under the title (e.g. document number, date range). */
  rightSubtitle?: string;
  /** Force the logo at a specific pixel height. Default 110px — matches the
   *  size used on the existing Reuben warning letter so spacing is stable. */
  logoHeightPx?: number;
  /** Show the thick black rule under the logo (true on letters, false on
   *  compact docs like POD chits). Default true. */
  showDivider?: boolean;
  /** Phase 115 — Which kind of document is this? The resolver uses this to
   *  pick the right logo from the brand library (e.g. invoices use the
   *  main mark, audit certificates use the FSC-certified mark). When
   *  omitted, the default-flagged logo wins. */
  documentKind?: DocumentKind;
  /** Phase 115 — The full brand library. Pass appSettings.brandLogos here
   *  so the resolver can pick the right one. */
  brandLogos?: BrandLogo[];
  /** Optional explicit override — used by the print-time picker when the
   *  admin manually overrides the auto-resolved logo for one print run. */
  overrideLogoUrl?: string;
  /** Phase 116 — Client's preferred logo id (BrandLogo.id). Only meaningful
   *  for customer-facing docs (invoices, DNs, stock statements, etc).
   *  Internal HR/payroll docs should leave this undefined. */
  clientPreferredLogoId?: string;
}

/**
 * Phase 115/116 — Pick the right logo URL for a given document.
 *
 * Precedence (highest first):
 *   1. explicit override (print-time picker)
 *   2. client's preferredLogoId (Phase 116) — only used on customer-facing
 *      docs; the caller passes preferredLogoId when there's a client tied
 *      to the print
 *   3. brand library entry where appliesToDocumentTypes includes this kind
 *   4. brand library entry marked isDefault
 *   5. first brand library entry (so at least *something* prints)
 *   6. legacy AppSettingsCompany.logoUrl
 *   7. empty string → fallback wordmark SVG renders
 */
export function resolveDocumentLogo(
  company: AppSettingsCompany | undefined,
  brandLogos: BrandLogo[] | undefined,
  kind: DocumentKind | undefined,
  override?: string,
  preferredLogoId?: string,
): string {
  if (override) return override;
  const lib = brandLogos ?? [];
  // Client preference — only honoured when the library actually contains
  // the referenced logo. A stale id (logo was deleted) silently falls
  // through to the next rule.
  if (preferredLogoId) {
    const clientPick = lib.find((l) => l.id === preferredLogoId);
    if (clientPick) return clientPick.url;
  }
  if (kind) {
    const pinned = lib.find((l) => l.appliesToDocumentTypes?.includes(kind));
    if (pinned) return pinned.url;
  }
  const def = lib.find((l) => l.isDefault);
  if (def) return def.url;
  if (lib.length > 0) return lib[0].url;
  return company?.logoUrl ?? '';
}

/** HTML-escape a value so a stray "<" in a name doesn't break the layout. */
function esc(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Emit the top-of-page letterhead. Renders the company logo on the left
 * (image if logoUrl is set, otherwise an inline SVG wordmark) and an
 * optional title block on the right. Followed by a 4px black rule that
 * matches the existing letterhead style.
 */
export function buildLetterhead(
  company: AppSettingsCompany | undefined,
  opts: LetterheadOptions = {},
): string {
  const c = { ...FALLBACK_COMPANY, ...(company ?? {}) };
  const h = opts.logoHeightPx ?? 110;
  const showDivider = opts.showDivider !== false;

  // Phase 115/116 — Resolve the right logo for THIS document. Multi-logo
  // assignments live in opts.brandLogos; auto-picks based on
  // (1) explicit override, (2) the client's preferredLogoId for customer-
  // facing docs, (3) per-doc-type pin, (4) library default, (5) legacy.
  const resolvedUrl = resolveDocumentLogo(c, opts.brandLogos, opts.documentKind, opts.overrideLogoUrl, opts.clientPreferredLogoId);
  const logoMark = resolvedUrl
    ? `<img src="${esc(resolvedUrl)}" alt="${esc(c.name)} logo" style="display:block;height:${h}px;width:auto;max-width:200px;object-fit:contain;" />`
    : fallbackWordmarkSvg(h);

  const titleBlock = opts.rightTitle
    ? `<div style="text-align:right;">
         <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;font-weight:500;color:#111;letter-spacing:-0.3px;">${esc(opts.rightTitle)}</div>
         ${opts.rightSubtitle ? `<div style="font-family:'Courier New',monospace;font-size:11px;color:#6f665a;margin-top:4px;">${esc(opts.rightSubtitle)}</div>` : ''}
       </div>`
    : '';

  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
      <tr>
        <td style="vertical-align:top;width:60%;">${logoMark}</td>
        <td style="vertical-align:top;text-align:right;">${titleBlock}</td>
      </tr>
    </table>
    ${showDivider ? `<div style="border-top:4px solid #111;margin:8px 0 28px;"></div>` : ''}
  `;
}

/**
 * Optional helper for the company address block — useful on long-form
 * documents (Stock Statement, Invoice) where the "From" address sits
 * under the letterhead.
 */
export function buildCompanyBlock(company: AppSettingsCompany | undefined): string {
  const c = { ...FALLBACK_COMPANY, ...(company ?? {}) };
  const parts = [
    c.legalName ? `<div>${esc(c.legalName)}</div>` : '',
    c.addressLine1 ? `<div>${esc(c.addressLine1)}</div>` : '',
    c.addressLine2 ? `<div>${esc(c.addressLine2)}</div>` : '',
    (c.phone || c.email)
      ? `<div>${esc(c.phone)}${c.phone && c.email ? ' &middot; ' : ''}${esc(c.email)}</div>`
      : '',
    c.vatNumber ? `<div style="color:#666;">VAT ${esc(c.vatNumber)}</div>` : '',
  ].filter(Boolean).join('');
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11.5px;line-height:1.5;color:#444;">${parts}</div>`;
}

/**
 * Standard print-window shell. Wraps a body fragment in a print-ready
 * document with letterhead at top and a small footer. Use this for any new
 * printable so we never reinvent the boilerplate again.
 */
export function buildPrintShell(
  company: AppSettingsCompany | undefined,
  title: string,
  bodyHtml: string,
  opts: LetterheadOptions = {},
): string {
  const c = { ...FALLBACK_COMPANY, ...(company ?? {}) };
  // opts already carries documentKind / brandLogos when callers supply them,
  // so the letterhead picks the right logo.
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)} — ${esc(c.name)}</title>
<style>
  @page { size: A4; margin: 24mm 22mm; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12.5px; line-height: 1.55; color: #111; margin: 0; }
  .page { max-width: 780px; margin: 0 auto; padding: 40px 44px; background: #fff; }
  @media print {
    .no-print { display: none !important; }
    .page { padding: 0; box-shadow: none; }
  }
</style></head>
<body>
  <div class="page">
    ${buildLetterhead(c, opts)}
    ${bodyHtml}
  </div>
</body></html>`;
}

/**
 * Inline fallback wordmark — used when no logoUrl is set. The bubble-letter
 * Jomo / Pak lockup is approximated with a display-weight italic; not a
 * pixel-perfect match for the brand mark but presentable until the admin
 * uploads the real PNG. Sized to the same height as the real logo so the
 * letterhead layout doesn't shift when a logo is added.
 */
function fallbackWordmarkSvg(heightPx: number): string {
  return `<svg width="${Math.round(heightPx * 1.15)}" height="${heightPx}" viewBox="0 0 150 130" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <text x="5" y="46" font-family="'Arial Black',sans-serif" font-weight="900" font-size="44" font-style="italic" stroke="#ffffff" stroke-width="6" stroke-linejoin="round" fill="#ffffff" paint-order="stroke" letter-spacing="-2.5">Jomo</text>
    <text x="5" y="46" font-family="'Arial Black',sans-serif" font-weight="900" font-size="44" font-style="italic" fill="#db5a1f" letter-spacing="-2.5">Jomo</text>
    <text x="38" y="92" font-family="'Arial Black',sans-serif" font-weight="900" font-size="44" font-style="italic" stroke="#ffffff" stroke-width="6" stroke-linejoin="round" fill="#ffffff" paint-order="stroke" letter-spacing="-2.5">Pak</text>
    <text x="38" y="92" font-family="'Arial Black',sans-serif" font-weight="900" font-size="44" font-style="italic" fill="#db5a1f" letter-spacing="-2.5">Pak</text>
    <g transform="translate(20 108)">
      <rect x="0" y="0" width="110" height="14" rx="7" fill="#ffffff" stroke="#db5a1f" stroke-width="1.6"/>
      <text x="55" y="10.5" font-family="Georgia,serif" font-weight="700" font-size="8.5" fill="#db5a1f" letter-spacing="2.2" text-anchor="middle">PAPER BAGS</text>
    </g>
  </svg>`;
}
