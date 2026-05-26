/**
 * Contamination Control — phase 38b
 *
 * Tabbed wrapper that surfaces two SEPARATE compliance registers under one
 * menu entry: the Foreign-Object register (physical contamination, glass /
 * plastic / metal incidents) and the Pest Control register (bait stations,
 * sightings, contractor visits). They remain two distinct registers — auditors
 * still see independent PRPs — but they share one nav item so the sidebar
 * isn't cluttered.
 *
 * The tabs are gated by the underlying permissions: a user only sees a tab
 * for a register they have access to.
 */

import { ReactNode, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';

interface ContaminationControlPageProps {
  canForeign: boolean;
  canPest: boolean;
  foreignContent: ReactNode;
  pestContent: ReactNode;
}

export function ContaminationControlPage({ canForeign, canPest, foreignContent, pestContent }: ContaminationControlPageProps) {
  const initial: 'foreign' | 'pest' = canForeign ? 'foreign' : 'pest';
  const [tab, setTab] = useState<'foreign' | 'pest'>(initial);

  return (
    <div className="page-stack">
      <SectionTitle
        title="Contamination Control"
        subtitle="Two separate registers — physical contamination (foreign objects, glass / plastic breakage) and pest monitoring — in one place. Each tab is its own audit-grade register."
      />
      <section className="card">
        <div className="settings-tabs" role="tablist" aria-label="Contamination registers">
          {canForeign ? (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'foreign'}
              className={tab === 'foreign' ? 'settings-tab is-active' : 'settings-tab'}
              onClick={() => setTab('foreign')}
            >
              Foreign-object register
            </button>
          ) : null}
          {canPest ? (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pest'}
              className={tab === 'pest' ? 'settings-tab is-active' : 'settings-tab'}
              onClick={() => setTab('pest')}
            >
              Pest control
            </button>
          ) : null}
        </div>
      </section>
      {tab === 'foreign' ? foreignContent : pestContent}
    </div>
  );
}
