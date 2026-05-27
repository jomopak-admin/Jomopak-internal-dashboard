/**
 * photoStorage — Phase 59
 *
 * Uploads photos to the `photos` Supabase Storage bucket. Returns the
 * public URL ready to use in <img> tags. Compresses oversized images
 * client-side to keep file sizes sane (~max 1600px on longest edge,
 * JPEG quality 0.82). Original uploads bypass compression if already
 * small enough.
 */

import { supabase } from './supabase';

const BUCKET = 'photos';
const MAX_DIMENSION = 1600;
const COMPRESSION_QUALITY = 0.82;
/** Files larger than this get compressed; smaller files upload as-is. */
const COMPRESS_THRESHOLD_BYTES = 500 * 1024; // 500 KB

/** Resize+compress a File into a smaller JPEG Blob. Returns the original
 *  if anything goes wrong — better to upload as-is than fail. */
async function compressImage(file: File): Promise<Blob> {
  if (file.size < COMPRESS_THRESHOLD_BYTES) return file;
  if (!file.type.startsWith('image/')) return file;
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    URL.revokeObjectURL(url);
    let { width, height } = img;
    if (Math.max(width, height) > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', COMPRESSION_QUALITY);
    });
  } catch {
    return file;
  }
}

/** Upload a single photo, returns the public URL. */
export async function uploadPhoto(file: File, recordType: string, recordId: string): Promise<string> {
  const compressed = await compressImage(file);
  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/\.\w+$/, '.jpg');
  const storagePath = `${recordType}/${recordId}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, compressed, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/** Convenience: upload a batch of files in parallel, return URL array. */
export async function uploadPhotos(files: FileList | File[], recordType: string, recordId: string): Promise<string[]> {
  const arr = Array.from(files);
  return Promise.all(arr.map((f) => uploadPhoto(f, recordType, recordId)));
}
