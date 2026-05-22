/**
 * Document Vault — Phase 22
 *
 * One place for supplier + client compliance/commercial documents:
 * certifications, FSC/ISO certs, credit applications, stock-level
 * agreements, IDs, bank details, contracts, price lists, etc.
 *
 * Each file uploads to Supabase Storage; the row holds metadata + an
 * optional expiry date that feeds the notification bell. Filter by who
 * (supplier/client + which one) and by category.
 */

import { useMemo, useRef, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  Client,
  DocumentCategory,
  DOCUMENT_CATEGORIES,
  DocumentOwnerType,
  DocumentRecord,
  Supplier,
} from '../../types';

interface DocumentVaultPageProps {
  documents: DocumentRecord[];
  suppliers: Supplier[];
  clients: Client[];
  uploaderName: string;
  onSave: (doc: DocumentRecord) => void;
  onDelete: (id: string) => void;
  onUploadFile: (file: File, docId: string) => Promise<{
    storagePath: string;
    signedUrl: string;
    fileName: string;
    fileMimeType: string;
    fileSizeBytes: number;
  }>;
}

function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / 86_400_000);
}

export function DocumentVaultPage({
  documents,
  suppliers,
  clients,
  uploaderName,
  onSave,
  onDelete,
  onUploadFile,
}: DocumentVaultPageProps) {
  const [ownerType, setOwnerType] = useState<DocumentOwnerType>('supplier');
  const [ownerId, setOwnerId] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Certification');
  const [title, setTitle] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [filterOwnerType, setFilterOwnerType] = useState<'all' | DocumentOwnerType>('all');
  const [filterOwnerId, setFilterOwnerId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const owners = ownerType === 'supplier'
    ? suppliers.map((s) => ({ id: s.id, name: s.name }))
    : clients.map((c) => ({ id: c.id, name: c.companyName || c.name }));

  const filterOwners = filterOwnerType === 'supplier'
    ? suppliers.map((s) => ({ id: s.id, name: s.name }))
    : filterOwnerType === 'client'
      ? clients.map((c) => ({ id: c.id, name: c.companyName || c.name }))
      : [];

  const filtered = useMemo(() => {
    return documents
      .filter((d) => filterOwnerType === 'all' || d.ownerType === filterOwnerType)
      .filter((d) => !filterOwnerId || d.ownerId === filterOwnerId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [documents, filterOwnerType, filterOwnerId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ownerId) {
      setMessage('Pick which supplier or client this document belongs to first.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setBusy(true);
    setMessage('Uploading…');
    const id = `DOC-${Date.now().toString(36)}`;
    try {
      const uploaded = await onUploadFile(file, id);
      const owner = owners.find((o) => o.id === ownerId);
      onSave({
        id,
        createdAt: new Date().toISOString(),
        ownerType,
        ownerId,
        ownerName: owner?.name || '',
        category,
        title: title.trim() || uploaded.fileName,
        fileName: uploaded.fileName,
        fileMimeType: uploaded.fileMimeType,
        fileSizeBytes: uploaded.fileSizeBytes,
        fileUrl: uploaded.signedUrl,
        storagePath: uploaded.storagePath,
        issueDate,
        expiryDate,
        uploadedByName: uploaderName || '',
        notes: notes.trim(),
      });
      setMessage('Document saved.');
      setTitle('');
      setIssueDate('');
      setExpiryDate('');
      setNotes('');
    } catch (err: any) {
      setMessage(`Upload failed: ${err?.message || err}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="Document Vault"
        subtitle="Supplier & client documents — certifications, credit apps, agreements, IDs, bank details. Set expiry dates and the bell will warn you before they lapse."
      />

      {/* Upload --------------------------------------------------------- */}
      <section className="card">
        <h3>Add a document</h3>
        <div className="docvault-form-grid">
          <label>
            <span>Belongs to</span>
            <select value={ownerType} onChange={(e) => { setOwnerType(e.target.value as DocumentOwnerType); setOwnerId(''); }}>
              <option value="supplier">Supplier</option>
              <option value="client">Client</option>
            </select>
          </label>
          <label>
            <span>{ownerType === 'supplier' ? 'Supplier' : 'Client'} *</span>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              <option value="">Select…</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
          <label>
            <span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
              {DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            <span>Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. FSC Chain-of-Custody 2026" />
          </label>
          <label>
            <span>Issue date</span>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </label>
          <label>
            <span>Expiry date (optional)</span>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </label>
          <label className="docvault-span-2">
            <span>Notes</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth noting" />
          </label>
        </div>
        <input ref={fileRef} type="file" accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={handleUpload} style={{ display: 'none' }} />
        <div className="docvault-actions">
          {message ? <span className="muted">{message}</span> : null}
          <button className="primary-button" disabled={busy || !ownerId} onClick={() => fileRef.current?.click()}>
            {busy ? 'Uploading…' : 'Choose file & upload'}
          </button>
        </div>
      </section>

      {/* Filters + list ------------------------------------------------- */}
      <section className="card">
        <div className="docvault-filters">
          <label>
            <span>Show</span>
            <select value={filterOwnerType} onChange={(e) => { setFilterOwnerType(e.target.value as any); setFilterOwnerId(''); }}>
              <option value="all">All documents</option>
              <option value="supplier">Suppliers only</option>
              <option value="client">Clients only</option>
            </select>
          </label>
          {filterOwnerType !== 'all' && (
            <label>
              <span>{filterOwnerType === 'supplier' ? 'Supplier' : 'Client'}</span>
              <select value={filterOwnerId} onChange={(e) => setFilterOwnerId(e.target.value)}>
                <option value="">All</option>
                {filterOwners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No documents yet" body="Upload a supplier or client document above to start the vault." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Belongs to</th>
                <th>Category</th>
                <th>Expiry</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const days = daysUntil(d.expiryDate);
                const expiryLabel = !d.expiryDate ? '—'
                  : days === null ? d.expiryDate
                  : days < 0 ? `Expired ${-days}d ago`
                  : days <= 30 ? `In ${days}d`
                  : d.expiryDate;
                const expiryClass = days === null ? '' : days < 0 ? 'variance-neg' : days <= 30 ? 'doc-expiry-soon' : '';
                return (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.title}</strong>
                      <div className="muted" style={{ fontSize: '0.75rem' }}>{d.fileName}</div>
                    </td>
                    <td>{d.ownerName} <span className="muted">({d.ownerType})</span></td>
                    <td>{d.category}</td>
                    <td><span className={expiryClass}>{expiryLabel}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {d.fileUrl ? <a className="link-button" href={d.fileUrl} target="_blank" rel="noreferrer">Open</a> : null}
                      {' · '}
                      <button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => onDelete(d.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
