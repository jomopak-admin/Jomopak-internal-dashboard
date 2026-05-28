/**
 * Tooling page — Phase 62
 *
 * Shared list + form for Dies AND Stereos. Selects mode via the
 * `toolType` prop so the parent can mount it twice — once at view
 * 'dies' and once at view 'stereos' — without duplicating UI.
 *
 * Die-specific UI: dimensions (W×H×D mm), bag/box type, handle / bottom
 * style, sharpening history (add an event when a sharpening happens).
 *
 * Stereo-specific UI: client (required), design name + version,
 * supersedes-link (when replacing an older version), client sign-off
 * (signer + date + on-screen signature pad + uploaded signed sample).
 *
 * Shared UI: photos (uses PhotoUploader → photos bucket), supplier +
 * internal vs external storage, cost + paid trail, status badge, notes,
 * runCount / lastUsedAt usage trail.
 */

import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { PhotoUploader } from '../../components/PhotoUploader';
import { SectionTitle } from '../../components/SectionTitle';
import { SignaturePad } from '../../components/SignaturePad';
import {
  Client,
  HandleType,
  Supplier,
  Tooling,
  ToolingFilters,
  ToolingFormState,
  ToolingSharpeningEvent,
  ToolingStatus,
  ToolType,
  TOOLING_STATUSES,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface ToolingPageProps {
  toolType: ToolType;
  tooling: Tooling[];
  clients: Client[];
  suppliers: Supplier[];
  filters: ToolingFilters;
  setFilters: (v: ToolingFilters) => void;
  form: ToolingFormState;
  setForm: (v: ToolingFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (t: Tooling) => void;
  onDelete: (id: string) => void;
  /** Add a sharpening event to a die. */
  onAddSharpeningEvent: (toolId: string, event: ToolingSharpeningEvent) => void;
}

const STATUS_CLASS: Record<ToolingStatus, string> = {
  'In Service': 'status-ok',
  'Needs Sharpening': 'status-warn',
  'In Repair': 'status-warn',
  Damaged: 'status-bad',
  Decommissioned: 'status-bad',
  Archived: 'status-info',
};

export function ToolingPage(props: ToolingPageProps) {
  const {
    toolType,
    tooling,
    clients,
    suppliers,
    filters,
    setFilters,
    form,
    setForm,
    editingId,
    message,
    onSave,
    onReset,
    onEdit,
    onDelete,
    onAddSharpeningEvent,
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (editingId) setMode('form');
  }, [editingId]);

  // Filter the registry to this page's tool type.
  const typedTooling = useMemo(() => tooling.filter((t) => t.toolType === toolType), [tooling, toolType]);

  // Apply UI filters on top.
  const filtered = useMemo(() => {
    return typedTooling.filter((t) => {
      if (filters.activeOnly && !t.active) return false;
      if (filters.status !== 'all' && t.status !== filters.status) return false;
      if (filters.location !== 'all' && t.location !== filters.location) return false;
      if (filters.client && !t.clientName.toLowerCase().includes(filters.client.toLowerCase())) return false;
      if (filters.supplier && !t.supplierName.toLowerCase().includes(filters.supplier.toLowerCase())) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = `${t.code} ${t.name} ${t.description} ${t.designName ?? ''} ${t.bagType ?? ''} ${t.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.sizeQuery && toolType === 'die') {
        const q = filters.sizeQuery.toLowerCase().replace(/\s/g, '');
        const dims = t.dimensions;
        const sizeStr = dims ? `${dims.widthMm}x${dims.heightMm}x${dims.depthMm}` : '';
        const altSizeStr = dims ? `${dims.widthMm}×${dims.heightMm}×${dims.depthMm}` : '';
        const hay = `${sizeStr} ${altSizeStr} ${t.name} ${t.description} ${t.bagType ?? ''}`.toLowerCase().replace(/\s/g, '');
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [typedTooling, filters, toolType]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  const isDie = toolType === 'die';
  const labelSingular = isDie ? 'Die' : 'Stereo';
  const labelPlural = isDie ? 'Dies' : 'Stereos';

  // -------------- Form sections ------------------------------------------
  const sections: FormWizardSection[] = [];

  sections.push({
    key: 'identity',
    title: 'Identity',
    subtitle: isDie
      ? 'What is this die? Give it a recognisable name and where it lives.'
      : 'Whose stereo is this? Capture the design name + version so it can be told apart from earlier or later runs.',
    body: (
      <div className="form-grid">
        <label className="full-span">
          <span>{isDie ? 'Die name' : 'Stereo / design name'} <RequiredMarker /></span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isDie ? 'e.g. SOS 1kg flat-handle die' : 'e.g. Pick n Pay Mother\'s Day 2026 v3'} />
        </label>
        {!isDie && (
          <>
            <label>
              <span>Client <RequiredMarker /></span>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">— Pick a client —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>
              <span>Design version</span>
              <input type="number" min={1} value={form.designVersion} onChange={(e) => setForm({ ...form, designVersion: e.target.value })} placeholder="1" />
            </label>
            <label className="full-span">
              <span>Replaces / supersedes</span>
              <select value={form.supersedesToolId} onChange={(e) => setForm({ ...form, supersedesToolId: e.target.value })}>
                <option value="">— None (this is a brand-new stereo) —</option>
                {typedTooling.filter((t) => t.clientId === form.clientId && t.id !== editingId).map((t) => (
                  <option key={t.id} value={t.id}>{t.code} · {t.name} (v{t.designVersion || 1})</option>
                ))}
              </select>
              <small className="muted">When you save, the older stereo is auto-archived but its file stays on record.</small>
            </label>
          </>
        )}
        {isDie && (
          <label>
            <span>Linked client (optional — leave blank for a generic die)</span>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">— Generic / multi-client —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}
        <label className="full-span">
          <span>Description</span>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={isDie ? 'Brief description — what it cuts, what to watch for' : 'Notes about the artwork itself'} />
        </label>
      </div>
    ),
  });

  if (isDie) {
    sections.push({
      key: 'sizing',
      title: 'Sizing & geometry',
      subtitle: 'Sales searches by dimensions — fill these in so we can answer "do we already have a die for that?".',
      body: (
        <div className="form-grid">
          <label>
            <span>Width (mm)</span>
            <input type="number" value={form.widthMm} onChange={(e) => setForm({ ...form, widthMm: e.target.value })} />
          </label>
          <label>
            <span>Height (mm)</span>
            <input type="number" value={form.heightMm} onChange={(e) => setForm({ ...form, heightMm: e.target.value })} />
          </label>
          <label>
            <span>Depth / gusset (mm)</span>
            <input type="number" value={form.depthMm} onChange={(e) => setForm({ ...form, depthMm: e.target.value })} />
          </label>
          <label>
            <span>Bag / box type</span>
            <input value={form.bagType} onChange={(e) => setForm({ ...form, bagType: e.target.value })} placeholder="SOS / Tote / Pinch-bottom / Box" />
          </label>
          <label>
            <span>Handle type</span>
            <select value={form.handleType} onChange={(e) => setForm({ ...form, handleType: e.target.value as HandleType })}>
              <option value="None">None</option>
              <option value="Flat Handle">Flat Handle</option>
              <option value="Rope Handle">Rope Handle</option>
              <option value="Roll Handle">Roll Handle</option>
            </select>
          </label>
          <label>
            <span>Bottom style</span>
            <input value={form.bottomStyle} onChange={(e) => setForm({ ...form, bottomStyle: e.target.value })} placeholder="Flat / Block / Hex" />
          </label>
        </div>
      ),
    });
  }

  sections.push({
    key: 'location',
    title: 'Where it lives',
    subtitle: 'Internal = sitting on our rack. External = held at a supplier. The Sharpening register below uses this to scope claims like "needs sharpening after one run".',
    body: (
      <div className="form-grid">
        <label>
          <span>Location <RequiredMarker /></span>
          <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value as 'Internal' | 'External' })}>
            <option value="Internal">Internal — JomoPak warehouse</option>
            <option value="External">External — held at supplier</option>
          </select>
        </label>
        {form.location === 'Internal' ? (
          <label>
            <span>Internal storage location</span>
            <input value={form.internalLocation} onChange={(e) => setForm({ ...form, internalLocation: e.target.value })} placeholder="Die rack A3 / Stereo cabinet 2 shelf 4" />
          </label>
        ) : (
          <>
            <label>
              <span>Supplier holding it</span>
              <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">— Pick a supplier —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label>
              <span>Supplier reference / tag</span>
              <input value={form.supplierReference} onChange={(e) => setForm({ ...form, supplierReference: e.target.value })} placeholder="Their internal ID for this tool" />
            </label>
          </>
        )}
      </div>
    ),
  });

  sections.push({
    key: 'cost',
    title: 'Cost trail',
    subtitle: 'When did we pay for this tooling? Defends against "you didn\'t pay for the die" claims.',
    body: (
      <div className="form-grid">
        <label>
          <span>Cost (excl. VAT)</span>
          <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        </label>
        <label>
          <span>Currency</span>
          <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as ToolingFormState['currency'] })} maxLength={3} />
        </label>
        <label>
          <span>Paid date</span>
          <input type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} />
        </label>
        <label>
          <span>Supplier invoice number</span>
          <input value={form.supplierInvoiceNumber} onChange={(e) => setForm({ ...form, supplierInvoiceNumber: e.target.value })} />
        </label>
      </div>
    ),
  });

  sections.push({
    key: 'photos',
    title: 'Photos & documents',
    subtitle: 'A photo is worth ten phone calls when there\'s a dispute. Add as many as you have.',
    body: (
      <div className="form-grid">
        <div className="full-span">
          <PhotoUploader
            urls={form.photoUrls}
            onChange={(urls) => setForm({ ...form, photoUrls: urls })}
            recordType="tooling"
            recordId={editingId || `draft-${Date.now()}`}
            label={isDie ? 'Photos of the die' : 'Photos of the stereo + printed sample'}
            max={10}
          />
        </div>
        <div className="full-span">
          <PhotoUploader
            urls={form.documentUrls}
            onChange={(urls) => setForm({ ...form, documentUrls: urls })}
            recordType="tooling-docs"
            recordId={editingId || `draft-${Date.now()}`}
            label="Documents (drawings, supplier invoice, sign-off form)"
            max={10}
          />
        </div>
      </div>
    ),
  });

  if (!isDie) {
    sections.push({
      key: 'signoff',
      title: 'Client sign-off',
      subtitle: 'Capture the moment the client approves this artwork. If something goes wrong six months from now, this is the document that protects you.',
      body: (
        <div className="form-grid">
          <label>
            <span>Signed off by (name)</span>
            <input value={form.signedOffByName} onChange={(e) => setForm({ ...form, signedOffByName: e.target.value })} placeholder="e.g. Sue from PnP buying" />
          </label>
          <label>
            <span>Signed off on (date)</span>
            <input type="date" value={form.signedOffAt} onChange={(e) => setForm({ ...form, signedOffAt: e.target.value })} />
          </label>
          <div className="full-span">
            <SignaturePad
              label="On-screen signature"
              onChange={(dataUrl) => setForm({ ...form, signatureDataUrl: dataUrl })}
            />
            {form.signatureDataUrl && (
              <img src={form.signatureDataUrl} alt="Current signature" style={{ maxWidth: 240, marginTop: 8, border: '1px solid #ddd', borderRadius: 6 }} />
            )}
          </div>
          <div className="full-span">
            <PhotoUploader
              urls={form.signedSampleDocumentUrl ? [form.signedSampleDocumentUrl] : []}
              onChange={(urls) => setForm({ ...form, signedSampleDocumentUrl: urls[0] || '' })}
              recordType="tooling-signoff"
              recordId={editingId || `draft-${Date.now()}`}
              label="Photo / scan of the signed-off sample"
              max={1}
            />
          </div>
        </div>
      ),
    });
  }

  sections.push({
    key: 'status',
    title: 'Status & notes',
    body: (
      <div className="form-grid">
        <label>
          <span>Status</span>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ToolingStatus })}>
            {TOOLING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Active (uncheck to hide from job pickers without deleting)
        </label>
        <label className="full-span">
          <span>Notes</span>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
      </div>
    ),
  });

  // Sharpening register card (dies only, edit mode only).
  const editingRecord = editingId ? typedTooling.find((t) => t.id === editingId) : null;
  const showSharpening = isDie && editingRecord;

  return (
    <>
      <SectionTitle
        action={mode === 'list'
          ? (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="ghost-button" onClick={() => printToolingRegister(filtered, labelPlural, filters, toolType)}>Print register</button>
              <button className="secondary-button" onClick={handleStartCreate}>Add {labelSingular}</button>
            </div>
          )
          : <button className="ghost-button" onClick={handleBackToList}>Back to {labelPlural}</button>}
      />

      {mode === 'form' ? (
        <>
          <FormWizard
            title={editingId ? `Edit ${labelSingular.toLowerCase()}` : `New ${labelSingular.toLowerCase()}`}
            subtitle="Required fields are marked. Photos + sign-off help you defend disputes later."
            message={message || undefined}
            sections={sections}
            onSave={onSave}
            onCancel={handleBackToList}
            isEditing={!!editingId}
            saveLabel={`Save ${labelSingular}`}
            footerExtra={editingId ? (
              <button className="ghost-button" onClick={() => { if (confirm(`Delete ${editingRecord?.code}? Cannot be undone.`)) onDelete(editingId); }}>
                Delete {labelSingular.toLowerCase()}
              </button>
            ) : null}
          />
          {showSharpening && editingRecord && (
            <SharpeningRegister
              tool={editingRecord}
              onAddEvent={(event) => onAddSharpeningEvent(editingRecord.id, event)}
            />
          )}
        </>
      ) : (
        <section className="card">
          <SectionTitle title={`${labelPlural} register`} subtitle={`${filtered.length} of ${typedTooling.length} ${labelPlural.toLowerCase()} shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name, code, description, notes" /></label>
            <label><span>Status</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as ToolingFilters['status'] })}>
                <option value="all">All</option>
                {TOOLING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label><span>Location</span>
              <select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value as ToolingFilters['location'] })}>
                <option value="all">All</option>
                <option value="Internal">Internal</option>
                <option value="External">At supplier</option>
              </select>
            </label>
            <label><span>Client</span><input value={filters.client} onChange={(e) => setFilters({ ...filters, client: e.target.value })} /></label>
            <label><span>Supplier</span><input value={filters.supplier} onChange={(e) => setFilters({ ...filters, supplier: e.target.value })} /></label>
            {isDie && (
              <label><span>Size search</span><input value={filters.sizeQuery} onChange={(e) => setFilters({ ...filters, sizeQuery: e.target.value })} placeholder="240x120, A4, etc." /></label>
            )}
            <label className="checkbox-row">
              <input type="checkbox" checked={filters.activeOnly} onChange={(e) => setFilters({ ...filters, activeOnly: e.target.checked })} />
              Active only
            </label>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title={`No ${labelPlural.toLowerCase()} yet`}
              body={isDie
                ? 'Add a die to start your tooling register. Once dimensions are captured, sales can search "do we already have one for this?" and save the client a fresh die cost.'
                : 'Add a stereo when a client signs off on artwork. The signed sample + signature become your proof for future runs.'}
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>{isDie ? 'Die' : 'Stereo'}</th>
                    <th>Client</th>
                    {isDie && <th>Dimensions</th>}
                    {!isDie && <th>Version</th>}
                    <th>Location</th>
                    <th>Status</th>
                    <th>Runs</th>
                    <th>Last used</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className={!t.active ? 'row-inactive' : undefined}>
                      <td><strong>{t.code}</strong></td>
                      <td>
                        <div>{t.name}</div>
                        {t.photoUrls.length > 0 && (
                          <img src={t.photoUrls[0]} alt="" className="row-thumb" style={{ height: 32, width: 32, objectFit: 'cover', borderRadius: 4, marginTop: 4 }} />
                        )}
                      </td>
                      <td>{t.clientName || (isDie ? 'Generic' : '—')}</td>
                      {isDie && (
                        <td>
                          {t.dimensions
                            ? `${t.dimensions.widthMm} × ${t.dimensions.heightMm} × ${t.dimensions.depthMm} mm`
                            : '—'}
                          <div className="table-subtext">{t.bagType || ''}</div>
                        </td>
                      )}
                      {!isDie && (
                        <td>
                          v{t.designVersion || 1}
                          {t.signedOffByName && <div className="table-subtext">✓ {t.signedOffByName}</div>}
                        </td>
                      )}
                      <td>
                        {t.location}
                        <div className="table-subtext">{t.location === 'External' ? t.supplierName : t.internalLocation}</div>
                      </td>
                      <td><span className={`status-badge ${STATUS_CLASS[t.status]}`}>{t.status}</span></td>
                      <td>{formatNumber(t.runCount)}</td>
                      <td>{t.lastUsedAt ? formatDate(t.lastUsedAt.slice(0, 10)) : '—'}</td>
                      <td><button className="table-button" onClick={() => onEdit(t)}>Open</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}

/** Phase 62.5 — open a printable register so the user can take it to a
 *  supplier for an annual tooling audit. Shows code, name, dimensions
 *  (dies) / version (stereos), supplier, internal location, status, run
 *  count, last used, and a tick column for the auditor to mark each as
 *  "seen on premises". The current page filters are applied so the
 *  printout matches what you're looking at. */
function printToolingRegister(
  rows: Tooling[],
  labelPlural: string,
  filters: ToolingFilters,
  toolType: ToolType,
) {
  const w = window.open('', '_blank', 'width=1100,height=1400');
  if (!w) return;
  const filterDescParts = [
    filters.status !== 'all' && `Status: ${filters.status}`,
    filters.location !== 'all' && `Location: ${filters.location}`,
    filters.client && `Client contains "${filters.client}"`,
    filters.supplier && `Supplier contains "${filters.supplier}"`,
    filters.sizeQuery && `Size: ${filters.sizeQuery}`,
    filters.activeOnly && 'Active only',
  ].filter(Boolean) as string[];
  const isDie = toolType === 'die';
  const headers = isDie
    ? ['☐', 'Code', 'Name', 'Client', 'Dimensions', 'Location / supplier', 'Status', 'Runs', 'Last used', 'Auditor notes']
    : ['☐', 'Code', 'Name', 'Client', 'Version', 'Signed off', 'Location / supplier', 'Status', 'Runs', 'Auditor notes'];
  const rowsHtml = rows.map((t) => {
    const where = t.location === 'External' ? (t.supplierName || '—') : (t.internalLocation || 'Internal');
    if (isDie) {
      const dims = t.dimensions ? `${t.dimensions.widthMm} × ${t.dimensions.heightMm} × ${t.dimensions.depthMm} mm` : '—';
      return `<tr>
        <td style="text-align:center;font-size:14px">☐</td>
        <td><strong>${t.code}</strong></td>
        <td>${escapeHtml(t.name)}</td>
        <td>${escapeHtml(t.clientName || 'Generic')}</td>
        <td>${dims}<div style="font-size:11px;color:#666">${escapeHtml(t.bagType || '')}</div></td>
        <td>${escapeHtml(where)}</td>
        <td>${escapeHtml(t.status)}</td>
        <td style="text-align:right">${t.runCount}</td>
        <td>${t.lastUsedAt ? t.lastUsedAt.slice(0, 10) : '—'}</td>
        <td style="min-width:160px;border-bottom:1px dashed #aaa">&nbsp;</td>
      </tr>`;
    }
    return `<tr>
      <td style="text-align:center;font-size:14px">☐</td>
      <td><strong>${t.code}</strong></td>
      <td>${escapeHtml(t.name)}</td>
      <td>${escapeHtml(t.clientName || '—')}</td>
      <td>v${t.designVersion || 1}</td>
      <td>${t.signedOffByName ? `✓ ${escapeHtml(t.signedOffByName)}<div style="font-size:11px;color:#666">${t.signedOffAt ? t.signedOffAt.slice(0, 10) : ''}</div>` : '—'}</td>
      <td>${escapeHtml(where)}</td>
      <td>${escapeHtml(t.status)}</td>
      <td style="text-align:right">${t.runCount}</td>
      <td style="min-width:160px;border-bottom:1px dashed #aaa">&nbsp;</td>
    </tr>`;
  }).join('');
  const totalCost = rows.reduce((s, t) => s + (Number(t.cost) || 0), 0);
  w.document.write(`<!DOCTYPE html><html><head><title>${labelPlural} register</title>
    <style>
      body { font-family: -apple-system, sans-serif; padding: 24px; color: #111; }
      h1 { margin: 0 0 4px; font-size: 22px; }
      .meta { font-size: 12px; color: #555; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; }
      th, td { padding: 8px 10px; border-bottom: 1px solid #ddd; text-align: left; font-size: 12px; vertical-align: top; }
      th { background: #f3f4f6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
      .total-row td { border-top: 2px solid #111; font-weight: 600; }
      .footer { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; font-size: 12px; }
      .sig-line { margin-top: 30px; border-top: 1px solid #111; padding-top: 4px; }
    </style></head><body>
    <h1>${labelPlural} register</h1>
    <div class="meta">
      Generated ${new Date().toLocaleString()} · ${rows.length} record(s)
      ${filterDescParts.length ? `· Filters: ${filterDescParts.join(' · ')}` : ''}
    </div>
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>
        ${rowsHtml}
        <tr class="total-row"><td colspan="${isDie ? 9 : 9}" style="text-align:right">Total tooling cost on register</td><td style="text-align:right">${totalCost ? totalCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : '—'}</td></tr>
      </tbody>
    </table>
    <div class="footer">
      <div>
        <div class="sig-line">JomoPak representative — name + signature</div>
        <div class="sig-line">Date</div>
      </div>
      <div>
        <div class="sig-line">Supplier / site representative — name + signature</div>
        <div class="sig-line">Date</div>
      </div>
    </div>
    <script>window.print();</script>
    </body></html>`);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface SharpeningRegisterProps {
  tool: Tooling;
  onAddEvent: (event: ToolingSharpeningEvent) => void;
}

function SharpeningRegister({ tool, onAddEvent }: SharpeningRegisterProps) {
  const [draft, setDraft] = useState({
    eventDate: new Date().toISOString().slice(0, 10),
    performedBy: '',
    runsSinceLast: '',
    cost: '',
    invoiceNumber: '',
    notes: '',
  });
  const history = tool.sharpeningHistory ?? [];

  function submit() {
    if (!draft.eventDate) return;
    onAddEvent({
      id: `sh-${Date.now().toString(36)}`,
      eventDate: draft.eventDate,
      performedBy: draft.performedBy.trim(),
      runsSinceLast: Number(draft.runsSinceLast) || 0,
      cost: Number(draft.cost) || 0,
      invoiceNumber: draft.invoiceNumber.trim(),
      notes: draft.notes.trim(),
    });
    setDraft({
      eventDate: new Date().toISOString().slice(0, 10),
      performedBy: '',
      runsSinceLast: '',
      cost: '',
      invoiceNumber: '',
      notes: '',
    });
  }

  return (
    <section className="card">
      <SectionTitle title="Sharpening / repair register" subtitle="Every time this die gets sharpened, log it here. When a supplier claims 'needs sharpening after one run', this register tells you the truth." />
      <div className="form-grid">
        <label><span>Event date</span><input type="date" value={draft.eventDate} onChange={(e) => setDraft({ ...draft, eventDate: e.target.value })} /></label>
        <label><span>Performed by</span><input value={draft.performedBy} onChange={(e) => setDraft({ ...draft, performedBy: e.target.value })} placeholder="Supplier or tech" /></label>
        <label><span>Runs since last sharpen</span><input type="number" value={draft.runsSinceLast} onChange={(e) => setDraft({ ...draft, runsSinceLast: e.target.value })} /></label>
        <label><span>Cost</span><input type="number" value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: e.target.value })} /></label>
        <label><span>Invoice number</span><input value={draft.invoiceNumber} onChange={(e) => setDraft({ ...draft, invoiceNumber: e.target.value })} /></label>
        <label className="full-span"><span>Notes</span><textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
      </div>
      <div className="form-actions">
        <button className="secondary-button" onClick={submit}>Log event</button>
      </div>
      {history.length > 0 && (
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead><tr><th>Date</th><th>By</th><th>Runs since last</th><th>Cost</th><th>Invoice</th><th>Notes</th></tr></thead>
            <tbody>
              {history.slice().sort((a, b) => (b.eventDate || '').localeCompare(a.eventDate || '')).map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.eventDate)}</td>
                  <td>{e.performedBy}</td>
                  <td>{e.runsSinceLast || '—'}</td>
                  <td>{e.cost ? formatNumber(e.cost) : '—'}</td>
                  <td>{e.invoiceNumber || '—'}</td>
                  <td>{e.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
