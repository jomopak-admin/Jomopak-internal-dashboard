/**
 * Chart of Accounts — Phase 24 (Accounting core)
 *
 * The list of ledger accounts every transaction classifies into. Ships with a
 * sensible South African small-business default (see buildDefaultChartOfAccounts)
 * but is fully editable so the bookkeeper / accountant can tune it. This is the
 * backbone the rest of accounting (supplier bills, VAT, P&L, SARS prep) maps onto.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  LedgerAccount,
  LedgerAccountType,
  LEDGER_ACCOUNT_TYPES,
} from '../../types';

interface ChartOfAccountsPageProps {
  ledgerAccounts: LedgerAccount[];
  onSave: (account: LedgerAccount) => void;
  onDelete: (id: string) => void;
}

function emptyAccount(): LedgerAccount {
  return {
    id: '',
    code: '',
    name: '',
    type: 'Expense',
    subType: '',
    vatApplicable: true,
    active: true,
    notes: '',
  };
}

const TYPE_ORDER: LedgerAccountType[] = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

const TYPE_CLASS: Record<LedgerAccountType, string> = {
  Asset: 'status-reviewed',
  Liability: 'status-pending',
  Equity: 'status-ocr_done',
  Income: 'status-ocr_running',
  Expense: 'status-duplicate',
};

export function ChartOfAccountsPage({ ledgerAccounts, onSave, onDelete }: ChartOfAccountsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [draft, setDraft] = useState<LedgerAccount>(emptyAccount());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | LedgerAccountType>('all');
  const [showInactive, setShowInactive] = useState(false);

  const grouped = useMemo(() => {
    const filtered = ledgerAccounts
      .filter((a) => (showInactive ? true : a.active))
      .filter((a) => (typeFilter === 'all' ? true : a.type === typeFilter));
    return TYPE_ORDER.map((type) => ({
      type,
      accounts: filtered
        .filter((a) => a.type === type)
        .sort((a, b) => (a.code || '').localeCompare(b.code || '')),
    })).filter((g) => g.accounts.length > 0);
  }, [ledgerAccounts, typeFilter, showInactive]);

  function startNew() { setDraft(emptyAccount()); setEditingId(null); setMode('form'); }
  function startEdit(a: LedgerAccount) { setDraft({ ...a }); setEditingId(a.id); setMode('form'); }
  function update(patch: Partial<LedgerAccount>) { setDraft((d) => ({ ...d, ...patch })); }

  function save() {
    if (!draft.code.trim() || !draft.name.trim()) return;
    onSave({ ...draft, code: draft.code.trim(), name: draft.name.trim() });
    setMode('list');
  }

  if (mode === 'form') {
    return (
      <div className="page-stack accounting-shell">
        <SectionTitle
          title={editingId ? `Edit account ${draft.code}` : 'New ledger account'}
          backAction={<button className="ghost-button" onClick={() => setMode('list')}>← Back</button>}
        />
        <section className="card">
          <div className="accounting-grid">
            <label><span>Code *</span><input value={draft.code} onChange={(e) => update({ code: e.target.value })} placeholder="e.g. 5000" /></label>
            <label><span>Account name *</span><input value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Paper & Board" /></label>
            <label><span>Type</span>
              <select value={draft.type} onChange={(e) => update({ type: e.target.value as LedgerAccountType })}>
                {LEDGER_ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label><span>Sub-type / group</span><input value={draft.subType} onChange={(e) => update({ subType: e.target.value })} placeholder="e.g. Cost of Sales" /></label>
            <label className="accounting-check"><input type="checkbox" checked={draft.vatApplicable} onChange={(e) => update({ vatApplicable: e.target.checked })} /><span>VAT usually applies</span></label>
            <label className="accounting-check"><input type="checkbox" checked={draft.active} onChange={(e) => update({ active: e.target.checked })} /><span>Active</span></label>
          </div>
          <label style={{ display: 'block', marginTop: '0.75rem' }}><span>Notes</span><input value={draft.notes} onChange={(e) => update({ notes: e.target.value })} /></label>
          <div className="accounting-actions">
            <button className="primary-button" onClick={save} disabled={!draft.code.trim() || !draft.name.trim()}>Save account</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="Chart of Accounts"
        subtitle="The ledger accounts every transaction is classified into — the backbone for VAT, P&L and SARS prep."
        action={<button className="secondary-button" onClick={startNew}>New account</button>}
      />
      <section className="card accounting-toolbar">
        <label><span>Type</span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | LedgerAccountType)}>
            <option value="all">All types</option>
            {LEDGER_ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="accounting-check"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /><span>Show inactive</span></label>
      </section>

      {grouped.length === 0 ? (
        <EmptyState title="No accounts" body="Add a ledger account to start classifying transactions." />
      ) : (
        grouped.map((group) => (
          <section className="card" key={group.type}>
            <h3 className="accounting-group-head">
              <span className={`status-pill ${TYPE_CLASS[group.type]}`}>{group.type}</span>
            </h3>
            <table className="data-table">
              <thead>
                <tr><th style={{ width: 90 }}>Code</th><th>Name</th><th>Group</th><th style={{ textAlign: 'center' }}>VAT</th><th></th></tr>
              </thead>
              <tbody>
                {group.accounts.map((a) => (
                  <tr key={a.id} className={a.active ? '' : 'row-muted'}>
                    <td><strong>{a.code}</strong></td>
                    <td>{a.name}{!a.active ? <span className="muted"> · inactive</span> : null}</td>
                    <td className="muted">{a.subType || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{a.vatApplicable ? '✓' : '—'}</td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button className="link-button" onClick={() => startEdit(a)}>Edit</button>
                      {' · '}
                      <button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => onDelete(a.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      )}
    </div>
  );
}
