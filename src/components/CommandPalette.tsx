import { useEffect, useMemo, useRef, useState } from 'react';
import { Client, Invoice, JobCard, Lead, Product, SparePart, View } from '../types';

/**
 * Global Cmd-K palette. Searches across the high-traffic record types and
 * lets the user jump straight to the right view with the record pre-selected.
 *
 * Why home-grown instead of `cmdk`? — we already have a styling system, the
 * matcher is simple substring scoring, and we want zero extra deps.
 */
export interface CommandPaletteResult {
  /** Stable key for the React list. */
  id: string;
  /** Human label shown as the headline. */
  label: string;
  /** Optional secondary line (client, status, qty). */
  detail?: string;
  /** Short tag chip on the right (e.g. "Job", "Invoice"). */
  kind: 'Job' | 'Client' | 'Product' | 'Spare' | 'Invoice' | 'Lead' | 'Action';
  /** What to navigate to when picked. */
  view: View;
  /** Lower-cased haystack used for matching — joined fields. */
  haystack: string;
  /** Optional selection callback so picking a job also selects it in the list. */
  onPick?: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  jobs: JobCard[];
  clients: Client[];
  products: Product[];
  spareParts: SparePart[];
  invoices: Invoice[];
  leads: Lead[];
  /** Used by the picker callback to navigate. */
  setView: (view: View) => void;
  /** Optional — pin the picked record into its list. */
  setSelectedJobId?: (jobId: string) => void;
  /** Every page the current user can reach — turned into "Go to X" actions
   *  so they can search for any screen (Calculator, Reports, etc.). */
  navItems?: Array<{ key: View; label: string }>;
}

const RESULT_LIMIT = 30;

function score(haystack: string, query: string): number {
  // Quick substring match — index 0 = strongest match. Returns -1 for no match.
  if (!query) return 0;
  const idx = haystack.indexOf(query);
  if (idx < 0) return -1;
  // Earlier matches and shorter haystacks win.
  return idx + Math.floor(haystack.length / 200);
}

export function CommandPalette({
  open,
  onClose,
  jobs,
  clients,
  products,
  spareParts,
  invoices,
  leads,
  setView,
  setSelectedJobId,
  navItems = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state on open.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Focus the input on the next frame (after the modal mounts).
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Build the full result set up-front, score on type. Memoised because
  // jobs/clients/etc are stable props and re-scoring on every keystroke is
  // cheap; rebuilding the haystack array isn't.
  const allResults = useMemo<CommandPaletteResult[]>(() => {
    const rows: CommandPaletteResult[] = [];

    for (const job of jobs) {
      rows.push({
        id: `job:${job.id}`,
        kind: 'Job',
        label: `${job.jobNumber} · ${job.customerName}`,
        detail: `${job.productName} • ${job.status}`,
        view: 'jobs',
        haystack: `${job.jobNumber} ${job.customerName} ${job.productName} ${job.status}`.toLowerCase(),
        onPick: () => {
          setSelectedJobId?.(job.id);
        },
      });
    }
    for (const client of clients) {
      rows.push({
        id: `client:${client.id}`,
        kind: 'Client',
        label: client.name,
        detail: client.code ? `${client.code} • ${client.companyName || ''}` : client.companyName,
        view: 'clients',
        haystack: `${client.name} ${client.code} ${client.companyName}`.toLowerCase(),
      });
    }
    for (const product of products) {
      rows.push({
        id: `product:${product.id}`,
        kind: 'Product',
        label: product.name,
        detail: `${product.sku} • ${product.category}`,
        view: 'products',
        haystack: `${product.name} ${product.sku} ${product.category}`.toLowerCase(),
      });
    }
    for (const part of spareParts) {
      rows.push({
        id: `part:${part.id}`,
        kind: 'Spare',
        label: `${part.partCode} · ${part.partName}`,
        detail: `${part.itemType} • ${part.category}`,
        view: 'spares',
        haystack: `${part.partCode} ${part.partName} ${part.itemType} ${part.category}`.toLowerCase(),
      });
    }
    for (const invoice of invoices) {
      rows.push({
        id: `invoice:${invoice.id}`,
        kind: 'Invoice',
        label: `${invoice.invoiceNumber} · ${invoice.clientName}`,
        detail: `${invoice.status} • ${invoice.invoiceDate}`,
        view: 'invoices',
        haystack: `${invoice.invoiceNumber} ${invoice.clientName} ${invoice.status}`.toLowerCase(),
      });
    }
    for (const lead of leads) {
      rows.push({
        id: `lead:${lead.id}`,
        kind: 'Lead',
        label: `${lead.leadNumber} · ${lead.contactName || lead.companyName}`,
        detail: `${lead.status} • ${lead.source}`,
        view: 'leads',
        haystack: `${lead.leadNumber} ${lead.contactName} ${lead.companyName} ${lead.status}`.toLowerCase(),
      });
    }

    // "Go to <page>" action for every page the user can reach — so they can
    // search for any screen by name (Calculator, Reports, Morning Digest…).
    for (const item of navItems) {
      rows.push({
        id: `action:${item.key}`,
        kind: 'Action',
        label: `Go to ${item.label}`,
        view: item.key,
        haystack: `go to ${item.label} ${item.key}`.toLowerCase(),
      });
    }

    return rows;
  }, [jobs, clients, products, spareParts, invoices, leads, setSelectedJobId, navItems]);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Empty query: show actions first, then the most recent jobs/invoices.
      const actions = allResults.filter((r) => r.kind === 'Action');
      const recent = allResults.filter((r) => r.kind === 'Job').slice(0, 8);
      return [...actions, ...recent].slice(0, RESULT_LIMIT);
    }
    const scored = allResults
      .map((r) => ({ r, s: score(r.haystack, q) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => a.s - b.s)
      .slice(0, RESULT_LIMIT)
      .map((x) => x.r);
    return scored;
  }, [allResults, query]);

  // Clamp activeIndex when results change.
  useEffect(() => {
    if (activeIndex >= filteredResults.length) {
      setActiveIndex(0);
    }
  }, [filteredResults.length, activeIndex]);

  function pick(result: CommandPaletteResult) {
    result.onPick?.();
    setView(result.view);
    onClose();
  }

  function handleKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filteredResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredResults[activeIndex];
      if (target) pick(target);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="cmdk-shell" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={handleKey}>
      <div className="cmdk-backdrop" onClick={onClose} />
      <div className="cmdk-panel">
        <input
          ref={inputRef}
          className="cmdk-input"
          type="text"
          placeholder="Search jobs, clients, parts, invoices…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
        />
        <div className="cmdk-results">
          {filteredResults.length === 0 ? (
            <p className="cmdk-empty">No matches.</p>
          ) : (
            <ul className="cmdk-list">
              {filteredResults.map((result, idx) => (
                <li
                  key={result.id}
                  className={idx === activeIndex ? 'cmdk-item active' : 'cmdk-item'}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => pick(result)}
                >
                  <div className="cmdk-item-body">
                    <p className="cmdk-item-label">{result.label}</p>
                    {result.detail ? <p className="cmdk-item-detail">{result.detail}</p> : null}
                  </div>
                  <span className={`cmdk-kind cmdk-kind-${result.kind.toLowerCase()}`}>{result.kind}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="cmdk-footer">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </footer>
      </div>
    </div>
  );
}
