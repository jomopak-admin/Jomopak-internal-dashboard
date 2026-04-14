import { useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import {
  DASHBOARD_WIDGET_LABELS,
  DashboardWidget,
  normalizeDashboardWidgets,
  normalizeProfilePermissions,
  ROLE_DEFAULT_DASHBOARD_WIDGETS,
  ROLE_DEFAULT_VIEWS,
  UserProfile,
  VIEW_LABELS,
  View,
} from '../../types';

interface CreateUserFormState {
  email: string;
  password: string;
  fullName: string;
  role: UserProfile['role'];
  permissions: View[];
  dashboardWidgets: DashboardWidget[];
}

interface PermissionsPageProps {
  profiles: UserProfile[];
  loading: boolean;
  onSave: (profile: UserProfile) => Promise<void>;
  onCreateUser: (payload: CreateUserFormState) => Promise<void>;
}

const initialCreateUserForm = (): CreateUserFormState => ({
  email: '',
  password: '',
  fullName: '',
  role: 'artwork',
  permissions: ROLE_DEFAULT_VIEWS.artwork,
  dashboardWidgets: ROLE_DEFAULT_DASHBOARD_WIDGETS.artwork,
});

export function PermissionsPage({ profiles, loading, onSave, onCreateUser }: PermissionsPageProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftRole, setDraftRole] = useState<UserProfile['role']>('ops');
  const [draftPermissions, setDraftPermissions] = useState<View[]>(ROLE_DEFAULT_VIEWS.ops);
  const [draftDashboardWidgets, setDraftDashboardWidgets] = useState<DashboardWidget[]>(ROLE_DEFAULT_DASHBOARD_WIDGETS.ops);
  const [createUserForm, setCreateUserForm] = useState(initialCreateUserForm);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [message, setMessage] = useState('');

  function togglePermission(selected: View[], permission: View, role: UserProfile['role']) {
    const exists = selected.includes(permission);
    const next = exists ? selected.filter((entry) => entry !== permission) : [...selected, permission];
    return normalizeProfilePermissions(role, next);
  }

  function toggleDashboardWidget(selected: DashboardWidget[], widget: DashboardWidget, role: UserProfile['role']) {
    const exists = selected.includes(widget);
    const next = exists ? selected.filter((entry) => entry !== widget) : [...selected, widget];
    return normalizeDashboardWidgets(role, next);
  }

  async function handleSave(profileId: string) {
    const current = profiles.find((profile) => profile.id === profileId);
    if (!current) {
      return;
    }
    try {
      await onSave({
        ...current,
        fullName: draftName,
        role: draftRole,
        permissions: normalizeProfilePermissions(draftRole, draftPermissions),
        dashboardWidgets: normalizeDashboardWidgets(draftRole, draftDashboardWidgets),
      });
      setMessage('Permissions updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update permissions.');
    }
  }

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0] ?? null;

  function handleSelectProfile(profile: UserProfile) {
    setSelectedProfileId(profile.id);
    setDraftName(profile.fullName);
    setDraftRole(profile.role);
    setDraftPermissions(profile.permissions);
    setDraftDashboardWidgets(profile.dashboardWidgets);
    setMessage('');
  }

  async function handleCreateUser(event: React.FormEvent) {
    event.preventDefault();
    try {
      await onCreateUser(createUserForm);
      setCreateUserForm(initialCreateUserForm());
      setMessage('User created.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to create user. Confirm the admin-create-dashboard-user edge function is deployed in Supabase.',
      );
    }
  }

  return (
    <>
      <SectionTitle
        title="Permissions"
        subtitle="Admin-only access to create users and edit names and roles for dashboard users."
      />

      <section className="card">
        {message ? <div className="message-strip">{message}</div> : null}
        <form className="permissions-create-form" onSubmit={handleCreateUser}>
          <div className="permissions-create-grid">
            <label>
              <span>Email</span>
              <input
                type="email"
                value={createUserForm.email}
                onChange={(event) => setCreateUserForm({ ...createUserForm, email: event.target.value })}
                required
              />
            </label>
            <label>
              <span>Temporary password</span>
              <div className="password-field">
                <input
                  type={showCreatePassword ? 'text' : 'password'}
                  value={createUserForm.password}
                  onChange={(event) => setCreateUserForm({ ...createUserForm, password: event.target.value })}
                  required
                />
                <button className="password-toggle" type="button" onClick={() => setShowCreatePassword((current) => !current)}>
                  {showCreatePassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            <label>
              <span>Full name</span>
              <input
                value={createUserForm.fullName}
                onChange={(event) => setCreateUserForm({ ...createUserForm, fullName: event.target.value })}
                required
              />
            </label>
            <label>
              <span>Role</span>
              <select
                value={createUserForm.role}
                onChange={(event) => {
                  const role = event.target.value as UserProfile['role'];
                  setCreateUserForm({
                    ...createUserForm,
                    role,
                    permissions: ROLE_DEFAULT_VIEWS[role],
                    dashboardWidgets: ROLE_DEFAULT_DASHBOARD_WIDGETS[role],
                  });
                }}
              >
                <option value="admin">admin</option>
                <option value="ops">ops</option>
                <option value="production">production</option>
                <option value="sales">sales</option>
                <option value="artwork">artwork</option>
              </select>
            </label>
          </div>
          <div className="permission-panel">
            <div className="permission-panel-header">
              <strong>Section Access</strong>
              <span className="table-subtext">Tick exactly what this user can see in the dashboard.</span>
            </div>
            <div className="permission-grid">
              {Object.entries(VIEW_LABELS).map(([key, label]) => {
                const permission = key as View;
                return (
                  <label key={permission} className="permission-check">
                    <input
                      type="checkbox"
                      checked={createUserForm.permissions.includes(permission)}
                      onChange={() =>
                        setCreateUserForm({
                          ...createUserForm,
                          permissions: togglePermission(createUserForm.permissions, permission, createUserForm.role),
                        })
                      }
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="permission-panel">
            <div className="permission-panel-header">
              <strong>Dashboard Cards</strong>
              <span className="table-subtext">Choose which cards appear on this user&apos;s dashboard.</span>
            </div>
            <div className="permission-grid">
              {Object.entries(DASHBOARD_WIDGET_LABELS).map(([key, label]) => {
                const widget = key as DashboardWidget;
                return (
                  <label key={widget} className="permission-check">
                    <input
                      type="checkbox"
                      checked={createUserForm.dashboardWidgets.includes(widget)}
                      onChange={() =>
                        setCreateUserForm({
                          ...createUserForm,
                          dashboardWidgets: toggleDashboardWidget(createUserForm.dashboardWidgets, widget, createUserForm.role),
                        })
                      }
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit">Create user</button>
          </div>
        </form>
      </section>

      <section className="card">
        {loading ? (
          <p className="muted">Loading profiles...</p>
        ) : profiles.length ? (
          <div className="permissions-layout">
            <div className="permissions-directory">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  className={selectedProfile?.id === profile.id ? 'permissions-person active' : 'permissions-person'}
                  onClick={() => handleSelectProfile(profile)}
                >
                  <strong>{profile.fullName || profile.email || 'No name set'}</strong>
                  <span>{profile.role}</span>
                </button>
              ))}
            </div>

            {selectedProfile ? (
              <div className="permissions-detail">
                <div className="permissions-user-header">
                  <div>
                    <strong>{selectedProfile.fullName || 'No name set'}</strong>
                    <p className="muted">{selectedProfile.email || 'No email stored'}</p>
                  </div>
                  <span className="badge badge-muted">{selectedProfile.role}</span>
                </div>

                <div className="permissions-meta">
                  <span>User ID</span>
                  <code>{selectedProfile.id}</code>
                </div>

                <div className="permissions-edit-grid">
                  <label>
                    <span>Full name</span>
                    <input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
                  </label>
                  <label>
                    <span>Role</span>
                    <select
                      value={draftRole}
                      onChange={(event) => {
                        const role = event.target.value as UserProfile['role'];
                        setDraftRole(role);
                        setDraftPermissions(normalizeProfilePermissions(role, draftPermissions));
                        setDraftDashboardWidgets(normalizeDashboardWidgets(role, draftDashboardWidgets));
                      }}
                    >
                      <option value="admin">admin</option>
                      <option value="ops">ops</option>
                      <option value="production">production</option>
                      <option value="sales">sales</option>
                      <option value="artwork">artwork</option>
                    </select>
                  </label>
                  <div className="permission-panel">
                    <div className="permission-panel-header">
                      <strong>Section Access</strong>
                      <span className="table-subtext">Tick the sections this user can access.</span>
                    </div>
                    <div className="permission-grid">
                      {Object.entries(VIEW_LABELS).map(([key, label]) => {
                        const permission = key as View;
                        return (
                          <label key={permission} className="permission-check">
                            <input
                              type="checkbox"
                              checked={draftPermissions.includes(permission)}
                              onChange={() => setDraftPermissions(togglePermission(draftPermissions, permission, draftRole))}
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="permission-panel">
                    <div className="permission-panel-header">
                      <strong>Dashboard Cards</strong>
                      <span className="table-subtext">Tick the dashboard cards this user should see.</span>
                    </div>
                    <div className="permission-grid">
                      {Object.entries(DASHBOARD_WIDGET_LABELS).map(([key, label]) => {
                        const widget = key as DashboardWidget;
                        return (
                          <label key={widget} className="permission-check">
                            <input
                              type="checkbox"
                              checked={draftDashboardWidgets.includes(widget)}
                              onChange={() => setDraftDashboardWidgets(toggleDashboardWidget(draftDashboardWidgets, widget, draftRole))}
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="inline-actions">
                    <button className="primary-button" onClick={() => handleSave(selectedProfile.id)}>Save</button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState title="No profiles found" body="Create the first user from this screen, or add auth users and matching profile rows in Supabase." />
        )}
      </section>
    </>
  );
}
