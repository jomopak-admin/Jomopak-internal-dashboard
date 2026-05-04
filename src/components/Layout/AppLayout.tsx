import { ReactNode, useEffect, useMemo, useState } from 'react';
import { UserProfile, View } from '../../types';

interface AppLayoutProps {
  view: View;
  onViewChange: (view: View) => void;
  navItems: Array<{ key: View; label: string }>;
  profile: UserProfile | null;
  onSignOut: () => void;
  topbarAction?: ReactNode;
  topbarSummary?: ReactNode;
  children: ReactNode;
}

const NAV_GROUPS: Array<{ title: string; views: View[] }> = [
  { title: 'Overview', views: ['dashboard', 'reports'] },
  { title: 'Sales', views: ['salesDesk', 'leads', 'quotes', 'invoices', 'clients', 'pricing', 'calculator', 'costInputs'] },
  { title: 'Production', views: ['artwork', 'productionSpecs', 'jobs', 'production', 'waste', 'paper', 'machines'] },
  { title: 'Stock', views: ['materials', 'finishedStock', 'customerStock', 'dispatch', 'deliveryNotes', 'spares', 'products', 'suppliers'] },
  { title: 'Admin', views: ['permissions'] },
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

export function AppLayout({ view, onViewChange, navItems, profile, onSignOut, topbarAction, topbarSummary, children }: AppLayoutProps) {
  const accountName = profile?.fullName || profile?.email || 'Signed in';
  const accountEmail = profile?.email || 'No email stored';
  const accountRole = profile?.role || 'ops';
  const currentItem = navItems.find((item) => item.key === view);
  const groupedNav = useMemo(
    () =>
      NAV_GROUPS
        .map((group) => ({
          title: group.title,
          items: group.views
            .map((groupView) => navItems.find((item) => item.key === groupView))
            .filter((item): item is { key: View; label: string } => Boolean(item)),
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
    <div className="app-shell">
      <aside className="sidebar">
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
                    <span className="nav-group-count">{group.items.length}</span>
                    <span className="nav-group-chevron" aria-hidden="true">{isOpen ? '−' : '+'}</span>
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

        <div className="sidebar-user">
          <p className="eyebrow">Account</p>
          <div className="account-block">
            <div className="account-avatar" aria-hidden="true">
              {accountName.charAt(0).toUpperCase()}
            </div>
            <div className="account-copy">
              <strong>{accountName}</strong>
              <span>{accountEmail}</span>
              <small>{accountRole}</small>
            </div>
          </div>
          <button className="ghost-button sidebar-signout" onClick={onSignOut}>Sign Out</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <p className="eyebrow">Workspace</p>
            <h2 className="page-heading">{currentItem?.label || 'Dashboard'}</h2>
            {topbarSummary ? (
              <div className="topbar-summary">{topbarSummary}</div>
            ) : null}
          </div>
          <div className="topbar-actions">
            {topbarAction}
            <div className="topbar-account">
              <div>
                <strong>{accountName}</strong>
                <p className="muted">{accountRole}</p>
              </div>
              <button className="ghost-button" onClick={onSignOut}>Sign Out</button>
            </div>
          </div>
        </header>

        <div className="page-body">{children}</div>
      </main>
    </div>
  );
}
