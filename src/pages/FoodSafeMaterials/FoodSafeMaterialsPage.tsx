/**
 * Approved Food-Safe Material Register.
 *
 * The gate-keeper for food-packaging jobs. Every material that can be used
 * in any job with foodContactLevel != 'NonFood' must live here with an
 * Approved status, the right contact-level approvals, current docs (FS
 * declaration, MSDS, CoA where applicable), and a current review date.
 *
 * The list flags suppliers whose docs are missing or expired, materials
 * past review, and lets you Approve / Suspend / Block / Quarantine in one
 * click. Job-card validation reads from this register via
 * `validateJobFoodSafety()` (see types/index.ts).
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  FoodSafeMaterial,
  FoodSafeMaterialFilters,
  FoodSafeMaterialFormState,
  FoodSafetyApprovalStatus,
  FoodSafetyMaterialCategory,
  FOOD_SAFETY_MATERIAL_CATEGORIES,
  FOOD_SAFETY_MATERIAL_CATEGORY_LABELS,
  Supplier,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface FoodSafeMaterialsPageProps {
  materials: FoodSafeMaterial[];
  suppliers: Supplier[];
  filters: FoodSafeMaterialFilters;
  setFilters: (v: FoodSafeMaterialFilters) => void;
  form: FoodSafeMaterialFormState;
  setForm: (v: FoodSafeMaterialFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (m: FoodSafeMaterial) => void;
  onStatusChange: (m: FoodSafeMaterial, status: FoodSafetyApprovalStatus) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function getReviewState(m: FoodSafeMaterial): 'overdue' | 'due-soon' | 'ok' | 'never' {
  if (!m.reviewDate) return 'never';
  const t = new Date(m.reviewDate).getTime();
  if (Number.isNaN(t)) return 'never';
  const now = Date.now();
  if (now > t) return 'overdue';
  if (t - now < 30 * DAY_MS) return 'due-soon';
  return 'ok';
}

function statusBadge(status: FoodSafetyApprovalStatus): string {
  switch (status) {
    case 'Approved': return 'badge-success';
    case 'Pending': return 'badge-warning';
    case 'Quarantined': return 'badge-warning';
    case 'Suspended':
    case 'Blocked':
    case 'Expired':
      return 'badge-danger';
    default: return '';
  }
}

export function FoodSafeMaterialsPage(props: FoodSafeMaterialsPageProps) {
  const {
    materials,
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
    onStatusChange,
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const q = filters.search.trim().toLowerCase();
      if (q) {
        const hay = [m.materialName, m.supplierName, m.supplierSku, m.internalBatchNumber, m.supplierBatchNumber, m.storageLocation].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.category && m.category !== filters.category) return false;
      if (filters.supplier && m.supplierId !== filters.supplier) return false;
      if (filters.status && m.status !== filters.status) return false;
      if (filters.contactLevel === 'direct' && !m.directContactApproved) return false;
      if (filters.contactLevel === 'indirect' && !m.indirectContactApproved && !m.directContactApproved) return false;
      if (filters.contactLevel === 'external' && !m.externalPrintOnly) return false;
      if (filters.reviewStatus !== 'all') {
        const r = getReviewState(m);
        if (filters.reviewStatus === 'overdue' && r !== 'overdue' && r !== 'never') return false;
        if (filters.reviewStatus === 'due-soon' && r !== 'due-soon') return false;
        if (filters.reviewStatus === 'ok' && r !== 'ok') return false;
      }
      return true;
    });
  }, [materials, filters]);

  const stats = useMemo(() => {
    const total = materials.length;
    const approved = materials.filter((m) => m.status === 'Approved').length;
    const directApproved = materials.filter((m) => m.status === 'Approved' && m.directContactApproved).length;
    const overdue = materials.filter((m) => getReviewState(m) === 'overdue' || getReviewState(m) === 'never').length;
    const blocked = materials.filter((m) => m.status === 'Blocked' || m.status === 'Suspended' || m.status === 'Expired').length;
    return { total, approved, directApproved, overdue, blocked };
  }, [materials]);

  function handleStartCreate() { onReset(); setMode('form'); }
  function handleStartEdit(m: FoodSafeMaterial) { onEdit(m); setMode('form'); }
  function handleBackToList() { onReset(); setMode('list'); }

  const sections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'Material identity',
      subtitle: 'What is it and who supplies it. The supplier must already exist on the supplier register.',
      missingRequired: [
        ...(form.materialName.trim() ? [] : ['Material name']),
        ...(form.supplierId ? [] : ['Supplier']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Material name <RequiredMarker /></span><input value={form.materialName} onChange={(e) => setForm({ ...form, materialName: e.target.value })} placeholder="e.g. WhitePak FoodGrade 90gsm" /></label>
          <label><span>Category <RequiredMarker /></span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as FoodSafetyMaterialCategory })}>
              {FOOD_SAFETY_MATERIAL_CATEGORIES.map((c) => <option key={c} value={c}>{FOOD_SAFETY_MATERIAL_CATEGORY_LABELS[c]}</option>)}
            </select>
          </label>
          <label><span>Supplier <RequiredMarker /></span>
            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">Select supplier…</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label><span>Supplier SKU / code</span><input value={form.supplierSku} onChange={(e) => setForm({ ...form, supplierSku: e.target.value })} placeholder="As on supplier's docs" /></label>
        </div>
      ),
    },
    {
      key: 'contact-approval',
      title: 'Food-contact approval level',
      subtitle: 'Tick every approval the supplier has actually granted in writing. This is what the job-card gate checks.',
      contextActive: form.directContactApproved || form.indirectContactApproved,
      body: (
        <div className="form-grid">
          <label className="checkbox-row full-span"><input type="checkbox" checked={form.directContactApproved} onChange={(e) => setForm({ ...form, directContactApproved: e.target.checked })} />Approved for <strong style={{ marginLeft: 4 }}>direct food contact</strong> (food touches this material)</label>
          <label className="checkbox-row full-span"><input type="checkbox" checked={form.indirectContactApproved} onChange={(e) => setForm({ ...form, indirectContactApproved: e.target.checked })} />Approved for <strong style={{ marginLeft: 4 }}>indirect food contact</strong> (outer/packaging only)</label>
          <label className="checkbox-row full-span"><input type="checkbox" checked={form.externalPrintOnly} onChange={(e) => setForm({ ...form, externalPrintOnly: e.target.checked })} />Approved for <strong style={{ marginLeft: 4 }}>external print only</strong> (no food contact whatsoever — typical for solvent-based inks)</label>
        </div>
      ),
    },
    {
      key: 'documents',
      title: 'Compliance documents',
      subtitle: 'Where the food-safe declaration, MSDS and Certificate of Analysis live. URLs for now; in-app upload arrives with the persistence session.',
      contextActive: !!form.foodSafeDeclarationUrl,
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Food-safe declaration URL</span><input value={form.foodSafeDeclarationUrl} onChange={(e) => setForm({ ...form, foodSafeDeclarationUrl: e.target.value })} placeholder="Link to PDF" /></label>
          <label className="full-span"><span>MSDS URL</span><input value={form.msdsUrl} onChange={(e) => setForm({ ...form, msdsUrl: e.target.value })} placeholder="Link to PDF" /></label>
          <label className="full-span"><span>Certificate of Analysis URL</span><input value={form.certificateOfAnalysisUrl} onChange={(e) => setForm({ ...form, certificateOfAnalysisUrl: e.target.value })} placeholder="If supplier issues per-batch CoA" /></label>
        </div>
      ),
    },
    {
      key: 'batch',
      title: 'Batch & storage',
      body: (
        <div className="form-grid">
          <label><span>Supplier batch number</span><input value={form.supplierBatchNumber} onChange={(e) => setForm({ ...form, supplierBatchNumber: e.target.value })} /></label>
          <label><span>Internal batch number</span><input value={form.internalBatchNumber} onChange={(e) => setForm({ ...form, internalBatchNumber: e.target.value })} placeholder="Auto if blank" /></label>
          <label><span>Storage location</span><input value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Approval status & dates',
      missingRequired: [
        ...(form.status ? [] : ['Status']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Status <RequiredMarker /></span>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FoodSafetyApprovalStatus })}>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Quarantined">Quarantined</option>
              <option value="Suspended">Suspended</option>
              <option value="Blocked">Blocked</option>
              <option value="Expired">Expired</option>
            </select>
          </label>
          <label><span>Approved on</span><input type="date" value={form.approvalDate} onChange={(e) => setForm({ ...form, approvalDate: e.target.value })} /></label>
          <label><span>Review due</span><input type="date" value={form.reviewDate} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} /></label>
          <label><span>Material expiry (optional)</span><input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></label>
          <label className="full-span"><span>Notes / approved-use restrictions</span><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Approved for bread bags only; not for greasy foods." /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        action={mode === 'list'
          ? <button className="secondary-button" onClick={handleStartCreate}>Add material</button>
          : <button className="ghost-button" onClick={handleBackToList}>Back to register</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit food-safe material' : 'New food-safe material'}
          subtitle="Only materials on this register can be selected for food-packaging jobs."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!editingId}
          saveLabel="Save material"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Approved Food-Safe Material Register" subtitle={`${filteredMaterials.length} of ${materials.length} material(s) shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total</span><strong>{stats.total}</strong></div>
            <div className="food-safety-stat"><span>Approved</span><strong>{stats.approved}</strong></div>
            <div className="food-safety-stat"><span>Direct-contact OK</span><strong>{stats.directApproved}</strong></div>
            <div className={`food-safety-stat${stats.overdue > 0 ? ' food-safety-stat-alert' : ''}`}><span>Review overdue</span><strong>{stats.overdue}</strong></div>
            <div className={`food-safety-stat${stats.blocked > 0 ? ' food-safety-stat-alert' : ''}`}><span>Blocked / Suspended</span><strong>{stats.blocked}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name, supplier, batch, location" /></label>
            <label><span>Category</span>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All categories</option>
                {FOOD_SAFETY_MATERIAL_CATEGORIES.map((c) => <option key={c} value={c}>{FOOD_SAFETY_MATERIAL_CATEGORY_LABELS[c]}</option>)}
              </select>
            </label>
            <label><span>Supplier</span>
              <select value={filters.supplier} onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}>
                <option value="">All suppliers</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label><span>Status</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Quarantined">Quarantined</option>
                <option value="Suspended">Suspended</option>
                <option value="Blocked">Blocked</option>
                <option value="Expired">Expired</option>
              </select>
            </label>
            <label><span>Contact level</span>
              <select value={filters.contactLevel} onChange={(e) => setFilters({ ...filters, contactLevel: e.target.value as FoodSafeMaterialFilters['contactLevel'] })}>
                <option value="all">All</option>
                <option value="direct">Direct contact</option>
                <option value="indirect">Indirect contact</option>
                <option value="external">External print only</option>
              </select>
            </label>
            <label><span>Review status</span>
              <select value={filters.reviewStatus} onChange={(e) => setFilters({ ...filters, reviewStatus: e.target.value as FoodSafeMaterialFilters['reviewStatus'] })}>
                <option value="all">All</option>
                <option value="overdue">Overdue</option>
                <option value="due-soon">Due within 30 days</option>
                <option value="ok">Up to date</option>
              </select>
            </label>
          </div>
          {filteredMaterials.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Supplier</th>
                    <th>Contact level</th>
                    <th>Status</th>
                    <th>Docs</th>
                    <th>Review</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map((m) => {
                    const r = getReviewState(m);
                    const docsMissing = (!m.foodSafeDeclarationUrl ? 1 : 0) + (!m.msdsUrl ? 1 : 0);
                    return (
                      <tr key={m.id}>
                        <td>
                          <strong>{m.materialName}</strong>
                          <div className="table-subtext">{FOOD_SAFETY_MATERIAL_CATEGORY_LABELS[m.category]}{m.supplierSku ? ` · ${m.supplierSku}` : ''}</div>
                        </td>
                        <td>{m.supplierName || '—'}<div className="table-subtext">{m.internalBatchNumber || m.supplierBatchNumber || ''}</div></td>
                        <td>
                          {m.directContactApproved ? <span className="badge badge-success" style={{ marginRight: 4 }}>Direct</span> : null}
                          {m.indirectContactApproved ? <span className="badge" style={{ marginRight: 4 }}>Indirect</span> : null}
                          {m.externalPrintOnly ? <span className="badge" style={{ marginRight: 4 }}>External</span> : null}
                          {!m.directContactApproved && !m.indirectContactApproved && !m.externalPrintOnly ? <span className="muted">—</span> : null}
                        </td>
                        <td><span className={`badge ${statusBadge(m.status)}`}>{m.status}</span></td>
                        <td className={docsMissing ? 'cell-alert' : undefined}>
                          {m.foodSafeDeclarationUrl ? <a className="table-button" href={m.foodSafeDeclarationUrl} target="_blank" rel="noopener noreferrer">FS</a> : <span className="muted">FS</span>}{' '}
                          {m.msdsUrl ? <a className="table-button" href={m.msdsUrl} target="_blank" rel="noopener noreferrer">MSDS</a> : <span className="muted">MSDS</span>}{' '}
                          {m.certificateOfAnalysisUrl ? <a className="table-button" href={m.certificateOfAnalysisUrl} target="_blank" rel="noopener noreferrer">CoA</a> : null}
                        </td>
                        <td className={r === 'overdue' || r === 'never' ? 'cell-alert' : undefined}>
                          {m.reviewDate ? formatDate(m.reviewDate) : 'No date set'}
                          <div className="table-subtext">
                            {r === 'overdue' && 'Overdue'}
                            {r === 'due-soon' && 'Due within 30 days'}
                            {r === 'ok' && 'OK'}
                            {r === 'never' && 'Set review date'}
                          </div>
                        </td>
                        <td>
                          <div className="inline-actions">
                            <button className="table-button" onClick={() => handleStartEdit(m)}>Edit</button>
                            {m.status === 'Approved' ? (
                              <button className="table-button" onClick={() => onStatusChange(m, 'Suspended')}>Suspend</button>
                            ) : (
                              <button className="table-button table-button-promote" onClick={() => onStatusChange(m, 'Approved')}>Approve</button>
                            )}
                            <button className="table-button" onClick={() => onStatusChange(m, 'Blocked')}>Block</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No food-safe materials yet" body="Add the first material. Once approved, it becomes selectable on food-packaging job cards." />
          )}
        </section>
      )}
    </>
  );
}
