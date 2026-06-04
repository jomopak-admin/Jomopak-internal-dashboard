import { ReactNode, useEffect, useMemo, useState } from 'react';
import { UserProfile, View } from '../../types';
import { ToastContainer } from '../Toast';

interface AppLayoutProps {
  view: View;
  onViewChange: (view: View) => void;
  navItems: Array<{ key: View; label: string }>;
  profile: UserProfile | null;
  onSignOut: () => void;
  onChangePassword: () => void;
  topbarAction?: ReactNode;
  topbarSummary?: ReactNode;
  /** Opens the global search / command palette. Rendered next to the menu
   *  toggle on the left of the topbar for easy access. */
  onOpenSearch?: () => void;
  /** Phase 103.7.1 — Account-menu hook that jumps to Settings AND sets
   *  the active tab to 'apiAccess'. App.tsx wires this so the picker
   *  doesn't live in the sidebar but is still one click away. */
  onOpenApiAccess?: () => void;
  /** Phase 60 — when true, the layout hides the sidebar, hamburger, search,
   *  and chrome to give a single-purpose PWA feel (used for drivers). The
   *  account menu still renders so they can sign out. */
  kioskMode?: boolean;
  children: ReactNode;
}

const NAV_GROUPS: Array<{ title: string; views: View[] }> = [
  // Pinned top-level landings. Each is its own one-item group so it renders
  // as a single high-visibility row, not buried inside a collapsible group.
  { title: 'Inbox', views: ['inbox'] },
  // Phase 130.1 — Admin Hub merged into Dashboard. No separate nav item;
  // the page renders inline below Control Centre for admin users.
  { title: 'My Stuff', views: ['myPortal'] },
  { title: 'Overview', views: ['dashboard', 'morningDigest', 'reportsHub', 'reports', 'profitability', 'cashFlow'] },
  { title: 'Sales', views: ['salesPipeline', 'salesDesk', 'leads', 'leadAnalytics', 'quotes', 'proformas', 'customerDeposits', 'invoices', 'agedDebtors', 'companies', 'clients', 'pricing', 'priceList', 'calculator', 'costInputs'] },
  { title: 'Production', views: ['productionSchedule', 'materialRequirements', 'artwork', 'productionSpecs', 'jobs', 'workTicket', 'production', 'cleaningLogs', 'waste', 'machines', 'maintenance', 'dies', 'stereos'] },
  // Phase 75 — 'paper' (Paper Log) removed from sidebar. Production Log is now
  // the single capture point for material consumption + slitting transformation.
  // Existing PaperLog rows remain queryable in the DB for legacy audits.
  { title: 'Materials', views: ['materials', 'shipments', 'invoiceInbox', 'foodSafeMaterials', 'chemicalRegister'] },
  { title: 'Stock', views: ['finishedStock', 'customerStock', 'stockStatements', 'reorderReminders', 'stockTake', 'clientStockTakeSheet', 'stockMovements', 'labels', 'dispatchRuns', 'dispatch', 'driverPod', 'deliveryNotes', 'spares', 'stockRequests', 'products', 'suppliers'] },
  { title: 'Finance', views: ['sarsCentre', 'financeSummary', 'financialStatements', 'financialProjections', 'customerStatements', 'accountsPayable', 'bankRec', 'generalLedger', 'fixedAssets', 'currencies', 'chartOfAccounts'] },
  // HR sits as its own group — leave, loans, claims, warnings, payroll are
  // all HR-ish concerns the admin (currently Aman) does daily.
  { title: 'HR & Payroll', views: ['payroll', 'employees', 'staffLeave', 'staffLeaveApprove', 'staffLoans', 'expenseClaims', 'expenseClaimsApprove', 'irp5Centre', 'staffWarnings', 'notices'] },
  // Compliance now includes SMETA registers + Audit Programmes alongside the
  // food-safety set so all auditor-facing surfaces live together.
  { title: 'Compliance', views: ['foodSafetyControlCentre', 'haccpRegister', 'sopRegister', 'nonConformance', 'firstAidRegister', 'incidentRegister', 'drillRegister', 'toolboxTalks', 'sheCommittee', 'auditProgrammes', 'traceability', 'complaints', 'staffTraining', 'ppeControl', 'foreignObjectControl', 'pestControl', 'toolBladeControl'] },
  // Reception / front office — visitor + contractor management lives here,
  // owned by the admin / receptionist (not Compliance). The Kiosk is the
  // tablet at the front desk; the Log is the full searchable register;
  // Approvals is the audit + admin-override view.
  { title: 'Reception', views: ['visitorKiosk', 'visitorLog', 'visitorApprovals'] },
  // Phase 103.7 — osConnector ('API access') moved into Settings API access
  // tab and is no longer in the sidebar.
  { title: 'Admin', views: ['documentVault', 'tradedGoods', 'permissions', 'settings'] },
];

const NAV_OPEN_STORAGE_KEY = 'jomopak.nav.openGroups';

function readStoredOpenGroups(): Set<string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(NAV_OPEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return null;
  }
}

export function AppLayout({ view, onViewChange, navItems, profile, onSignOut, onChangePassword, topbarAction, topbarSummary, onOpenSearch, onOpenApiAccess, kioskMode, children }: AppLayoutProps) {
  const accountName = profile?.fullName || profile?.email || 'Signed in';
  const accountEmail = profile?.email || 'No email stored';
  const accountRole = profile?.role || 'ops';
  const currentItem = navItems.find((item) => item.key === view);
  const canOpenSettings = navItems.some((item) => item.key === 'settings');
  const canOpenPermissions = navItems.some((item) => item.key === 'permissions');
  const [accountOpen, setAccountOpen] = useState(false);
  // Mobile drawer state — sidebar is hidden by default on narrow viewports
  // and toggled open via the hamburger in the topbar. On desktop the
  // drawer state is ignored (CSS keeps the sidebar always visible).
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Close drawer whenever the user picks a nav item so it doesn't sit
  // open over the page they just jumped to.
  useEffect(() => {
    setDrawerOpen(false);
    setAccountOpen(false);
  }, [view]);
  /* Phase 103.7 — Hard blacklist of views that must NEVER appear in the
   * sidebar regardless of what permissions / NAV_GROUPS say. Currently:
   *   - 'osConnector' (API access) lives in Settings API access tab
   *      and is reachable from the avatar menu. Keeping it out of the
   *      sidebar means there's exactly one path.
   *
   * This belt-and-braces filter exists because the same setting got
   * filtered at 5 different layers historically and one always slipped
   * through. The blacklist here is the last word — if a view is in it,
   * it physically cannot render in the sidebar. */
  const SIDEBAR_HIDDEN: ReadonlyArray<View> = ['osConnector'];
  const groupedNav = useMemo(
    () =>
      NAV_GROUPS
        .map((group) => ({
          title: group.title,
          items: group.views
            .filter((groupView) => !SIDEBAR_HIDDEN.includes(groupView))
            .map((groupView) => navItems.find((item) => item.key === groupView))
            .filter((item): item is { key: View; label: string } => Boolean(item))
            .filter((item) => !SIDEBAR_HIDDEN.includes(item.key)),
        }))
        .filter((group) => group.items.length > 0),
    [navItems],
  );

  const activeGroupTitle = useMemo(
    () => groupedNav.find((group) => group.items.some((item) => item.key === view))?.title ?? null,
    [groupedNav, view],
  );

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const stored = readStoredOpenGroups();
    if (stored && stored.size > 0) return stored;
    const seed = new Set<string>(['Overview']);
    return seed;
  });

  // Make sure the group containing the active view is always visible.
  useEffect(() => {
    if (!activeGroupTitle) return;
    setOpenGroups((current) => {
      if (current.has(activeGroupTitle)) return current;
      const next = new Set(current);
      next.add(activeGroupTitle);
      return next;
    });
  }, [activeGroupTitle]);

  // Persist user's preferred open/closed state.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(NAV_OPEN_STORAGE_KEY, JSON.stringify(Array.from(openGroups)));
    } catch {
      /* ignore quota errors */
    }
  }, [openGroups]);

  function toggleGroup(title: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }

  return (
    <div className={[
      drawerOpen ? 'app-shell drawer-open' : 'app-shell',
      kioskMode ? 'kiosk-mode' : '',
    ].filter(Boolean).join(' ')}>
      {/* Phase 104 — Global toast notifications.
          Mounted once at the layout root so any code anywhere in the app
          can call toast.success(...) / toast.error(...) and the message
          surfaces top-right above all pages, including in kiosk mode. */}
      <ToastContainer />

      {/* Mobile overlay — tapping it closes the drawer. Always rendered so
          the slide animation can play; CSS hides it on desktop. */}
      {!kioskMode && (
        <div
          className="sidebar-overlay"
          aria-hidden={!drawerOpen}
          onClick={() => setDrawerOpen(false)}
        />
      )}
      {!kioskMode && (
      <aside className={drawerOpen ? 'sidebar is-open' : 'sidebar'}>
        <div className="brand-block">
          <p className="eyebrow">Jomopak OS</p>
          <h1>JomoPak</h1>
          <p className="sidebar-copy">Internal operations across sales, production, stock, and dispatch.</p>
        </div>

        <nav className="nav-groups">
          {groupedNav.map((group) => {
            const isOpen = openGroups.has(group.title);
            const groupHasActive = group.items.some((item) => item.key === view);
            return (
              <div key={group.title} className={isOpen ? 'nav-group is-open' : 'nav-group'}>
                <button
                  type="button"
                  className={groupHasActive ? 'nav-group-toggle has-active' : 'nav-group-toggle'}
                  onClick={() => toggleGroup(group.title)}
                  aria-expanded={isOpen}
                >
                  <span>{group.title}</span>
                  <span className="nav-group-meta">
                    <span className="nav-group-chevron" aria-hidden="true">{isOpen ? '' : ''}</span>
                  </span>
                </button>
                {isOpen ? (
                  <div className="nav-list">
                    {group.items.map((item) => (
                      <button
                        key={item.key}
                        className={view === item.key ? 'nav-button active' : 'nav-button'}
                        onClick={() => onViewChange(item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>
      )}

      <main className="main-content">
        <header className="topbar">
          {!kioskMode && (
            <button
              type="button"
              className="topbar-menu-toggle"
              aria-label="Toggle navigation"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((v) => !v)}
            >
              <span aria-hidden="true"></span>
            </button>
          )}
          {!kioskMode && onOpenSearch ? (
            <button
              type="button"
              className="topbar-search-btn"
              onClick={onOpenSearch}
              aria-label="Search (Cmd-K)"
            >
              <span aria-hidden="true"></span>
              <span className="topbar-search-label">Search</span>
              <kbd>K</kbd>
            </button>
          ) : null}
          <div className="topbar-title">
            <p className="eyebrow">Workspace</p>
            <h2 className="page-heading">{currentItem?.label || 'Dashboard'}</h2>
            {topbarSummary ? (
              <div className="topbar-summary">{topbarSummary}</div>
            ) : null}
          </div>
          <div className="topbar-actions">
            {topbarAction}
            <div className="account-menu">
              <button
                type="button"
                className="account-menu-trigger"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span className="account-avatar account-avatar-sm" aria-hidden="true">{accountName.charAt(0).toUpperCase()}</span>
                <span className="account-menu-id">
                  <strong>{accountName}</strong>
                  <span className="muted">{accountRole}</span>
                </span>
                <span className="account-menu-caret" aria-hidden="true">{accountOpen ? '▴' : ''}</span>
              </button>
              {accountOpen ? (
                <>
                  <button
                    type="button"
                    className="account-menu-backdrop"
                    aria-label="Close account menu"
                    onClick={() => setAccountOpen(false)}
                  />
                  <div className="account-menu-dropdown" role="menu">
                    <div className="account-menu-header">
                      <strong>{accountName}</strong>
                      <span>{accountEmail}</span>
                      <small>{accountRole}</small>
                    </div>
                    {canOpenSettings ? (
                      <button type="button" role="menuitem" className="account-menu-item" onClick={() => { setAccountOpen(false); onViewChange('settings'); }}>Account &amp; settings</button>
                    ) : null}
                    {/* Phase 103.7.1 — API access lives inside Settings. The
                        sidebar doesn't expose it; the account menu provides
                        a one-click jump that opens Settings on the right tab. */}
                    {canOpenSettings && onOpenApiAccess ? (
                      <button type="button" role="menuitem" className="account-menu-item" onClick={() => { setAccountOpen(false); onOpenApiAccess(); }}>API access</button>
                    ) : null}
                    {canOpenPermissions ? (
                      <button type="button" role="menuitem" className="account-menu-item" onClick={() => { setAccountOpen(false); onViewChange('permissions'); }}>Permissions</button>
                    ) : null}
                    <button type="button" role="menuitem" className="account-menu-item" onClick={() => { setAccountOpen(false); onChangePassword(); }}>Change password</button>
                    <button type="button" role="menuitem" className="account-menu-item account-menu-item-danger" onClick={() => { setAccountOpen(false); onSignOut(); }}>Sign out</button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <div className="page-body">{children}</div>
      </main>
    </div>
  );
}
