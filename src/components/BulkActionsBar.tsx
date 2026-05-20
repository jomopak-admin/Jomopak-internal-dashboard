import { ReactNode } from 'react';

/**
 * BulkActionsBar — sticky bar that appears at the bottom of the viewport when
 * at least one row is selected. The parent decides which actions appear; this
 * component just lays them out and offers a Cancel button.
 *
 * Why bottom-sticky and not inline? Two reasons:
 *  1. The bar should remain visible no matter how far the user has scrolled
 *     down a long table — they often select a row near the top, scroll to
 *     verify, and want to act without scrolling back.
 *  2. Inline above the table eats vertical space the user doesn't want when
 *     no selection is active.
 */
interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  /** Action buttons rendered on the right side of the bar. */
  children: ReactNode;
  /** Optional copy override. Default reads "X selected". */
  label?: string;
}

export function BulkActionsBar({ selectedCount, onClear, children, label }: BulkActionsBarProps) {
  if (selectedCount <= 0) return null;
  return (
    <div className="bulk-actions-bar" role="region" aria-label="Bulk actions">
      <div className="bulk-actions-count">
        <strong>{selectedCount}</strong> {label ?? `selected`}
      </div>
      <div className="bulk-actions-buttons">{children}</div>
      <button type="button" className="bulk-actions-cancel" onClick={onClear} aria-label="Clear selection">
        Cancel
      </button>
    </div>
  );
}
