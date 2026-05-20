/**
 * podSync — Phase 17 cleanup (Tasks #109 / #110)
 *
 * Bridges three sides of the POD pipeline:
 *
 *   1. IndexedDB queue       — drivers' phones (offline-tolerant).
 *   2. Supabase Storage      — pod-signatures + pod-photos buckets.
 *   3. proof_of_deliveries   — relational row pointing at the URLs.
 *
 * The flush() entry point pulls every queued POD, uploads the binary
 * payloads, then writes the row with the resulting URLs. On any failure
 * the POD stays in the queue with syncStatus='failed' + the error — the
 * next online flush retries it.
 *
 * We also expose a window 'online' listener so the flush kicks off
 * automatically when a phone regains signal.
 */

import { ProofOfDelivery } from '../types';
import { loadQueuedPods, removePodLocally, savePodLocally } from './podQueue';
import { supabase } from './supabase';

const SIGNATURE_BUCKET = 'pod-signatures';
const PHOTO_BUCKET = 'pod-photos';

/** Convert a `data:image/png;base64,xxx` URL back to a Blob we can upload. */
function dataUrlToBlob(dataUrl: string): Blob | null {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const [, mime, b64] = match;
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

/** Upload a base64 payload to a bucket and return a signed URL good for a
 *  year. We return signed URLs (not public ones) because the buckets are
 *  private; the dashboard reads them via the same signed token. */
async function uploadDataUrl(
  bucket: string,
  path: string,
  dataUrl: string,
): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) throw new Error(`Invalid data URL for ${path}`);
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: true,
    contentType: blob.type,
  });
  if (uploadError) throw uploadError;
  const { data, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signError || !data?.signedUrl) {
    throw signError || new Error(`Could not sign URL for ${path}`);
  }
  return data.signedUrl;
}

/** Push a single POD all the way to Supabase. Throws on any failure so the
 *  caller can mark the row 'failed' and keep it in the local queue. */
async function syncOne(pod: ProofOfDelivery): Promise<ProofOfDelivery> {
  let signatureUrl = pod.signatureUrl;
  let signedDocPhoto = pod.signedDocumentPhotoUrl;
  const goodsPhotos: string[] = [];

  // 1. Signature.
  if (pod.signatureDataUrl) {
    signatureUrl = await uploadDataUrl(SIGNATURE_BUCKET, `${pod.id}.png`, pod.signatureDataUrl);
  }

  // 2. Photo of signed delivery note.
  if (pod.signedDocumentPhotoUrl && pod.signedDocumentPhotoUrl.startsWith('data:')) {
    signedDocPhoto = await uploadDataUrl(PHOTO_BUCKET, `${pod.id}-signed-doc.jpg`, pod.signedDocumentPhotoUrl);
  }

  // 3. Goods photos (variable count).
  for (let i = 0; i < pod.goodsPhotoUrls.length; i++) {
    const src = pod.goodsPhotoUrls[i];
    if (src.startsWith('data:')) {
      const url = await uploadDataUrl(PHOTO_BUCKET, `${pod.id}-goods-${i}.jpg`, src);
      goodsPhotos.push(url);
    } else {
      goodsPhotos.push(src); // already uploaded, keep as-is
    }
  }

  // 4. Upsert the row with resolved URLs.
  const row = {
    id: pod.id,
    pod_number: pod.podNumber,
    created_at: pod.createdAt,
    dispatch_record_id: pod.dispatchRecordId || null,
    dispatch_number: pod.dispatchNumber || '',
    job_id: pod.jobId || null,
    job_number: pod.jobNumber || '',
    client_id: pod.clientId || null,
    client_name: pod.clientName || '',
    driver_name: pod.driverName || '',
    driver_user_id: pod.driverUserId || null,
    receiver_name: pod.receiverName || '',
    receiver_role: pod.receiverRole || '',
    receiver_company: pod.receiverCompany || '',
    receiver_id_number: pod.receiverIdNumber || '',
    receiver_phone: pod.receiverPhone || '',
    outcome: pod.outcome,
    failure_reason: pod.failureReason || '',
    quantity_delivered: pod.quantityDelivered,
    quantity_unit: pod.quantityUnit,
    goods_condition: pod.goodsCondition,
    condition_notes: pod.conditionNotes || '',
    captured_at: pod.capturedAt || null,
    gps_latitude: pod.gpsLatitude,
    gps_longitude: pod.gpsLongitude,
    gps_accuracy_meters: pod.gpsAccuracyMeters,
    signature_url: signatureUrl,
    signed_document_photo_url: signedDocPhoto,
    goods_photo_urls: goodsPhotos,
    notes: pod.notes || '',
    sync_status: 'synced',
    sync_error: '',
  };
  const { error } = await supabase.from('proof_of_deliveries').upsert(row);
  if (error) throw error;

  return {
    ...pod,
    signatureUrl,
    signedDocumentPhotoUrl: signedDocPhoto,
    goodsPhotoUrls: goodsPhotos,
    signatureDataUrl: '',
    syncStatus: 'synced',
    syncError: '',
  };
}

/** Flush every queued POD. Returns the synced PODs so the caller can merge
 *  them into in-memory React state. Failed PODs stay queued. */
export async function flushPodQueue(): Promise<{ synced: ProofOfDelivery[]; failed: ProofOfDelivery[] }> {
  const queued = await loadQueuedPods();
  const synced: ProofOfDelivery[] = [];
  const failed: ProofOfDelivery[] = [];

  for (const pod of queued) {
    if (pod.syncStatus === 'synced') {
      await removePodLocally(pod.id);
      continue;
    }
    try {
      const result = await syncOne({ ...pod, syncStatus: 'syncing' });
      await removePodLocally(pod.id);
      synced.push(result);
    } catch (err: any) {
      const updated: ProofOfDelivery = {
        ...pod,
        syncStatus: 'failed',
        syncError: err?.message || 'Sync failed',
      };
      await savePodLocally(updated);
      failed.push(updated);
    }
  }

  return { synced, failed };
}

/** Wire a one-shot listener so the page flushes automatically when the
 *  phone comes back online. Returns a teardown function. */
export function attachAutoFlush(onFlush: (result: Awaited<ReturnType<typeof flushPodQueue>>) => void): () => void {
  async function run() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    try {
      const result = await flushPodQueue();
      onFlush(result);
    } catch {
      /* ignore — the next flush will retry */
    }
  }
  const onlineHandler = () => { void run(); };
  window.addEventListener('online', onlineHandler);
  // Also flush opportunistically on mount in case the queue is non-empty.
  void run();
  return () => window.removeEventListener('online', onlineHandler);
}
