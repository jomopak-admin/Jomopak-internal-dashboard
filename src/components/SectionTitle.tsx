import { ReactNode } from 'react';

interface SectionTitleProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

// Title and subtitle are now both optional. Per-page "hero" SectionTitles can
// drop them entirely since the topbar already shows the page heading + per-page
// summary chips. When all three props are absent the component renders nothing.
export function SectionTitle({ title, subtitle, action }: SectionTitleProps) {
  if (!title && !subtitle && !action) return null;
  return (
    <div className="section-title">
      <div>
        {title ? <h2>{title}</h2> : null}
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
