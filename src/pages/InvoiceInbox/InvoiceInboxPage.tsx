/**
 * Supplier Invoice Inbox — Phase 17 (Task #82 / #105)
 *
 * Two-pane layout: a list of inbox items on the left, a review pane on
 * the right for the selected item.
 *
 * Status pipeline:
 *   pending → ocr_running → ocr_done → reviewed → posted
 *
 * The OCR step itself is wired in `runOcrOnInboxItem` (a thin async
 * helper). Right now it returns a stubbed extraction so the rest of the
 * pipeline is testable end-to-end. The Google Document AI HTTP call will
 * land in Task #106 once GCP credentials are configured.
 *
 * Posting an item lets accounts/ops carry the extracted values into:
 *   • a new Material Receipt (uses the existing form),
 *   • and eventually an AP invoice record (next session).
 *
 * Duplicate detection is local: we hash the file bytes and compare to
 * already-posted items in `invoiceInboxItems`. If a match is found, the
 * status is bumped to `duplicate` and the candidate ids are stored.
 */

import { useMemo, useRef, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  InvoiceExtraction,
  InvoiceInboxItem,
  InvoiceInboxSource,
  InvoiceInboxStatus,
  Supplier,
} from '../../types';

interface InvoiceInboxPageProps {
  items: InvoiceInboxItem[];
  suppliers: Supplier[];
  onSave: (item: InvoiceInboxItem) => void;
  onPostToMaterialReceipt: (item: InvoiceInboxItem) => void;
  /** Run OCR on the given inbox item. Returns a fresh extraction. */
  onRunOcr: (item: InvoiceInboxItem) => Promise<InvoiceExtraction>;
  /** Upload the file to Supabase Storage and resolve with the storage
   *  path + signed URL. Required for non-trivial PDFs because we don't
   *  want to inline base64 bytes inside the row. */
  onUploadFile: (file: File, inboxItemId: string) => Promise<{
    storagePath: string;
    signedUrl: string;
    fileName: string;
    fileMimeType: string;
    fileSizeBytes: number;
  }>;
}

const STATUS_LABEL: Record<InvoiceInboxStatus, string> = {
  pending: 'Awaiting OCR',
  ocr_running: 'OCR running',
  ocr_failed: 'OCR failed',
  ocr_done: 'Ready to review',
  reviewed: 'Reviewed',
  posted: 'Posted',
  duplicate: 'Duplicate',
};

const SOURCE_LABEL: Record<InvoiceInboxSource, string> = {
  materialsUpload: 'Materials Receiving',
  manualUpload: 'Manual upload',
  email: 'Email',
  whatsapp: 'WhatsApp',
  messaging: 'Internal messaging',
};

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function emptyExtraction(): InvoiceExtraction {
  return {
    supplierGuess: '',
    matchedSupplierId: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    supplierVatNumber: '',
    currency: 'ZAR',
    subtotal: 0,
    vatTotal: 0,
    grandTotal: 0,
    paymentTerms: '',
    bankName: '',
    bankAccountNumber: '',
    bankBranchCode: '',
    lines: [],
  };
}

export function InvoiceInboxPage({
  items,
  suppliers,
  onSave,
  onPostToMaterialReceipt,
  onRunOcr,
  onUploadFile,
}: InvoiceInboxPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(
    () => items.find((it) => it.id === selectedId) || null,
    [items, selectedId],
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const buf = await file.arrayBuffer();
    const hash = await sha256Hex(buf);

    // Duplicate detection — match against already-posted invoices.
    const duplicates = items.filter((it) => it.fileHash === hash && it.status !== 'pending');
    const dupIds = duplicates.map((d) => d.id);

    const id = `INV-INBOX-${Date.now().toString(36)}`;

    // Upload to Supabase Storage. We deliberately do this before saving
    // the row so the URL is real from the start. If the upload fails we
    // bail out — the operator can retry.
    let uploaded;
    try {
      uploaded = await onUploadFile(file, id);
    } catch (err: any) {
      // Show a soft error by saving a row in 'ocr_failed' so the user
      // can see what happened and re-upload.
      onSave({
        id,
        inboxNumber: id,
        createdAt: new Date().toISOString(),
        source: 'manualUpload',
        uploaderName: '',
        uploaderUserId: '',
        fileName: file.name,
        fileMimeType: file.type || 'application/octet-stream',
        fileSizeBytes: file.size,
        fileUrl: '',
        storagePath: '',
        fileHash: hash,
        status: 'ocr_failed',
        ocrError: `Upload failed: ${err?.message || err}`,
        extractedJson: null,
        validatedJson: null,
        reviewedByName: '',
        reviewedAt: '',
        reviewNotes: '',
        postedAsMaterialReceiptId: '',
        postedAsMaterialReceiptNumber: '',
        postedAsApInvoiceId: '',
        postedAt: '',
        duplicateCandidateIds: dupIds,
        senderHandle: '',
        senderSubject: '',
      });
      setSelectedId(id);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const newItem: InvoiceInboxItem = {
      id,
      inboxNumber: id,
      createdAt: new Date().toISOString(),
      source: 'manualUpload',
      uploaderName: '',
      uploaderUserId: '',
      fileName: uploaded.fileName,
      fileMimeType: uploaded.fileMimeType,
      fileSizeBytes: uploaded.fileSizeBytes,
      fileUrl: uploaded.signedUrl,
      storagePath: uploaded.storagePath,
      fileHash: hash,
      status: dupIds.length > 0 ? 'duplicate' : 'pending',
      ocrError: '',
      extractedJson: null,
      validatedJson: null,
      reviewedByName: '',
      reviewedAt: '',
      reviewNotes: '',
      postedAsMaterialReceiptId: '',
      postedAsMaterialReceiptNumber: '',
      postedAsApInvoiceId: '',
      postedAt: '',
      duplicateCandidateIds: dupIds,
      senderHandle: '',
      senderSubject: '',
    };
    onSave(newItem);
    setSelectedId(id);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function runOcr(item: InvoiceInboxItem) {
    if (busyId) return;
    setBusyId(item.id);
    onSave({ ...item, status: 'ocr_running', ocrError: '' });
    try {
      const extraction = await onRunOcr(item);
      onSave({
        ...item,
        status: 'ocr_done',
        ocrError: '',
        extractedJson: extraction,
      });
    } catch (e: any) {
      onSave({
        ...item,
        status: 'ocr_failed',
        ocrError: e?.message || 'OCR failed',
      });
    } finally {
      setBusyId(null);
    }
  }

  function updateExtraction(item: InvoiceInboxItem, patch: Partial<InvoiceExtraction>) {
    const base = item.extractedJson || emptyExtraction();
    onSave({ ...item, extractedJson: { ...base, ...patch } });
  }

  function markReviewed(item: InvoiceInboxItem) {
    onSave({
      ...item,
      status: 'reviewed',
      reviewedAt: new Date().toISOString(),
      reviewedByName: item.reviewedByName,
    });
  }

  return (
    <div className="invoice-inbox-shell">
      <SectionTitle
        title="Supplier Invoice Inbox"
        subtitle="Drop invoices here. OCR pre-fills the details; accounts confirms and posts."
        action={
          <button className="primary-button" onClick={() => fileInputRef.current?.click()}>
            Upload invoice
          </button>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />

      {items.length === 0 ? (
        <EmptyState title="Inbox empty" body="Drop a PDF or photo of a supplier invoice to begin." />
      ) : (
        <div className="invoice-inbox-grid">
          <div className="invoice-inbox-list">
            {items.map((it) => (
              <button
                key={it.id}
                className={selectedId === it.id ? 'invoice-inbox-row active' : 'invoice-inbox-row'}
                onClick={() => setSelectedId(it.id)}
              >
                <strong>{it.fileName || it.inboxNumber}</strong>
                <span>{SOURCE_LABEL[it.source]} • {STATUS_LABEL[it.status]}</span>
                <small>{new Date(it.createdAt).toLocaleString()}</small>
              </button>
            ))}
          </div>

          <div className="invoice-inbox-pane">
            {!selected ? (
              <p className="muted">Select an item to review.</p>
            ) : (
              <ReviewPane
                item={selected}
                suppliers={suppliers}
                busy={busyId === selected.id}
                onSave={onSave}
                onRunOcr={runOcr}
                onUpdateExtraction={updateExtraction}
                onMarkReviewed={markReviewed}
                onPost={() => onPostToMaterialReceipt(selected)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ReviewPaneProps {
  item: InvoiceInboxItem;
  suppliers: Supplier[];
  busy: boolean;
  onSave: (item: InvoiceInboxItem) => void;
  onRunOcr: (item: InvoiceInboxItem) => void;
  onUpdateExtraction: (item: InvoiceInboxItem, patch: Partial<InvoiceExtraction>) => void;
  onMarkReviewed: (item: InvoiceInboxItem) => void;
  onPost: () => void;
}

function ReviewPane({
  item,
  suppliers,
  busy,
  onSave,
  onRunOcr,
  onUpdateExtraction,
  onMarkReviewed,
  onPost,
}: ReviewPaneProps) {
  const ex = item.extractedJson || emptyExtraction();
  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ id: s.id, label: s.name })),
    [suppliers],
  );

  return (
    <div className="invoice-inbox-review">
      <header>
        <strong>{item.fileName}</strong>
        <span className={`status-pill status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
      </header>

      <div className="invoice-inbox-preview">
        {item.fileMimeType.startsWith('image/') ? (
          <img alt="" src={item.fileUrl} />
        ) : item.fileMimeType === 'application/pdf' ? (
          <iframe title="invoice-pdf" src={item.fileUrl} />
        ) : (
          <p className="muted">Preview not available for {item.fileMimeType}.</p>
        )}
      </div>

      {item.status === 'duplicate' && (
        <p className="callout warn">
          Possible duplicate of {item.duplicateCandidateIds.join(', ')}. Review carefully before posting.
        </p>
      )}

      {item.status === 'pending' || item.status === 'ocr_failed' ? (
        <button className="primary-button" disabled={busy} onClick={() => onRunOcr(item)}>
          {busy ? 'Running OCR…' : 'Run OCR'}
        </button>
      ) : null}

      {item.status === 'ocr_failed' && item.ocrError && (
        <p className="callout error">OCR error: {item.ocrError}</p>
      )}

      {(item.status === 'ocr_done' || item.status === 'reviewed' || item.status === 'posted' || item.status === 'duplicate') && (
        <>
          <section className="invoice-inbox-fields">
            <h4>Extracted fields</h4>
            <label>
              <span>Supplier</span>
              <select
                value={ex.matchedSupplierId}
                onChange={(e) => {
                  const id = e.target.value;
                  const name = supplierOptions.find((o) => o.id === id)?.label || ex.supplierGuess;
                  onUpdateExtraction(item, { matchedSupplierId: id, supplierGuess: name });
                }}
              >
                <option value="">— match a supplier —</option>
                {supplierOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              {ex.supplierGuess && !ex.matchedSupplierId ? (
                <small>OCR detected: {ex.supplierGuess}</small>
              ) : null}
            </label>
            <label><span>Invoice number</span><input value={ex.invoiceNumber} onChange={(e) => onUpdateExtraction(item, { invoiceNumber: e.target.value })} /></label>
            <label><span>Invoice date</span><input type="date" value={ex.invoiceDate} onChange={(e) => onUpdateExtraction(item, { invoiceDate: e.target.value })} /></label>
            <label><span>Due date</span><input type="date" value={ex.dueDate} onChange={(e) => onUpdateExtraction(item, { dueDate: e.target.value })} /></label>
            <label><span>VAT number</span><input value={ex.supplierVatNumber} onChange={(e) => onUpdateExtraction(item, { supplierVatNumber: e.target.value })} /></label>
            <label><span>Currency</span><input value={ex.currency} onChange={(e) => onUpdateExtraction(item, { currency: e.target.value })} /></label>
            <label><span>Subtotal</span><input inputMode="decimal" value={ex.subtotal} onChange={(e) => onUpdateExtraction(item, { subtotal: Number(e.target.value || 0) })} /></label>
            <label><span>VAT total</span><input inputMode="decimal" value={ex.vatTotal} onChange={(e) => onUpdateExtraction(item, { vatTotal: Number(e.target.value || 0) })} /></label>
            <label><span>Grand total</span><input inputMode="decimal" value={ex.grandTotal} onChange={(e) => onUpdateExtraction(item, { grandTotal: Number(e.target.value || 0) })} /></label>
            <label><span>Payment terms</span><input value={ex.paymentTerms} onChange={(e) => onUpdateExtraction(item, { paymentTerms: e.target.value })} /></label>
            <label><span>Bank</span><input value={ex.bankName} onChange={(e) => onUpdateExtraction(item, { bankName: e.target.value })} /></label>
            <label><span>Account number</span><input value={ex.bankAccountNumber} onChange={(e) => onUpdateExtraction(item, { bankAccountNumber: e.target.value })} /></label>
            <label><span>Branch code</span><input value={ex.bankBranchCode} onChange={(e) => onUpdateExtraction(item, { bankBranchCode: e.target.value })} /></label>
          </section>

          <section className="invoice-inbox-fields">
            <h4>Line items ({ex.lines.length})</h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Unit price</th>
                  <th>VAT %</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {ex.lines.map((l, i) => (
                  <tr key={i}>
                    <td>{l.description}</td>
                    <td>{l.quantity}</td>
                    <td>{l.unit}</td>
                    <td>{l.unitPrice.toFixed(2)}</td>
                    <td>{l.vatRate}</td>
                    <td>{l.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
                {ex.lines.length === 0 && (
                  <tr><td colSpan={6} className="muted">No line items extracted.</td></tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="invoice-inbox-fields">
            <h4>Reviewer</h4>
            <label><span>Reviewed by</span><input value={item.reviewedByName} onChange={(e) => onSave({ ...item, reviewedByName: e.target.value })} /></label>
            <label><span>Notes</span><textarea rows={2} value={item.reviewNotes} onChange={(e) => onSave({ ...item, reviewNotes: e.target.value })} /></label>
          </section>

          <div className="invoice-inbox-actions">
            {item.status !== 'posted' && (
              <button className="ghost-button" onClick={() => onMarkReviewed(item)}>
                Mark reviewed
              </button>
            )}
            {(item.status === 'reviewed' || item.status === 'ocr_done') && (
              <button className="primary-button" onClick={onPost}>
                Post to Materials Receiving
              </button>
            )}
            {item.status === 'posted' && (
              <p className="muted">Posted as {item.postedAsMaterialReceiptNumber} on {item.postedAt}.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
