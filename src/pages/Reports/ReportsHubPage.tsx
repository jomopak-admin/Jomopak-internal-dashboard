/**
 * Reports Hub — Phase 111.4
 *
 * SimplePay-style central reports landing. Reports are grouped into
 * categorised cards (General / Leave / Financial / Bulk Download). Each
 * tile is a link that opens the corresponding report page. The user
 * doesn't have to remember which sidebar group a report lives under —
 * everything is one click from this hub.
 *
 * Two top tabs:
 *   - Standard: the curated, ready-to-run reports we ship.
 *   - Custom (Beta): future placeholder for user-built reports.
 */

import { useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { View } from '../../types';

interface ReportsHubPageProps {
  /** Navigate to another view (delegated to App.tsx setView). */
  onOpen: (view: View) => void;
}

type HubTab = 'standard' | 'custom';

interface ReportCategory {
  title: string;
  reports: Array<{
    label: string;
    description?: string;
    view?: View;
    badge?: string;
    disabled?: boolean;
  }>;
}

const CATEGORIES: ReportCategory[] = [
  {
    title: 'General',
    reports: [
      { label: 'Employee Basic Info', view: 'employees' },
      { label: 'Employee Changes', badge: 'BETA', disabled: true },
      { label: 'Employment Tax Incentive (ETI)', view: 'irp5Centre' },
      { label: 'Transaction History Report', view: 'generalLedger' },
      { label: 'Variance Report', disabled: true },
    ],
  },
  {
    title: 'Leave',
    reports: [
      { label: 'Leave Days Report', view: 'staffLeave' },
      { label: 'Leave Expiry', view: 'staffLeave' },
      { label: 'Leave Report', view: 'staffLeave' },
    ],
  },
  {
    title: 'Financial',
    reports: [
      { label: 'Profit & Loss', view: 'financialStatements' },
      { label: 'Balance Sheet', view: 'financialStatements' },
      { label: 'Cash Flow Forecast', view: 'financialStatements' },
      { label: 'Aged Debtors', view: 'agedDebtors' },
      { label: 'Customer Statements', view: 'customerStatements' },
      { label: 'Profitability Analysis', view: 'profitability' },
      { label: 'Balances — Loans, Savings & Garnishees', view: 'staffLoans' },
      { label: 'Leave Liabilities', disabled: true },
      { label: 'Financial Projections', view: 'financialProjections' },
    ],
  },
  {
    title: 'Bulk Download',
    reports: [
      { label: 'Payslips (bulk PDF)', view: 'payroll' },
      { label: 'Termination Certificates & Salary Schedules', view: 'irp5Centre' },
      { label: 'Customer Stock Statements', view: 'stockStatements' },
    ],
  },
  {
    title: 'Production & Operations',
    reports: [
      { label: 'Production Throughput', view: 'reports' },
      { label: 'Job Pipeline', view: 'reports' },
      { label: 'Sales Pipeline', view: 'salesPipeline' },
      { label: 'Material Requirements (MRP-lite)', view: 'reports' },
      { label: 'Lead Conversion', view: 'reports' },
    ],
  },
  {
    title: 'Compliance & Safety',
    reports: [
      { label: 'Audit Programmes', view: 'auditProgrammes' },
      { label: 'Incident & Accident Register', view: 'incidentRegister' },
      { label: 'Toolbox Talks', view: 'toolboxTalks' },
      { label: 'Fire / Evacuation Drills', view: 'drillRegister' },
      { label: 'First Aid Register', view: 'firstAidRegister' },
    ],
  },
];

export function ReportsHubPage({ onOpen }: ReportsHubPageProps) {
  const [tab, setTab] = useState<HubTab>('standard');

  return (
    <div className="page-stack">
      <SectionTitle
        title="Reports"
        subtitle="Every report in one place. Pick a category, run a report."
      />

      {/* Top sub-tab strip — Standard / Custom (Beta). */}
      <div
        role="tablist"
        aria-label="Reports tab"
        style={{
          display: 'flex',
          gap: '1.25rem',
          borderBottom: '1px solid var(--border, #d8dde3)',
          marginBottom: '1.25rem',
        }}
      >
        {[
          { key: 'standard' as HubTab, label: 'Standard' },
          { key: 'custom' as HubTab, label: 'Custom', badge: 'BETA' },
        ].map((t) => {
          const isActive = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(t.key)}
              style={{
                padding: '0.5rem 0',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--accent, #1f7a4d)' : '3px solid transparent',
                color: isActive ? 'var(--accent, #1f7a4d)' : 'var(--text, #1a1a1a)',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {t.label}
              {t.badge ? (
                <span style={{
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.35rem',
                  background: 'var(--warning, #f7c948)',
                  color: '#1a1a1a',
                  borderRadius: '0.2rem',
                  fontWeight: 600,
                }}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === 'standard' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1rem',
          }}
        >
          {CATEGORIES.map((cat) => (
            <section key={cat.title} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <header
                style={{
                  background: 'var(--surface, #3b4956)',
                  color: '#fff',
                  padding: '0.6rem 1rem',
                  fontWeight: 600,
                }}
              >
                {cat.title}
              </header>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {cat.reports.map((r) => (
                  <li
                    key={r.label}
                    style={{
                      borderBottom: '1px solid var(--border-soft, #f0f3f6)',
                    }}
                  >
                    <button
                      type="button"
                      disabled={r.disabled || !r.view}
                      onClick={() => r.view && onOpen(r.view)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '0.65rem 1rem',
                        textAlign: 'left',
                        cursor: r.disabled || !r.view ? 'not-allowed' : 'pointer',
                        color: r.disabled || !r.view ? 'var(--muted, #5b6b7a)' : 'var(--accent, #1f7a4d)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      <span>{r.label}</span>
                      {r.badge ? (
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.35rem',
                          background: 'var(--warning, #f7c948)',
                          color: '#1a1a1a',
                          borderRadius: '0.2rem',
                          fontWeight: 600,
                        }}>
                          {r.badge}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <section className="card" style={{ padding: '1.5rem' }}>
          <h3>Custom Reports (Beta)</h3>
          <p style={{ color: 'var(--muted, #5b6b7a)' }}>
            Build your own report by picking columns, filters, and grouping.
            Coming soon — for now use the Standard reports above or export raw
            data from any list page to CSV.
          </p>
        </section>
      )}
    </div>
  );
}
