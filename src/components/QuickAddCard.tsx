import { ReactNode } from 'react';

/**
 * QuickAddCard
 *
 * A deliberately minimal create form. The goal is to lower the entry bar:
 * three-to-five fields, save, done. Anything else can be filled in later
 * from edit view.
 *
 * Pair with a "Switch to full form" link via the `onSwitchToFullForm` prop —
 * power users still get the wizard with one click.
 */
interface QuickAddCardProps {
  title: string;
  subtitle?: string;
  message?: string;
  /** Human-readable list of fields still missing. Save is gated on this being empty. */
  missingRequired?: string[];
  /** Form fields, typically a small <div className="form-grid"> with 3-5 inputs. */
  body: ReactNode;
  /** Optional preview / hint shown beneath the body (e.g. "Auto-filled from last job"). */
  hint?: ReactNode;
  onSave: () => void;
  onCancel: () => void;
  onSwitchToFullForm?: () => void;
  saveLabel?: string;
}

export function QuickAddCard({
  title,
  subtitle,
  message,
  missingRequired = [],
  body,
  hint,
  onSave,
  onCancel,
  onSwitchToFullForm,
  saveLabel = 'Save',
}: QuickAddCardProps) {
  const blocked = missingRequired.length > 0;
  return (
    <section className="card form-card quick-add-card">
      <header className="quick-add-header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
        <span className="quick-add-tag">Quick add</span>
      </header>

      {message ? <div className="message-strip">{message}</div> : null}

      <div className="quick-add-body">{body}</div>

      {hint ? <div className="quick-add-hint">{hint}</div> : null}

      <footer className="quick-add-actions">
        <div className="quick-add-actions-primary">
          <button type="button" className="primary-button" onClick={onSave} disabled={blocked}>
            {saveLabel}
          </button>
          <button type="button" className="ghost-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
        <div className="quick-add-actions-secondary">
          {blocked ? (
            <span className="form-wizard-hint">
              {missingRequired.length} required {missingRequired.length === 1 ? 'field' : 'fields'} still empty
            </span>
          ) : null}
          {onSwitchToFullForm ? (
            <button type="button" className="link-button" onClick={onSwitchToFullForm}>
              Need more fields? Switch to full form →
            </button>
          ) : null}
        </div>
      </footer>
    </section>
  );
}
