/**
 * invoiceInboxStorage — Phase 17 cleanup (Task #110)
 *
 * Uploads supplier-invoice files (PDF, image) to the invoice-inbox
 * Supabase Storage bucket and returns a stable storage path + a signed
 * download URL good for a year. Previously the InvoiceInboxPage stored
 * the file as a base64 data URL inside the row, which:
 *   • bloated Postgres (1–5MB per row)
 *   • broke the table view on large invoices
 *   • prevented OCR backends from fetching the file by URL
 *
 * This helper fixes all three.
 */

import { supabase } from './supabase';

const BUCKET = 'invoice-inbox';

export interface UploadedInvoiceFile {
  /** Object key inside the bucket — persist this so we can re-sign URLs. */
  storagePath: string;
  /** Signed URL valid for one year. Refresh whenever needed. */
  signedUrl: string;
  /** Pass-through file metadata caller writes onto the inbox row. */
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
}

/** Upload a single file to the invoice-inbox bucket. The path includes a
 *  timestamp to keep object keys unique even if two operators upload the
 *  same filename. */
export async function uploadInvoiceInboxFile(file: File, inboxItemId: string): Promise<UploadedInvoiceFile> {
  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '_');
  const storagePath = `${inboxItemId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
  if (signError || !data?.signedUrl) {
    throw signError || new Error(`Could not sign URL for ${storagePath}`);
  }

  return {
    storagePath,
    signedUrl: data.signedUrl,
    fileName: file.name,
    fileMimeType: file.type || 'application/octet-stream',
    fileSizeBytes: file.size,
  };
}

/** Re-sign a stored URL when the previous one expires. */
export async function resignInvoiceInboxUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
  if (error || !data?.signedUrl) {
    throw error || new Error(`Could not re-sign URL for ${storagePath}`);
  }
  return data.signedUrl;
}
