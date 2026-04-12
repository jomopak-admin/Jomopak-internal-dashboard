import { ReactNode } from 'react';
import { UserProfile, View } from '../../types';

interface AppLayoutProps {
  view: View;
  onViewChange: (view: View) => void;
  navItems: Array<{ key: View; label: string }>;
  profile: UserProfile | null;
  onSignOut: () => void;
  topbarAction?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ view, onViewChange, navItems, profile, onSignOut, topbarAction, children }: AppLayoutProps) {
  const accountName = profile?.fullName || profile?.email || 'Signed in';
  const accountEmail = profile?.email || 'No email stored';
  const accountRole = profile?.role || 'ops';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Internal Production Dashboard</p>
          <h1>JomoPak</h1>
          <p className="muted sidebar-copy">
            Phase 1 digitisation for job cards, waste, paper usage, and reporting with FSC-ready flags.
          </p>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={view === item.key ? 'nav-button active' : 'nav-button'}
              onClick={() => onViewChange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <p className="eyebrow">Login</p>
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
          <div>
            <p className="eyebrow">Operations Overview</p>
            <h2 className="page-heading">Paper bag production control</h2>
          </div>
          <div className="topbar-actions">
            {topbarAction}
            <div className="topbar-account">
              <div>
                <strong>{accountName}</strong>
                <p className="muted">{accountRole}</p>
              </div>
              <button className="secondary-button" onClick={onSignOut}>Sign Out</button>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
