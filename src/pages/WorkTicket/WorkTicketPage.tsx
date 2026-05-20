/**
 * Work Ticket page.
 *
 * The factory's existing process is: salesperson types numbers into a paper
 * work-ticket pad, hands it to the foreman, who prices each line in his
 * head, then someone retypes it into a quote. This page collapses the
 * whole flow into one screen — pick the inputs, the engine fills the
 * breakdown, the quoter confirms and prints the same form they're used to.
 *
 * Layout: two columns —
 *   left  : input panel (run details + master picks + ink/finishing rows)
 *   right : computed breakdown matching the PRINTED ticket layout.
 *
 * The breakdown panel is the form's source of truth. Every time the inputs
 * change, the engine recomputes from scratch — no incremental state, no
 * stale values.
 */

import { useEffect, useMemo, useState } from 'react';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  CostProfile,
  FinishingOperation,
  HandleType,
  InkRate,
  Machine,
  PaperRate,
  PlateCost,
  PressRate,
  PricingTier,
  PrintMethod,
  Product,
  WorkTicket,
  WorkTicketFinishingLine,
  WorkTicketFilters,
  WorkTicketFormState,
  WorkTicketInkLine,
  WorkTicketStatus,
} from '../../types';
import { formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';
import {
  computeWorkTicket,
  parseSheetAreaSqm,
  WorkTicketBreakdown,
} from '../../utils/workTicketEngine';

interface WorkTicketPageProps {
  monthOptions: string[];
  clients: Client[];
  products: Product[];
  pricingTiers: PricingTier[];
  paperRates: PaperRate[];
  inkRates: InkRate[];
  finishingOperations: FinishingOperation[];
  pressRates: PressRate[];
  plateCosts: PlateCost[];
  machines: Machine[];
  workTickets: WorkTicket[];
  workTicketForm: WorkTicketFormState;
  setWorkTicketForm: (value: WorkTicketFormState) => void;
  workTicketEditingId: string | null;
  workTicketMessage: string;
  onSave: () => void;
  onReset: () => void;
  onPrint: (ticket: WorkTicket) => void;
  workTicketFilters: WorkTicketFilters;
  setWorkTicketFilters: (value: WorkTicketFilters) => void;
  filteredWorkTickets: WorkTicket[];
  onEdit: (ticket: WorkTicket) => void;
}

const STATUS_OPTIONS: WorkTicketStatus[] = [
  'Draft',
  'Costed',
  'Approved',
  'Sent',
  'Won',
  'Lost',
  'Converted to Job',
];

const HANDLE_OPTIONS: HandleType[] = ['None', 'Flat Handle', 'Rope Handle', 'Roll Handle'];
const PRINT_METHOD_OPTIONS: PrintMethod[] = ['Plain', 'Auto', 'Screen Print', 'Flexo', 'Digital Print', 'Litho'];

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function WorkTicketPage({
  monthOptions,
  clients,
  products,
  pricingTiers,
  paperRates,
  inkRates,
  finishingOperations,
  pressRates,
  plateCosts,
  machines,
  workTickets,
  workTicketForm,
  setWorkTicketForm,
  workTicketEditingId,
  workTicketMessage,
  onSave,
  onReset,
  onPrint,
  workTicketFilters,
  setWorkTicketFilters,
  filteredWorkTickets,
  onEdit,
}: WorkTicketPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (workTicketEditingId) setMode('form');
  }, [workTicketEditingId]);

  const clientOptions: ComboboxOption[] = useMemo(
    () => clients.map((client) => ({ value: client.id, label: client.name, description: client.companyName })),
    [clients],
  );
  const productOptions: ComboboxOption[] = useMemo(
    () => products.map((product) => ({ value: product.id, label: product.name, description: product.sku })),
    [products],
  );

  // ----- live cost breakdown -----
  // Recompute every render; the inputs are tiny so this is essentially free.
  const breakdown: WorkTicketBreakdown = useMemo(() => {
    const sheetAreaSqm = parseSheetAreaSqm(workTicketForm.sheetSize);
    const marginOverrideRaw = workTicketForm.marginPercentOverride.trim();
    const marginPercentOverride =
      marginOverrideRaw === '' ? null : Number(marginOverrideRaw);
    return computeWorkTicket(
      {
        quantity: Number(workTicketForm.quantity || 0),
        sheets: Number(workTicketForm.sheets || 0),
        sheetAreaSqm,
        colors: Number(workTicketForm.colors || 0),
        paperRateId: workTicketForm.paperRateId,
        plateCostId: workTicketForm.plateCostId,
        pressRateId: workTicketForm.pressRateId,
        guillotineRateId: workTicketForm.guillotineRateId,
        inkLines: workTicketForm.inkLines,
        finishingLines: workTicketForm.finishingLines,
        marginPercentOverride: Number.isFinite(marginPercentOverride)
          ? (marginPercentOverride as number)
          : null,
        clientId: workTicketForm.clientId,
        despatchCost: Number(workTicketForm.despatchCost || 0),
      },
      {
        paperRates,
        costProfiles: [],
        inkRates,
        finishingOperations,
        pressRates,
        plateCosts,
        pricingTiers,
        clients,
        machines,
      },
    );
  }, [
    workTicketForm,
    paperRates,
    inkRates,
    finishingOperations,
    pressRates,
    plateCosts,
    pricingTiers,
    clients,
    machines,
  ]);

  // ----- helpers for editing line arrays -----
  function addInkLine(): void {
    const next: WorkTicketInkLine = {
      id: newId('ink'),
      inkRateId: '',
      inkName: '',
      coveragePercent: 0,
      estimatedKg: 0,
      cost: 0,
    };
    setWorkTicketForm({ ...workTicketForm, inkLines: [...workTicketForm.inkLines, next] });
  }
  function updateInkLine(id: string, patch: Partial<WorkTicketInkLine>): void {
    setWorkTicketForm({
      ...workTicketForm,
      inkLines: workTicketForm.inkLines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  }
  function removeInkLine(id: string): void {
    setWorkTicketForm({
      ...workTicketForm,
      inkLines: workTicketForm.inkLines.filter((l) => l.id !== id),
    });
  }

  function addFinishingLine(): void {
    const next: WorkTicketFinishingLine = {
      id: newId('fin'),
      finishingOperationId: '',
      operationName: '',
      quantity: Number(workTicketForm.quantity || 0),
      cost: 0,
      override: false,
    };
    setWorkTicketForm({
      ...workTicketForm,
      finishingLines: [...workTicketForm.finishingLines, next],
    });
  }
  function updateFinishingLine(id: string, patch: Partial<WorkTicketFinishingLine>): void {
    setWorkTicketForm({
      ...workTicketForm,
      finishingLines: workTicketForm.finishingLines.map((l) =>
        l.id === id ? { ...l, ...patch } : l,
      ),
    });
  }
  function removeFinishingLine(id: string): void {
    setWorkTicketForm({
      ...workTicketForm,
      finishingLines: workTicketForm.finishingLines.filter((l) => l.id !== id),
    });
  }

  function handleStartCreate(): void {
    onReset();
    setMode('form');
  }
  function handleBackToList(): void {
    onReset();
    setMode('list');
  }

  if (mode === 'list') {
    return (
      <div className="page-shell">
        <section className="card">
          <SectionTitle
            title="Work Tickets"
            subtitle="Cost breakdowns for every job — paper, ink, press time, finishing, despatch."
            action={
              <button type="button" className="primary-button" onClick={handleStartCreate}>
                + New Work Ticket
              </button>
            }
          />
          <div className="filters-grid">
            <label>
              <span>Search</span>
              <input
                type="search"
                value={workTicketFilters.search}
                onChange={(event) => setWorkTicketFilters({ ...workTicketFilters, search: event.target.value })}
                placeholder="Ticket no, client, product"
              />
            </label>
            <label>
              <span>Month</span>
              <select
                value={workTicketFilters.month}
                onChange={(event) => setWorkTicketFilters({ ...workTicketFilters, month: event.target.value })}
              >
                <option value="">All months</option>
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {getMonthLabel(m)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select
                value={workTicketFilters.status}
                onChange={(event) => setWorkTicketFilters({ ...workTicketFilters, status: event.target.value })}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Client</span>
              <select
                value={workTicketFilters.client}
                onChange={(event) => setWorkTicketFilters({ ...workTicketFilters, client: event.target.value })}
              >
                <option value="">All clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {filteredWorkTickets.length === 0 ? (
            <EmptyState
              title="No work tickets yet"
              body="Build your first ticket. Pick the spec, the engine fills the breakdown."
            />
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Cost / unit</th>
                    <th>Sell / unit</th>
                    <th>Total sell</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>{ticket.ticketNumber}</td>
                      <td>{ticket.ticketDate ? formatDate(ticket.ticketDate) : '—'}</td>
                      <td>{ticket.clientName || '—'}</td>
                      <td>{ticket.productName || ticket.productDescription || '—'}</td>
                      <td>{formatNumber(ticket.quantity)}</td>
                      <td>{formatNumber(ticket.totalCost / Math.max(1, ticket.quantity), 4)}</td>
                      <td>{formatNumber(ticket.sellingPricePerUnit, 4)}</td>
                      <td>{formatNumber(ticket.sellingPriceTotal, 2)}</td>
                      <td>{ticket.status}</td>
                      <td className="row-actions">
                        <button type="button" className="link-button" onClick={() => onEdit(ticket)}>
                          Edit
                        </button>
                        <button type="button" className="link-button" onClick={() => onPrint(ticket)}>
                          Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  // ===== form mode =====
  const editing = Boolean(workTicketEditingId);
  return (
    <div className="page-shell work-ticket-shell">
      <section className="card">
        <SectionTitle
          title={editing ? 'Edit Work Ticket' : 'New Work Ticket'}
          subtitle="Fill the spec — costs auto-calculate from the live cost masters."
          action={
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={handleBackToList}>
                ← Back to list
              </button>
              <button type="button" className="primary-button" onClick={onSave}>
                {editing ? 'Save changes' : 'Save ticket'}
              </button>
            </div>
          }
        />
        {workTicketMessage ? <div className="form-message">{workTicketMessage}</div> : null}

        <div className="work-ticket-layout">
          <div className="work-ticket-inputs">
            {/* ---- header / job details ---- */}
            <fieldset className="card-inset">
              <legend>Job details</legend>
              <div className="form-grid form-grid-3">
                <label>
                  <span>Ticket date</span>
                  <input
                    type="date"
                    value={workTicketForm.ticketDate}
                    onChange={(e) => setWorkTicketForm({ ...workTicketForm, ticketDate: e.target.value })}
                  />
                </label>
                <label>
                  <span>Client</span>
                  <Combobox
                    value={workTicketForm.clientId}
                    options={clientOptions}
                    placeholder="Select client"
                    onChange={(value) => setWorkTicketForm({ ...workTicketForm, clientId: value })}
                  />
                </label>
                <label>
                  <span>Product</span>
                  <Combobox
                    value={workTicketForm.productId}
                    options={productOptions}
                    placeholder="Select product"
                    onChange={(value) => setWorkTicketForm({ ...workTicketForm, productId: value })}
                  />
                </label>
                <label className="span-2">
                  <span>Description (printed at top of ticket)</span>
                  <input
                    type="text"
                    value={workTicketForm.productDescription}
                    onChange={(e) =>
                      setWorkTicketForm({ ...workTicketForm, productDescription: e.target.value })
                    }
                    placeholder='e.g. "Burger Self-Erecting Box"'
                  />
                </label>
                <label>
                  <span>Status</span>
                  <select
                    value={workTicketForm.status}
                    onChange={(e) =>
                      setWorkTicketForm({
                        ...workTicketForm,
                        status: e.target.value as WorkTicketStatus,
                      })
                    }
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </fieldset>

            {/* ---- spec ---- */}
            <fieldset className="card-inset">
              <legend>Run spec</legend>
              <div className="form-grid form-grid-4">
                <label>
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="0"
                    value={workTicketForm.quantity}
                    onChange={(e) => setWorkTicketForm({ ...workTicketForm, quantity: e.target.value })}
                  />
                </label>
                <label>
                  <span>Sheets (incl. make-ready)</span>
                  <input
                    type="number"
                    min="0"
                    value={workTicketForm.sheets}
                    onChange={(e) => setWorkTicketForm({ ...workTicketForm, sheets: e.target.value })}
                    placeholder="Auto if blank"
                  />
                </label>
                <label>
                  <span>Sheet size (mm)</span>
                  <input
                    type="text"
                    value={workTicketForm.sheetSize}
                    onChange={(e) => setWorkTicketForm({ ...workTicketForm, sheetSize: e.target.value })}
                    placeholder="640 × 920"
                  />
                </label>
                <label>
                  <span>Size spec (printed)</span>
                  <input
                    type="text"
                    value={workTicketForm.sizeSpec}
                    onChange={(e) => setWorkTicketForm({ ...workTicketForm, sizeSpec: e.target.value })}
                    placeholder='e.g. "260 × 130 × 70"'
                  />
                </label>
                <label>
                  <span>Handle type</span>
                  <select
                    value={workTicketForm.handleType}
                    onChange={(e) =>
                      setWorkTicketForm({
                        ...workTicketForm,
                        handleType: e.target.value as HandleType,
                      })
                    }
                  >
                    {HANDLE_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Print method</span>
                  <select
                    value={workTicketForm.printMethod}
                    onChange={(e) =>
                      setWorkTicketForm({
                        ...workTicketForm,
                        printMethod: e.target.value as PrintMethod,
                      })
                    }
                  >
                    {PRINT_METHOD_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Colours</span>
                  <input
                    type="number"
                    min="0"
                    value={workTicketForm.colors}
                    onChange={(e) => setWorkTicketForm({ ...workTicketForm, colors: e.target.value })}
                  />
                </label>
                <label>
                  <span>Margin % override</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={workTicketForm.marginPercentOverride}
                    onChange={(e) =>
                      setWorkTicketForm({
                        ...workTicketForm,
                        marginPercentOverride: e.target.value,
                      })
                    }
                    placeholder="Use client tier"
                  />
                </label>
              </div>
            </fieldset>

            {/* ---- master picks ---- */}
            <fieldset className="card-inset">
              <legend>Materials & machines</legend>
              <div className="form-grid form-grid-2">
                <label>
                  <span>Paper rate</span>
                  <select
                    value={workTicketForm.paperRateId}
                    onChange={(e) => setWorkTicketForm({ ...workTicketForm, paperRateId: e.target.value })}
                  >
                    <option value="">Select paper</option>
                    {paperRates
                      .filter((p) => p.active)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.paperType} {p.gsm}gsm · {formatNumber(p.pricePerTon, 2)}/ton
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  <span>Plate / pre-press</span>
                  <select
                    value={workTicketForm.plateCostId}
                    onChange={(e) => setWorkTicketForm({ ...workTicketForm, plateCostId: e.target.value })}
                  >
                    <option value="">Select plate</option>
                    {plateCosts
                      .filter((p) => p.active)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.format} · {formatNumber(p.costPerColor, 2)}/colour
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  <span>Press</span>
                  <select
                    value={workTicketForm.pressRateId}
                    onChange={(e) => setWorkTicketForm({ ...workTicketForm, pressRateId: e.target.value })}
                  >
                    <option value="">Select press</option>
                    {pressRates
                      .filter((p) => p.active)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.machineName} · {formatNumber(p.ratePerHour, 2)}/hr
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  <span>Guillotine</span>
                  <select
                    value={workTicketForm.guillotineRateId}
                    onChange={(e) =>
                      setWorkTicketForm({ ...workTicketForm, guillotineRateId: e.target.value })
                    }
                  >
                    <option value="">No guillotine pass</option>
                    {pressRates
                      .filter((p) => p.active)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.machineName} · {formatNumber(p.ratePerHour, 2)}/hr
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            </fieldset>

            {/* ---- ink lines ---- */}
            <fieldset className="card-inset">
              <legend>Ink (per colour)</legend>
              <div className="line-table">
                <div className="line-table-header">
                  <span>Ink</span>
                  <span>Coverage %</span>
                  <span>Est kg</span>
                  <span>Cost</span>
                  <span />
                </div>
                {workTicketForm.inkLines.map((line, idx) => {
                  const computed = breakdown.inkLines[idx];
                  return (
                    <div key={line.id} className="line-table-row">
                      <select
                        value={line.inkRateId}
                        onChange={(e) =>
                          updateInkLine(line.id, { inkRateId: e.target.value, inkName: '' })
                        }
                      >
                        <option value="">Select ink</option>
                        {inkRates
                          .filter((i) => i.active)
                          .map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={line.coveragePercent || ''}
                        onChange={(e) =>
                          updateInkLine(line.id, { coveragePercent: Number(e.target.value || 0) })
                        }
                        placeholder="Default"
                      />
                      <span>{formatNumber(computed?.estimatedKg ?? 0, 4)}</span>
                      <span>{formatNumber(computed?.cost ?? 0, 2)}</span>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => removeInkLine(line.id)}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
                <button type="button" className="ghost-button" onClick={addInkLine}>
                  + Add ink line
                </button>
              </div>
            </fieldset>

            {/* ---- finishing lines ---- */}
            <fieldset className="card-inset">
              <legend>Finishing operations</legend>
              <div className="line-table">
                <div className="line-table-header">
                  <span>Operation</span>
                  <span>Quantity</span>
                  <span>Cost</span>
                  <span />
                  <span />
                </div>
                {workTicketForm.finishingLines.map((line, idx) => {
                  const computed = breakdown.finishingLines[idx];
                  return (
                    <div key={line.id} className="line-table-row">
                      <select
                        value={line.finishingOperationId}
                        onChange={(e) =>
                          updateFinishingLine(line.id, {
                            finishingOperationId: e.target.value,
                            operationName: '',
                            override: false,
                          })
                        }
                      >
                        <option value="">Select operation</option>
                        {finishingOperations
                          .filter((f) => f.active)
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={line.quantity || ''}
                        onChange={(e) =>
                          updateFinishingLine(line.id, { quantity: Number(e.target.value || 0) })
                        }
                        placeholder={String(workTicketForm.quantity || 0)}
                      />
                      {line.override ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.cost || ''}
                          onChange={(e) =>
                            updateFinishingLine(line.id, { cost: Number(e.target.value || 0) })
                          }
                        />
                      ) : (
                        <span>{formatNumber(computed?.cost ?? 0, 2)}</span>
                      )}
                      <label className="line-table-checkbox">
                        <input
                          type="checkbox"
                          checked={line.override}
                          onChange={(e) =>
                            updateFinishingLine(line.id, { override: e.target.checked })
                          }
                        />
                        <span>Override</span>
                      </label>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => removeFinishingLine(line.id)}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
                <button type="button" className="ghost-button" onClick={addFinishingLine}>
                  + Add finishing line
                </button>
              </div>
            </fieldset>

            {/* ---- despatch ---- */}
            <fieldset className="card-inset">
              <legend>Despatch</legend>
              <div className="form-grid form-grid-2">
                <label>
                  <span>Despatch cost (packing + delivery)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={workTicketForm.despatchCost}
                    onChange={(e) =>
                      setWorkTicketForm({ ...workTicketForm, despatchCost: e.target.value })
                    }
                  />
                </label>
                <label className="span-2">
                  <span>Despatch notes</span>
                  <input
                    type="text"
                    value={workTicketForm.despatchNotes}
                    onChange={(e) =>
                      setWorkTicketForm({ ...workTicketForm, despatchNotes: e.target.value })
                    }
                    placeholder="e.g. 5 pallets, JHB delivery, Friday"
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="card-inset">
              <legend>Notes</legend>
              <textarea
                rows={3}
                value={workTicketForm.notes}
                onChange={(e) => setWorkTicketForm({ ...workTicketForm, notes: e.target.value })}
                placeholder="Anything that doesn't fit a column — substrate quirks, deadline, special instructions."
              />
            </fieldset>
          </div>

          {/* ===== Right column: live cost breakdown panel ===== */}
          <aside className="work-ticket-breakdown">
            <SectionTitle title="Cost breakdown" subtitle="Live — refreshes as you type." />
            {breakdown.warnings.length > 0 ? (
              <ul className="warning-list">
                {breakdown.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            ) : null}
            <div className="breakdown-section">
              <h4>Pre-press</h4>
              <div className="breakdown-row">
                <span>{breakdown.plateCostName || '—'}</span>
                <strong>{formatNumber(breakdown.prePressCost, 2)}</strong>
              </div>
            </div>
            <div className="breakdown-section">
              <h4>Paper</h4>
              <div className="breakdown-row">
                <span>{breakdown.paperRateName || '—'}</span>
                <span>{formatNumber(breakdown.paperKg, 2)} kg</span>
                <strong>{formatNumber(breakdown.paperCost, 2)}</strong>
              </div>
            </div>
            <div className="breakdown-section">
              <h4>Ink</h4>
              {breakdown.inkLines.length === 0 ? (
                <div className="breakdown-row muted">No ink lines</div>
              ) : (
                breakdown.inkLines.map((line) => (
                  <div className="breakdown-row" key={line.id}>
                    <span>{line.inkName || '(no ink selected)'}</span>
                    <span>{formatNumber(line.estimatedKg, 4)} kg</span>
                    <strong>{formatNumber(line.cost, 2)}</strong>
                  </div>
                ))
              )}
              <div className="breakdown-subtotal">
                <span>Ink subtotal</span>
                <strong>{formatNumber(breakdown.inkSubtotal, 2)}</strong>
              </div>
            </div>
            <div className="breakdown-section">
              <h4>Press</h4>
              {breakdown.pressLines.map((line) => (
                <div className="breakdown-row" key={line.id}>
                  <span>{line.machineName}</span>
                  <span>{formatNumber(line.minutes, 1)} min</span>
                  <strong>{formatNumber(line.cost, 2)}</strong>
                </div>
              ))}
              {breakdown.pressLines.length === 0 ? (
                <div className="breakdown-row muted">No press selected</div>
              ) : null}
            </div>
            {breakdown.guillotineLines.length > 0 ? (
              <div className="breakdown-section">
                <h4>Guillotine</h4>
                {breakdown.guillotineLines.map((line) => (
                  <div className="breakdown-row" key={line.id}>
                    <span>{line.machineName}</span>
                    <span>{formatNumber(line.minutes, 1)} min</span>
                    <strong>{formatNumber(line.cost, 2)}</strong>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="breakdown-section">
              <h4>Finishing</h4>
              {breakdown.finishingLines.length === 0 ? (
                <div className="breakdown-row muted">No finishing lines</div>
              ) : (
                breakdown.finishingLines.map((line) => (
                  <div className="breakdown-row" key={line.id}>
                    <span>{line.operationName || '(no operation)'}</span>
                    <strong>{formatNumber(line.cost, 2)}</strong>
                  </div>
                ))
              )}
              <div className="breakdown-subtotal">
                <span>Finishing subtotal</span>
                <strong>{formatNumber(breakdown.finishingSubtotal, 2)}</strong>
              </div>
            </div>
            <div className="breakdown-section">
              <h4>Despatch</h4>
              <div className="breakdown-row">
                <span>{workTicketForm.despatchNotes || '—'}</span>
                <strong>{formatNumber(breakdown.despatchCost, 2)}</strong>
              </div>
            </div>
            <div className="breakdown-totals">
              <div className="breakdown-row">
                <span>Total cost</span>
                <strong>{formatNumber(breakdown.totalCost, 2)}</strong>
              </div>
              <div className="breakdown-row">
                <span>Cost / unit</span>
                <strong>{formatNumber(breakdown.unitCost, 4)}</strong>
              </div>
              <div className="breakdown-row">
                <span>Margin applied</span>
                <strong>{formatNumber(breakdown.marginPercentApplied, 2)}%</strong>
              </div>
              <div className="breakdown-row breakdown-row-emphasis">
                <span>Sell / unit</span>
                <strong>{formatNumber(breakdown.sellingPricePerUnit, 4)}</strong>
              </div>
              <div className="breakdown-row breakdown-row-emphasis">
                <span>Total sell</span>
                <strong>{formatNumber(breakdown.sellingPriceTotal, 2)}</strong>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

/** Helper used by App.tsx when seeding/clearing the work-ticket form. */
export function emptyWorkTicketForm(today: string): WorkTicketFormState {
  return {
    ticketDate: today,
    linkedQuoteId: '',
    linkedJobId: '',
    clientId: '',
    productId: '',
    productDescription: '',
    sizeSpec: '',
    handleType: 'None',
    printMethod: 'Plain',
    colors: '0',
    quantity: '0',
    sheets: '',
    sheetSize: '',
    paperRateId: '',
    plateCostId: '',
    pressRateId: '',
    guillotineRateId: '',
    inkLines: [],
    finishingLines: [],
    despatchCost: '0',
    despatchNotes: '',
    marginPercentOverride: '',
    status: 'Draft',
    notes: '',
  };
}

