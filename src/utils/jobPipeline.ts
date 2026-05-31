/**
 * Phase 94 — Job Pipeline helpers.
 *
 * Default stage definitions + pure helpers for computing the current stage,
 * blockers, and overall progress. Used by the JobPipelineTracker component
 * on the job edit form and the Live Pipeline widget on the Client profile.
 *
 * All functions are pure / O(n) over a single job's stages. No I/O.
 */

import { JobCard, PipelineItem, PipelineStage, PipelineStageKey } from '../types';

/**
 * Build a fresh pipeline for a new job. The stages mirror the JomoPak
 * production flow Aman described: artwork → plates → ink → paper →
 * production → finishing → packing → dispatch. Edit this list to change
 * the default checklist for all NEW jobs (existing jobs keep their own).
 */
export function createDefaultJobPipeline(): PipelineStage[] {
  return [
    {
      key: 'artwork',
      label: 'Artwork',
      items: [
        { key: 'brief_received', label: 'Brief received', status: 'pending' },
        { key: 'design_started', label: 'Design started', status: 'pending' },
        { key: 'proof_sent', label: 'Proof sent to client', status: 'pending' },
        { key: 'proof_approved', label: 'Proof approved', status: 'pending' },
      ],
    },
    {
      key: 'plates',
      label: 'Plates',
      items: [
        { key: 'plates_ordered', label: 'Plates ordered', status: 'pending' },
        { key: 'plates_received', label: 'Plates received', status: 'pending' },
      ],
    },
    {
      key: 'ink',
      label: 'Ink',
      items: [
        { key: 'ink_ordered', label: 'Ink ordered', status: 'pending' },
        { key: 'ink_received', label: 'Ink received', status: 'pending' },
      ],
    },
    {
      key: 'paper',
      label: 'Paper / materials',
      items: [
        { key: 'paper_allocated', label: 'Paper allocated', status: 'pending' },
        { key: 'paper_received', label: 'Paper received / on hand', status: 'pending' },
      ],
    },
    {
      key: 'production',
      label: 'Production',
      items: [
        { key: 'scheduled', label: 'Scheduled on press', status: 'pending' },
        { key: 'on_press', label: 'On press', status: 'pending' },
        { key: 'off_press', label: 'Off press', status: 'pending' },
      ],
    },
    {
      key: 'finishing',
      label: 'Finishing',
      items: [
        { key: 'cut', label: 'Cut', status: 'pending' },
        { key: 'glued', label: 'Glued / pasted', status: 'pending' },
        { key: 'handled', label: 'Handles attached', status: 'pending' },
      ],
    },
    {
      key: 'packing',
      label: 'Packing',
      items: [
        { key: 'counted', label: 'Counted', status: 'pending' },
        { key: 'packed', label: 'Packed', status: 'pending' },
        { key: 'in_warehouse', label: 'In warehouse', status: 'pending' },
      ],
    },
    {
      key: 'dispatch',
      label: 'Dispatch',
      items: [
        { key: 'on_dn', label: 'On delivery note', status: 'pending' },
        { key: 'delivered', label: 'Delivered', status: 'pending' },
        { key: 'pod_received', label: 'POD received', status: 'pending' },
      ],
    },
  ];
}

/**
 * Merge a job's stored pipeline with the default. Keeps statuses for items
 * that exist in both; inserts any newly-added default items as 'pending'.
 * This is what lets you ship a new stage in code and have it appear on
 * existing jobs without losing their progress.
 */
export function ensurePipelineShape(stored: PipelineStage[] | undefined): PipelineStage[] {
  const defaults = createDefaultJobPipeline();
  if (!stored || !stored.length) return defaults;
  const byKey = new Map<PipelineStageKey, PipelineStage>();
  stored.forEach((s) => byKey.set(s.key, s));
  return defaults.map((defStage) => {
    const existing = byKey.get(defStage.key);
    if (!existing) return defStage;
    const existingItems = new Map(existing.items.map((i) => [i.key, i]));
    return {
      ...defStage,
      items: defStage.items.map((defItem) => existingItems.get(defItem.key) ?? defItem),
    };
  });
}

export interface PipelineSummary {
  totalItems: number;
  doneItems: number;
  blockedItems: number;
  percent: number;
  /** First non-done stage; null when everything is done. */
  currentStage: PipelineStage | null;
  /** All items currently in `blocked` status, flattened. */
  blockers: Array<{ stage: PipelineStage; item: PipelineItem }>;
}

/**
 * Compute a one-pass summary for a job's pipeline. Used by the live widget
 * on Client profile + the topbar chips + the notifications rule.
 */
export function summarisePipeline(stages: PipelineStage[] | undefined): PipelineSummary {
  const safe = ensurePipelineShape(stages);
  let totalItems = 0;
  let doneItems = 0;
  let blockedItems = 0;
  let currentStage: PipelineStage | null = null;
  const blockers: PipelineSummary['blockers'] = [];
  for (const stage of safe) {
    for (const item of stage.items) {
      totalItems++;
      if (item.status === 'done') doneItems++;
      if (item.status === 'blocked') {
        blockedItems++;
        blockers.push({ stage, item });
      }
    }
    if (!currentStage && stage.items.some((i) => i.status !== 'done')) {
      currentStage = stage;
    }
  }
  const percent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  return { totalItems, doneItems, blockedItems, percent, currentStage, blockers };
}

/**
 * Quick "where is this job?" label for tooltips / table cells. Returns the
 * current stage label and any blocker reason in a single line, e.g.
 *   "Plates · BLOCKED: Sun Chemicals out until Tue"
 *   "Production · 2/3"
 *   "Done · 24/24"
 */
export function describePipelinePosition(summary: PipelineSummary): string {
  if (!summary.currentStage) return `Done · ${summary.doneItems}/${summary.totalItems}`;
  const stage = summary.currentStage;
  const itemsInStage = stage.items;
  const doneInStage = itemsInStage.filter((i) => i.status === 'done').length;
  const blockerInStage = itemsInStage.find((i) => i.status === 'blocked');
  if (blockerInStage) {
    const note = blockerInStage.blockerNote?.trim();
    return `${stage.label} · BLOCKED${note ? `: ${note}` : ''}`;
  }
  return `${stage.label} · ${doneInStage}/${itemsInStage.length}`;
}

/**
 * Filter helper for the Client profile widget — returns the user's open
 * jobs (anything whose pipeline isn't 100% done) sorted by client name.
 */
export function getOpenJobsForClient(jobs: JobCard[], clientId: string): JobCard[] {
  return jobs
    .filter((j) => j.clientId === clientId)
    .filter((j) => {
      const summary = summarisePipeline(j.pipelineStages);
      return summary.currentStage !== null;
    });
}

/** How many days a blocker has been outstanding. Used by the bell rule. */
export function daysBlocked(item: PipelineItem, today: Date = new Date()): number | null {
  if (item.status !== 'blocked' || !item.blockedAt) return null;
  const blockedDate = new Date(item.blockedAt);
  if (Number.isNaN(blockedDate.getTime())) return null;
  const ms = today.getTime() - blockedDate.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
