/**
 * Staff portal — "My Stuff".
 *
 * The home screen for every internal staff member. Surfaces:
 *   • pinned/recent notices for them
 *   • training they need to acknowledge
 *   • SOPs they need to acknowledge
 *   • their recent payslips
 *
 * Match-by-name on staffName for now; once UserProfile.linkedEmployeeId is
 * filled in by the admin in Permissions, we use that to scope payslips. If
 * not linked yet, we fall back to a fullName match.
 */

import { useMemo } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Employee,
  Notice,
  PayrollRun,
  Payslip,
  SopDocument,
  StaffTrainingRecord,
  UserProfile,
  UserRole,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface StaffPortalPageProps {
  profile: UserProfile;
  role: UserRole;
  notices: Notice[];
  trainingRecords: StaffTrainingRecord[];
  sopDocuments: SopDocument[];
  payrollRuns: PayrollRun[];
  employees: Employee[];
  onAcknowledgeTraining: (id: string) => void;
  onAcknowledgeSop: (sopId: string, staffName: string) => void;
}

export function StaffPortalPage({ profile, role, notices, trainingRecords, sopDocuments, payrollRuns, employees, onAcknowledgeTraining, onAcknowledgeSop }: StaffPortalPageProps) {
  const fullName = profile.fullName || profile.email || '';
  const today = new Date().toISOString().slice(0, 10);

  // Resolve the staff member's linked employee record. Prefer the explicit
  // linkedEmployeeId set by an admin in Permissions; otherwise fall back to
  // a name match so new users see something useful right away.
  const linkedEmployee = useMemo<Employee | undefined>(() => {
    if (profile.linkedEmployeeId) {
      return employees.find((e) => e.id === profile.linkedEmployeeId);
    }
    return employees.find((e) => `${e.firstName} ${e.lastName}`.trim().toLowerCase() === fullName.trim().toLowerCase());
  }, [profile.linkedEmployeeId, employees, fullName]);

  const visibleNotices = useMemo(() => {
    return notices
      .filter((n) => !n.expiresAt || n.expiresAt >= today)
      .filter((n) => !n.audienceRoles || n.audienceRoles.length === 0 || n.audienceRoles.includes(role))
      .sort((a, b) => {
        if ((a.pinned ? 1 : 0) !== (b.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return (b.postedAt || '').localeCompare(a.postedAt || '');
      })
      .slice(0, 6);
  }, [notices, today, role]);

  const myTraining = useMemo(() => {
    return trainingRecords.filter((t) => t.staffName.trim().toLowerCase() === fullName.trim().toLowerCase());
  }, [trainingRecords, fullName]);

  const pendingTraining = myTraining.filter((t) => !t.acknowledged);

  const pendingSops = useMemo(() => {
    return sopDocuments.filter((s) => s.status === 'Active' && !s.acknowledgements.some((a) => a.staffName.trim().toLowerCase() === fullName.trim().toLowerCase()));
  }, [sopDocuments, fullName]);

  const myPayslips = useMemo<Array<{ run: PayrollRun; payslip: Payslip }>>(() => {
    if (!linkedEmployee) return [];
    const out: Array<{ run: PayrollRun; payslip: Payslip }> = [];
    payrollRuns.forEach((run) => {
      run.payslips.forEach((p) => {
        if (p.employeeId === linkedEmployee.id) out.push({ run, payslip: p });
      });
    });
    return out
      .sort((a, b) => `${b.run.periodYear}-${String(b.run.periodMonth).padStart(2, '0')}`.localeCompare(`${a.run.periodYear}-${String(a.run.periodMonth).padStart(2, '0')}`))
      .slice(0, 6);
  }, [payrollRuns, linkedEmployee]);

  return (
    <section className="card">
      <SectionTitle title={`Hi ${fullName.split(' ')[0] || 'there'}`} subtitle="Everything you need to keep on top of — notices, training, payslips." />

      <div className="portal-grid">
        {/* ────────── Notices ────────── */}
        <div className="portal-card">
          <h3>📣 Notice board</h3>
          {visibleNotices.length === 0 ? (
            <div className="portal-empty">Nothing new — check back later.</div>
          ) : (
            visibleNotices.map((n) => (
              <div key={n.id} className="portal-row">
                <div className="portal-row-main">
                  <strong>{n.pinned ? '📌 ' : ''}{n.title}</strong>
                  <span>{formatDate(n.postedAt)} · {n.postedByName}</span>
                  <span style={{ color: 'var(--jp-text)', marginTop: 4, whiteSpace: 'pre-wrap' }}>{n.body}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ────────── Training to acknowledge ────────── */}
        <div className="portal-card">
          <h3>🎓 Training to sign off</h3>
          {pendingTraining.length === 0 ? (
            <div className="portal-empty">All caught up — nice work.</div>
          ) : (
            pendingTraining.map((t) => (
              <div key={t.id} className="portal-row">
                <div className="portal-row-main">
                  <strong>{t.topic}</strong>
                  <span>Trained {formatDate(t.trainingDate)} by {t.trainerName || '—'}</span>
                </div>
                <button className="secondary-button" onClick={() => onAcknowledgeTraining(t.id)}>I acknowledge</button>
              </div>
            ))
          )}
        </div>

        {/* ────────── SOPs to acknowledge ────────── */}
        <div className="portal-card">
          <h3>📋 SOPs to read & acknowledge</h3>
          {pendingSops.length === 0 ? (
            <div className="portal-empty">You've acknowledged every active SOP.</div>
          ) : (
            pendingSops.map((s) => (
              <div key={s.id} className="portal-row">
                <div className="portal-row-main">
                  <strong>{s.title} <span className="muted">v{s.version}</span></strong>
                  <span>{s.category} · approved {formatDate(s.approvedDate)}</span>
                  {s.documentUrl ? <a href={s.documentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem' }}>Open document ↗</a> : null}
                </div>
                <button className="secondary-button" onClick={() => onAcknowledgeSop(s.id, fullName)}>I've read it</button>
              </div>
            ))
          )}
        </div>

        {/* ────────── Recent payslips ────────── */}
        <div className="portal-card">
          <h3>💰 My payslips</h3>
          {!linkedEmployee ? (
            <div className="portal-empty">Your profile isn't linked to an employee record yet. Ask an admin to link it on the Permissions page so payslips appear here.</div>
          ) : myPayslips.length === 0 ? (
            <div className="portal-empty">No payslips for you yet.</div>
          ) : (
            myPayslips.map(({ run, payslip }) => (
              <div key={`${run.id}-${payslip.id}`} className="portal-row">
                <div className="portal-row-main">
                  <strong>{run.periodLabel}</strong>
                  <span>Pay date {formatDate(run.payDate)} · Net R{payslip.netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <span className={`portal-pill ${run.status === 'Paid' ? 'ok' : 'due'}`}>{run.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
