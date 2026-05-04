import { useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * Combobox
 *
 * A searchable single-select input — type to filter, arrow keys to move,
 * Enter to choose, Escape to close. Replaces native `<select>` for any
 * list long enough that scrolling becomes annoying (clients, products,
 * job cards, supplied paper rates, etc.).
 *
 * Behaviour notes:
 * - Controlled by `value` (the selected option's `value`). The displayed
 *   text is derived from the matching option's `label`.
 * - When the user types, the input shows the search query. On blur or
 *   selection it snaps back to the selected label.
 * - Filtering is a simple case-insensitive substring match across label
 *   AND optional sublabel — so "ACME" matches "Job ACME-001" by sublabel.
 */
export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional second-line text shown beneath the label, also searchable. */
  sublabel?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  emptyMessage?: string;
  autoFocus?: boolean;
  /** Allow the user to clear the selection back to ''. Default: true. */
  clearable?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Search…',
  id,
  disabled = false,
  emptyMessage = 'No matches',
  autoFocus = false,
  clearable = true,
}: ComboboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  // `query` is what's in the input box. While the dropdown is closed we
  // mirror the selected label; while it's open we let the user type freely.
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? '');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Re-sync the input text whenever the external value changes (e.g. parent
  // resets the form) and we're not actively typing.
  useEffect(() => {
    if (!isOpen) {
      setQuery(selected?.label ?? '');
    }
  }, [selected, isOpen]);

  // Close when the user clicks outside the wrapper.
  useEffect(() => {
    if (!isOpen) return;
    function handlePointer(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(selected?.label ?? '');
      }
    }
    document.addEventListener('mousedown', handlePointer);
    return () => document.removeEventListener('mousedown', handlePointer);
  }, [isOpen, selected]);

  const filtered = useMemo(() => {
    // When the dropdown is open but the user hasn't typed (or typed the
    // exact label of the current selection), show everything — this is the
    // expected "click to browse" behaviour.
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed === selected?.label.toLowerCase()) {
      return options;
    }
    return options.filter((option) => {
      const haystack = `${option.label} ${option.sublabel ?? ''}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [options, query, selected]);

  // Keep the highlighted row in view when navigating with the keyboard.
  useEffect(() => {
    if (!isOpen) return;
    const list = listRef.current;
    if (!list) return;
    const item = list.children.item(highlightedIndex) as HTMLElement | null;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, isOpen]);

  function openAndReset() {
    if (disabled) return;
    setIsOpen(true);
    setHighlightedIndex(0);
  }

  function commit(option: ComboboxOption) {
    onChange(option.value);
    setQuery(option.label);
    setIsOpen(false);
  }

  function clearSelection() {
    onChange('');
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        openAndReset();
        return;
      }
      setHighlightedIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        openAndReset();
        return;
      }
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      if (isOpen && filtered[highlightedIndex]) {
        event.preventDefault();
        commit(filtered[highlightedIndex]);
      }
    } else if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
        setQuery(selected?.label ?? '');
      }
    } else if (event.key === 'Tab') {
      // Let Tab do its normal thing but close the dropdown so we don't
      // leave a floating menu when focus moves on.
      setIsOpen(false);
      setQuery(selected?.label ?? '');
    }
  }

  return (
    <div className="combobox" ref={wrapperRef}>
      <div className="combobox-input-wrap">
        <input
          id={inputId}
          ref={inputRef}
          className="combobox-input"
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${inputId}-listbox`}
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          onFocus={openAndReset}
          onClick={openAndReset}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />
        {clearable && selected && !disabled ? (
          <button
            type="button"
            className="combobox-clear"
            aria-label="Clear selection"
            onClick={clearSelection}
            tabIndex={-1}
          >
            ×
          </button>
        ) : null}
        <span className="combobox-chevron" aria-hidden="true">▾</span>
      </div>
      {isOpen ? (
        <ul
          ref={listRef}
          className="combobox-list"
          role="listbox"
          id={`${inputId}-listbox`}
        >
          {filtered.length === 0 ? (
            <li className="combobox-empty">{emptyMessage}</li>
          ) : (
            filtered.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  className={[
                    'combobox-option',
                    isHighlighted ? 'is-highlighted' : '',
                    isSelected ? 'is-selected' : '',
                  ].filter(Boolean).join(' ')}
                  onMouseDown={(event) => {
                    // Prevent the input from blurring before the click lands.
                    event.preventDefault();
                    commit(option);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="combobox-option-label">{option.label}</span>
                  {option.sublabel ? (
                    <span className="combobox-option-sublabel">{option.sublabel}</span>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
