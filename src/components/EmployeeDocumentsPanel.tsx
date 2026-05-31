/**
 * Phase 96.2 — Employee Documents panel.
 *
 * Mounts on the Employees edit form. Lists every Doc Vault document with
 * ownerType='employee' + employeeId matching this employee, lets you
 * upload more, and warns when a doc is past its retention window.
 *
 * Files live in Supabase Storage (cheap). Only metadata sits in Postgres.
 * The actual upload is delegated to the parent's `onUploadFile` helper
 * which writes to Supabase Storage and returns the path + signed URL,
 * matching the existing Doc Vault upload flow.
 */

import { useMemo, useRef, useState } from 'react';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_RETENTION_DAYS,
  DocumentCategory,
  DocumentRecord,
  Employee,
  isDocumentPastRetention,
} from '../types';
import { formatDate, formatNumber } from '../utils/calculations';

interface Props {
  employee: Employee;
  documents: DocumentRecord[];
  uploaderName: string;
  onSave: (doc: DocumentRecord) => void;
  onDelete: (id: string) => void;
  onUploadFile: (file: File, docId: string) => Promise<{ storagePath: string; signedUrl: string } | null>;
}

/** Subset of categories that make sense to attach to an employee. */
const HR_CATEGORIES: DocumentCategory[] = [
  'Employment Contract', 'Contract Extension', 'Warning Letter',
  'Performance Review', 'Disciplinary Record', 'Resignation Letter',
  'Reference Letter', 'Training Certificate', 'Medical Record',
  'Payslip Acknowledgement', 'IRP5 / IT3a', 'Employee ID Copy',
  'HR Document',
];

export function EmployeeDocumentsPanel({ employee, documents, uploaderName, onSave, onDelete, onUploadFile }: Props) {
  const [showPastRetention, setShowPastRetention] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>('Warning Letter');
  const [title, setTitle] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const employeeDocs = useMemo(
    () => documents.filter((d) => d.ownerType === 'employee' && (d.employeeId === employee.id || d.ownerId === employee.id)),
    [documents, employee.id],
  );

  const visible = showPastRetention
    ? employeeDocs
    : employeeDocs.filter((d) => !isDocumentPastRetention(d));
  const pastRetentionCount = employeeDocs.filter((d) => isDocumentPastRetention(d)).length;

  const totalBytes = employeeDocs.reduce((s, d) => s + (d.fileSizeBytes || 0), 0);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!employee.id) {
      setMessage('Save the employee first before attaching documents.');
      return;
    }
    setUploading(true);
    setMessage('');
    try {
      const docId = `EDOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const result = await onUploadFile(file, docId);
      const storagePath = result?.storagePath ?? '';
      const fileUrl = result?.signedUrl ?? '';
      const fullName = `${employee.firstName} ${employee.lastName}`.trim();
      const doc: DocumentRecord = {
        id: docId,
        createdAt: new Date().toISOString(),
        ownerType: 'employee',
        ownerId: employee.id,
        ownerName: fullName || employee.employeeNumber || employee.id,
        employeeId: employee.id,
        category,
        title: title.trim() || file.name,
        fileName: file.name,
        fileMimeType: file.type,
        fileSizeBytes: file.size,
        fileUrl,
        storagePath,
        issueDate,
        expiryDate,
        uploadedByName: uploaderName,
        notes,
        retentionDays: DOCUMENT_CATEGORY_RETENTION_DAYS[category],
      };
      onSave(doc);
      setMessage('Document uploaded.');
      setTitle(''); setNotes(''); setExpiryDate('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function toggleArchive(doc: DocumentRecord) {
    onSave({ ...doc, markedForArchive: !doc.markedForArchive });
  }

  return (
    <section style={{ marginTop: 16, padding: 16, border: '1px solid var(--jp-border, #e5e2dc)', borderRadius: 10, background: 'var(--jp-paper, #fff)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <strong style={{ fontSize: 16 }}>HR documents</strong>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {employeeDocs.length} on file · {formatNumber(totalBytes / 1024, 0)} KB stored
            {pastRetentionCount > 0 ? <> · {pastRetentionCount} past retention</> : null}
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <input type="checkbox" checked={showPastRetention} onChange={(e) => setShowPastRetention(e.target.checked)} />
          Show past-retention
        </label>
      </div>

      {/* Upload form */}
      <div style={{ marginTop: 12, padding: 12, background: 'var(--jp-paper-2, #faf8f4)', borderRadius: 8 }}>
        <strong style={{ fontSize: 13 }}>Add a document</strong>
        <div className="form-grid" style={{ marginTop: 6 }}>
          <label><span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
              {HR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              {DOCUMENT_CATEGORIES.filter((c) => !HR_CATEGORIES.includes(c)).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {DOCUMENT_CATEGORY_RETENTION_DAYS[category] ? (
              <small className="muted">Retention: {Math.round(DOCUMENT_CATEGORY_RETENTION_DAYS[category]! / 365)} year(s).</small>
            ) : null}
          </label>
          <label><span>Title (optional)</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Verbal warning — 23 May 2026" /></label>
          <label><span>Issue date</span><input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></label>
          <label><span>Expiry (optional)</span><input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></label>
          <label className="full-span"><span>Notes</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context — e.g. 'Final written warning re late attendance.'" /></label>
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <input ref={fileInputRef} type="file" onChange={handleUpload} disabled={uploading || !employee.id} accept="application/pdf,image/*,.doc,.docx" />
          {uploading ? <span className="muted" style={{ fontSize: 12 }}>Uploading…</span> : null}
        </div>
        {!employee.id ? (
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Save the employee first, then come back here to attach docs.</p>
        ) : null}
        {message ? <p style={{ marginTop: 6, fontSize: 12, color: message.includes('fail') ? '#b22b2b' : '#2e6f3e' }}>{message}</p> : null}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          {employeeDocs.length === 0 ? 'No documents on file yet.' : 'All on-file documents are past retention. Tick "Show past-retention" to view.'}
        </p>
      ) : (
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="data-table">
            <thead><tr><th>Title</th><th>Category</th><th>Issued</th><th>Size</th><th>Status</th><th /></tr></thead>
            <tbody>
              {visible.map((d) => {
                const past = isDocumentPastRetention(d);
                return (
                  <tr key={d.id} style={{ opacity: d.markedForArchive ? 0.55 : 1 }}>
                    <td>
                      <a href={d.fileUrl} target="_blank" rel="noreferrer">{d.title || d.fileName}</a>
                      {d.notes ? <div className="table-subtext">{d.notes}</div> : null}
                    </td>
                    <td>{d.category}</td>
                    <td>{d.issueDate ? formatDate(d.issueDate) : '—'}</td>
                    <td>{formatNumber((d.fileSizeBytes || 0) / 1024, 0)} KB</td>
                    <td>
                      {past ? <span style={{ color: '#b8860b' }}>Past retention</span> : '—'}
                      {d.markedForArchive ? <div className="table-subtext">Marked for archive</div> : null}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="ghost-button" onClick={() => toggleArchive(d)}>
                          {d.markedForArchive ? 'Unarchive' : 'Mark archive'}
                        </button>
                        <button type="button" className="ghost-button" onClick={() => onDelete(d.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
