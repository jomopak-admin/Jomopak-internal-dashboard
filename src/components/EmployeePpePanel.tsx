/**
 * Phase 122.2 — Employee profile PPE panel.
 *
 * Renders every PPE record linked to a specific Employee. The Employee
 * profile uses this panel to surface "what PPE is currently in this
 * person's possession, what's overdue for replacement, and what's been
 * returned."
 *
 * Filters on employeeId === employee.id (the new Phase 122 link). Legacy
 * free-text rows are shown only if the name happens to match — keeps
 * older history visible until the admin re-links them by issuing fresh
 * records.
 */

import { useMemo } from 'react';
import { Employee, PpeIssueRecord } from '../types';
import { formatDate } from '../utils/calculations';

interface EmployeePpePanelProps {
  employee: Employee;
  records: PpeIssueRecord[];
}

/** Classify each PPE row for the summary header.
 *  - in-use: status === 'Issued' AND no return date AND (no replacement-due OR replacement-due >= today)
 *  - overdue: status === 'Issued' AND replacement-due < today
 *  - returned / lost / damaged: bucket by status
 */
function bucketFor(r: PpeIssueRecord, todayYMD: string): 'in-use' | 'overdue' | 'returned' | 'other' {
  if (r.status === 'Returned') return 'returned';
  if (r.status === 'Lost' || r.status === 'Damaged') return 'other';
  if (r.status === 'Issued') {
    if (r.replacementDueDate && r.replacementDueDate < todayYMD) return 'overdue';
    return 'in-use';
  }
  return 'other';
}

export function EmployeePpePanel({ employee, records }: EmployeePpePanelProps) {
  const todayYMD = new Date().toISOString().slice(0, 10);

  // Filter PPE records for this employee. Prefer the explicit
  // employeeId link (Phase 122); fall back to a name match so legacy
  // free-text rows still show.
  const myRecords = useMemo(() => {
    const fullName = `${employee.firstName} ${employee.lastName}`.trim().toLowerCase();
    return records
      .filter((r) => {
        if (r.employeeId && r.employeeId === employee.id) return true;
        return !r.employeeId && r.staffName.trim().toLowerCase() === fullName;
      })
      .sort((a, b) => (b.issuedDate || '').localeCompare(a.issuedDate || ''));
  }, [records, employee]);

  const summary = useMemo(() => {
    const inUse = myRecords.filter((r) => bucketFor(r, todayYMD) === 'in-use').length;
    const overdue = myRecords.filter((r) => bucketFor(r, todayYMD) === 'overdue').length;
    const returned = myRecords.filter((r) => bucketFor(r, todayYMD) === 'returned').length;
    return { inUse, overdue, returned };
  }, [myRecords, todayYMD]);

  if (myRecords.length === 0) {
    return (
      <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--jp-divider, #e2e8f0)', background: 'var(--jp-paper, #fff)', color: 'var(--jp-ink-3, #64748b)', fontSize: 13 }}>
        No PPE has been issued to this employee yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary header — three count chips. */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(34, 168, 101, 0.12)', color: '#065f46', fontSize: 12, fontWeight: 700 }}>
          IN USE {summary.inUse}
        </span>
        {summary.overdue > 0 && (
          <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(219, 90, 31, 0.14)', color: '#9a3412', fontSize: 12, fontWeight: 700 }}>
            OVERDUE FOR REPLACEMENT {summary.overdue}
          </span>
        )}
        <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(100, 116, 139, 0.12)', color: '#475569', fontSize: 12, fontWeight: 700 }}>
          RETURNED {summary.returned}
        </span>
      </div>

      <div style={{ borderRadius: 8, border: '1px solid var(--jp-divider, #e2e8f0)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--jp-bg, #fafafa)' }}>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--jp-ink-3, #475569)' }}>Item</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--jp-ink-3, #475569)' }}>Issued</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--jp-ink-3, #475569)' }}>Replace by</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--jp-ink-3, #475569)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {myRecords.map((r) => {
              const bucket = bucketFor(r, todayYMD);
              const accent = bucket === 'overdue' ? '#db5a1f' : bucket === 'in-use' ? '#22a865' : '#94a3b8';
              const lineLabel = (r.items && r.items.length > 0)
                ? r.items.map((i) => `${i.quantity}× ${i.type}${i.description ? ` (${i.description})` : ''}`).join(', ')
                : `${r.quantity}× ${r.itemType}${r.itemDescription ? ` (${r.itemDescription})` : ''}`;
              return (
                <tr key={r.id} style={{ borderTop: '1px solid var(--jp-divider, #e5e7eb)' }}>
                  <td style={{ padding: '10px', borderLeft: `3px solid ${accent}`, fontSize: 13 }}>
                    <strong>{lineLabel}</strong>
                    {r.notes ? <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>{r.notes}</div> : null}
                  </td>
                  <td style={{ padding: '10px', fontSize: 12 }}>{formatDate(r.issuedDate)}<div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>by {r.issuedByName || '—'}</div></td>
                  <td style={{ padding: '10px', fontSize: 12 }}>
                    {r.replacementDueDate ? (
                      <span style={{ color: bucket === 'overdue' ? '#9a3412' : 'inherit', fontWeight: bucket === 'overdue' ? 700 : 400 }}>
                        {formatDate(r.replacementDueDate)}
                      </span>
                    ) : <span style={{ color: 'var(--jp-ink-3, #94a3b8)' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px', fontSize: 12 }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      background: bucket === 'overdue' ? 'rgba(219, 90, 31, 0.14)' : bucket === 'in-use' ? 'rgba(34, 168, 101, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                      color: bucket === 'overdue' ? '#9a3412' : bucket === 'in-use' ? '#065f46' : '#475569',
                    }}>{r.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
