/**
 * SARS Centre — Phase 25 (tax organizer / prep, NOT a tax engine).
 *
 * Two jobs:
 *   1. Show every upcoming SARS deadline (VAT201, EMP201, EMP501, IRP6, ITR14)
 *      with how many days are left and what's been done — so nothing is missed.
 *   2. For each period, prepare the figures. VAT201 is auto-filled from the
 *      invoices + supplier bills already in the system, with manual override;
 *      the rest are light worksheets + a submission/payment trail.
 *
 * It deliberately does not file anything or compute income tax. The headline
 * for the user is: "what's due, when, and are the numbers ready."
 */

import { useMemo, useRef, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  AppSettingsSarsConfig,
  DocumentRecord,
  Invoice,
  SARS_FILING_STATUSES,
  SARS_OBLIGATION_LABELS,
  SARS_OBLIGATION_SHORT,
  SarsFiling,
  SarsFilingFigure,
  SarsFilingStatus,
  SupplierBill,
  PayrollRun,
} from '../../types';
import { formatNumber } from '../../utils/calculations';
import { buildSarsCalendar, computeVatForPeriod, daysUntil, SarsCalendarSlot } from '../../utils/sars';

interface SarsCentrePageProps {
  sarsFilings: SarsFiling[];
  sarsConfig: AppSettingsSarsConfig;
  invoices: Invoice[];
  supplierBills: SupplierBill[];
  payrollRuns: PayrollRun[];
  documents: DocumentRecord[];
  today: string;
  onSaveFiling: (filing: SarsFiling) => void;
  onSaveConfig: (config: AppSettingsSarsConfig) => void;
  // Phase 98.3 — SARS Correspondence panel wiring.
  uploaderName?: string;
  onSaveDocument?: (doc: DocumentRecord) => void;
  onDeleteDocument?: (id: string) => void;
  onUploadDocumentFile?: (file: File, docId: string) => Promise<{ storagePath: string; signedUrl: string } | null>;
}

/** EMP201 = PAYE + UIF (both sides) + SDL across payroll runs for a month. */
function computeEmp201ForMonth(payrollRuns: PayrollRun[], year: number, month: number) {
  const runs = payrollRuns.filter((r) => r.periodYear === year && r.periodMonth === month);
  const paye = runs.reduce((s, r) => s + (Number(r.totalPaye) || 0), 0);
  const uif = runs.reduce((s, r) => s + (Number(r.totalUifEmployee) || 0) + (Number(r.totalUifEmployer) || 0), 0);
  const sdl = runs.reduce((s, r) => s + (Number(r.totalSdl) || 0), 0);
  return { paye: round2(paye), uif: round2(uif), sdl: round2(sdl), total: round2(paye + uif + sdl), runCount: runs.length };
}

const STATUS_CLASS: Record<SarsFilingStatus, string> = {
  'Not Started': 'status-pending',
  'In Progress': 'status-ocr_running',
  'Submitted': 'status-ocr_done',
  'Paid': 'status-reviewed',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function round2(n: number): number { return Math.round((Number(n) || 0) * 100) / 100; }

function recomputeVatNet(f: SarsFiling): SarsFiling {
  const net = round2((Number(f.outputVat) || 0) - (Number(f.inputVat) || 0) + (Number(f.manualAdjustment) || 0));
  return { ...f, netVatPayable: net, amountPayable: net };
}

function filingFromSlot(
  slot: SarsCalendarSlot,
  existing: SarsFiling | undefined,
  invoices: Invoice[],
  supplierBills: SupplierBill[],
  payrollRuns: PayrollRun[],
): SarsFiling {
  if (existing) return { ...existing };
  const base: SarsFiling = {
    id: '',
    obligationType: slot.obligationType,
    periodKey: slot.periodKey,
    periodLabel: slot.periodLabel,
    periodStart: slot.periodStart,
    periodEnd: slot.periodEnd,
    dueDate: slot.dueDate,
    status: 'Not Started',
    outputVat: 0,
    inputVat: 0,
    manualAdjustment: 0,
    netVatPayable: 0,
    amountPayable: 0,
    figures: [],
    submittedDate: '',
    submittedBy: '',
    paymentDate: '',
    paymentReference: '',
    proofDocumentId: '',
    notes: '',
    createdAt: '',
  };
  if (slot.obligationType === 'VAT201') {
    const vat = computeVatForPeriod(invoices, supplierBills, slot.periodStart, slot.periodEnd);
    base.outputVat = vat.outputVat;
    base.inputVat = vat.inputVat;
    return recomputeVatNet(base);
  }
  if (slot.obligationType === 'EMP201') {
    const year = Number(slot.periodStart.slice(0, 4));
    const month = Number(slot.periodStart.slice(5, 7));
    const e = computeEmp201ForMonth(payrollRuns, year, month);
    base.amountPayable = e.total;
    base.figures = [
      { id: 'emp-paye', label: 'PAYE', amount: e.paye, source: 'auto', note: '' },
      { id: 'emp-uif', label: 'UIF (employee + employer)', amount: e.uif, source: 'auto', note: '' },
      { id: 'emp-sdl', label: 'SDL', amount: e.sdl, source: 'auto', note: '' },
    ];
  }
  return base;
}

export function SarsCentrePage({
  sarsFilings,
  sarsConfig,
  invoices,
  supplierBills,
  payrollRuns,
  documents,
  today,
  onSaveFiling,
  onSaveConfig,
  uploaderName = '',
  onSaveDocument,
  onDeleteDocument,
  onUploadDocumentFile,
}: SarsCentrePageProps) {
  const [mode, setMode] = useState<'overview' | 'worksheet'>('overview');
  const [draft, setDraft] = useState<SarsFiling | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState<AppSettingsSarsConfig>(sarsConfig);

  const savedByKey = useMemo(() => {
    const map = new Map<string, SarsFiling>();
    sarsFilings.forEach((f) => map.set(f.periodKey, f));
    return map;
  }, [sarsFilings]);

  const calendar = useMemo(() => buildSarsCalendar(sarsConfig, today), [sarsConfig, today]);

  const enriched = useMemo(
    () =>
      calendar.map((slot) => {
        const saved = savedByKey.get(slot.periodKey);
        const status: SarsFilingStatus = saved?.status ?? 'Not Started';
        const days = daysUntil(slot.dueDate, today);
        const settled = status === 'Submitted' || status === 'Paid';
        const overdue = !settled && days < 0;
        const dueSoon = !settled && days >= 0 && days <= 30;
        return { slot, saved, status, days, settled, overdue, dueSoon };
      }),
    [calendar, savedByKey, today],
  );

  const actionNeeded = enriched.filter((e) => e.overdue || e.dueSoon);
  const upcoming = enriched.filter((e) => !e.overdue && !e.dueSoon);

  function openSlot(slot: SarsCalendarSlot) {
    setDraft(filingFromSlot(slot, savedByKey.get(slot.periodKey), invoices, supplierBills, payrollRuns));
    setMode('worksheet');
  }

  function recalcEmp201() {
    setDraft((d) => {
      if (!d) return d;
      const year = Number(d.periodStart.slice(0, 4));
      const month = Number(d.periodStart.slice(5, 7));
      const e = computeEmp201ForMonth(payrollRuns, year, month);
      return {
        ...d,
        amountPayable: e.total,
        figures: [
          { id: 'emp-paye', label: 'PAYE', amount: e.paye, source: 'auto', note: '' },
          { id: 'emp-uif', label: 'UIF (employee + employer)', amount: e.uif, source: 'auto', note: '' },
          { id: 'emp-sdl', label: 'SDL', amount: e.sdl, source: 'auto', note: '' },
        ],
      };
    });
  }

  function updateDraft(patch: Partial<SarsFiling>) {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, ...patch };
      return d.obligationType === 'VAT201' ? recomputeVatNet(next) : next;
    });
  }

  function recalcVat() {
    setDraft((d) => {
      if (!d) return d;
      const vat = computeVatForPeriod(invoices, supplierBills, d.periodStart, d.periodEnd);
      return recomputeVatNet({ ...d, outputVat: vat.outputVat, inputVat: vat.inputVat });
    });
  }

  function addFigure() {
    setDraft((d) => (d ? { ...d, figures: [...d.figures, { id: `fig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label: '', amount: 0, source: 'manual', note: '' }] } : d));
  }
  function updateFigure(id: string, patch: Partial<SarsFilingFigure>) {
    setDraft((d) => (d ? { ...d, figures: d.figures.map((f) => (f.id === id ? { ...f, ...patch } : f)) } : d));
  }
  function removeFigure(id: string) {
    setDraft((d) => (d ? { ...d, figures: d.figures.filter((f) => f.id !== id) } : d));
  }

  function saveDraft() {
    if (!draft) return;
    let toSave = draft;
    // Snapshot VAT headline numbers into the figures list for the record/export.
    if (draft.obligationType === 'VAT201') {
      toSave = {
        ...draft,
        figures: [
          { id: 'vat-sales', label: 'Standard-rated sales (excl VAT)', amount: round2(computeVatForPeriod(invoices, supplierBills, draft.periodStart, draft.periodEnd).standardRatedSalesExclVat), source: 'auto', note: '' },
          { id: 'vat-output', label: 'Output VAT', amount: round2(draft.outputVat), source: 'auto', note: '' },
          { id: 'vat-input', label: 'Input VAT (purchases)', amount: round2(draft.inputVat), source: 'auto', note: '' },
          { id: 'vat-adj', label: 'Manual adjustment', amount: round2(draft.manualAdjustment), source: 'manual', note: '' },
          { id: 'vat-net', label: 'Net VAT payable / (refundable)', amount: round2(draft.netVatPayable), source: 'auto', note: '' },
        ],
      };
    }
    onSaveFiling(toSave);
    setMode('overview');
    setDraft(null);
  }

  function saveConfig() {
    onSaveConfig({
      ...configDraft,
      financialYearEndMonth: Math.min(12, Math.max(1, Number(configDraft.financialYearEndMonth) || 2)),
    });
    setShowConfig(false);
  }

  // ─────────────────────────────────────────────────────────────── Worksheet
  if (mode === 'worksheet' && draft) {
    const isVat = draft.obligationType === 'VAT201';
    const docOptions = documents.filter((d) => d.fileName);
    return (
      <div className="page-stack sars-shell">
        <SectionTitle
          title={`${SARS_OBLIGATION_SHORT[draft.obligationType]} · ${draft.periodLabel}`}
          subtitle={SARS_OBLIGATION_LABELS[draft.obligationType]}
          backAction={<button className="ghost-button" onClick={() => { setMode('overview'); setDraft(null); }}>← Back</button>}
        />

        <section className="card">
          <div className="sars-grid">
            <label><span>Period start</span><input type="date" value={draft.periodStart} onChange={(e) => updateDraft({ periodStart: e.target.value })} /></label>
            <label><span>Period end</span><input type="date" value={draft.periodEnd} onChange={(e) => updateDraft({ periodEnd: e.target.value })} /></label>
            <label><span>Due date</span><input type="date" value={draft.dueDate} onChange={(e) => updateDraft({ dueDate: e.target.value })} /></label>
            <label><span>Status</span>
              <select value={draft.status} onChange={(e) => updateDraft({ status: e.target.value as SarsFilingStatus })}>
                {SARS_FILING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </section>

        {isVat ? (
          <section className="card">
            <div className="sars-card-head">
              <h3>VAT201 worksheet</h3>
              <button className="ghost-button" onClick={recalcVat}>↻ Recalculate from accounting data</button>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>
              Auto-filled from issued ZAR invoices and supplier bills dated in this period. Adjust any figure before you submit on eFiling.
            </p>
            <div className="sars-vat-rows">
              <div className="sars-vat-row"><span>Output VAT (on sales)</span><input type="number" value={draft.outputVat} onChange={(e) => updateDraft({ outputVat: Number(e.target.value) })} /></div>
              <div className="sars-vat-row"><span>Input VAT (on purchases)</span><input type="number" value={draft.inputVat} onChange={(e) => updateDraft({ inputVat: Number(e.target.value) })} /></div>
              <div className="sars-vat-row"><span>Manual adjustment (+/−)</span><input type="number" value={draft.manualAdjustment} onChange={(e) => updateDraft({ manualAdjustment: Number(e.target.value) })} /></div>
              <div className="sars-vat-row sars-vat-net">
                <span>{draft.netVatPayable >= 0 ? 'Net VAT payable to SARS' : 'Net VAT refund due'}</span>
                <strong className={draft.netVatPayable >= 0 ? 'amount-due' : ''}>ZAR {formatNumber(Math.abs(draft.netVatPayable), 2)}</strong>
              </div>
            </div>
          </section>
        ) : (
          <section className="card">
            <div className="sars-card-head">
              <h3>Figures</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {draft.obligationType === 'EMP201' && (
                  <button className="ghost-button" onClick={recalcEmp201}>↻ Recalculate from payroll</button>
                )}
                <button className="ghost-button" onClick={addFigure} style={{ borderStyle: 'dashed' }}>+ Add line</button>
              </div>
            </div>
            {draft.obligationType === 'EMP201' && (
              <p className="muted" style={{ marginTop: 0 }}>Auto-filled from payroll runs dated in this month (PAYE + UIF + SDL). Adjust before submitting on eFiling.</p>
            )}
            <label className="sars-amount"><span>Amount payable to SARS (ZAR)</span><input type="number" value={draft.amountPayable} onChange={(e) => updateDraft({ amountPayable: Number(e.target.value) })} /></label>
            {draft.figures.length > 0 && (
              <table className="data-table" style={{ marginTop: '0.75rem' }}>
                <thead><tr><th>Line</th><th style={{ textAlign: 'right' }}>Amount</th><th></th></tr></thead>
                <tbody>
                  {draft.figures.map((f) => (
                    <tr key={f.id}>
                      <td><input value={f.label} onChange={(e) => updateFigure(f.id, { label: e.target.value })} placeholder="e.g. PAYE" /></td>
                      <td><input type="number" style={{ width: 120, textAlign: 'right' }} value={f.amount} onChange={(e) => updateFigure(f.id, { amount: Number(e.target.value) })} /></td>
                      <td><button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => removeFigure(f.id)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        <section className="card">
          <h3>Submission &amp; payment</h3>
          <div className="sars-grid">
            <label><span>Submitted date</span><input type="date" value={draft.submittedDate} onChange={(e) => updateDraft({ submittedDate: e.target.value })} /></label>
            <label><span>Submitted by</span><input value={draft.submittedBy} onChange={(e) => updateDraft({ submittedBy: e.target.value })} /></label>
            <label><span>Payment date</span><input type="date" value={draft.paymentDate} onChange={(e) => updateDraft({ paymentDate: e.target.value })} /></label>
            <label><span>Payment reference</span><input value={draft.paymentReference} onChange={(e) => updateDraft({ paymentReference: e.target.value })} /></label>
            <label className="sars-span-2"><span>Proof of submission (Document Vault)</span>
              <select value={draft.proofDocumentId} onChange={(e) => updateDraft({ proofDocumentId: e.target.value })}>
                <option value="">— none linked —</option>
                {docOptions.map((d) => <option key={d.id} value={d.id}>{d.title || d.fileName}</option>)}
              </select>
            </label>
          </div>
          <label style={{ display: 'block', marginTop: '0.75rem' }}><span>Notes</span><input value={draft.notes} onChange={(e) => updateDraft({ notes: e.target.value })} /></label>
          <div className="sars-actions">
            <button className="primary-button" onClick={saveDraft}>Save</button>
          </div>
        </section>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────── Overview
  const renderRow = (e: typeof enriched[number]) => {
    const overdueLabel = e.days < 0 ? `${Math.abs(e.days)}d overdue` : e.days === 0 ? 'Due today' : `${e.days}d left`;
    return (
      <tr key={e.slot.periodKey}>
        <td><span className="sars-tag">{SARS_OBLIGATION_SHORT[e.slot.obligationType]}</span></td>
        <td><strong>{e.slot.periodLabel}</strong></td>
        <td>{e.slot.dueDate}</td>
        <td className={e.overdue ? 'amount-due' : e.dueSoon ? 'sars-soon' : 'muted'}>{e.settled ? '—' : overdueLabel}</td>
        <td><span className={`status-pill ${STATUS_CLASS[e.status]}`}>{e.status}</span></td>
        <td style={{ textAlign: 'right' }}>
          <button className="link-button" onClick={() => openSlot(e.slot)}>{e.saved ? 'Open' : 'Prepare'}</button>
        </td>
      </tr>
    );
  };

  return (
    <div className="page-stack">
      <SectionTitle
        title="SARS Centre"
        subtitle="Every SARS deadline in one place, with figures pre-filled from your books. An organizer — it doesn't file for you."
        action={<button className="ghost-button" onClick={() => { setConfigDraft(sarsConfig); setShowConfig((v) => !v); }}>{showConfig ? 'Close settings' : 'Settings'}</button>}
      />

      <section className="card sars-config-summary">
        <span>VAT: <strong>{sarsConfig.vatRegistered ? `${sarsConfig.vatFrequency === 'monthly' ? 'Monthly' : `Bi-monthly (Cat ${sarsConfig.vatCategory})`}` : 'Not registered'}</strong></span>
        <span>Payroll: <strong>{sarsConfig.payrollActive ? 'Active' : 'Off'}</strong></span>
        <span>Financial year-end: <strong>{MONTHS[Math.min(12, Math.max(1, sarsConfig.financialYearEndMonth || 2)) - 1]}</strong></span>
      </section>

      {showConfig && (
        <section className="card">
          <h3>SARS settings</h3>
          <div className="sars-grid">
            <label className="sars-check"><input type="checkbox" checked={configDraft.vatRegistered} onChange={(e) => setConfigDraft({ ...configDraft, vatRegistered: e.target.checked })} /><span>VAT registered</span></label>
            <label><span>VAT frequency</span>
              <select value={configDraft.vatFrequency} onChange={(e) => setConfigDraft({ ...configDraft, vatFrequency: e.target.value as AppSettingsSarsConfig['vatFrequency'] })}>
                <option value="bimonthly">Bi-monthly (every 2 months)</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label><span>VAT category</span>
              <select value={configDraft.vatCategory} onChange={(e) => setConfigDraft({ ...configDraft, vatCategory: e.target.value as AppSettingsSarsConfig['vatCategory'] })}>
                <option value="A">Category A (ends Jan, Mar, May…)</option>
                <option value="B">Category B (ends Feb, Apr, Jun…)</option>
              </select>
            </label>
            <label className="sars-check"><input type="checkbox" checked={configDraft.payrollActive} onChange={(e) => setConfigDraft({ ...configDraft, payrollActive: e.target.checked })} /><span>Run payroll (track EMP201/EMP501)</span></label>
            <label><span>Financial year-end</span>
              <select value={configDraft.financialYearEndMonth} onChange={(e) => setConfigDraft({ ...configDraft, financialYearEndMonth: Number(e.target.value) })}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </label>
          </div>
          <div className="sars-actions">
            <button className="primary-button" onClick={saveConfig}>Save settings</button>
          </div>
        </section>
      )}

      <section className="card">
        <h3 className="sars-section-h">Action needed</h3>
        {actionNeeded.length === 0 ? (
          <p className="muted">Nothing overdue or due within 30 days. You're on top of it.</p>
        ) : (
          <table className="data-table">
            <thead><tr><th></th><th>Period</th><th>Due</th><th>Countdown</th><th>Status</th><th></th></tr></thead>
            <tbody>{actionNeeded.map(renderRow)}</tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h3 className="sars-section-h">Upcoming</h3>
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming deadlines" body="Adjust your SARS settings if this looks wrong." />
        ) : (
          <table className="data-table">
            <thead><tr><th></th><th>Period</th><th>Due</th><th>Countdown</th><th>Status</th><th></th></tr></thead>
            <tbody>{upcoming.map(renderRow)}</tbody>
          </table>
        )}
      </section>

      {/* Phase 98.3 — SARS Correspondence panel. PDFs go into Supabase
          Storage; only metadata sits in the documents table. Retention
          is 5 years (SARS rule) — controlled by the category default. */}
      {onSaveDocument && onDeleteDocument && onUploadDocumentFile ? (
        <SarsCorrespondencePanel
          documents={documents}
          uploaderName={uploaderName}
          onSave={onSaveDocument}
          onDelete={onDeleteDocument}
          onUploadFile={onUploadDocumentFile}
        />
      ) : null}
    </div>
  );
}

/* ─── SARS Correspondence panel ────────────────────────────────────── */
function SarsCorrespondencePanel(props: {
  documents: DocumentRecord[];
  uploaderName: string;
  onSave: (doc: DocumentRecord) => void;
  onDelete: (id: string) => void;
  onUploadFile: (file: File, docId: string) => Promise<{ storagePath: string; signedUrl: string } | null>;
}) {
  const { documents, uploaderName, onSave, onDelete, onUploadFile } = props;
  const [title, setTitle] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const items = documents.filter((d) => d.ownerType === 'sars');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMessage('');
    try {
      const docId = `SARS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const result = await onUploadFile(file, docId);
      const doc: DocumentRecord = {
        id: docId,
        createdAt: new Date().toISOString(),
        ownerType: 'sars',
        ownerId: 'sars',
        ownerName: 'SARS',
        category: 'SARS Correspondence',
        title: title.trim() || file.name,
        fileName: file.name,
        fileMimeType: file.type,
        fileSizeBytes: file.size,
        fileUrl: result?.signedUrl ?? '',
        storagePath: result?.storagePath ?? '',
        issueDate,
        expiryDate: '',
        uploadedByName: uploaderName,
        notes,
        retentionDays: 5 * 365,
      };
      onSave(doc);
      setMessage('Uploaded.');
      setTitle(''); setNotes('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="card">
      <h3 className="sars-section-h">SARS Correspondence</h3>
      <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>
        Letters, notices, assessments, objections. PDFs persist in Supabase Storage.
        Retention 5 years per SARS rules.
      </p>
      <div style={{ marginTop: 10, padding: 10, background: 'var(--jp-paper-2, #faf8f4)', borderRadius: 8 }}>
        <div className="form-grid">
          <label><span>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ITA34 assessment — 2026 tax year" /></label>
          <label><span>Issue date</span><input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></label>
          <label className="full-span"><span>Notes</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional context" /></label>
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <input ref={fileRef} type="file" onChange={handleUpload} disabled={uploading} accept="application/pdf,image/*,.doc,.docx" />
          {uploading ? <span className="muted" style={{ fontSize: 12 }}>Uploading…</span> : null}
        </div>
        {message ? <p style={{ marginTop: 6, fontSize: 12, color: message.includes('fail') ? '#b22b2b' : '#2e6f3e' }}>{message}</p> : null}
      </div>

      {items.length === 0 ? (
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>No SARS correspondence on file yet.</p>
      ) : (
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="data-table">
            <thead><tr><th>Title</th><th>Issued</th><th>Size</th><th /></tr></thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td>
                    <a href={d.fileUrl} target="_blank" rel="noreferrer">{d.title || d.fileName}</a>
                    {d.notes ? <div className="table-subtext">{d.notes}</div> : null}
                  </td>
                  <td>{d.issueDate || '—'}</td>
                  <td>{Math.round((d.fileSizeBytes || 0) / 1024)} KB</td>
                  <td>
                    <button type="button" className="ghost-button" onClick={() => onDelete(d.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
