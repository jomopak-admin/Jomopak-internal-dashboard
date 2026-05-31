import { ReactNode, useEffect, useRef, useState } from 'react';
import { toast } from './Toast';

/**
 * Phase 104 — Heuristic classifier for save messages into a toast tone.
 *
 * Every form in the app already sets a `message` like 'Saved.', 'Updated.',
 * 'Failed to save xyz', etc. Instead of rewiring every save handler to fire
 * a toast explicitly, the FormWizard watches its `message` prop and pops a
 * toast whenever it changes. We classify by keyword so success/error/warn
 * each get the right styling.
 */
function classifyMessage(text: string): 'success' | 'error' | 'warning' | null {
  const lower = text.trim().toLowerCase();
  if (!lower) return null;
  if (/fail|error|invalid|missing|required|cannot|denied|forbid/.test(lower)) return 'error';
  if (/warn|caution|already/.test(lower)) return 'warning';
  if (/save|updat|delet|created|added|logged|recorded|approve|reject|submit|sent|posted|publish|reset|clos/.test(lower)) return 'success';
  // Default to a neutral info-style success on anything else, so the user
  // always gets feedback when the form sets a message.
  return 'success';
}

/**
 * A single section of a FormWizard.
 *
 * - `contextActive: false` greys the section out and replaces its body with
 *   `contextPrompt` (typically a checkbox/explanation that, once toggled,
 *   flips contextActive to true). Required fields inside a context-inactive
 *   section are NOT counted as missing — that's the whole point: the section
 *   only matters once the user opts in.
 *
 * - `missingRequired` is a flat list of human-readable field labels that are
 *   required but currently empty. The wizard shows the count, gates Save on
 *   the total across all active sections, and lets users jump to the section
 *   that's holding them up.
 */
export interface FormWizardSection {
  key: string;
  title: string;
  subtitle?: string;
  contextActive?: boolean;
  contextPrompt?: ReactNode;
  missingRequired?: string[];
  body: ReactNode;
}

interface FormWizardProps {
  title: string;
  subtitle?: string;
  message?: string;
  sections: FormWizardSection[];
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  isEditing?: boolean;
  /** Allow Save even when required fields are empty (used for drafts). */
  allowIncompleteSave?: boolean;
  /** Optional extra action rendered in the footer (e.g. Delete). */
  footerExtra?: ReactNode;
}

type SectionState = 'active' | 'complete' | 'incomplete' | 'available' | 'disabled';

export function FormWizard({
  title,
  subtitle,
  message,
  sections,
  onSave,
  onCancel,
  saveLabel = 'Save',
  isEditing = false,
  allowIncompleteSave = false,
  footerExtra,
}: FormWizardProps) {
  const [activeKey, setActiveKey] = useState<string>(() => sections[0]?.key ?? '');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Keep activeKey valid if sections change.
  useEffect(() => {
    if (!sections.some((section) => section.key === activeKey)) {
      setActiveKey(sections[0]?.key ?? '');
    }
  }, [sections, activeKey]);

  /* ─── Phase 104 — pop a global toast whenever the message changes ─────
   * Every form in the app already sets a save-confirmation message; this
   * surfaces it as a top-right toast in addition to the inline strip so
   * the user always gets clear, visible feedback without having to look
   * for it on the page. We track the last-fired message in a ref so the
   * same message doesn't double-fire on re-render. */
  const lastMessageRef = useRef<string>('');
  useEffect(() => {
    const text = (message ?? '').trim();
    if (!text || text === lastMessageRef.current) return;
    lastMessageRef.current = text;
    const tone = classifyMessage(text);
    if (tone === 'error') toast.error(text);
    else if (tone === 'warning') toast.warning(text);
    else if (tone === 'success') toast.success(text);
  }, [message]);

  const activeSections = sections.filter((section) => section.contextActive !== false);
  const completeCount = activeSections.filter(
    (section) => (section.missingRequired?.length ?? 0) === 0,
  ).length;
  const totalRequired = activeSections.reduce(
    (acc, section) => acc + (section.missingRequired?.length ?? 0),
    0,
  );

  function getSectionState(section: FormWizardSection): SectionState {
    if (section.contextActive === false) return 'disabled';
    const incomplete = (section.missingRequired?.length ?? 0) > 0;
    if (section.key === activeKey) return 'active';
    if (incomplete) return 'incomplete';
    return 'complete';
  }

  function handleStepClick(section: FormWizardSection) {
    if (section.contextActive === false) return;
    setActiveKey(section.key);
    const node = sectionRefs.current[section.key];
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <section className="card form-card form-wizard">
      <header className="form-wizard-header">
        <div className="form-wizard-title-block">
          <h3>{title}</h3>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
        <div className="form-wizard-progress" aria-label="Form progress">
          <strong>{completeCount}</strong>
          <span className="muted">/ {activeSections.length} sections complete</span>
        </div>
      </header>

      {message ? <div className="message-strip">{message}</div> : null}

      <nav className="form-stepper" aria-label="Form sections">
        {sections.map((section, index) => {
          const state = getSectionState(section);
          return (
            <button
              key={section.key}
              type="button"
              className={`form-step is-${state}`}
              onClick={() => handleStepClick(section)}
              disabled={state === 'disabled'}
              aria-current={state === 'active' ? 'step' : undefined}
            >
              <span className="form-step-num" aria-hidden="true">
                {state === 'complete' ? '✓' : index + 1}
              </span>
              <span className="form-step-label">{section.title}</span>
            </button>
          );
        })}
      </nav>

      <div className="form-wizard-body">
        {sections.map((section, index) => {
          const state = getSectionState(section);
          const isDisabled = state === 'disabled';
          return (
            <section
              key={section.key}
              ref={(node) => {
                sectionRefs.current[section.key] = node;
              }}
              className={`form-section is-${state}`}
              onFocusCapture={() => {
                if (!isDisabled && activeKey !== section.key) setActiveKey(section.key);
              }}
              aria-labelledby={`form-section-${section.key}-title`}
            >
              <header className="form-section-header">
                <span className="form-section-num" aria-hidden="true">
                  {state === 'complete' ? '✓' : index + 1}
                </span>
                <div className="form-section-title-block">
                  <h4 className="form-section-title" id={`form-section-${section.key}-title`}>
                    {section.title}
                  </h4>
                  {section.subtitle ? (
                    <p className="form-section-subtitle">{section.subtitle}</p>
                  ) : null}
                </div>
                {!isDisabled && (section.missingRequired?.length ?? 0) > 0 ? (
                  <span className="form-section-tag is-incomplete">
                    {section.missingRequired!.length} required
                  </span>
                ) : null}
                {!isDisabled && (section.missingRequired?.length ?? 0) === 0 ? (
                  <span className="form-section-tag is-complete">Done</span>
                ) : null}
                {isDisabled ? (
                  <span className="form-section-tag is-disabled">Optional</span>
                ) : null}
              </header>

              {isDisabled ? (
                <div className="form-section-gate">
                  {section.contextPrompt ?? (
                    <p className="muted">Enable this section to fill in details.</p>
                  )}
                </div>
              ) : (
                <div className="form-section-body">{section.body}</div>
              )}
            </section>
          );
        })}
      </div>

      <footer className="form-wizard-actions">
        <div className="form-wizard-actions-primary">
          <button
            type="button"
            className="primary-button"
            onClick={onSave}
            disabled={!allowIncompleteSave && totalRequired > 0}
          >
            {isEditing ? `Save Changes` : saveLabel}
          </button>
          <button type="button" className="ghost-button" onClick={onCancel}>
            Cancel
          </button>
          {footerExtra}
        </div>
        {totalRequired > 0 ? (
          <span className="form-wizard-hint">
            {totalRequired} required {totalRequired === 1 ? 'field' : 'fields'} still empty
          </span>
        ) : null}
      </footer>
    </section>
  );
}

/** Visual marker used inside section bodies to flag a required field. */
export function RequiredMarker() {
  return (
    <span className="required-marker" aria-label="required" title="Required">
      *
    </span>
  );
}
