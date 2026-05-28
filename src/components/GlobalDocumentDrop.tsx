/**
 * Phase 78 — Global Document Drop with type picker.
 *
 * Listens to window-level drag/drop on every page. When a file is dropped,
 * a modal asks "What kind of document is this?" — the choice determines
 * routing:
 *
 *   • Supplier Invoice / Bill   → Invoice Inbox (OCR pipeline)
 *   • Shipment / Import Document → attached to a shipment (user picks)
 *   • General Document          → Doc Vault
 *
 * On the Invoice Inbox page itself, drop is direct (the picker would be
 * redundant); the inbox's own dropzone handles it.
 */
import { useEffect, useRef, useState } from 'react';

export type GlobalDropDocType = 'invoice' | 'shipment' | 'general';

export interface ShipmentPickerEntry {
  id: string;
  shipmentNumber: string;
  supplierName: string;
}

interface GlobalDocumentDropProps {
  /** Active view key. When equal to 'invoiceInbox' we step aside so the
   *  Invoice Inbox's local drop handles the file directly. */
  activeView: string;
  /** Existing shipments — surfaced in the shipment picker. */
  shipments: ShipmentPickerEntry[];
  /** Upload + route a supplier invoice through the existing Invoice Inbox
   *  pipeline. Caller is responsible for status + navigation. */
  onDropAsInvoice: (files: File[]) => Promise<void> | void;
  /** Attach uploaded files to a specific shipment by id. */
  onDropAsShipmentDoc: (files: File[], shipmentId: string) => Promise<void> | void;
  /** Upload to Doc Vault as a general internal document. */
  onDropAsGeneral: (files: File[]) => Promise<void> | void;
}

export function GlobalDocumentDrop({
  activeView,
  shipments,
  onDropAsInvoice,
  onDropAsShipmentDoc,
  onDropAsGeneral,
}: GlobalDocumentDropProps) {
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  // Once a drop happens we hold the files in a ref while the picker is open.
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [picking, setPicking] = useState(false);
  const [shipmentChoice, setShipmentChoice] = useState<string>('');
  const [busy, setBusy] = useState(false);

  function reset() {
    setPendingFiles([]);
    setPicking(false);
    setShipmentChoice('');
    setBusy(false);
  }

  function isAcceptedType(file: File): boolean {
    if (file.type === 'application/pdf') return true;
    if (file.type.startsWith('image/')) return true;
    if (file.type === 'application/msword') return true;
    if (file.type.includes('officedocument')) return true;
    return /\.(pdf|png|jpe?g|gif|webp|tiff?|heic|docx?|xlsx?)$/i.test(file.name);
  }

  useEffect(() => {
    // Skip the global drop entirely on the Invoice Inbox page so its own
    // direct drop handler keeps working.
    if (activeView === 'invoiceInbox') return;

    function hasFiles(e: DragEvent) {
      return !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
    }
    function onDragEnter(e: DragEvent) {
      if (!hasFiles(e)) return;
      dragDepth.current += 1;
      setIsDragging(true);
    }
    function onDragLeave(e: DragEvent) {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragging(false);
    }
    function onDragOver(e: DragEvent) {
      if (hasFiles(e)) e.preventDefault();
    }
    function onDrop(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);
      const files = Array.from(e.dataTransfer?.files || []).filter(isAcceptedType);
      if (files.length === 0) return;
      setPendingFiles(files);
      setPicking(true);
    }
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [activeView]);

  async function commitInvoice() {
    setBusy(true);
    try { await onDropAsInvoice(pendingFiles); } finally { reset(); }
  }
  async function commitGeneral() {
    setBusy(true);
    try { await onDropAsGeneral(pendingFiles); } finally { reset(); }
  }
  async function commitShipment() {
    if (!shipmentChoice) return;
    setBusy(true);
    try { await onDropAsShipmentDoc(pendingFiles, shipmentChoice); } finally { reset(); }
  }

  // Render: overlay while dragging, modal once dropped.
  return (
    <>
      {isDragging ? (
        <div className="global-doc-drop-overlay" aria-hidden="true">
          <div className="global-doc-drop-card">
            <strong>Drop documents here</strong>
            <span>You'll choose where they go next</span>
          </div>
        </div>
      ) : null}
      {picking ? (
        <div className="global-doc-drop-modal" role="dialog" aria-modal="true">
          <div className="global-doc-drop-modal-card">
            <h3>What kind of document?</h3>
            <p className="muted">
              {pendingFiles.length === 1
                ? `${pendingFiles[0].name}`
                : `${pendingFiles.length} files`}
            </p>
            <div className="global-doc-drop-options">
              <button
                className="secondary-button"
                disabled={busy}
                onClick={commitInvoice}
              >
                Supplier Invoice / Bill / Credit Note
                <small>Goes to the Invoice Inbox for OCR + review.</small>
              </button>

              <div className="global-doc-drop-shipment-row">
                <button
                  className="secondary-button"
                  disabled={busy || !shipmentChoice}
                  onClick={commitShipment}
                >
                  Shipment / Import document
                  <small>Bill of lading, packing list, commercial invoice, customs paperwork — attached to a shipment.</small>
                </button>
                <select
                  value={shipmentChoice}
                  onChange={(e) => setShipmentChoice(e.target.value)}
                  disabled={busy || shipments.length === 0}
                >
                  <option value="">
                    {shipments.length === 0 ? 'No shipments yet' : 'Pick a shipment…'}
                  </option>
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shipmentNumber} — {s.supplierName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="ghost-button"
                disabled={busy}
                onClick={commitGeneral}
              >
                General document
                <small>Goes to the Doc Vault.</small>
              </button>
            </div>
            <div className="global-doc-drop-modal-footer">
              <button className="ghost-button" disabled={busy} onClick={reset}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
