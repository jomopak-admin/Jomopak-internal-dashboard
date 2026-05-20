/**
 * ocrRunner — Phase 17 (Task #82)
 *
 * Single entry point the UI calls to extract structured data from a
 * supplier invoice. The real implementation will dispatch to Google
 * Document AI (Task #106) and optionally a Claude validation pass
 * (Task #107). For now, this returns a deterministic stub so the UI is
 * developable end-to-end without external credentials.
 *
 * Swap-in plan:
 *   1. Add VITE_DOCAI_PROJECT_ID, VITE_DOCAI_LOCATION, VITE_DOCAI_PROCESSOR_ID
 *      and a service-account JWT minted server-side (Supabase Edge Function
 *      `mint-docai-token`).
 *   2. In runDocumentAi(), POST the base64 file content to
 *      https://{location}-documentai.googleapis.com/v1/projects/{project}
 *      /locations/{location}/processors/{processor}:process
 *   3. Parse the returned `entities` into our InvoiceExtraction shape.
 *
 * The stub at the bottom intentionally mirrors the *shape* the real
 * pipeline will return, so downstream code doesn't change.
 */

import { InvoiceExtraction, InvoiceInboxItem } from '../types';

export async function runOcrOnInboxItem(item: InvoiceInboxItem): Promise<InvoiceExtraction> {
  // When Document AI credentials are configured, swap this for the real
  // call. Until then, fall back to the stub so the UI is testable.
  if (hasDocAiCredentials()) {
    return runDocumentAi(item);
  }
  return stubExtraction(item);
}

function hasDocAiCredentials(): boolean {
  // Vite env vars; read defensively so this also runs in non-Vite tests.
  const env = (typeof import.meta !== 'undefined' ? (import.meta as any).env : {}) || {};
  return Boolean(
    env.VITE_DOCAI_PROJECT_ID &&
      env.VITE_DOCAI_LOCATION &&
      env.VITE_DOCAI_PROCESSOR_ID,
  );
}

async function runDocumentAi(_item: InvoiceInboxItem): Promise<InvoiceExtraction> {
  // To be implemented in Task #106 — see header comment.
  throw new Error('Document AI integration not wired yet — see Task #106.');
}

function stubExtraction(item: InvoiceInboxItem): InvoiceExtraction {
  // A tiny deterministic stub so reviewers can exercise the rest of the
  // pipeline before the real OCR is wired. Returns a single line item
  // and obvious placeholder values that scream "I'm fake — fill me in".
  const today = new Date().toISOString().slice(0, 10);
  return {
    supplierGuess: 'Detected supplier (stub)',
    matchedSupplierId: '',
    invoiceNumber: `STUB-${item.id.slice(-4)}`,
    invoiceDate: today,
    dueDate: today,
    supplierVatNumber: '',
    currency: 'ZAR',
    subtotal: 0,
    vatTotal: 0,
    grandTotal: 0,
    paymentTerms: '30 days',
    bankName: '',
    bankAccountNumber: '',
    bankBranchCode: '',
    lines: [
      {
        description: 'OCR placeholder — fill in the real line items',
        quantity: 1,
        unit: 'each',
        unitPrice: 0,
        vatRate: 15,
        lineTotal: 0,
      },
    ],
  };
}
