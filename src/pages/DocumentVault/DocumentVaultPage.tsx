/**
 * Document Vault — Phase 22 + 36 extensions.
 *
 * One place for company documents. Three owner types:
 *  - Supplier: certs, MSDS, supplier contracts.
 *  - Client:   credit apps, stock-level agreements + operational docs
 *              (delivery notes, credit notes, signed POD, POP, invoice/quote
 *               copies, job card PDFs). Operational docs can ALSO be linked
 *               to a specific invoice/job/quote/delivery note for context.
 *  - Internal: company-level docs (HR, factory policies, insurance, leases,
 *              licenses, accounting records) with ROLE-BASED VISIBILITY so
 *              accounts can see accounting docs but not HR; factory policies
 *              are visible to everyone; leases are admin-only.
 *
 * Each file uploads to Supabase Storage; the row holds metadata + an optional
 * expiry date that feeds the notification bell.
 */

import { useMemo, useRef, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  Client,
  DeliveryNote,
  DocumentCategory,
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_ROLE_DEFAULTS,
  DocumentOwnerType,
  DocumentRecord,
  Invoice,
  JobCard,
  QuoteEstimate,
  Supplier,
  UserProfile,
  UserRole,
} from '../../types';

interface DocumentVaultPageProps {
  documents: DocumentRecord[];
  suppliers: Supplier[];
  clients: Client[];
  invoices: Invoice[];
  jobs: JobCard[];
  quoteEstimates: QuoteEstimate[];
  deliveryNotes: DeliveryNote[];
  uploaderName: string;
  currentUserRole: UserProfile['role'];
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

const ALL_ROLES: UserRole[] = ['admin', 'ops', 'production', 'sales', 'artwork', 'accounts'];

/** Operational categories — client-owned docs that can optionally tie to a
 *  specific invoice/job/quote/delivery note. */
const OPERATIONAL_CLIENT_CATEGORIES: DocumentCategory[] = [
  'Delivery Note', 'Credit Note', 'Signed POD', 'Proof of Payment',
  'Invoice Copy', 'Quote Copy', 'Job Card',
];

const INTERNAL_CATEGORIES: DocumentCategory[] = [
  'HR Document', 'Staff Handbook', 'Factory Policy', 'Health & Safety',
  'Insurance', 'Lease / Property', 'License / Permit', 'Tax / Compliance',
  'Accounting Record', 'Other Internal',
];

function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / 86_400_000);
}

/** A non-admin can view an INTERNAL doc only if its visibleToRoles is empty
 *  (everyone) or includes their role. Admin always sees everything. */
function userCanViewInternalDoc(doc: DocumentRecord, role: UserProfile['role']): boolean {
  if (role === 'admin') return true;
  const allowed = doc.visibleToRoles ?? [];
  if (allowed.length === 0) return true;
  return allowed.includes(role as UserRole);
}

export function DocumentVaultPage({
  documents,
  suppliers,
  clients,
  invoices,
  jobs,
  quoteEstimates,
  deliveryNotes,
  uploaderName,
  currentUserRole,
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
  const [linkedInvoiceId, setLinkedInvoiceId] = useState('');
  const [linkedJobId, setLinkedJobId] = useState('');
  const [linkedQuoteId, setLinkedQuoteId] = useState('');
  const [linkedDeliveryNoteId, setLinkedDeliveryNoteId] = useState('');
  const [visibleToRoles, setVisibleToRoles] = useState<UserRole[]>([]);
  const [filterOwnerType, setFilterOwnerType] = useState<'all' | DocumentOwnerType>('all');
  const [filterOwnerId, setFilterOwnerId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const owners = ownerType === 'supplier'
    ? suppliers.map((s) => ({ id: s.id, name: s.name }))
    : ownerType === 'client'
      ? clients.map((c) => ({ id: c.id, name: c.companyName || c.name }))
      : [];

  const filterOwners = filterOwnerType === 'supplier'
    ? suppliers.map((s) => ({ id: s.id, name: s.name }))
    : filterOwnerType === 'client'
      ? clients.map((c) => ({ id: c.id, name: c.companyName || c.name }))
      : [];

  const showDeepLinks = ownerType === 'client' && OPERATIONAL_CLIENT_CATEGORIES.includes(category);
  const isInternal = ownerType === 'internal';

  function changeCategory(next: DocumentCategory) {
    setCategory(next);
    // Reset deep links when leaving an operational category.
    if (!OPERATIONAL_CLIENT_CATEGORIES.includes(next)) {
      setLinkedInvoiceId(''); setLinkedJobId(''); setLinkedQuoteId(''); setLinkedDeliveryNoteId('');
    }
    // When uploading an internal doc, seed role visibility from category defaults.
    if (isInternal) {
      const defaults = DOCUMENT_CATEGORY_ROLE_DEFAULTS[next] ?? [];
      setVisibleToRoles(defaults);
    }
  }
  function changeOwnerType(next: DocumentOwnerType) {
    setOwnerType(next);
    setOwnerId('');
    setLinkedInvoiceId(''); setLinkedJobId(''); setLinkedQuoteId(''); setLinkedDeliveryNoteId('');
    if (next === 'internal') {
      // Default category for internal uploads.
      const first: DocumentCategory = 'Factory Policy';
      setCategory(first);
      setVisibleToRoles(DOCUMENT_CATEGORY_ROLE_DEFAULTS[first] ?? []);
    } else {
      setCategory('Certification');
      setVisibleToRoles([]);
    }
  }
  function toggleRole(role: UserRole) {
    setVisibleToRoles((current) =>
      current.includes(role) ? current.filter((r) => r !== role) : [...current, role],
    );
  }

  const filtered = useMemo(() => {
    return documents
      .filter((d) => filterOwnerType === 'all' || d.ownerType === filterOwnerType)
      .filter((d) => !filterOwnerId || d.ownerId === filterOwnerId)
      // Apply role-based visibility to internal docs.
      .filter((d) => d.ownerType !== 'internal' || userCanViewInternalDoc(d, currentUserRole))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [documents, filterOwnerType, filterOwnerId, currentUserRole]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isInternal && !ownerId) {
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
        ownerId: isInternal ? '' : ownerId,
        ownerName: isInternal ? 'Internal' : (owner?.name || ''),
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
        linkedInvoiceId: linkedInvoiceId || undefined,
        linkedJobId: linkedJobId || undefined,
        linkedQuoteId: linkedQuoteId || undefined,
        linkedDeliveryNoteId: linkedDeliveryNoteId || undefined,
        visibleToRoles: isInternal ? visibleToRoles : undefined,
      });
      setMessage('Document saved.');
      setTitle(''); setIssueDate(''); setExpiryDate(''); setNotes('');
      setLinkedInvoiceId(''); setLinkedJobId(''); setLinkedQuoteId(''); setLinkedDeliveryNoteId('');
    } catch (err: any) {
      setMessage(`Upload failed: ${err?.message || err}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  // Visible categories in the upload form: when ownerType is internal show
  // only internal categories; otherwise hide internal categories from
  // client/supplier uploads.
  const visibleCategories = isInternal
    ? INTERNAL_CATEGORIES
    : DOCUMENT_CATEGORIES.filter((c) => !INTERNAL_CATEGORIES.includes(c));

  return (
    <div className="page-stack">
      <SectionTitle
        title="Document Vault"
        subtitle="Supplier, client and internal company documents — certifications, agreements, signed PODs, credit notes, factory policies, insurance, leases. Set expiry dates and the bell will warn before they lapse. Internal docs respect role-based visibility."
      />

      {/* Upload --------------------------------------------------------- */}
      <section className="card">
        <h3>Add a document</h3>
        <div className="docvault-form-grid">
          <label>
            <span>Belongs to</span>
            <select value={ownerType} onChange={(e) => changeOwnerType(e.target.value as DocumentOwnerType)}>
              <option value="supplier">Supplier</option>
              <option value="client">Client</option>
              <option value="internal">Internal (company)</option>
            </select>
          </label>
          {!isInternal ? (
            <label>
              <span>{ownerType === 'supplier' ? 'Supplier' : 'Client'} *</span>
              <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
                <option value="">Select…</option>
                {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>
          ) : null}
          <label>
            <span>Category</span>
            <select value={category} onChange={(e) => changeCategory(e.target.value as DocumentCategory)}>
              {visibleCategories.map((c) => <option key={c} value={c}>{c}</option>)}
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

          {showDeepLinks ? (
            <>
              <label>
                <span>Link to invoice (optional)</span>
                <select value={linkedInvoiceId} onChange={(e) => setLinkedInvoiceId(e.target.value)}>
                  <option value="">— None —</option>
                  {invoices.filter((i) => !ownerId || i.clientId === ownerId).map((i) => (
                    <option key={i.id} value={i.id}>{i.invoiceNumber} · {i.clientName}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Link to job (optional)</span>
                <select value={linkedJobId} onChange={(e) => setLinkedJobId(e.target.value)}>
                  <option value="">— None —</option>
                  {jobs.filter((j) => !ownerId || j.clientId === ownerId).map((j) => (
                    <option key={j.id} value={j.id}>{j.jobNumber} · {j.customerName || ''}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Link to quote (optional)</span>
                <select value={linkedQuoteId} onChange={(e) => setLinkedQuoteId(e.target.value)}>
                  <option value="">— None —</option>
                  {quoteEstimates.filter((q) => !ownerId || q.clientId === ownerId).map((q) => (
                    <option key={q.id} value={q.id}>{q.quoteNumber} · {q.clientName}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Link to delivery note (optional)</span>
                <select value={linkedDeliveryNoteId} onChange={(e) => setLinkedDeliveryNoteId(e.target.value)}>
                  <option value="">— None —</option>
                  {deliveryNotes.filter((d) => !ownerId || d.clientId === ownerId).map((d) => (
                    <option key={d.id} value={d.id}>{d.deliveryNoteNumber} · {d.clientName}</option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {isInternal ? (
            <div className="docvault-span-2">
              <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Visible to (roles)</span>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {ALL_ROLES.map((r) => (
                  <label key={r} className="permission-check" style={{ minWidth: 100 }}>
                    <input type="checkbox" checked={visibleToRoles.includes(r)} onChange={() => toggleRole(r)} />
                    <span style={{ textTransform: 'capitalize' }}>{r}</span>
                  </label>
                ))}
              </div>
              <small className="muted">
                {visibleToRoles.length === 0
                  ? 'Visible to everyone (no role restriction).'
                  : `Visible only to: ${visibleToRoles.join(', ')} (admin always sees).`}
              </small>
            </div>
          ) : null}
        </div>
        <input ref={fileRef} type="file" accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={handleUpload} style={{ display: 'none' }} />
        <div className="docvault-actions">
          {message ? <span className="muted">{message}</span> : null}
          <button className="primary-button" disabled={busy || (!isInternal && !ownerId)} onClick={() => fileRef.current?.click()}>
            {busy ? 'Uploading…' : 'Choose file & upload'}
          </button>
        </div>
      </section>

      {/* Filters + list ------------------------------------------------- */}
      <section className="card">
        <div className="docvault-filters">
          <label>
            <span>Show</span>
            <select value={filterOwnerType} onChange={(e) => { setFilterOwnerType(e.target.value as 'all' | DocumentOwnerType); setFilterOwnerId(''); }}>
              <option value="all">All documents</option>
              <option value="supplier">Suppliers only</option>
              <option value="client">Clients only</option>
              <option value="internal">Internal only</option>
            </select>
          </label>
          {(filterOwnerType === 'supplier' || filterOwnerType === 'client') && (
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
          <EmptyState title="No documents to show" body="Upload a supplier, client or internal document above. Internal docs respect role-based visibility." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Belongs to</th>
                <th>Category</th>
                <th>Linked to</th>
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
                const linkedParts: string[] = [];
                if (d.linkedInvoiceId) {
                  const inv = invoices.find((i) => i.id === d.linkedInvoiceId);
                  linkedParts.push(inv ? `Invoice ${inv.invoiceNumber}` : 'Invoice');
                }
                if (d.linkedJobId) {
                  const job = jobs.find((j) => j.id === d.linkedJobId);
                  linkedParts.push(job ? `Job ${job.jobNumber}` : 'Job');
                }
                if (d.linkedQuoteId) {
                  const q = quoteEstimates.find((q) => q.id === d.linkedQuoteId);
                  linkedParts.push(q ? `Quote ${q.quoteNumber}` : 'Quote');
                }
                if (d.linkedDeliveryNoteId) {
                  const dn = deliveryNotes.find((n) => n.id === d.linkedDeliveryNoteId);
                  linkedParts.push(dn ? `Delivery ${dn.deliveryNoteNumber}` : 'Delivery note');
                }
                return (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.title}</strong>
                      <div className="muted" style={{ fontSize: '0.75rem' }}>{d.fileName}</div>
                    </td>
                    <td>
                      {d.ownerType === 'internal' ? <em>Internal</em> : <>{d.ownerName} <span className="muted">({d.ownerType})</span></>}
                      {d.ownerType === 'internal' && d.visibleToRoles && d.visibleToRoles.length > 0 ? (
                        <div className="muted" style={{ fontSize: '0.7rem' }}>Roles: {d.visibleToRoles.join(', ')}</div>
                      ) : null}
                    </td>
                    <td>{d.category}</td>
                    <td className="muted" style={{ fontSize: '0.78rem' }}>{linkedParts.length ? linkedParts.join(' · ') : '—'}</td>
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
