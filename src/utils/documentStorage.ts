/**
 * documentStorage — Phase 22 (Document Vault)
 *
 * Uploads supplier/client documents to the `documents` Supabase Storage
 * bucket and returns a stable path + signed URL. Mirrors the
 * invoice-inbox storage helper.
 */

import { supabase } from './supabase';

const BUCKET = 'documents';

export interface UploadedDocument {
  storagePath: string;
  signedUrl: string;
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
}

export async function uploadDocumentFile(file: File, docId: string): Promise<UploadedDocument> {
  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '_');
  const storagePath = `${docId}/${Date.now()}-${safeName}`;

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
