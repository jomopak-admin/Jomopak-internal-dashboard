/**
 * Fixed-Asset Register — Phase 29
 *
 * Track assets, see accumulated depreciation + book value as at today, and run
 * depreciation for a period — which posts a balanced journal to the General
 * Ledger (Dr Depreciation / Cr Accumulated Depreciation) for you to review.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import { FixedAsset, FixedAssetStatus, JournalEntry, LedgerAccount } from '../../types';
import { formatNumber } from '../../utils/calculations';
import { accumulatedDepreciation, bookValue, monthlyDepreciation, depreciationForPeriod, buildDepreciationJournal } from '../../utils/fixedAssets';

interface FixedAssetsPageProps {
  fixedAssets: FixedAsset[];
  ledgerAccounts: LedgerAccount[];
  today: string;
  onSave: (asset: FixedAsset) => void;
  onDelete: (id: string) => void;
  /** Post a depreciation journal to the GL and stamp assets' posted-to date. */
  onPostDepreciation: (journal: JournalEntry, postedToDate: string) => void;
}

function emptyAsset(today: string): FixedAsset {
  return {
    id: '', assetNumber: '', name: '', category: 'Plant & Machinery', acquisitionDate: today,
    cost: 0, residualValue: 0, usefulLifeYears: 5, depreciationMethod: 'Straight Line',
    status: 'Active', depreciationPostedToDate: '', disposalDate: '', disposalProceeds: 0,
    notes: '', createdAt: '',
  };
}

const CATEGORIES = ['Plant & Machinery', 'Office & Computer Equipment', 'Motor Vehicles', 'Furniture & Fittings', 'Other'];

const STATUS_CLASS: Record<FixedAssetStatus, string> = {
  Active: 'status-reviewed',
  Disposed: 'status-duplicate',
};

export function FixedAssetsPage({ fixedAssets, ledgerAccounts, today, onSave, onDelete, onPostDepreciation }: FixedAssetsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [draft, setDraft] = useState<FixedAsset>(emptyAsset(today));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [depTo, setDepTo] = useState(today);
  const [message, setMessage] = useState('');

  const rows = useMemo(
    () => fixedAssets.map((a) => ({
      asset: a,
      accumulated: accumulatedDepreciation(a, today),
      book: bookValue(a, today),
      monthly: monthlyDepreciation(a),
    })).sort((x, y) => (x.asset.assetNumber || '').localeCompare(y.asset.assetNumber || '')),
    [fixedAssets, today],
  );

  const totals = useMemo(() => {
    const active = fixedAssets.filter((a) => a.status === 'Active');
    return {
      cost: active.reduce((s, a) => s + (Number(a.cost) || 0), 0),
      book: active.reduce((s, a) => s + bookValue(a, today), 0),
      count: active.length,
    };
  }, [fixedAssets, today]);

  function startNew() { setDraft(emptyAsset(today)); setEditingId(null); setMode('form'); }
  function startEdit(a: FixedAsset) { setDraft({ ...a }); setEditingId(a.id); setMode('form'); }
  function update(patch: Partial<FixedAsset>) { setDraft((d) => ({ ...d, ...patch })); }

  function save() {
    if (!draft.name.trim() || (Number(draft.cost) || 0) <= 0) return;
    onSave({ ...draft, name: draft.name.trim() });
    setMode('list');
  }

  function runDepreciation() {
    const lines = depreciationForPeriod(fixedAssets, depTo);
    const journal = buildDepreciationJournal(lines, ledgerAccounts, depTo);
    if (!journal) {
      setMessage('Nothing to depreciate to that date (or the 6150/1590 accounts are missing — run the phase 29 SQL).');
      return;
    }
    onPostDepreciation(journal, depTo);
    setMessage(`Posted a draft depreciation journal of R ${formatNumber(journal.lines[0].debit, 2)} across ${lines.length} asset${lines.length === 1 ? '' : 's'}. Review + post it in the General Ledger.`);
  }

  if (mode === 'form') {
    const acc = accumulatedDepreciation(draft, today);
    return (
      <div className="page-stack accounting-shell">
        <SectionTitle
          title={editingId ? `Edit ${draft.name}` : 'New fixed asset'}
          action={<button className="ghost-button" onClick={() => setMode('list')}>Back</button>}
        />
        <section className="card">
          <div className="accounting-grid">
            <label><span>Name *</span><input value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Heidelberg press" /></label>
            <label><span>Asset no.</span><input value={draft.assetNumber} onChange={(e) => update({ assetNumber: e.target.value })} placeholder="auto if blank" /></label>
            <label><span>Category</span>
              <select value={draft.category} onChange={(e) => update({ category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label><span>Acquisition date</span><input type="date" value={draft.acquisitionDate} onChange={(e) => update({ acquisitionDate: e.target.value })} /></label>
            <label><span>Cost (excl VAT)</span><input type="number" value={draft.cost} onChange={(e) => update({ cost: Number(e.target.value) })} /></label>
            <label><span>Residual value</span><input type="number" value={draft.residualValue} onChange={(e) => update({ residualValue: Number(e.target.value) })} /></label>
            <label><span>Useful life (years)</span><input type="number" value={draft.usefulLifeYears} onChange={(e) => update({ usefulLifeYears: Number(e.target.value) })} /></label>
            <label><span>Status</span>
              <select value={draft.status} onChange={(e) => update({ status: e.target.value as FixedAssetStatus })}>
                <option value="Active">Active</option>
                <option value="Disposed">Disposed</option>
              </select>
            </label>
            {draft.status === 'Disposed' && (
              <>
                <label><span>Disposal date</span><input type="date" value={draft.disposalDate} onChange={(e) => update({ disposalDate: e.target.value })} /></label>
                <label><span>Disposal proceeds</span><input type="number" value={draft.disposalProceeds} onChange={(e) => update({ disposalProceeds: Number(e.target.value) })} /></label>
              </>
            )}
          </div>
          <label style={{ display: 'block', marginTop: '0.6rem' }}><span>Notes</span><input value={draft.notes} onChange={(e) => update({ notes: e.target.value })} /></label>
          <div className="payroll-summary">
            <div><span className="muted">Monthly depreciation</span><strong>R {formatNumber(monthlyDepreciation(draft), 2)}</strong></div>
            <div><span className="muted">Accumulated (to today)</span><strong>R {formatNumber(acc, 2)}</strong></div>
            <div><span className="muted">Book value</span><strong>R {formatNumber((Number(draft.cost) || 0) - acc, 2)}</strong></div>
          </div>
          <div className="accounting-actions">
            <button className="primary-button" onClick={save} disabled={!draft.name.trim() || (Number(draft.cost) || 0) <= 0}>Save asset</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="Fixed Assets"
        subtitle="Asset register with straight-line depreciation that posts to the ledger."
        action={<button className="secondary-button" onClick={startNew}>New asset</button>}
      />

      <section className="stats-grid">
        <div className="card stat-card"><p className="stat-label">Active assets</p><h3>{totals.count}</h3></div>
        <div className="card stat-card"><p className="stat-label">Total cost</p><h3>R {formatNumber(totals.cost, 2)}</h3></div>
        <div className="card stat-card"><p className="stat-label">Net book value</p><h3>R {formatNumber(totals.book, 2)}</h3></div>
      </section>

      <section className="card accounting-toolbar">
        <span className="muted" style={{ alignSelf: 'center' }}>Run depreciation:</span>
        <label><span>Up to</span><input type="date" value={depTo} onChange={(e) => setDepTo(e.target.value)} /></label>
        <button className="ghost-button" onClick={runDepreciation}>Post depreciation to GL</button>
      </section>
      {message ? <p className="muted">{message}</p> : null}

      {rows.length === 0 ? (
        <EmptyState title="No assets" body="Add your machines, vehicles and equipment to track depreciation." />
      ) : (
        <section className="card">
          <div className="payroll-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Asset</th><th>Category</th><th>Acquired</th><th style={{ textAlign: 'right' }}>Cost</th><th style={{ textAlign: 'right' }}>Accum. dep.</th><th style={{ textAlign: 'right' }}>Book value</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map(({ asset, accumulated, book }) => (
                  <tr key={asset.id}>
                    <td><strong>{asset.name}</strong><div className="muted" style={{ fontSize: '0.72rem' }}>{asset.assetNumber}</div></td>
                    <td className="muted">{asset.category}</td>
                    <td>{asset.acquisitionDate || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(asset.cost, 2)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(accumulated, 2)}</td>
                    <td style={{ textAlign: 'right' }}><strong>{formatNumber(book, 2)}</strong></td>
                    <td><span className={`status-pill ${STATUS_CLASS[asset.status]}`}>{asset.status}</span></td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button className="link-button" onClick={() => startEdit(asset)}>Edit</button>
                      {' · '}
                      <button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => onDelete(asset.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
