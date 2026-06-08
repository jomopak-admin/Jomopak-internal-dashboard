/**
 * Entity360Layout — Phase 137.1.
 *
 * Aman's 7-Lens Rule, encoded as a reusable layout component. Every detail
 * page in JomoPak (Client, Supplier, Invoice, Quote, Job, Delivery Note,
 * Customer Deposit, etc.) must answer the same seven questions, in the
 * same order, in the same shape:
 *
 *   1. What is this?            → Identity
 *   2. Who is it linked to?     → Links
 *   3. What is its status?      → Status (with workflow stepper)
 *   4. What money is attached?  → Money (margin gated behind canViewCosts)
 *   5. What stock is attached?  → Stock
 *   6. What documents are att.? → Documents
 *   7. What must happen next?   → NextAction
 *
 * Anything else the page wants to show (collapsible deep-dive sections,
 * tables of related records, etc.) sits in the layout's children/body slot
 * BELOW the 7 lenses.
 *
 * If a particular entity legitimately has nothing for a given lens (a
 * brand-new client with no money yet, a quote with no stock implications)
 * the lens is rendered as a "—" placeholder so the user still sees the
 * shape and trusts every detail page works the same way.
 *
 * Usage:
 *
 *   <Entity360Layout
 *     identity={{ type: 'Client', code: 'BRUV-001', title: 'Bruv Burger', subtitle: 'Sameer Khan' }}
 *     links={[{ kind: 'staff', label: 'Account Manager', value: 'Aman' }, ...]}
 *     status={{ label: 'Active', tone: 'success' }}
 *     money={canViewCosts ? { revenue: 102_882, paid: 80_000, outstanding: 22_882, marginPct: 33.1 } : { revenue: 102_882, paid: 80_000, outstanding: 22_882 }}
 *     stock={{ committed: 25_000, made: 25_000, drawn: 18_200, onHand: 6_800, unit: 'bags' }}
 *     documents={[{ label: 'Invoice 557.pdf', kind: 'pdf' }, ...]}
 *     nextAction={{ label: 'Allocate R 84,896.70 open deposits', priority: 'high', onClick: () => ... }}
 *     onBack={() => ...}
 *   >
 *     // ...page-specific collapsible deep-dive sections here
 *   </Entity360Layout>
 */

import { CSSProperties, ReactNode } from 'react';
import { formatNumber } from '../../utils/calculations';

// ── Lens data types ─────────────────────────────────────────────────────

/** Lens 1 — Identity. What is this? */
export interface Entity360Identity {
  /** Entity type label, e.g. 'Client', 'Invoice', 'Supplier Bill'. */
  type: string;
  /** Optional internal code/number, e.g. 'BRUV-001' / 'INV-557'. */
  code?: string;
  /** Display title, e.g. 'Bruv Burger', 'Invoice 557'. */
  title: string;
  /** One-line subtitle for the most important secondary fact. */
  subtitle?: string;
  /** Tone for the type chip (defaults to neutral). */
  typeTone?: Entity360Tone;
}

export type Entity360Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Lens 2 — Links. Who is this linked to? */
export interface Entity360Link {
  /** Logical category — drives the icon / colour. */
  kind: 'client' | 'supplier' | 'staff' | 'job' | 'quote' | 'invoice' | 'deposit' | 'deliveryNote' | 'parent' | 'child' | 'other';
  /** Role of this relationship, e.g. 'Account Manager', 'Parent Quote'. */
  label: string;
  /** Display value, e.g. 'Aman', 'Q1086'. */
  value: string;
  /** Optional click handler — navigates to that entity's 360 page. */
  onClick?: () => void;
}

/** Lens 3 — Status. Where in the workflow is this? */
export interface Entity360Status {
  /** Headline label, e.g. 'Sent', 'Partially Paid', 'Active'. */
  label: string;
  tone: Entity360Tone;
  /** Optional workflow steps for a stepper, e.g. ['Quoted', 'Approved', 'In Production', 'Delivered']. */
  workflow?: string[];
  /** Zero-indexed position in workflow. */
  currentStep?: number;
}

/** Lens 4 — Money. What's tied up financially? */
export interface Entity360Money {
  /** Total revenue / value attached, ex VAT. */
  revenue?: number;
  /** Total cost basis, ex VAT. Hidden if user lacks canViewCosts. */
  cost?: number;
  /** Cash received so far. */
  paid?: number;
  /** Amount still outstanding. */
  outstanding?: number;
  /** Margin % (revenue − cost) / revenue. Hidden if user lacks canViewCosts. */
  marginPct?: number;
  /** Currency symbol, defaults to 'R '. */
  currencySymbol?: string;
}

/** Lens 5 — Stock. What physical inventory is attached? */
export interface Entity360Stock {
  /** Qty committed (quoted / ordered). */
  committed?: number;
  /** Qty already manufactured / received. */
  made?: number;
  /** Qty drawn down (delivered / consumed). */
  drawn?: number;
  /** Qty currently on hand. */
  onHand?: number;
  /** Unit label, e.g. 'bags', 'cans', 'units'. */
  unit?: string;
}

/** Lens 6 — Documents. What's attached? */
export interface Entity360Document {
  /** Display label, e.g. 'Invoice 557.pdf'. */
  label: string;
  /** File kind for the icon. */
  kind?: 'pdf' | 'image' | 'email' | 'spreadsheet' | 'link';
  /** Optional click handler — opens the doc / vault entry. */
  onClick?: () => void;
}

/** Lens 7 — Next action. What must happen next? */
export interface Entity360NextAction {
  /** Verb-led label, e.g. 'Allocate deposit', 'Send to client'. */
  label: string;
  /** Optional explanatory subtitle. */
  detail?: string;
  /** Optional click handler. If absent the action is shown as advisory only. */
  onClick?: () => void;
  /** Visual emphasis — 'high' renders as a red call-to-action banner. */
  priority?: 'normal' | 'high';
}

interface Entity360LayoutProps {
  identity: Entity360Identity;
  links?: Entity360Link[];
  status?: Entity360Status;
  money?: Entity360Money;
  stock?: Entity360Stock;
  documents?: Entity360Document[];
  nextAction?: Entity360NextAction;
  /** If false, the Money lens hides cost + margin even when provided. */
  canViewCosts?: boolean;
  /** Optional back button handler shown next to the identity header. */
  onBack?: () => void;
  /** Page-specific deep-dive sections (collapsible cards, tables, etc.). */
  children?: ReactNode;
}

// ── Styling helpers ─────────────────────────────────────────────────────

function toneColor(tone: Entity360Tone): { bg: string; fg: string; border: string } {
  switch (tone) {
    case 'success': return { bg: '#e6f6ee', fg: '#0f7a47', border: '#a8d8bc' };
    case 'warning': return { bg: '#fff4dc', fg: '#7a5300', border: '#e8c378' };
    case 'danger':  return { bg: '#fdecec', fg: '#a3221c', border: '#e3a8a4' };
    case 'info':    return { bg: '#e7f0fa', fg: '#1e4d8c', border: '#a8c4e3' };
    default:        return { bg: '#f1f5f9', fg: '#475569', border: '#cbd5e1' };
  }
}

const lensCardStyle: CSSProperties = {
  background: 'var(--jp-card, #fff)',
  border: '1px solid var(--jp-line, #e2e8f0)',
  borderRadius: 8,
  padding: '14px 16px',
  minWidth: 200,
  flex: '1 1 220px',
};

const lensLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--jp-ink-3, #64748b)',
  marginBottom: 6,
  fontWeight: 600,
};

function fmtMoney(n: number, currency: string = 'R '): string {
  return `${currency}${formatNumber(n, 2)}`;
}

function fmtQty(n: number): string {
  return n.toLocaleString();
}

// ── Lens renderers ──────────────────────────────────────────────────────

function IdentityHeader({ identity, onBack }: { identity: Entity360Identity; onBack?: () => void }) {
  const tone = toneColor(identity.typeTone || 'info');
  return (
    <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{
            background: tone.bg,
            color: tone.fg,
            border: `1px solid ${tone.border}`,
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>{identity.type}</span>
          {identity.code ? (
            <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)', fontFamily: 'monospace' }}>
              {identity.code}
            </span>
          ) : null}
        </div>
        <h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}>{identity.title}</h1>
        {identity.subtitle ? (
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--jp-ink-3, #64748b)' }}>{identity.subtitle}</p>
        ) : null}
      </div>
      {onBack ? (
        <button className="ghost-button" onClick={onBack}>← Back</button>
      ) : null}
    </header>
  );
}

function StatusLens({ status }: { status?: Entity360Status }) {
  if (!status) return <Placeholder label="Status" />;
  const tone = toneColor(status.tone);
  return (
    <div style={lensCardStyle}>
      <div style={lensLabelStyle}>Status</div>
      <div style={{
        display: 'inline-block',
        background: tone.bg,
        color: tone.fg,
        border: `1px solid ${tone.border}`,
        padding: '3px 10px',
        borderRadius: 4,
        fontWeight: 600,
        fontSize: 13,
      }}>
        {status.label}
      </div>
      {status.workflow && status.workflow.length > 0 ? (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {status.workflow.map((step, i) => {
            const active = (status.currentStep ?? -1) === i;
            const past = (status.currentStep ?? -1) > i;
            return (
              <span key={i} style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 3,
                background: active ? tone.bg : past ? '#e2e8f0' : 'transparent',
                color: active ? tone.fg : past ? '#475569' : '#94a3b8',
                fontWeight: active ? 700 : 400,
                border: '1px solid',
                borderColor: active ? tone.border : past ? '#cbd5e1' : '#e2e8f0',
              }}>
                {step}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function LinksLens({ links }: { links?: Entity360Link[] }) {
  if (!links || links.length === 0) return <Placeholder label="Linked to" body="No relationships" />;
  return (
    <div style={lensCardStyle}>
      <div style={lensLabelStyle}>Linked to</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {links.slice(0, 6).map((l, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 8 }}>
            <span style={{ color: 'var(--jp-ink-3, #64748b)' }}>{l.label}</span>
            {l.onClick ? (
              <button onClick={l.onClick} className="link-button" style={{ padding: 0, fontWeight: 600, textAlign: 'right' }}>
                {l.value}
              </button>
            ) : (
              <span style={{ fontWeight: 600 }}>{l.value}</span>
            )}
          </div>
        ))}
        {links.length > 6 ? (
          <span style={{ fontSize: 10, color: 'var(--jp-ink-3, #64748b)' }}>+{links.length - 6} more</span>
        ) : null}
      </div>
    </div>
  );
}

function MoneyLens({ money, canViewCosts }: { money?: Entity360Money; canViewCosts: boolean }) {
  if (!money) return <Placeholder label="Money" body="No financial movement yet" />;
  const c = money.currencySymbol || 'R ';
  return (
    <div style={lensCardStyle}>
      <div style={lensLabelStyle}>Money</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        {money.revenue !== undefined ? (
          <Row label="Revenue (ex VAT)" value={fmtMoney(money.revenue, c)} bold />
        ) : null}
        {canViewCosts && money.cost !== undefined ? (
          <Row label="Cost (ex VAT)" value={fmtMoney(money.cost, c)} />
        ) : null}
        {money.paid !== undefined ? (
          <Row label="Paid" value={fmtMoney(money.paid, c)} tone={money.paid > 0 ? 'success' : undefined} />
        ) : null}
        {money.outstanding !== undefined ? (
          <Row
            label="Outstanding"
            value={fmtMoney(money.outstanding, c)}
            tone={money.outstanding > 0 ? 'warning' : 'success'}
            bold
          />
        ) : null}
        {canViewCosts && money.marginPct !== undefined ? (
          <Row
            label="Margin"
            value={`${formatNumber(money.marginPct, 1)} %`}
            tone={money.marginPct < 0 ? 'danger' : money.marginPct < 15 ? 'warning' : 'success'}
          />
        ) : null}
      </div>
    </div>
  );
}

function StockLens({ stock }: { stock?: Entity360Stock }) {
  if (!stock) return <Placeholder label="Stock" body="No physical stock attached" />;
  const u = stock.unit ? ` ${stock.unit}` : '';
  return (
    <div style={lensCardStyle}>
      <div style={lensLabelStyle}>Stock</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        {stock.committed !== undefined ? <Row label="Committed" value={`${fmtQty(stock.committed)}${u}`} /> : null}
        {stock.made !== undefined ? <Row label="Made / received" value={`${fmtQty(stock.made)}${u}`} /> : null}
        {stock.drawn !== undefined ? <Row label="Drawn" value={`${fmtQty(stock.drawn)}${u}`} /> : null}
        {stock.onHand !== undefined ? <Row label="On hand" value={`${fmtQty(stock.onHand)}${u}`} bold tone={stock.onHand < 0 ? 'danger' : undefined} /> : null}
      </div>
    </div>
  );
}

function DocumentsLens({ documents }: { documents?: Entity360Document[] }) {
  if (!documents || documents.length === 0) return <Placeholder label="Documents" body="None attached" />;
  return (
    <div style={lensCardStyle}>
      <div style={lensLabelStyle}>Documents</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        {documents.slice(0, 6).map((d, i) => (
          <div key={i}>
            {d.onClick ? (
              <button onClick={d.onClick} className="link-button" style={{ padding: 0, fontWeight: 500, textAlign: 'left' }}>
                {iconForKind(d.kind)} {d.label}
              </button>
            ) : (
              <span>{iconForKind(d.kind)} {d.label}</span>
            )}
          </div>
        ))}
        {documents.length > 6 ? (
          <span style={{ fontSize: 10, color: 'var(--jp-ink-3, #64748b)' }}>+{documents.length - 6} more</span>
        ) : null}
      </div>
    </div>
  );
}

function NextActionBanner({ action }: { action?: Entity360NextAction }) {
  if (!action) return null;
  const isHigh = action.priority === 'high';
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      borderRadius: 8,
      background: isHigh ? '#fef2f2' : '#f5f8fc',
      border: `1px solid ${isHigh ? '#fca5a5' : '#cbd5e1'}`,
      gap: 16,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: isHigh ? '#9b1c1c' : 'var(--jp-ink-3, #64748b)', fontWeight: 700 }}>
          Next action
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{action.label}</div>
        {action.detail ? (
          <div style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)', marginTop: 2 }}>{action.detail}</div>
        ) : null}
      </div>
      {action.onClick ? (
        <button
          onClick={action.onClick}
          className={isHigh ? 'primary-button' : 'secondary-button'}
        >
          Take action
        </button>
      ) : null}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: Entity360Tone }) {
  const colour = tone ? toneColor(tone).fg : undefined;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: 'var(--jp-ink-3, #64748b)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: colour }}>{value}</span>
    </div>
  );
}

function Placeholder({ label, body }: { label: string; body?: string }) {
  return (
    <div style={{ ...lensCardStyle, opacity: 0.6 }}>
      <div style={lensLabelStyle}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--jp-ink-3, #64748b)' }}>{body || '—'}</div>
    </div>
  );
}

function iconForKind(kind?: Entity360Document['kind']): string {
  switch (kind) {
    case 'pdf': return '[PDF]';
    case 'image': return '[IMG]';
    case 'email': return '[MAIL]';
    case 'spreadsheet': return '[XLS]';
    case 'link': return '[LINK]';
    default: return '[DOC]';
  }
}

// ── Public component ───────────────────────────────────────────────────

export function Entity360Layout({
  identity,
  links,
  status,
  money,
  stock,
  documents,
  nextAction,
  canViewCosts = false,
  onBack,
  children,
}: Entity360LayoutProps) {
  return (
    <div className="page-stack">
      <IdentityHeader identity={identity} onBack={onBack} />

      {/* Lens row — 5 cards side by side (Status / Links / Money / Stock / Documents) */}
      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatusLens status={status} />
        <LinksLens links={links} />
        <MoneyLens money={money} canViewCosts={canViewCosts} />
        <StockLens stock={stock} />
        <DocumentsLens documents={documents} />
      </section>

      {/* Next-action banner — full width below the lens row */}
      <NextActionBanner action={nextAction} />

      {/* Page-specific deep-dive content (collapsible cards, tables, etc.) */}
      {children}
    </div>
  );
}
