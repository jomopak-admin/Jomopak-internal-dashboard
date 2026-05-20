/**
 * NotificationBell — Phase 16 (Task #96)
 *
 * Self-contained bell. Click to open a popover with the unread list,
 * click a notification to navigate to its source view, "Clear all" marks
 * everything read. Renders nothing if the list is empty.
 */
import { useEffect, useRef, useState } from 'react';
import { AppNotification, NotificationSeverity, View } from '../types';

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  isRead: (id: string) => boolean;
  onOpen: (n: AppNotification) => void;
  onMarkAllRead: () => void;
  onNavigate: (view: View, entityId?: string) => void;
}

const SEV_LABEL: Record<NotificationSeverity, string> = {
  urgent: 'Urgent',
  warn: 'Attention',
  info: 'Info',
};

export function NotificationBell({
  notifications,
  unreadCount,
  isRead,
  onOpen,
  onMarkAllRead,
  onNavigate,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function handleClick(n: AppNotification) {
    onOpen(n);
    if (n.link?.view) onNavigate(n.link.view, n.link.entityId);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="notification-bell-wrap">
      <button
        type="button"
        className={unreadCount > 0 ? 'notification-bell has-unread' : 'notification-bell'}
        aria-label={`Notifications (${unreadCount} unread)`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="notification-bell-icon" aria-hidden="true">{'\u{1F514}'}</span>
        {unreadCount > 0 ? (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <strong>Notifications</strong>
            {notifications.length > 0 ? (
              <button type="button" className="link-button" onClick={onMarkAllRead}>
                Clear all
              </button>
            ) : null}
          </div>
          {notifications.length === 0 ? (
            <div className="notification-empty">All caught up — no alerts.</div>
          ) : (
            <ul className="notification-list">
              {notifications.slice(0, 30).map((n) => {
                const read = isRead(n.id);
                return (
                  <li key={n.id} className={read ? 'is-read' : ''}>
                    <button
                      type="button"
                      className={`notification-row severity-${n.severity}`}
                      onClick={() => handleClick(n)}
                    >
                      <span className={`notification-sev sev-${n.severity}`}>
                        {SEV_LABEL[n.severity]}
                      </span>
                      <span className="notification-body">
                        <strong>{n.title}</strong>
                        <span>{n.message}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
