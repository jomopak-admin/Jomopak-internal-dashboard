/**
 * PhotoUploader — Phase 59
 *
 * Drop into any edit form. Multi-photo upload to Supabase Storage with
 * client-side compression, thumbnail grid, remove button per photo, and
 * a click-to-lightbox preview. Owner passes in the current URL array
 * and gets a new array back via onChange — pure controlled component.
 *
 * Usage:
 *   <PhotoUploader
 *     urls={form.photoUrls}
 *     onChange={(urls) => setForm({ ...form, photoUrls: urls })}
 *     recordType="products"
 *     recordId={editingId || 'draft'}
 *     label="Product photos"
 *   />
 */

import { ChangeEvent, useRef, useState } from 'react';
import { uploadPhotos } from '../utils/photoStorage';

interface PhotoUploaderProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  recordType: string;
  recordId: string;
  label?: string;
  /** Max number of photos allowed (default 8). */
  max?: number;
}

export function PhotoUploader({ urls, onChange, recordType, recordId, label, max = 8 }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const newUrls = await uploadPhotos(files, recordType, recordId);
      const combined = [...urls, ...newUrls].slice(0, max);
      onChange(combined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove(idx: number) {
    onChange(urls.filter((_, i) => i !== idx));
  }

  const canUploadMore = urls.length < max;

  return (
    <div className="photo-uploader">
      {label ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{label}</span>
          <span className="muted" style={{ fontSize: '0.78rem' }}>{urls.length} / {max}</span>
        </div>
      ) : null}

      <div className="photo-uploader-grid">
        {urls.map((url, idx) => (
          <div key={url} className="photo-uploader-thumb">
            <button type="button" onClick={() => setLightboxUrl(url)} title="View full size" style={{ padding: 0, border: 0, background: 'none', cursor: 'zoom-in' }}>
              <img src={url} alt={`Photo ${idx + 1}`} loading="lazy" />
            </button>
            <button type="button" className="photo-uploader-remove" onClick={() => remove(idx)} aria-label="Remove photo" title="Remove photo">×</button>
          </div>
        ))}

        {canUploadMore ? (
          <label className={`photo-uploader-add ${uploading ? 'is-uploading' : ''}`}>
            {uploading ? (
              <span>Uploading…</span>
            ) : (
              <>
                <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>+</span>
                <span style={{ fontSize: '0.78rem' }}>Add photo</span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleFiles}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        ) : null}
      </div>

      {error ? <p style={{ color: 'var(--jp-alert, #b3201f)', fontSize: '0.78rem', marginTop: 6 }}>{error}</p> : null}

      {lightboxUrl ? (
        <div
          className="photo-uploader-lightbox"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-label="Photo preview — click to close"
        >
          <img src={lightboxUrl} alt="Full size preview" />
          <button type="button" className="photo-uploader-lightbox-close" onClick={() => setLightboxUrl(null)} aria-label="Close">×</button>
        </div>
      ) : null}
    </div>
  );
}
