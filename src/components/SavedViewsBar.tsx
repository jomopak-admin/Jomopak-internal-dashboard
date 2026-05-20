import { SavedView } from '../hooks/useSavedViews';

/**
 * SavedViewsBar — pill row that sits above a list page's filter bar. Click a
 * pill to apply that view's filters. The "+ Save current" button captures the
 * current filters with a prompted name. Built-in views can't be deleted.
 *
 * The component is dumb — it doesn't own any state. Parent owns the filters
 * object and decides how to apply a view (so the parent can also do things
 * like reset selection, scroll to top, etc).
 */
interface SavedViewsBarProps<T> {
  views: SavedView<T>[];
  /** What the parent uses to detect "this view is currently active". */
  isActive: (view: SavedView<T>) => boolean;
  onApply: (view: SavedView<T>) => void;
  onSaveCurrent: (name: string) => void;
  onDelete: (id: string) => void;
}

export function SavedViewsBar<T>({
  views,
  isActive,
  onApply,
  onSaveCurrent,
  onDelete,
}: SavedViewsBarProps<T>) {
  function handleSave() {
    const name = window.prompt('Name this view (e.g. "Overdue", "My jobs")');
    if (!name || !name.trim()) return;
    onSaveCurrent(name.trim());
  }

  return (
    <div className="saved-views-bar" role="toolbar" aria-label="Saved views">
      {views.map((view) => (
        <span key={view.id} className={isActive(view) ? 'saved-view-pill active' : 'saved-view-pill'}>
          <button type="button" className="saved-view-apply" onClick={() => onApply(view)}>
            {view.name}
          </button>
          {!view.builtIn ? (
            <button
              type="button"
              className="saved-view-delete"
              aria-label={`Delete ${view.name}`}
              onClick={() => {
                if (window.confirm(`Delete saved view "${view.name}"?`)) {
                  onDelete(view.id);
                }
              }}
            >
              ×
            </button>
          ) : null}
        </span>
      ))}
      <button type="button" className="saved-view-add" onClick={handleSave} title="Save the current filters as a view">
        + Save current
      </button>
    </div>
  );
}
