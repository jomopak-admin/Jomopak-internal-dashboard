/**
 * Financial Projections — Phase 109.3
 *
 * Multi-scenario forecasting page. The CEO picks a scenario from the rail
 * on the left, edits assumptions inline, and watches the projected P&L,
 * Balance Sheet, and Cash Flow update on the right.
 *
 * Math lives in src/types/index.ts → computeProjection(). This file is
 * presentation + edit handlers only.
 *
 * Two-pane layout collapses to a single column on phones.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import {
  AccountingStandard,
  FinancialProjection,
  ProjectedPeriod,
  ProjectionCapexItem,
  ProjectionCostLine,
  ProjectionFundingItem,
  ProjectionOpeningBalances,
  ProjectionPeriodKind,
  ProjectionResult,
  computeProjection,
  emptyFinancialProjection,
  rollUpPeriods,
} from '../../types';
import { formatNumber } from '../../utils/calculations';
import { toast } from '../../components/Toast';

interface FinancialProjectionsPageProps {
  projections: FinancialProjection[];
  defaultStandard: AccountingStandard;
  onSave: (projection: FinancialProjection) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (sourceId: string) => void;
}

type ResultTab = 'pnl' | 'balance' | 'cash';

export function FinancialProjectionsPage(props: FinancialProjectionsPageProps) {
  const { projections, defaultStandard, onSave, onDelete, onDuplicate } = props;
  const [selectedId, setSelectedId] = useState<string | null>(
    projections.length > 0 ? projections[0].id : null,
  );
  const [periodKind, setPeriodKind] = useState<ProjectionPeriodKind>('month');
  const [resultTab, setResultTab] = useState<ResultTab>('pnl');

  const selected = useMemo(
    () => projections.find((p) => p.id === selectedId) ?? null,
    [projections, selectedId],
  );

  const result: ProjectionResult | null = useMemo(() => {
    if (!selected) return null;
    return computeProjection(selected, defaultStandard);
  }, [selected, defaultStandard]);

  const periodsForUi = useMemo<ProjectedPeriod[]>(() => {
    if (!result) return [];
    return rollUpPeriods(result.periods, periodKind);
  }, [result, periodKind]);

  function handleCreate() {
    const fresh = emptyFinancialProjection({
      name: `Scenario ${projections.length + 1}`,
      accountingStandard: defaultStandard,
    });
    onSave(fresh);
    setSelectedId(fresh.id);
    toast.success('Scenario created');
  }

  function handlePatch(patch: Partial<FinancialProjection>) {
    if (!selected) return;
    onSave({ ...selected, ...patch, updatedAt: new Date().toISOString() });
  }

  function handleDelete() {
    if (!selected) return;
    if (!window.confirm(`Delete "${selected.name}"? This cannot be undone.`)) return;
    onDelete(selected.id);
    toast.success('Scenario deleted');
    setSelectedId(projections.find((p) => p.id !== selected.id)?.id ?? null);
  }

  function handleDuplicate() {
    if (!selected) return;
    onDuplicate?.(selected.id);
    toast.success('Scenario duplicated');
  }

  return (
    <>
      <SectionTitle
        title="Financial Projections"
        subtitle="Forecast P&L, Balance Sheet, and Cash Flow over the next 3–36 months. Compare scenarios side-by-side. Standard-aware (IFRS / US GAAP)."
      />

      <section
        className="card"
        style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: '1rem' }}
      >
        {/* Left rail — scenario picker */}
        <aside style={{ borderRight: '1px solid var(--border, #e1e5ea)', paddingRight: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button type="button" className="primary-button" onClick={handleCreate}>
              + New scenario
            </button>
          </div>
          {projections.length === 0 ? (
            <p style={{ color: 'var(--muted, #5b6b7a)', fontSize: '0.875rem' }}>
              No scenarios yet. Create one to start projecting.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
              {projections.map((p) => {
                const isActive = p.id === selectedId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.6rem 0.75rem',
                        border: isActive
                          ? '2px solid var(--accent, #1f7a4d)'
                          : '1px solid var(--border, #d8dde3)',
                        borderRadius: '0.4rem',
                        background: isActive ? 'var(--accent-bg, #f0f8f3)' : 'var(--card-bg, #fff)',
                        cursor: 'pointer',
                      }}
                    >
                      <strong style={{ display: 'block' }}>{p.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted, #5b6b7a)' }}>
                        {p.horizonMonths} months · {p.scenarioKind ?? 'base'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Right pane — scenario detail */}
        <div>
          {!selected || !result ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted, #5b6b7a)' }}>
              <p>Select or create a scenario to start.</p>
            </div>
          ) : (
            <>
              <SummaryTiles result={result} />
              <ScenarioMeta
                projection={selected}
                onPatch={handlePatch}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                worstBalanceDelta={result.worstBalanceDelta}
              />
              <RevenueAndTaxBlock projection={selected} onPatch={handlePatch} />
              <WorkingCapitalBlock projection={selected} onPatch={handlePatch} />
              <OpeningBalancesBlock projection={selected} onPatch={handlePatch} />
              <CostLinesBlock projection={selected} onPatch={handlePatch} />
              <CapexBlock projection={selected} onPatch={handlePatch} />
              <FundingBlock projection={selected} onPatch={handlePatch} />

              <ResultBlock
                result={result}
                periodsForUi={periodsForUi}
                periodKind={periodKind}
                setPeriodKind={setPeriodKind}
                resultTab={resultTab}
                setResultTab={setResultTab}
              />
            </>
          )}
        </div>
      </section>

      {/* Mobile collapse */}
      <style>{`
        @media (max-width: 760px) {
          .card[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

/* ------------------------------- Summary tiles ------------------------------- */

function SummaryTiles({ result }: { result: ProjectionResult }) {
  const tiles = [
    {
      label: 'Revenue (period total)',
      value: `R ${formatNumber(result.totals.revenue, 0)}`,
    },
    {
      label: 'Net income (period total)',
      value: `R ${formatNumber(result.totals.netIncome, 0)}`,
      tone: result.totals.netIncome >= 0 ? 'good' : 'bad',
    },
    {
      label: 'Closing cash',
      value: `R ${formatNumber(result.totals.closingCash, 0)}`,
      tone: result.totals.closingCash >= 0 ? 'good' : 'bad',
    },
    {
      label: 'Min closing cash',
      value: `R ${formatNumber(result.totals.minClosingCash, 0)}`,
      tone: result.totals.minClosingCash >= 0 ? 'good' : 'bad',
    },
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.6rem',
        marginBottom: '1rem',
      }}
    >
      {tiles.map((t, i) => (
        <div
          key={i}
          className="card"
          style={{
            padding: '0.75rem 1rem',
            background:
              t.tone === 'bad'
                ? 'var(--danger-bg, #fdecea)'
                : t.tone === 'good'
                ? 'var(--accent-bg, #f0f8f3)'
                : 'var(--card-bg, #fff)',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted, #5b6b7a)' }}>{t.label}</p>
          <strong style={{ fontSize: '1.1rem' }}>{t.value}</strong>
        </div>
      ))}
      {result.totals.cashRunwayBreakMonth ? (
        <div className="card" style={{ padding: '0.75rem 1rem', background: 'var(--danger-bg, #fdecea)', gridColumn: '1 / -1' }}>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>
            <strong>Cash runs out:</strong> closing cash goes negative in{' '}
            {result.totals.cashRunwayBreakMonth}. Review funding plan.
          </p>
        </div>
      ) : null}
      {Math.abs(result.worstBalanceDelta) > 1 ? (
        <div className="card" style={{ padding: '0.5rem 1rem', background: 'var(--warning-bg, #fff8e1)', gridColumn: '1 / -1' }}>
          <p style={{ margin: 0, fontSize: '0.75rem' }}>
            Articulation diagnostic: worst balance sheet delta is R{' '}
            {formatNumber(result.worstBalanceDelta, 2)}. Should be near zero —
            check assumption consistency.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ Scenario meta -------------------------------- */

function ScenarioMeta({
  projection,
  onPatch,
  onDelete,
  onDuplicate,
  worstBalanceDelta,
}: {
  projection: FinancialProjection;
  onPatch: (p: Partial<FinancialProjection>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  worstBalanceDelta: number;
}) {
  return (
    <section className="card" style={{ marginBottom: '1rem' }}>
      <SectionTitle title="Scenario" subtitle="Name, horizon, and accounting standard." />
      <div className="form-grid">
        <label>
          <span>Name</span>
          <input
            value={projection.name}
            onChange={(e) => onPatch({ name: e.target.value })}
          />
        </label>
        <label>
          <span>Kind</span>
          <select
            value={projection.scenarioKind ?? 'base'}
            onChange={(e) =>
              onPatch({ scenarioKind: e.target.value as FinancialProjection['scenarioKind'] })
            }
          >
            <option value="base">Base case</option>
            <option value="optimistic">Optimistic</option>
            <option value="pessimistic">Pessimistic</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label>
          <span>Start month</span>
          <input
            type="month"
            value={projection.startMonth.slice(0, 7)}
            onChange={(e) => onPatch({ startMonth: `${e.target.value}-01` })}
          />
        </label>
        <label>
          <span>Horizon</span>
          <select
            value={projection.horizonMonths}
            onChange={(e) => onPatch({ horizonMonths: Number(e.target.value) })}
          >
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
            <option value={24}>24 months</option>
            <option value={36}>36 months</option>
          </select>
        </label>
        <label>
          <span>Accounting standard</span>
          <select
            value={projection.accountingStandard ?? 'IFRS'}
            onChange={(e) =>
              onPatch({ accountingStandard: e.target.value as AccountingStandard })
            }
          >
            <option value="IFRS">IFRS</option>
            <option value="US_GAAP">US GAAP</option>
          </select>
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          <span>Description</span>
          <textarea
            value={projection.description ?? ''}
            onChange={(e) => onPatch({ description: e.target.value })}
            rows={2}
          />
        </label>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button type="button" className="ghost-button" onClick={onDuplicate}>
          Duplicate scenario
        </button>
        <button
          type="button"
          className="ghost-button"
          style={{ color: 'var(--danger, #c0392b)' }}
          onClick={onDelete}
        >
          Delete scenario
        </button>
        {Math.abs(worstBalanceDelta) > 1 ? (
          <span className="warning-pill" style={{ marginLeft: 'auto' }}>
            Articulation drift R {formatNumber(worstBalanceDelta, 2)}
          </span>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------- Revenue + Tax + Working Capital + Opening ------------- */

function RevenueAndTaxBlock({
  projection,
  onPatch,
}: {
  projection: FinancialProjection;
  onPatch: (p: Partial<FinancialProjection>) => void;
}) {
  const r = projection.revenue;
  const t = projection.tax;
  return (
    <section className="card" style={{ marginBottom: '1rem' }}>
      <SectionTitle title="Revenue & Tax" subtitle="Baseline sales and growth, plus the tax rates applied to taxable income." />
      <div className="form-grid">
        <label>
          <span>Baseline monthly revenue (R)</span>
          <input
            type="number"
            value={r.baselineMonthlyRevenue}
            onChange={(e) =>
              onPatch({
                revenue: { ...r, baselineMonthlyRevenue: Number(e.target.value) || 0 },
              })
            }
          />
        </label>
        <label>
          <span>Annual growth %</span>
          <input
            type="number"
            step="0.5"
            value={r.annualGrowthPercent}
            onChange={(e) =>
              onPatch({
                revenue: { ...r, annualGrowthPercent: Number(e.target.value) || 0 },
              })
            }
          />
        </label>
        <label>
          <span>Gross margin %</span>
          <input
            type="number"
            step="0.5"
            value={r.grossMarginPercent}
            onChange={(e) =>
              onPatch({
                revenue: { ...r, grossMarginPercent: Number(e.target.value) || 0 },
              })
            }
          />
        </label>
        <label>
          <span>Baseline units / month (optional)</span>
          <input
            type="number"
            value={r.baselineUnitsPerMonth ?? 0}
            onChange={(e) =>
              onPatch({
                revenue: { ...r, baselineUnitsPerMonth: Number(e.target.value) || 0 },
              })
            }
          />
        </label>
        <label>
          <span>Corporate tax %</span>
          <input
            type="number"
            step="0.1"
            value={t.corporateTaxRatePercent}
            onChange={(e) =>
              onPatch({ tax: { ...t, corporateTaxRatePercent: Number(e.target.value) || 0 } })
            }
          />
        </label>
        <label>
          <span>VAT rate %</span>
          <input
            type="number"
            step="0.1"
            value={t.vatRatePercent}
            onChange={(e) =>
              onPatch({ tax: { ...t, vatRatePercent: Number(e.target.value) || 0 } })
            }
          />
        </label>
      </div>
    </section>
  );
}

function WorkingCapitalBlock({
  projection,
  onPatch,
}: {
  projection: FinancialProjection;
  onPatch: (p: Partial<FinancialProjection>) => void;
}) {
  const w = projection.workingCapital;
  return (
    <section className="card" style={{ marginBottom: '1rem' }}>
      <SectionTitle title="Working capital" subtitle="Days metrics that drive AR / Inventory / AP movements on the balance sheet." />
      <div className="form-grid">
        <label>
          <span>DSO — days sales outstanding</span>
          <input
            type="number"
            value={w.dso}
            onChange={(e) =>
              onPatch({ workingCapital: { ...w, dso: Number(e.target.value) || 0 } })
            }
          />
        </label>
        <label>
          <span>DIO — days inventory outstanding</span>
          <input
            type="number"
            value={w.dio}
            onChange={(e) =>
              onPatch({ workingCapital: { ...w, dio: Number(e.target.value) || 0 } })
            }
          />
        </label>
        <label>
          <span>DPO — days payables outstanding</span>
          <input
            type="number"
            value={w.dpo}
            onChange={(e) =>
              onPatch({ workingCapital: { ...w, dpo: Number(e.target.value) || 0 } })
            }
          />
        </label>
      </div>
    </section>
  );
}

function OpeningBalancesBlock({
  projection,
  onPatch,
}: {
  projection: FinancialProjection;
  onPatch: (p: Partial<FinancialProjection>) => void;
}) {
  const o = projection.opening;
  function patchOpening(patch: Partial<ProjectionOpeningBalances>) {
    onPatch({ opening: { ...o, ...patch } });
  }
  return (
    <section className="card" style={{ marginBottom: '1rem' }}>
      <SectionTitle
        title="Opening balance sheet"
        subtitle="What the business looks like on day 0. Sets starting balances for the projection."
      />
      <div className="form-grid">
        <NumberField label="Cash" value={o.cash} onChange={(v) => patchOpening({ cash: v })} />
        <NumberField label="Accounts receivable" value={o.accountsReceivable} onChange={(v) => patchOpening({ accountsReceivable: v })} />
        <NumberField label="Inventory" value={o.inventory} onChange={(v) => patchOpening({ inventory: v })} />
        <NumberField label="Other current assets" value={o.otherCurrentAssets} onChange={(v) => patchOpening({ otherCurrentAssets: v })} />
        <NumberField label="PPE (gross)" value={o.ppe} onChange={(v) => patchOpening({ ppe: v })} />
        <NumberField label="Accumulated depreciation" value={o.accumulatedDepreciation} onChange={(v) => patchOpening({ accumulatedDepreciation: v })} />
        <NumberField label="Other non-current assets" value={o.otherNonCurrentAssets} onChange={(v) => patchOpening({ otherNonCurrentAssets: v })} />
        <NumberField label="Accounts payable" value={o.accountsPayable} onChange={(v) => patchOpening({ accountsPayable: v })} />
        <NumberField label="Short-term debt" value={o.shortTermDebt} onChange={(v) => patchOpening({ shortTermDebt: v })} />
        <NumberField label="Other current liabilities" value={o.otherCurrentLiabilities} onChange={(v) => patchOpening({ otherCurrentLiabilities: v })} />
        <NumberField label="Long-term debt" value={o.longTermDebt} onChange={(v) => patchOpening({ longTermDebt: v })} />
        <NumberField label="Other non-current liabilities" value={o.otherNonCurrentLiabilities} onChange={(v) => patchOpening({ otherNonCurrentLiabilities: v })} />
        <NumberField label="Share capital" value={o.shareCapital} onChange={(v) => patchOpening({ shareCapital: v })} />
        <NumberField label="Retained earnings" value={o.retainedEarnings} onChange={(v) => patchOpening({ retainedEarnings: v })} />
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}

/* ----------------------------- Cost line block ------------------------------- */

function CostLinesBlock({
  projection,
  onPatch,
}: {
  projection: FinancialProjection;
  onPatch: (p: Partial<FinancialProjection>) => void;
}) {
  function addLine() {
    const fresh: ProjectionCostLine = {
      id: `cl-${Date.now()}`,
      label: 'New cost line',
      driver: 'percentRevenue',
      amount: 0,
    };
    onPatch({ costLines: [...projection.costLines, fresh] });
  }
  function patchLine(id: string, patch: Partial<ProjectionCostLine>) {
    onPatch({
      costLines: projection.costLines.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }
  function removeLine(id: string) {
    onPatch({ costLines: projection.costLines.filter((c) => c.id !== id) });
  }
  return (
    <section className="card" style={{ marginBottom: '1rem' }}>
      <SectionTitle
        title="Cost lines"
        subtitle="Each line generates an expense every period. COGS lines should use a 5xxx account code; overheads use 6xxx. Leaving COGS empty falls back to the gross margin %."
      />
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th align="left">Label</th>
            <th align="left">Account</th>
            <th align="left">Driver</th>
            <th align="right">Amount</th>
            <th align="right">Inflation %</th>
            <th align="right">Start month</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {projection.costLines.map((c) => (
            <tr key={c.id}>
              <td>
                <input
                  value={c.label}
                  onChange={(e) => patchLine(c.id, { label: e.target.value })}
                />
              </td>
              <td>
                <input
                  style={{ width: '5rem' }}
                  value={c.accountCode ?? ''}
                  placeholder="6100"
                  onChange={(e) => patchLine(c.id, { accountCode: e.target.value })}
                />
              </td>
              <td>
                <select
                  value={c.driver}
                  onChange={(e) =>
                    patchLine(c.id, { driver: e.target.value as ProjectionCostLine['driver'] })
                  }
                >
                  <option value="percentRevenue">% of revenue</option>
                  <option value="fixedMonthly">Fixed monthly</option>
                  <option value="perUnit">Per unit</option>
                </select>
              </td>
              <td align="right">
                <input
                  type="number"
                  style={{ width: '6rem' }}
                  value={c.amount}
                  onChange={(e) => patchLine(c.id, { amount: Number(e.target.value) || 0 })}
                />
              </td>
              <td align="right">
                <input
                  type="number"
                  style={{ width: '4rem' }}
                  value={c.inflationPercent ?? 0}
                  onChange={(e) =>
                    patchLine(c.id, { inflationPercent: Number(e.target.value) || 0 })
                  }
                />
              </td>
              <td align="right">
                <input
                  type="number"
                  style={{ width: '4rem' }}
                  value={c.startMonth ?? 1}
                  min={1}
                  onChange={(e) => patchLine(c.id, { startMonth: Number(e.target.value) || 1 })}
                />
              </td>
              <td align="right">
                <button type="button" className="ghost-button" onClick={() => removeLine(c.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="ghost-button" onClick={addLine} style={{ marginTop: '0.5rem' }}>
        + Add cost line
      </button>
    </section>
  );
}

/* ------------------------------- Capex block --------------------------------- */

function CapexBlock({
  projection,
  onPatch,
}: {
  projection: FinancialProjection;
  onPatch: (p: Partial<FinancialProjection>) => void;
}) {
  function add() {
    const fresh: ProjectionCapexItem = {
      id: `cap-${Date.now()}`,
      label: 'New machine',
      amount: 0,
      month: 1,
      usefulLifeYears: 10,
      depreciationMethod: 'Straight Line',
    };
    onPatch({ capex: [...projection.capex, fresh] });
  }
  function patch(id: string, p: Partial<ProjectionCapexItem>) {
    onPatch({ capex: projection.capex.map((c) => (c.id === id ? { ...c, ...p } : c)) });
  }
  function remove(id: string) {
    onPatch({ capex: projection.capex.filter((c) => c.id !== id) });
  }
  return (
    <section className="card" style={{ marginBottom: '1rem' }}>
      <SectionTitle
        title="Capital expenditure (CapEx)"
        subtitle="New machines / buildings. Cash leaves in the chosen month and depreciation runs over the useful life."
      />
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th align="left">Label</th>
            <th align="right">Amount (R)</th>
            <th align="right">Month</th>
            <th align="right">Useful life (yrs)</th>
            <th align="left">Method</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {projection.capex.map((c) => (
            <tr key={c.id}>
              <td><input value={c.label} onChange={(e) => patch(c.id, { label: e.target.value })} /></td>
              <td align="right">
                <input type="number" style={{ width: '7rem' }} value={c.amount} onChange={(e) => patch(c.id, { amount: Number(e.target.value) || 0 })} />
              </td>
              <td align="right">
                <input type="number" style={{ width: '4rem' }} min={1} value={c.month} onChange={(e) => patch(c.id, { month: Number(e.target.value) || 1 })} />
              </td>
              <td align="right">
                <input type="number" style={{ width: '4rem' }} min={1} value={c.usefulLifeYears} onChange={(e) => patch(c.id, { usefulLifeYears: Number(e.target.value) || 1 })} />
              </td>
              <td>
                <input value={c.depreciationMethod ?? ''} onChange={(e) => patch(c.id, { depreciationMethod: e.target.value })} />
              </td>
              <td align="right">
                <button type="button" className="ghost-button" onClick={() => remove(c.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="ghost-button" onClick={add} style={{ marginTop: '0.5rem' }}>
        + Add CapEx item
      </button>
    </section>
  );
}

/* ------------------------------ Funding block -------------------------------- */

function FundingBlock({
  projection,
  onPatch,
}: {
  projection: FinancialProjection;
  onPatch: (p: Partial<FinancialProjection>) => void;
}) {
  function add() {
    const fresh: ProjectionFundingItem = {
      id: `fund-${Date.now()}`,
      label: 'New loan',
      kind: 'loan',
      amount: 0,
      month: 1,
      interestRatePercent: 10,
      monthlyRepayment: 0,
    };
    onPatch({ funding: [...projection.funding, fresh] });
  }
  function patch(id: string, p: Partial<ProjectionFundingItem>) {
    onPatch({ funding: projection.funding.map((f) => (f.id === id ? { ...f, ...p } : f)) });
  }
  function remove(id: string) {
    onPatch({ funding: projection.funding.filter((f) => f.id !== id) });
  }
  return (
    <section className="card" style={{ marginBottom: '1rem' }}>
      <SectionTitle
        title="Funding events"
        subtitle="Loan drawdowns, equity injections, grants. Loans accrue interest and reduce by the monthly repayment."
      />
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th align="left">Label</th>
            <th align="left">Kind</th>
            <th align="right">Amount (R)</th>
            <th align="right">Month</th>
            <th align="right">Interest %</th>
            <th align="right">Monthly repay</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {projection.funding.map((f) => (
            <tr key={f.id}>
              <td><input value={f.label} onChange={(e) => patch(f.id, { label: e.target.value })} /></td>
              <td>
                <select value={f.kind} onChange={(e) => patch(f.id, { kind: e.target.value as ProjectionFundingItem['kind'] })}>
                  <option value="loan">Loan</option>
                  <option value="equity">Equity</option>
                  <option value="grant">Grant</option>
                </select>
              </td>
              <td align="right">
                <input type="number" style={{ width: '7rem' }} value={f.amount} onChange={(e) => patch(f.id, { amount: Number(e.target.value) || 0 })} />
              </td>
              <td align="right">
                <input type="number" style={{ width: '4rem' }} min={1} value={f.month} onChange={(e) => patch(f.id, { month: Number(e.target.value) || 1 })} />
              </td>
              <td align="right">
                <input type="number" step="0.1" style={{ width: '4rem' }} value={f.interestRatePercent ?? 0} onChange={(e) => patch(f.id, { interestRatePercent: Number(e.target.value) || 0 })} />
              </td>
              <td align="right">
                <input type="number" style={{ width: '6rem' }} value={f.monthlyRepayment ?? 0} onChange={(e) => patch(f.id, { monthlyRepayment: Number(e.target.value) || 0 })} />
              </td>
              <td align="right">
                <button type="button" className="ghost-button" onClick={() => remove(f.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="ghost-button" onClick={add} style={{ marginTop: '0.5rem' }}>
        + Add funding event
      </button>
    </section>
  );
}

/* ------------------------------- Result block -------------------------------- */

function ResultBlock({
  result,
  periodsForUi,
  periodKind,
  setPeriodKind,
  resultTab,
  setResultTab,
}: {
  result: ProjectionResult;
  periodsForUi: ProjectedPeriod[];
  periodKind: ProjectionPeriodKind;
  setPeriodKind: (k: ProjectionPeriodKind) => void;
  resultTab: ResultTab;
  setResultTab: (t: ResultTab) => void;
}) {
  return (
    <section className="card">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <SectionTitle title="Projected statements" subtitle={`Standard: ${result.accountingStandard} · Inventory: ${result.inventoryMethod}`} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
          {(['pnl', 'balance', 'cash'] as ResultTab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={resultTab === t ? 'primary-button' : 'ghost-button'}
              onClick={() => setResultTab(t)}
            >
              {t === 'pnl' ? 'Income Statement' : t === 'balance' ? 'Balance Sheet' : 'Cash Flow'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['month', 'quarter', 'year'] as ProjectionPeriodKind[]).map((k) => (
            <button
              key={k}
              type="button"
              className={periodKind === k ? 'primary-button' : 'ghost-button'}
              onClick={() => setPeriodKind(k)}
            >
              {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        {resultTab === 'pnl' ? (
          <PnlTable periods={periodsForUi} />
        ) : resultTab === 'balance' ? (
          <BalanceTable periods={periodsForUi} />
        ) : (
          <CashTable periods={periodsForUi} />
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="button" className="ghost-button" onClick={() => window.print()}>
          Print
        </button>
        <button type="button" className="ghost-button" onClick={() => downloadCsv(result, resultTab)}>
          Export CSV
        </button>
      </div>
    </section>
  );
}

function PnlTable({ periods }: { periods: ProjectedPeriod[] }) {
  const rows: Array<[string, (p: ProjectedPeriod) => number, boolean?]> = [
    ['Revenue', (p) => p.incomeStatement.revenue],
    ['COGS', (p) => p.incomeStatement.cogs],
    ['Gross profit', (p) => p.incomeStatement.grossProfit, true],
    ['Operating expenses', (p) => p.incomeStatement.operatingExpenses],
    ['Depreciation & amortisation', (p) => p.incomeStatement.depreciationAmortisation],
    ['EBIT', (p) => p.incomeStatement.ebit, true],
    ['Interest expense', (p) => p.incomeStatement.interestExpense],
    ['EBT', (p) => p.incomeStatement.ebt],
    ['Tax', (p) => p.incomeStatement.tax],
    ['Net income', (p) => p.incomeStatement.netIncome, true],
  ];
  return <StatementTable periods={periods} rows={rows} />;
}

function BalanceTable({ periods }: { periods: ProjectedPeriod[] }) {
  const rows: Array<[string, (p: ProjectedPeriod) => number, boolean?]> = [
    ['Cash', (p) => p.balanceSheet.cash],
    ['Accounts receivable', (p) => p.balanceSheet.accountsReceivable],
    ['Inventory', (p) => p.balanceSheet.inventory],
    ['Other current assets', (p) => p.balanceSheet.otherCurrentAssets],
    ['Total current assets', (p) => p.balanceSheet.totalCurrentAssets, true],
    ['Net PPE', (p) => p.balanceSheet.netPpe],
    ['Other non-current assets', (p) => p.balanceSheet.otherNonCurrentAssets],
    ['Total non-current assets', (p) => p.balanceSheet.totalNonCurrentAssets, true],
    ['Total assets', (p) => p.balanceSheet.totalAssets, true],
    ['Accounts payable', (p) => p.balanceSheet.accountsPayable],
    ['Short-term debt', (p) => p.balanceSheet.shortTermDebt],
    ['Other current liabilities', (p) => p.balanceSheet.otherCurrentLiabilities],
    ['Total current liabilities', (p) => p.balanceSheet.totalCurrentLiabilities, true],
    ['Long-term debt', (p) => p.balanceSheet.longTermDebt],
    ['Other non-current liabilities', (p) => p.balanceSheet.otherNonCurrentLiabilities],
    ['Total non-current liabilities', (p) => p.balanceSheet.totalNonCurrentLiabilities, true],
    ['Total liabilities', (p) => p.balanceSheet.totalLiabilities, true],
    ['Share capital', (p) => p.balanceSheet.shareCapital],
    ['Retained earnings', (p) => p.balanceSheet.retainedEarnings],
    ['Total equity', (p) => p.balanceSheet.totalEquity, true],
    ['Total liabilities + equity', (p) => p.balanceSheet.totalLiabilitiesAndEquity, true],
    ['Balance check (≈ 0)', (p) => p.balanceSheet.balanceCheck],
  ];
  return <StatementTable periods={periods} rows={rows} />;
}

function CashTable({ periods }: { periods: ProjectedPeriod[] }) {
  const rows: Array<[string, (p: ProjectedPeriod) => number, boolean?]> = [
    ['Net income', (p) => p.cashFlow.netIncome],
    ['+ D&A', (p) => p.cashFlow.depreciationAmortisation],
    ['– Change in AR', (p) => -p.cashFlow.changeInAR],
    ['– Change in inventory', (p) => -p.cashFlow.changeInInventory],
    ['+ Change in AP', (p) => p.cashFlow.changeInAP],
    ['Cash from operations', (p) => p.cashFlow.cashFromOperations, true],
    ['CapEx', (p) => p.cashFlow.capex],
    ['Cash from investing', (p) => p.cashFlow.cashFromInvesting, true],
    ['Loan drawdown', (p) => p.cashFlow.loanDrawdown],
    ['Equity / grant', (p) => p.cashFlow.equityInjection],
    ['– Loan repayment', (p) => -p.cashFlow.loanRepayment],
    ['Cash from financing', (p) => p.cashFlow.cashFromFinancing, true],
    ['Net change in cash', (p) => p.cashFlow.netCashChange, true],
    ['Opening cash', (p) => p.cashFlow.openingCash],
    ['Closing cash', (p) => p.cashFlow.closingCash, true],
  ];
  return <StatementTable periods={periods} rows={rows} />;
}

function StatementTable({
  periods,
  rows,
}: {
  periods: ProjectedPeriod[];
  rows: Array<[string, (p: ProjectedPeriod) => number, boolean?]>;
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '600px' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border, #d8dde3)' }}>
          <th align="left" style={{ padding: '0.4rem 0.6rem' }}></th>
          {periods.map((p) => (
            <th key={p.periodStart} align="right" style={{ padding: '0.4rem 0.6rem' }}>{p.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, getter, bold]) => (
          <tr key={label} style={{ borderBottom: '1px solid var(--border-soft, #f0f3f6)' }}>
            <td style={{ padding: '0.3rem 0.6rem', fontWeight: bold ? 600 : 400 }}>{label}</td>
            {periods.map((p) => (
              <td key={p.periodStart} align="right" style={{ padding: '0.3rem 0.6rem', fontWeight: bold ? 600 : 400 }}>
                {formatNumber(getter(p), 0)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* --------------------------------- CSV export -------------------------------- */

function downloadCsv(result: ProjectionResult, tab: ResultTab) {
  const lines: string[] = [];
  lines.push(`Scenario,${result.scenarioName}`);
  lines.push(`Standard,${result.accountingStandard}`);
  lines.push('');
  const periods = result.periods;
  const headerRow = ['Line', ...periods.map((p) => p.label)].join(',');
  lines.push(headerRow);

  function pushRows(rows: Array<[string, (p: ProjectedPeriod) => number]>) {
    rows.forEach(([label, getter]) => {
      lines.push([label, ...periods.map((p) => getter(p).toFixed(2))].join(','));
    });
  }

  if (tab === 'pnl') {
    pushRows([
      ['Revenue', (p) => p.incomeStatement.revenue],
      ['COGS', (p) => p.incomeStatement.cogs],
      ['Gross profit', (p) => p.incomeStatement.grossProfit],
      ['Operating expenses', (p) => p.incomeStatement.operatingExpenses],
      ['D&A', (p) => p.incomeStatement.depreciationAmortisation],
      ['EBIT', (p) => p.incomeStatement.ebit],
      ['Interest', (p) => p.incomeStatement.interestExpense],
      ['EBT', (p) => p.incomeStatement.ebt],
      ['Tax', (p) => p.incomeStatement.tax],
      ['Net income', (p) => p.incomeStatement.netIncome],
    ]);
  } else if (tab === 'balance') {
    pushRows([
      ['Cash', (p) => p.balanceSheet.cash],
      ['AR', (p) => p.balanceSheet.accountsReceivable],
      ['Inventory', (p) => p.balanceSheet.inventory],
      ['Net PPE', (p) => p.balanceSheet.netPpe],
      ['Total assets', (p) => p.balanceSheet.totalAssets],
      ['AP', (p) => p.balanceSheet.accountsPayable],
      ['LT debt', (p) => p.balanceSheet.longTermDebt],
      ['Total liab.', (p) => p.balanceSheet.totalLiabilities],
      ['Share capital', (p) => p.balanceSheet.shareCapital],
      ['Retained earnings', (p) => p.balanceSheet.retainedEarnings],
      ['Total equity', (p) => p.balanceSheet.totalEquity],
    ]);
  } else {
    pushRows([
      ['Net income', (p) => p.cashFlow.netIncome],
      ['D&A', (p) => p.cashFlow.depreciationAmortisation],
      ['Change AR', (p) => p.cashFlow.changeInAR],
      ['Change inventory', (p) => p.cashFlow.changeInInventory],
      ['Change AP', (p) => p.cashFlow.changeInAP],
      ['Cash from ops', (p) => p.cashFlow.cashFromOperations],
      ['CapEx', (p) => p.cashFlow.capex],
      ['Loan drawdown', (p) => p.cashFlow.loanDrawdown],
      ['Equity inject', (p) => p.cashFlow.equityInjection],
      ['Loan repayment', (p) => p.cashFlow.loanRepayment],
      ['Net change', (p) => p.cashFlow.netCashChange],
      ['Closing cash', (p) => p.cashFlow.closingCash],
    ]);
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${result.scenarioName.replace(/\s+/g, '-')}-${tab}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
