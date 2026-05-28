import { ReactNode } from 'react';

interface SectionTitleProps {
  title?: string;
  subtitle?: string;
  /** Right-side primary action (e.g. "+ New", "Print"). */
  action?: ReactNode;
  /** Left-side back / navigate-up action. Always rendered before the title. */
  backAction?: ReactNode;
}

// Title and subtitle are both optional. backAction always renders on the LEFT,
// action always renders on the RIGHT. When everything is absent the component
// renders nothing.
export function SectionTitle({ title, subtitle, action, backAction }: SectionTitleProps) {
  if (!title && !subtitle && !action && !backAction) return null;
  return (
    <div className="section-title">
      {backAction ? <div className="section-title-back">{backAction}</div> : null}
      <div className="section-title-text">
        {title ? <h2>{title}</h2> : null}
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="section-title-action">{action}</div> : null}
    </div>
  );
}
