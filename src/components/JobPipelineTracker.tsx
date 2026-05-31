/**
 * Phase 94 — JobPipelineTracker.
 *
 * A tick-box checklist mounted on the Job edit form. One row per item
 * within each stage, with three statuses (pending / blocked / done) and
 * a free-text blocker note when something's stuck.
 *
 * Self-contained: takes `stages` + `onChange`. The parent owns the JobCard
 * and persists. We never mutate in place — every action returns a new
 * stages array via onChange.
 *
 * Stamps `doneByName` + `doneAt` (and `blockedAt`) automatically so audit
 * trail just works.
 */

import { useMemo } from 'react';
import { PipelineItem, PipelineItemStatus, PipelineStage } from '../types';
import {
  describePipelinePosition,
  ensurePipelineShape,
  summarisePipeline,
} from '../utils/jobPipeline';

interface JobPipelineTrackerProps {
  stages: PipelineStage[] | undefined;
  onChange: (next: PipelineStage[]) => void;
  /** Logged-in user's name — stamped on items as they tick done/blocked. */
  actingUserName?: string;
  /** Render in read-only mode (used on the Client profile widget). */
  readOnly?: boolean;
}

export function JobPipelineTracker({
  stages,
  onChange,
  actingUserName = '',
  readOnly = false,
}: JobPipelineTrackerProps) {
  const shaped = useMemo(() => ensurePipelineShape(stages), [stages]);
  const summary = useMemo(() => summarisePipeline(shaped), [shaped]);

  function patchItem(stageKey: string, itemKey: string, patch: Partial<PipelineItem>) {
    const next = shaped.map((stage) => {
      if (stage.key !== stageKey) return stage;
      return {
        ...stage,
        items: stage.items.map((item) => (item.key === itemKey ? { ...item, ...patch } : item)),
      };
    });
    onChange(next);
  }

  function cycleStatus(stageKey: string, item: PipelineItem) {
    if (readOnly) return;
    const now = new Date().toISOString();
    // pending → done → blocked → pending
    if (item.status === 'pending') {
      patchItem(stageKey, item.key, {
        status: 'done',
        doneAt: now,
        doneByName: actingUserName,
        blockedAt: undefined,
      });
    } else if (item.status === 'done') {
      patchItem(stageKey, item.key, {
        status: 'blocked',
        blockedAt: now,
        doneAt: undefined,
        doneByName: undefined,
      });
    } else {
      patchItem(stageKey, item.key, {
        status: 'pending',
        blockedAt: undefined,
        blockerNote: undefined,
      });
    }
  }

  function setBlockerNote(stageKey: string, itemKey: string, note: string) {
    patchItem(stageKey, itemKey, { blockerNote: note });
  }

  return (
    <div className="job-pipeline">
      <div className="job-pipeline-header">
        <div>
          <strong>Production pipeline</strong>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {describePipelinePosition(summary)}
            {summary.blockers.length > 0 ? (
              <> · <span style={{ color: '#b22b2b' }}>{summary.blockers.length} blocker{summary.blockers.length === 1 ? '' : 's'}</span></>
            ) : null}
          </div>
        </div>
        <div className="job-pipeline-progress" aria-label={`${summary.percent}% complete`}>
          <div className="job-pipeline-progress-bar" style={{ width: `${summary.percent}%` }} />
          <span>{summary.percent}%</span>
        </div>
      </div>

      <div className="job-pipeline-stages">
        {shaped.map((stage) => {
          const stageSummary = stageRollup(stage);
          return (
            <div
              key={stage.key}
              className={`job-pipeline-stage job-pipeline-stage--${stageSummary.tone}`}
            >
              <div className="job-pipeline-stage-head">
                <strong>{stage.label}</strong>
                <span className="muted" style={{ fontSize: 12 }}>
                  {stageSummary.done}/{stage.items.length}
                  {stageSummary.blocked > 0 ? ' · blocked' : ''}
                </span>
              </div>
              <ul className="job-pipeline-items">
                {stage.items.map((item) => (
                  <li key={item.key} className={`job-pipeline-item job-pipeline-item--${item.status}`}>
                    <button
                      type="button"
                      className="job-pipeline-tick"
                      disabled={readOnly}
                      onClick={() => cycleStatus(stage.key, item)}
                      aria-label={`Toggle ${item.label}`}
                      title="Tap to cycle: pending → done → blocked"
                    >
                      {item.status === 'done' ? '✓' : item.status === 'blocked' ? '!' : ''}
                    </button>
                    <div className="job-pipeline-item-body">
                      <div className="job-pipeline-item-label">{item.label}</div>
                      {item.status === 'done' ? (
                        <div className="muted" style={{ fontSize: 11 }}>
                          Done{item.doneByName ? ` by ${item.doneByName}` : ''}
                          {item.doneAt ? ` · ${formatStamp(item.doneAt)}` : ''}
                        </div>
                      ) : null}
                      {item.status === 'blocked' ? (
                        readOnly ? (
                          <div style={{ fontSize: 12, color: '#b22b2b' }}>
                            BLOCKED{item.blockerNote ? `: ${item.blockerNote}` : ''}
                          </div>
                        ) : (
                          <input
                            className="job-pipeline-blocker-input"
                            placeholder="What's blocking this? (e.g. Sun Chemicals out until Tue)"
                            value={item.blockerNote ?? ''}
                            onChange={(e) => setBlockerNote(stage.key, item.key, e.target.value)}
                          />
                        )
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {!readOnly ? (
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Tap any tick: <strong>○</strong> pending → <strong>✓</strong> done → <strong>!</strong> blocked → back to pending. Blocker
          notes age automatically — a blocker stuck &gt; 5 days raises a notification.
        </p>
      ) : null}
    </div>
  );
}

function stageRollup(stage: PipelineStage) {
  let done = 0;
  let blocked = 0;
  for (const item of stage.items) {
    if (item.status === 'done') done++;
    if (item.status === 'blocked') blocked++;
  }
  const allDone = done === stage.items.length;
  const tone: 'done' | 'blocked' | 'in-progress' | 'pending' = blocked > 0
    ? 'blocked'
    : allDone
      ? 'done'
      : done > 0
        ? 'in-progress'
        : 'pending';
  return { done, blocked, tone };
}

function formatStamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString();
  } catch {
    return iso;
  }
}

/* ------------------------------ Status pill ------------------------------- */
/**
 * Read-only stage pill for use in lists / tables. Compact way to show
 * "Production · 2/3" or "Plates · BLOCKED" on every job row.
 */
export function PipelineStagePill({ stages }: { stages: PipelineStage[] | undefined }) {
  const summary = summarisePipeline(stages);
  const tone: PipelineItemStatus | 'done-all' = summary.blockedItems > 0
    ? 'blocked'
    : !summary.currentStage
      ? 'done-all'
      : 'pending';
  const label = describePipelinePosition(summary);
  const colour = tone === 'blocked' ? '#b22b2b' : tone === 'done-all' ? '#2e6f3e' : 'var(--jp-ink, #444)';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 999,
      fontSize: 11,
      background: 'var(--jp-paper-2, #faf8f4)',
      border: '1px solid var(--jp-border, #e5e2dc)',
      color: colour,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
