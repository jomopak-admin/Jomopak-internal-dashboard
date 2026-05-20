/**
 * Food Safety Control Centre.
 *
 * Single-screen status of everything food-safety related. Read-only tiles
 * pull live signals from:
 *  - Approved Food-Safe Material Register (expired docs, blocked materials)
 *  - Cleaning Logs (overdue machines, recent fails)
 *  - Job Cards (food-packaging jobs awaiting QC, jobs on hold)
 *  - Finished Goods Stock (batches on hold, awaiting QC, recalled)
 *  - Customer Complaints (open, critical, recalls triggered)
 *  - HACCP Hazard Register (overdue reviews, critical hazards)
 *
 * Every tile is clickable — drills into the relevant module so management
 * can act on it. No edits happen here; this is a cockpit, not a workshop.
 */

import { useMemo } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import {
  AppData,
  FoodContactLevel,
  getLatestPassingClean,
  isFoodPackagingLevel,
  isQcStagePassed,
  Machine,
  View,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface FoodSafetyControlCentrePageProps {
  data: AppData;
  /** Navigate to another view when a tile is clicked. */
  onNavigate: (view: View) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

interface Tile {
  label: string;
  value: number | string;
  detail?: string;
  alert?: boolean;
  view?: View;
}

export function FoodSafetyControlCentrePage({ data, onNavigate }: FoodSafetyControlCentrePageProps) {
  // ----- Approved material register signals -----
  const materialStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const total = data.foodSafeMaterials.length;
    const approved = data.foodSafeMaterials.filter((m) => m.status === 'Approved').length;
    const blocked = data.foodSafeMaterials.filter((m) =>
      m.status === 'Blocked' || m.status === 'Suspended' || m.status === 'Expired',
    ).length;
    const reviewOverdue = data.foodSafeMaterials.filter((m) =>
      !m.reviewDate || m.reviewDate < today,
    ).length;
    const declarationMissing = data.foodSafeMaterials.filter((m) =>
      !m.foodSafeDeclarationUrl || !m.msdsUrl,
    ).length;
    return { total, approved, blocked, reviewOverdue, declarationMissing };
  }, [data.foodSafeMaterials]);

  // ----- Cleaning signals -----
  const cleaningStats = useMemo(() => {
    const total = data.cleaningLogs.length;
    const fails = data.cleaningLogs.filter((l) => l.result === 'Fail').length;
    const last24h = data.cleaningLogs.filter((l) =>
      Date.now() - new Date(l.performedAt).getTime() < DAY_MS,
    );
    const machinesCleanedToday = new Set(
      last24h.filter((l) => l.machineId && l.result !== 'Fail').map((l) => l.machineId),
    );
    // Machines that are referenced by ANY active job but haven't been cleaned in 24h.
    const activeMachineIds = new Set<string>();
    for (const job of data.jobs) {
      if (job.assignedMachineId && job.status !== 'Completed') {
        activeMachineIds.add(job.assignedMachineId);
      }
    }
    const machinesOverdue: Machine[] = [];
    for (const id of activeMachineIds) {
      if (!machinesCleanedToday.has(id)) {
        const m = data.machines.find((x) => x.id === id);
        if (m) machinesOverdue.push(m);
      }
    }
    return { total, fails, last24h: last24h.length, machinesOverdue: machinesOverdue.length, machinesOverdueList: machinesOverdue };
  }, [data.cleaningLogs, data.jobs, data.machines]);

  // ----- Jobs signals -----
  const jobStats = useMemo(() => {
    const foodJobs = data.jobs.filter((j) =>
      isFoodPackagingLevel((j.foodContactLevel ?? 'NonFood') as FoodContactLevel),
    );
    const awaitingQc = foodJobs.filter((j) => {
      const firstOff = (j.qcPlan ?? []).find((s) => s.stage === 'FirstOff');
      const final = (j.qcPlan ?? []).find((s) => s.stage === 'FinalInspection');
      return j.status !== 'Completed'
        && (!firstOff || !isQcStagePassed(firstOff) || !final || !isQcStagePassed(final));
    }).length;
    const jobsBlockedOnCleaning = foodJobs.filter((j) =>
      j.commercialReleaseStatus !== 'Cleared for Production'
      && j.assignedMachineId
      && !getLatestPassingClean(j.assignedMachineId, data.cleaningLogs),
    ).length;
    return { foodJobs: foodJobs.length, awaitingQc, jobsBlockedOnCleaning };
  }, [data.jobs, data.cleaningLogs]);

  // ----- Finished-goods hold/release signals -----
  const fgStats = useMemo(() => {
    const onHold = data.finishedGoodsStock.filter((s) => s.foodSafetyHoldStatus === 'On Hold').length;
    const awaitingQc = data.finishedGoodsStock.filter((s) => s.foodSafetyHoldStatus === 'Awaiting QC').length;
    const rejected = data.finishedGoodsStock.filter((s) => s.foodSafetyHoldStatus === 'Rejected').length;
    const recalled = data.finishedGoodsStock.filter((s) => s.foodSafetyHoldStatus === 'Recalled').length;
    return { onHold, awaitingQc, rejected, recalled };
  }, [data.finishedGoodsStock]);

  // ----- Complaint signals -----
  const complaintStats = useMemo(() => {
    const open = data.customerComplaints.filter((c) => c.status !== 'Closed' && c.status !== 'Resolved').length;
    const critical = data.customerComplaints.filter((c) => c.severity === 'Critical').length;
    const recalls = data.customerComplaints.filter((c) => c.recallTriggered).length;
    return { open, critical, recalls };
  }, [data.customerComplaints]);

  // ----- HACCP signals -----
  const haccpStats = useMemo(() => {
    const total = data.haccpHazards.length;
    const ccps = data.haccpHazards.filter((h) => h.isCCP).length;
    const criticalRisks = data.haccpHazards.filter((h) => h.riskLevel === 'Critical' || h.riskLevel === 'High').length;
    const reviewOverdue = data.haccpHazards.filter((h) => {
      if (!h.lastReviewedDate || !h.reviewIntervalMonths) return true;
      const last = new Date(h.lastReviewedDate).getTime();
      if (Number.isNaN(last)) return true;
      const dueAt = last + h.reviewIntervalMonths * 30 * DAY_MS;
      return Date.now() > dueAt;
    }).length;
    return { total, ccps, criticalRisks, reviewOverdue };
  }, [data.haccpHazards]);

  // ----- Chemical register signals -----
  const chemStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const active = data.chemicalRegisterEntries.filter((c) => !c.archived).length;
    const overdue = data.chemicalRegisterEntries.filter((c) => {
      if (c.archived) return false;
      if (!c.msdsLastReviewedDate) return true;
      const last = new Date(c.msdsLastReviewedDate).getTime();
      if (Number.isNaN(last)) return true;
      const dueAt = last + (c.msdsReviewIntervalMonths || 12) * 30 * DAY_MS;
      return Date.now() > dueAt;
    }).length;
    return { active, overdue };
  }, [data.chemicalRegisterEntries]);

  // Headline tiles — the urgent stuff.
  const headlineTiles: Tile[] = [
    { label: 'Open complaints', value: complaintStats.open, alert: complaintStats.open > 0, view: 'complaints' },
    { label: 'Active recalls', value: complaintStats.recalls, alert: complaintStats.recalls > 0, view: 'complaints' },
    { label: 'Critical complaints', value: complaintStats.critical, alert: complaintStats.critical > 0, view: 'complaints' },
    { label: 'FG batches on hold', value: fgStats.onHold, alert: fgStats.onHold > 0, view: 'finishedStock' },
    { label: 'FG awaiting QC', value: fgStats.awaitingQc, alert: fgStats.awaitingQc > 5, view: 'finishedStock' },
    { label: 'FG rejected', value: fgStats.rejected, alert: fgStats.rejected > 0, view: 'finishedStock' },
  ];

  // Compliance tiles — slower-moving but still need attention.
  const complianceTiles: Tile[] = [
    { label: 'Materials review overdue', value: materialStats.reviewOverdue, alert: materialStats.reviewOverdue > 0, view: 'foodSafeMaterials' },
    { label: 'Materials blocked / suspended', value: materialStats.blocked, alert: materialStats.blocked > 0, view: 'foodSafeMaterials' },
    { label: 'Materials missing docs', value: materialStats.declarationMissing, alert: materialStats.declarationMissing > 0, view: 'foodSafeMaterials' },
    { label: 'MSDS reviews overdue', value: chemStats.overdue, alert: chemStats.overdue > 0, view: 'chemicalRegister' },
    { label: 'HACCP reviews overdue', value: haccpStats.reviewOverdue, alert: haccpStats.reviewOverdue > 0, view: 'haccpRegister' },
    { label: 'HACCP Critical/High hazards', value: haccpStats.criticalRisks, alert: haccpStats.criticalRisks > 0, view: 'haccpRegister' },
  ];

  // Floor tiles — production-floor state.
  const floorTiles: Tile[] = [
    { label: 'Active machines without recent clean', value: cleaningStats.machinesOverdue, alert: cleaningStats.machinesOverdue > 0, view: 'cleaningLogs' },
    { label: 'Cleaning logs last 24h', value: cleaningStats.last24h, view: 'cleaningLogs' },
    { label: 'Cleaning Fail (all-time)', value: cleaningStats.fails, alert: cleaningStats.fails > 0, view: 'cleaningLogs' },
    { label: 'Food-packaging jobs awaiting QC', value: jobStats.awaitingQc, alert: jobStats.awaitingQc > 0, view: 'jobs' },
    { label: 'Jobs blocked on cleaning', value: jobStats.jobsBlockedOnCleaning, alert: jobStats.jobsBlockedOnCleaning > 0, view: 'jobs' },
    { label: 'Active food-packaging jobs', value: jobStats.foodJobs, view: 'jobs' },
  ];

  function renderTileRow(tiles: Tile[]) {
    return (
      <div className="food-safety-stats">
        {tiles.map((tile) => (
          <button
            key={tile.label}
            type="button"
            onClick={() => tile.view && onNavigate(tile.view)}
            className={`food-safety-stat${tile.alert ? ' food-safety-stat-alert' : ''}`}
            style={{
              textAlign: 'left',
              cursor: tile.view ? 'pointer' : 'default',
              font: 'inherit',
              color: 'inherit',
            }}
          >
            <span>{tile.label}</span>
            <strong>{tile.value}</strong>
            {tile.detail ? <div className="table-subtext" style={{ marginTop: 2 }}>{tile.detail}</div> : null}
          </button>
        ))}
      </div>
    );
  }

  // Active recall list — across complaints + finished goods.
  const activeRecalls = useMemo(() => {
    const list = [
      ...data.customerComplaints.filter((c) => c.recallTriggered).map((c) => ({
        type: 'Complaint' as const,
        id: c.id,
        ref: c.complaintNumber,
        client: c.clientName,
        date: c.complaintDate,
        scope: c.recallScope || c.description,
      })),
      ...data.finishedGoodsStock.filter((s) => s.foodSafetyHoldStatus === 'Recalled').map((s) => ({
        type: 'FG Batch' as const,
        id: s.id,
        ref: s.stockNumber,
        client: s.clientName || 'General stock',
        date: s.storedDate,
        scope: `Recalled batch · ${formatNumber(s.quantityOnHand)} ${s.quantityUnit} on hand · ${s.holdReason || ''}`,
      })),
    ];
    return list;
  }, [data.customerComplaints, data.finishedGoodsStock]);

  return (
    <>
      <SectionTitle />
      <section className="card">
        <SectionTitle
          title="Food Safety Control Centre"
          subtitle="Live operational status. Click any tile to drill in."
        />

        <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)', margin: '20px 0 8px' }}>
          Urgent — needs attention now
        </h3>
        {renderTileRow(headlineTiles)}

        <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)', margin: '24px 0 8px' }}>
          Production floor
        </h3>
        {renderTileRow(floorTiles)}

        <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)', margin: '24px 0 8px' }}>
          Compliance & review cycle
        </h3>
        {renderTileRow(complianceTiles)}

        {activeRecalls.length > 0 && (
          <>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b22b2b', margin: '24px 0 8px' }}>
              Active recalls
            </h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Source</th><th>Reference</th><th>Client</th><th>Date</th><th>Scope</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {activeRecalls.map((r) => (
                    <tr key={`${r.type}-${r.id}`}>
                      <td><strong>{r.type}</strong></td>
                      <td>{r.ref}</td>
                      <td>{r.client}</td>
                      <td>{formatDate(r.date)}</td>
                      <td>{r.scope}</td>
                      <td>
                        <button
                          className="table-button table-button-promote"
                          onClick={() => onNavigate(r.type === 'Complaint' ? 'complaints' : 'finishedStock')}
                        >
                          {r.type === 'Complaint' ? 'Open complaint' : 'Open stock'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {cleaningStats.machinesOverdueList.length > 0 && (
          <>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b22b2b', margin: '24px 0 8px' }}>
              Machines blocking food-packaging jobs
            </h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Machine</th><th>Type</th><th>Last clean</th><th>Action</th></tr></thead>
                <tbody>
                  {cleaningStats.machinesOverdueList.map((m) => {
                    const last = [...data.cleaningLogs]
                      .filter((l) => l.machineId === m.id)
                      .sort((a, b) => (b.performedAt || '').localeCompare(a.performedAt || ''))[0];
                    return (
                      <tr key={m.id}>
                        <td><strong>{m.name}</strong></td>
                        <td>{m.processType || m.department || '—'}</td>
                        <td className="cell-alert">{last ? `${formatDate(last.performedAt.slice(0, 10))} · ${last.result}` : 'Never'}</td>
                        <td><button className="table-button table-button-promote" onClick={() => onNavigate('cleaningLogs')}>Log clean</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
