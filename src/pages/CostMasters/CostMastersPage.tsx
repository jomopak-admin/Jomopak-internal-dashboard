/**
 * Cost Masters page.
 *
 * Single screen for the four work-ticket master tables: Ink Rates,
 * Finishing Operations, Press Rates, and Plate Costs. Each gets a tab
 * with a list + inline editor.
 *
 * The bag-centric `CostProfile` records continue to live on the existing
 * Cost Inputs page so we don't disturb the older calculator workflow.
 */

import { useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  FinishingOperation,
  FinishingOperationFormState,
  InkRate,
  InkRateFormState,
  Machine,
  PlateCost,
  PlateCostFormState,
  PressRate,
  PressRateFormState,
  Supplier,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

type CostMasterTab = 'ink' | 'finishing' | 'press' | 'plate';

interface CostMastersPageProps {
  inkRates: InkRate[];
  finishingOperations: FinishingOperation[];
  pressRates: PressRate[];
  plateCosts: PlateCost[];
  suppliers: Supplier[];
  machines: Machine[];

  inkRateForm: InkRateFormState;
  setInkRateForm: (value: InkRateFormState) => void;
  inkRateEditingId: string | null;
  inkRateMessage: string;
  onSaveInkRate: () => void;
  onResetInkRate: () => void;
  onEditInkRate: (rate: InkRate) => void;
  onDeleteInkRate: (rate: InkRate) => void;

  finishingForm: FinishingOperationFormState;
  setFinishingForm: (value: FinishingOperationFormState) => void;
  finishingEditingId: string | null;
  finishingMessage: string;
  onSaveFinishing: () => void;
  onResetFinishing: () => void;
  onEditFinishing: (op: FinishingOperation) => void;
  onDeleteFinishing: (op: FinishingOperation) => void;

  pressRateForm: PressRateFormState;
  setPressRateForm: (value: PressRateFormState) => void;
  pressRateEditingId: string | null;
  pressRateMessage: string;
  onSavePressRate: () => void;
  onResetPressRate: () => void;
  onEditPressRate: (rate: PressRate) => void;
  onDeletePressRate: (rate: PressRate) => void;

  plateCostForm: PlateCostFormState;
  setPlateCostForm: (value: PlateCostFormState) => void;
  plateCostEditingId: string | null;
  plateCostMessage: string;
  onSavePlateCost: () => void;
  onResetPlateCost: () => void;
  onEditPlateCost: (rate: PlateCost) => void;
  onDeletePlateCost: (rate: PlateCost) => void;
}

export function CostMastersPage(props: CostMastersPageProps) {
  const [tab, setTab] = useState<CostMasterTab>('ink');
  return (
    <div className="page-shell cost-masters-shell">
      <section className="card">
        <SectionTitle
          title="Cost Masters"
          subtitle="Fuel for the work-ticket engine. Update once, every quote uses the new rate."
        />
        <div className="tab-bar">
          {([
            ['ink', `Ink (${props.inkRates.length})`],
            ['finishing', `Finishing (${props.finishingOperations.length})`],
            ['press', `Press (${props.pressRates.length})`],
            ['plate', `Plate (${props.plateCosts.length})`],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`tab-pill${tab === id ? ' tab-pill-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'ink' ? (
          <InkTab
            rates={props.inkRates}
            suppliers={props.suppliers}
            form={props.inkRateForm}
            setForm={props.setInkRateForm}
            editingId={props.inkRateEditingId}
            message={props.inkRateMessage}
            onSave={props.onSaveInkRate}
            onReset={props.onResetInkRate}
            onEdit={props.onEditInkRate}
            onDelete={props.onDeleteInkRate}
          />
        ) : null}

        {tab === 'finishing' ? (
          <FinishingTab
            operations={props.finishingOperations}
            form={props.finishingForm}
            setForm={props.setFinishingForm}
            editingId={props.finishingEditingId}
            message={props.finishingMessage}
            onSave={props.onSaveFinishing}
            onReset={props.onResetFinishing}
            onEdit={props.onEditFinishing}
            onDelete={props.onDeleteFinishing}
          />
        ) : null}

        {tab === 'press' ? (
          <PressTab
            rates={props.pressRates}
            machines={props.machines}
            form={props.pressRateForm}
            setForm={props.setPressRateForm}
            editingId={props.pressRateEditingId}
            message={props.pressRateMessage}
            onSave={props.onSavePressRate}
            onReset={props.onResetPressRate}
            onEdit={props.onEditPressRate}
            onDelete={props.onDeletePressRate}
          />
        ) : null}

        {tab === 'plate' ? (
          <PlateTab
            rates={props.plateCosts}
            form={props.plateCostForm}
            setForm={props.setPlateCostForm}
            editingId={props.plateCostEditingId}
            message={props.plateCostMessage}
            onSave={props.onSavePlateCost}
            onReset={props.onResetPlateCost}
            onEdit={props.onEditPlateCost}
            onDelete={props.onDeletePlateCost}
          />
        ) : null}
      </section>
    </div>
  );
}

/* ===== Ink ===== */
interface InkTabProps {
  rates: InkRate[];
  suppliers: Supplier[];
  form: InkRateFormState;
  setForm: (v: InkRateFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (r: InkRate) => void;
  onDelete: (r: InkRate) => void;
}
function InkTab({ rates, suppliers, form, setForm, editingId, message, onSave, onReset, onEdit, onDelete }: InkTabProps) {
  return (
    <div className="masters-grid">
      <fieldset className="card-inset">
        <legend>{editingId ? 'Edit ink' : 'New ink'}</legend>
        {message ? <div className="form-message">{message}</div> : null}
        <div className="form-grid form-grid-2">
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. PMS 485 Red" />
          </label>
          <label>
            <span>Type</span>
            <select value={form.inkType} onChange={(e) => setForm({ ...form, inkType: e.target.value as InkRateFormState['inkType'] })}>
              <option>Process</option>
              <option>Pantone</option>
              <option>Varnish</option>
              <option>Metallic</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            <span>Supplier</span>
            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Cost / kg</span>
            <input type="number" min="0" step="0.01" value={form.costPerKg} onChange={(e) => setForm({ ...form, costPerKg: e.target.value })} />
          </label>
          <label>
            <span>Coverage m² / kg</span>
            <input type="number" min="0" step="0.1" value={form.coverageSqmPerKg} onChange={(e) => setForm({ ...form, coverageSqmPerKg: e.target.value })} placeholder="e.g. 100" />
          </label>
          <label>
            <span>Default coverage %</span>
            <input type="number" min="0" max="100" step="1" value={form.defaultCoveragePercent} onChange={(e) => setForm({ ...form, defaultCoveragePercent: e.target.value })} />
          </label>
          <label className="span-2">
            <span>Notes</span>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
        </div>
        <div className="action-row">
          <button type="button" className="primary-button" onClick={onSave}>{editingId ? 'Save changes' : 'Add ink'}</button>
          {editingId ? <button type="button" className="ghost-button" onClick={onReset}>Cancel</button> : null}
        </div>
      </fieldset>

      {rates.length === 0 ? (
        <EmptyState title="No ink rates" body="Add your first ink rate to fuel the work-ticket engine." />
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Supplier</th>
                <th>Cost / kg</th>
                <th>Coverage</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.inkType}</td>
                  <td>{r.supplierName}</td>
                  <td>{formatNumber(r.costPerKg, 2)}</td>
                  <td>{formatNumber(r.coverageSqmPerKg, 0)} m²/kg @ {formatNumber(r.defaultCoveragePercent, 0)}%</td>
                  <td>{r.active ? 'Yes' : 'No'}</td>
                  <td className="row-actions">
                    <button type="button" className="link-button" onClick={() => onEdit(r)}>Edit</button>
                    <button type="button" className="link-button" onClick={() => onDelete(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===== Finishing ===== */
interface FinishingTabProps {
  operations: FinishingOperation[];
  form: FinishingOperationFormState;
  setForm: (v: FinishingOperationFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (o: FinishingOperation) => void;
  onDelete: (o: FinishingOperation) => void;
}
function FinishingTab({ operations, form, setForm, editingId, message, onSave, onReset, onEdit, onDelete }: FinishingTabProps) {
  return (
    <div className="masters-grid">
      <fieldset className="card-inset">
        <legend>{editingId ? 'Edit operation' : 'New operation'}</legend>
        {message ? <div className="form-message">{message}</div> : null}
        <div className="form-grid form-grid-2">
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lamination, gloss" />
          </label>
          <label>
            <span>Machine / station</span>
            <input value={form.machineName} onChange={(e) => setForm({ ...form, machineName: e.target.value })} placeholder="e.g. Bobst die-cutter" />
          </label>
          <label>
            <span>Rate type</span>
            <select value={form.rateType} onChange={(e) => setForm({ ...form, rateType: e.target.value as FinishingOperationFormState['rateType'] })}>
              <option value="PerThousand">Per 1000</option>
              <option value="PerHour">Per hour</option>
            </select>
          </label>
          <label>
            <span>Rate</span>
            <input type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          </label>
          <label>
            <span>Setup cost</span>
            <input type="number" min="0" step="0.01" value={form.setupCost} onChange={(e) => setForm({ ...form, setupCost: e.target.value })} />
          </label>
          <label>
            <span>Run speed / hour</span>
            <input type="number" min="0" step="1" value={form.runSpeedPerHour} onChange={(e) => setForm({ ...form, runSpeedPerHour: e.target.value })} />
          </label>
          <label className="span-2">
            <span>Notes</span>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
        </div>
        <div className="action-row">
          <button type="button" className="primary-button" onClick={onSave}>{editingId ? 'Save changes' : 'Add operation'}</button>
          {editingId ? <button type="button" className="ghost-button" onClick={onReset}>Cancel</button> : null}
        </div>
      </fieldset>

      {operations.length === 0 ? (
        <EmptyState title="No finishing operations" body="Add die-cut, fold, glue, lamination, etc." />
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Machine</th><th>Rate</th><th>Setup</th><th>Active</th><th /></tr></thead>
            <tbody>
              {operations.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.machineName}</td>
                  <td>{formatNumber(o.rate, 2)} {o.rateType === 'PerThousand' ? '/ 1000' : '/ hr'}</td>
                  <td>{formatNumber(o.setupCost, 2)}</td>
                  <td>{o.active ? 'Yes' : 'No'}</td>
                  <td className="row-actions">
                    <button type="button" className="link-button" onClick={() => onEdit(o)}>Edit</button>
                    <button type="button" className="link-button" onClick={() => onDelete(o)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===== Press ===== */
interface PressTabProps {
  rates: PressRate[];
  machines: Machine[];
  form: PressRateFormState;
  setForm: (v: PressRateFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (r: PressRate) => void;
  onDelete: (r: PressRate) => void;
}
function PressTab({ rates, machines, form, setForm, editingId, message, onSave, onReset, onEdit, onDelete }: PressTabProps) {
  return (
    <div className="masters-grid">
      <fieldset className="card-inset">
        <legend>{editingId ? 'Edit press rate' : 'New press rate'}</legend>
        {message ? <div className="form-message">{message}</div> : null}
        <div className="form-grid form-grid-2">
          <label>
            <span>Machine</span>
            <select value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })}>
              <option value="">Select machine</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>{m.name} · {m.code}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Rate / hour</span>
            <input type="number" min="0" step="0.01" value={form.ratePerHour} onChange={(e) => setForm({ ...form, ratePerHour: e.target.value })} />
          </label>
          <label>
            <span>Make-ready sheets</span>
            <input type="number" min="0" step="1" value={form.makeReadySheets} onChange={(e) => setForm({ ...form, makeReadySheets: e.target.value })} />
          </label>
          <label>
            <span>Make-ready minutes</span>
            <input type="number" min="0" step="1" value={form.makeReadyMinutes} onChange={(e) => setForm({ ...form, makeReadyMinutes: e.target.value })} />
          </label>
          <label>
            <span>Run speed (sheets / hr)</span>
            <input type="number" min="0" step="1" value={form.runSpeedSheetsPerHour} onChange={(e) => setForm({ ...form, runSpeedSheetsPerHour: e.target.value })} />
          </label>
          <label className="span-2">
            <span>Notes</span>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
        </div>
        <div className="action-row">
          <button type="button" className="primary-button" onClick={onSave}>{editingId ? 'Save changes' : 'Add press rate'}</button>
          {editingId ? <button type="button" className="ghost-button" onClick={onReset}>Cancel</button> : null}
        </div>
      </fieldset>

      {rates.length === 0 ? (
        <EmptyState title="No press rates" body="Add a hourly cost for each press / guillotine you run." />
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Machine</th><th>Rate / hr</th><th>Make-ready</th><th>Run speed</th><th>Active</th><th /></tr></thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id}>
                  <td>{r.machineName}</td>
                  <td>{formatNumber(r.ratePerHour, 2)}</td>
                  <td>{r.makeReadySheets} sh / {r.makeReadyMinutes} min</td>
                  <td>{formatNumber(r.runSpeedSheetsPerHour)} / hr</td>
                  <td>{r.active ? 'Yes' : 'No'}</td>
                  <td className="row-actions">
                    <button type="button" className="link-button" onClick={() => onEdit(r)}>Edit</button>
                    <button type="button" className="link-button" onClick={() => onDelete(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===== Plate ===== */
interface PlateTabProps {
  rates: PlateCost[];
  form: PlateCostFormState;
  setForm: (v: PlateCostFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (r: PlateCost) => void;
  onDelete: (r: PlateCost) => void;
}
function PlateTab({ rates, form, setForm, editingId, message, onSave, onReset, onEdit, onDelete }: PlateTabProps) {
  return (
    <div className="masters-grid">
      <fieldset className="card-inset">
        <legend>{editingId ? 'Edit plate' : 'New plate'}</legend>
        {message ? <div className="form-message">{message}</div> : null}
        <div className="form-grid form-grid-2">
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Litho B2" />
          </label>
          <label>
            <span>Format</span>
            <input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} placeholder='e.g. "B2", "Flexo 800mm"' />
          </label>
          <label>
            <span>Cost / colour</span>
            <input type="number" min="0" step="0.01" value={form.costPerColor} onChange={(e) => setForm({ ...form, costPerColor: e.target.value })} />
          </label>
          <label>
            <span>Origination cost</span>
            <input type="number" min="0" step="0.01" value={form.originationCost} onChange={(e) => setForm({ ...form, originationCost: e.target.value })} />
          </label>
          <label className="span-2">
            <span>Notes</span>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
        </div>
        <div className="action-row">
          <button type="button" className="primary-button" onClick={onSave}>{editingId ? 'Save changes' : 'Add plate'}</button>
          {editingId ? <button type="button" className="ghost-button" onClick={onReset}>Cancel</button> : null}
        </div>
      </fieldset>

      {rates.length === 0 ? (
        <EmptyState title="No plate costs" body="Add the plate / pre-press costs by format." />
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Format</th><th>Cost / colour</th><th>Origination</th><th>Active</th><th /></tr></thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.format}</td>
                  <td>{formatNumber(r.costPerColor, 2)}</td>
                  <td>{formatNumber(r.originationCost, 2)}</td>
                  <td>{r.active ? 'Yes' : 'No'}</td>
                  <td className="row-actions">
                    <button type="button" className="link-button" onClick={() => onEdit(r)}>Edit</button>
                    <button type="button" className="link-button" onClick={() => onDelete(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
