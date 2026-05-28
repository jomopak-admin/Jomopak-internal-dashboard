/**
 * HACCP Hazard Register.
 *
 * One row per identified hazard in the packaging process. Captures the
 * hazard, risk score (likelihood × severity → Low/Medium/High/Critical),
 * the control measure that mitigates it, monitoring + critical limits,
 * corrective action when the control fails, verification method.
 *
 * The CCP (Critical Control Point) flag marks hazards where the control
 * measure is the LAST line of defense — these get extra attention in
 * audits. Review cycle defaults to annual.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  computeHaccpRiskLevel,
  HACCP_PROCESS_STEPS,
  HaccpHazard,
  HaccpHazardFilters,
  HaccpHazardFormState,
  HaccpHazardType,
  HaccpProcessStep,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface HaccpRegisterPageProps {
  hazards: HaccpHazard[];
  filters: HaccpHazardFilters;
  setFilters: (v: HaccpHazardFilters) => void;
  form: HaccpHazardFormState;
  setForm: (v: HaccpHazardFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (h: HaccpHazard) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function getReviewState(h: HaccpHazard): 'overdue' | 'due-soon' | 'ok' | 'never' {
  if (!h.lastReviewedDate || !h.reviewIntervalMonths) return 'never';
  const last = new Date(h.lastReviewedDate).getTime();
  if (Number.isNaN(last)) return 'never';
  const dueAt = last + h.reviewIntervalMonths * 30 * DAY_MS;
  const now = Date.now();
  if (now > dueAt) return 'overdue';
  if (dueAt - now < 30 * DAY_MS) return 'due-soon';
  return 'ok';
}

function riskColor(level: HaccpHazard['riskLevel']): string {
  if (level === 'Critical') return 'cell-alert';
  if (level === 'High') return 'cell-alert';
  return '';
}

export function HaccpRegisterPage(props: HaccpRegisterPageProps) {
  const { hazards, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filtered = useMemo(() => {
    return hazards.filter((h) => {
      const q = filters.search.trim().toLowerCase();
      if (q) {
        const hay = [h.hazardName, h.description, h.controlMeasure, h.processStep, h.responsiblePerson].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.processStep && h.processStep !== filters.processStep) return false;
      if (filters.hazardType && h.hazardType !== filters.hazardType) return false;
      if (filters.riskLevel && h.riskLevel !== filters.riskLevel) return false;
      if (filters.ccpOnly && !h.isCCP) return false;
      return true;
    });
  }, [hazards, filters]);

  const stats = useMemo(() => {
    const total = hazards.length;
    const ccps = hazards.filter((h) => h.isCCP).length;
    const critical = hazards.filter((h) => h.riskLevel === 'Critical').length;
    const high = hazards.filter((h) => h.riskLevel === 'High').length;
    const overdue = hazards.filter((h) => getReviewState(h) === 'overdue' || getReviewState(h) === 'never').length;
    return { total, ccps, critical, high, overdue };
  }, [hazards]);

  function handleStartCreate() { onReset(); setMode('form'); }
  function handleStartEdit(h: HaccpHazard) { onEdit(h); setMode('form'); }
  function handleBackToList() { onReset(); setMode('list'); }

  const liveRiskLevel = computeHaccpRiskLevel(Number(form.likelihood || 0), Number(form.severity || 0));

  const sections: FormWizardSection[] = [
    {
      key: 'identify',
      title: 'Identify hazard',
      missingRequired: [
        ...(form.hazardName.trim() ? [] : ['Hazard name']),
        ...(form.processStep ? [] : ['Process step']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Process step <RequiredMarker /></span>
            <select value={form.processStep} onChange={(e) => setForm({ ...form, processStep: e.target.value as HaccpProcessStep })}>
              {HACCP_PROCESS_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label><span>Hazard type</span>
            <select value={form.hazardType} onChange={(e) => setForm({ ...form, hazardType: e.target.value as HaccpHazardType })}>
              <option value="Physical">Physical</option>
              <option value="Chemical">Chemical</option>
              <option value="Biological">Biological</option>
              <option value="Allergen">Allergen</option>
            </select>
          </label>
          <label className="full-span"><span>Hazard name <RequiredMarker /></span><input value={form.hazardName} onChange={(e) => setForm({ ...form, hazardName: e.target.value })} placeholder="e.g. Ink migration into food contact surface" /></label>
          <label className="full-span"><span>Description</span><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full description of the hazard, where it can occur, what it threatens" /></label>
        </div>
      ),
    },
    {
      key: 'risk',
      title: 'Risk score',
      subtitle: `Computed risk: ${liveRiskLevel} (likelihood ${form.likelihood || 0} × severity ${form.severity || 0})`,
      contextActive: liveRiskLevel === 'High' || liveRiskLevel === 'Critical',
      body: (
        <div className="form-grid">
          <label><span>Likelihood (1 rare → 5 almost certain)</span>
            <select value={form.likelihood} onChange={(e) => setForm({ ...form, likelihood: e.target.value })}>
              <option value="">—</option>
              <option value="1">1 — Rare</option>
              <option value="2">2 — Unlikely</option>
              <option value="3">3 — Possible</option>
              <option value="4">4 — Likely</option>
              <option value="5">5 — Almost certain</option>
            </select>
          </label>
          <label><span>Severity (1 negligible → 5 catastrophic)</span>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option value="">—</option>
              <option value="1">1 — Negligible</option>
              <option value="2">2 — Minor</option>
              <option value="3">3 — Moderate</option>
              <option value="4">4 — Major</option>
              <option value="5">5 — Catastrophic</option>
            </select>
          </label>
        </div>
      ),
    },
    {
      key: 'control',
      title: 'Control measure',
      missingRequired: [...(form.controlMeasure.trim() ? [] : ['Control measure'])],
      contextActive: form.isCCP,
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Control measure <RequiredMarker /></span><textarea rows={2} value={form.controlMeasure} onChange={(e) => setForm({ ...form, controlMeasure: e.target.value })} placeholder="What we do to mitigate this hazard" /></label>
          <label className="checkbox-row full-span">
            <input type="checkbox" checked={form.isCCP} onChange={(e) => setForm({ ...form, isCCP: e.target.checked })} />
            <strong style={{ marginLeft: 4 }}>Critical Control Point (CCP)</strong> — failure of this control directly endangers food safety
          </label>
        </div>
      ),
    },
    {
      key: 'monitor',
      title: 'Monitoring & critical limits',
      body: (
        <div className="form-grid">
          <label><span>Monitoring method</span><input value={form.monitoringMethod} onChange={(e) => setForm({ ...form, monitoringMethod: e.target.value })} placeholder="What do we measure / observe?" /></label>
          <label><span>Frequency</span><input value={form.monitoringFrequency} onChange={(e) => setForm({ ...form, monitoringFrequency: e.target.value })} placeholder="Each batch / Daily / Per shift" /></label>
          <label className="full-span"><span>Critical limits</span><textarea rows={2} value={form.criticalLimits} onChange={(e) => setForm({ ...form, criticalLimits: e.target.value })} placeholder="Acceptable / unacceptable thresholds" /></label>
        </div>
      ),
    },
    {
      key: 'correct',
      title: 'Corrective action & verification',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Corrective action (if control fails)</span><textarea rows={2} value={form.correctiveAction} onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })} /></label>
          <label className="full-span"><span>Verification method</span><textarea rows={2} value={form.verificationMethod} onChange={(e) => setForm({ ...form, verificationMethod: e.target.value })} placeholder="Audit / test / inspection that confirms the control works" /></label>
          <label><span>Responsible person</span><input value={form.responsiblePerson} onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })} placeholder="Owner of this hazard's control" /></label>
        </div>
      ),
    },
    {
      key: 'review',
      title: 'Review cycle',
      body: (
        <div className="form-grid">
          <label><span>Last reviewed</span><input type="date" value={form.lastReviewedDate} onChange={(e) => setForm({ ...form, lastReviewedDate: e.target.value })} /></label>
          <label><span>Review interval (months)</span><input type="number" min="1" max="36" value={form.reviewIntervalMonths} onChange={(e) => setForm({ ...form, reviewIntervalMonths: e.target.value })} /></label>
          <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add hazard</button> : null}
        backAction={mode === 'list' ? null : <button className="ghost-button" onClick={handleBackToList}>← Back to register</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit hazard' : 'New hazard'}
          subtitle="Identify a hazard → score it → pick a control. CCPs trigger extra audit attention."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!editingId}
          saveLabel="Save hazard"
        />
      ) : (
        <section className="card">
          <SectionTitle title="HACCP Hazard Register" subtitle={`${filtered.length} of ${hazards.length} hazard(s) shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total hazards</span><strong>{stats.total}</strong></div>
            <div className="food-safety-stat"><span>CCPs</span><strong>{stats.ccps}</strong></div>
            <div className={`food-safety-stat${stats.critical > 0 ? ' food-safety-stat-alert' : ''}`}><span>Critical risk</span><strong>{stats.critical}</strong></div>
            <div className={`food-safety-stat${stats.high > 0 ? ' food-safety-stat-alert' : ''}`}><span>High risk</span><strong>{stats.high}</strong></div>
            <div className={`food-safety-stat${stats.overdue > 0 ? ' food-safety-stat-alert' : ''}`}><span>Review overdue</span><strong>{stats.overdue}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Hazard, description, control" /></label>
            <label><span>Process step</span>
              <select value={filters.processStep} onChange={(e) => setFilters({ ...filters, processStep: e.target.value })}>
                <option value="">All steps</option>
                {HACCP_PROCESS_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label><span>Type</span>
              <select value={filters.hazardType} onChange={(e) => setFilters({ ...filters, hazardType: e.target.value })}>
                <option value="">All</option>
                <option>Physical</option><option>Chemical</option><option>Biological</option><option>Allergen</option>
              </select>
            </label>
            <label><span>Risk</span>
              <select value={filters.riskLevel} onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}>
                <option value="">All</option>
                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </label>
            <label className="checkbox-row"><input type="checkbox" checked={filters.ccpOnly} onChange={(e) => setFilters({ ...filters, ccpOnly: e.target.checked })} />CCPs only</label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No hazards in this filter" body="Add your first hazard. Start with the process step where it can occur, then score likelihood × severity." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Hazard</th>
                    <th>Step</th>
                    <th>Type</th>
                    <th>Risk</th>
                    <th>CCP</th>
                    <th>Control</th>
                    <th>Owner</th>
                    <th>Review</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h) => {
                    const r = getReviewState(h);
                    return (
                      <tr key={h.id}>
                        <td><strong>{h.hazardName}</strong><div className="table-subtext">{h.hazardNumber}</div></td>
                        <td>{h.processStep}</td>
                        <td>{h.hazardType}</td>
                        <td className={riskColor(h.riskLevel)}><strong>{h.riskLevel}</strong><div className="table-subtext">L{h.likelihood} × S{h.severity}</div></td>
                        <td>{h.isCCP ? <span className="badge badge-warning">CCP</span> : <span className="muted">—</span>}</td>
                        <td>{h.controlMeasure ? <span title={h.controlMeasure}>{h.controlMeasure.length > 60 ? h.controlMeasure.slice(0, 60) + '…' : h.controlMeasure}</span> : <span className="muted">Not set</span>}</td>
                        <td>{h.responsiblePerson || '—'}</td>
                        <td className={r === 'overdue' || r === 'never' ? 'cell-alert' : undefined}>{h.lastReviewedDate ? formatDate(h.lastReviewedDate) : 'Never'}<div className="table-subtext">{r === 'overdue' ? 'Overdue' : r === 'due-soon' ? 'Due 30d' : r === 'never' ? 'Set date' : `${h.reviewIntervalMonths}m cycle`}</div></td>
                        <td><button className="table-button" onClick={() => handleStartEdit(h)}>Edit</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
