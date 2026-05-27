import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  DASHBOARD_WIDGET_LABELS,
  DashboardWidget,
  Employee,
  JobCard,
  Lead,
  normalizeDashboardWidgets,
  normalizeProfilePermissions,
  ROLE_DEFAULT_DASHBOARD_WIDGETS,
  ROLE_DEFAULT_VIEWS,
  UserProfile,
  VIEW_LABELS,
  View,
} from '../../types';

export interface HandoverPayload {
  toName: string;
  clientIds: string[];
  leadIds: string[];
  jobIds: string[];
}

function HandoverList({ title, items, picked, onToggle, onAll }: {
  title: string;
  items: Array<{ id: string; label: string }>;
  picked: Set<string>;
  onToggle: (id: string) => void;
  onAll: (on: boolean) => void;
}) {
  if (!items.length) return <div className="perm-group" style={{ marginTop: '0.6rem' }}><div className="perm-group-head"><span className="perm-group-title">{title}</span></div><p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>None.</p></div>;
  const allOn = items.every((i) => picked.has(i.id));
  return (
    <div className="perm-group" style={{ marginTop: '0.6rem' }}>
      <div className="perm-group-head">
        <span className="perm-group-title">{title}</span>
        <button type="button" className="perm-group-toggle" onClick={() => onAll(!allOn)}>{allOn ? 'Clear' : 'Select all'}</button>
      </div>
      <div className="perm-group-grid">
        {items.map((i) => (
          <label key={i.id} className="permission-check">
            <input type="checkbox" checked={picked.has(i.id)} onChange={() => onToggle(i.id)} />
            <span>{i.label || i.id}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function HandoverPanel({ staffOptions, clients, leads, jobs, onHandover }: {
  staffOptions: string[];
  clients: Client[];
  leads: Lead[];
  jobs: JobCard[];
  onHandover: (payload: HandoverPayload) => void;
}) {
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [pickedClients, setPickedClients] = useState<Set<string>>(new Set());
  const [pickedLeads, setPickedLeads] = useState<Set<string>>(new Set());
  const [pickedJobs, setPickedJobs] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');

  const isOpenLead = (l: Lead) => l.status !== 'Won' && l.status !== 'Lost';
  const isOpenJob = (j: JobCard) => j.status !== 'Completed';

  const fromClients = useMemo(() => (fromName ? clients.filter((c) => c.accountManagerName === fromName) : []), [fromName, clients]);
  const fromLeads = useMemo(() => (fromName ? leads.filter((l) => isOpenLead(l) && l.assignedTo === fromName) : []), [fromName, leads]);
  const fromJobs = useMemo(() => (fromName ? jobs.filter((j) => isOpenJob(j) && j.salesOwnerName === fromName) : []), [fromName, jobs]);

  const ownerOptions = useMemo(() => {
    const s = new Set<string>();
    clients.forEach((c) => { if (c.accountManagerName) s.add(c.accountManagerName); });
    leads.forEach((l) => { if (isOpenLead(l) && l.assignedTo) s.add(l.assignedTo); });
    jobs.forEach((j) => { if (isOpenJob(j) && j.salesOwnerName) s.add(j.salesOwnerName); });
    staffOptions.forEach((n) => s.add(n));
    return Array.from(s).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [clients, leads, jobs, staffOptions]);

  // When the From person changes, default to selecting all their items.
  useEffect(() => {
    setPickedClients(new Set(fromClients.map((c) => c.id)));
    setPickedLeads(new Set(fromLeads.map((l) => l.id)));
    setPickedJobs(new Set(fromJobs.map((j) => j.id)));
    setMessage('');
  }, [fromName]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  }

  function apply() {
    if (!fromName || !toName) { setMessage('Pick who to hand over from and to.'); return; }
    if (fromName === toName) { setMessage('Choose two different people.'); return; }
    const clientIds = Array.from(pickedClients);
    const leadIds = Array.from(pickedLeads);
    const jobIds = Array.from(pickedJobs);
    if (!clientIds.length && !leadIds.length && !jobIds.length) { setMessage('Nothing selected to hand over.'); return; }
    onHandover({ toName, clientIds, leadIds, jobIds });
    setMessage(`Handed over ${clientIds.length} client(s), ${leadIds.length} lead(s) and ${jobIds.length} job(s) to ${toName}.`);
    setFromName('');
    setToName('');
  }

  return (
    <section className="card">
      <SectionTitle title="Hand over a person's accounts" subtitle="Move a departing rep's clients, open leads and open jobs to someone else." />
      <div className="form-grid">
        <label><span>From (the person leaving / reassigning)</span>
          <select value={fromName} onChange={(e) => setFromName(e.target.value)}>
            <option value="">Select person…</option>
            {ownerOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label><span>To (new owner)</span>
          <select value={toName} onChange={(e) => setToName(e.target.value)}>
            <option value="">Select person…</option>
            {staffOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      {fromName ? (
        <>
          <HandoverList
            title={`Clients (${fromClients.length})`}
            items={fromClients.map((c) => ({ id: c.id, label: c.companyName || c.name }))}
            picked={pickedClients}
            onToggle={(id) => toggle(pickedClients, setPickedClients, id)}
            onAll={(on) => setPickedClients(on ? new Set(fromClients.map((c) => c.id)) : new Set())}
          />
          <HandoverList
            title={`Open leads (${fromLeads.length})`}
            items={fromLeads.map((l) => ({ id: l.id, label: `${l.leadNumber || ''} ${l.companyName || l.clientName || ''}`.trim() }))}
            picked={pickedLeads}
            onToggle={(id) => toggle(pickedLeads, setPickedLeads, id)}
            onAll={(on) => setPickedLeads(on ? new Set(fromLeads.map((l) => l.id)) : new Set())}
          />
          <HandoverList
            title={`Open jobs (${fromJobs.length})`}
            items={fromJobs.map((j) => ({ id: j.id, label: `${j.jobNumber || ''} ${j.customerName || ''}`.trim() }))}
            picked={pickedJobs}
            onToggle={(id) => toggle(pickedJobs, setPickedJobs, id)}
            onAll={(on) => setPickedJobs(on ? new Set(fromJobs.map((j) => j.id)) : new Set())}
          />
          <div className="accounting-actions" style={{ gap: '0.6rem', marginTop: '0.8rem' }}>
            <button type="button" className="primary-button" onClick={apply}>Hand over selected</button>
          </div>
        </>
      ) : (
        <p className="muted">Pick a person above to see their clients, open leads and open jobs, tick what to move, then choose the new owner.</p>
      )}
      {message ? <p className="muted">{message}</p> : null}
    </section>
  );
}

interface CreateUserFormState {
  email: string;
  password: string;
  fullName: string;
  username: string;
  phoneNumber: string;
  clientId: string;
  accountType: UserProfile['accountType'];
  publicDisplayName: string;
  publicDisplayRole: string;
  role: UserProfile['role'];
  permissions: View[];
  dashboardWidgets: DashboardWidget[];
}

interface PermissionsPageProps {
  profiles: UserProfile[];
  loading: boolean;
  onSave: (profile: UserProfile) => Promise<void>;
  onCreateUser: (payload: CreateUserFormState) => Promise<void>;
  staffOptions: string[];
  clients: Client[];
  leads: Lead[];
  jobs: JobCard[];
  employees: Employee[];
  onHandover: (payload: HandoverPayload) => void;
}

const initialCreateUserForm = (): CreateUserFormState => ({
  email: '',
  password: '',
  fullName: '',
  username: '',
  phoneNumber: '',
  clientId: '',
  accountType: 'internal',
  publicDisplayName: '',
  publicDisplayRole: '',
  role: 'artwork',
  permissions: ROLE_DEFAULT_VIEWS.artwork,
  dashboardWidgets: ROLE_DEFAULT_DASHBOARD_WIDGETS.artwork,
});

/** Section-access grouped by area, with a Select all / Clear per group. */
const PERMISSION_GROUPS: Array<{ title: string; views: View[] }> = [
  { title: 'Overview', views: ['dashboard', 'morningDigest', 'reports', 'profitability', 'cashFlow'] },
  { title: 'Sales & CRM', views: ['salesPipeline', 'salesDesk', 'leads', 'leadAnalytics', 'quotes', 'invoices', 'agedDebtors', 'customerStatements', 'clients', 'pricing', 'priceList', 'calculator', 'costInputs', 'costMasters'] },
  { title: 'Production', views: ['productionSchedule', 'materialRequirements', 'artwork', 'productionSpecs', 'jobs', 'workTicket', 'machines', 'maintenance', 'production', 'waste', 'paper'] },
  { title: 'Materials & Stock', views: ['materials', 'shipments', 'invoiceInbox', 'finishedStock', 'customerStock', 'stockStatements', 'reorderReminders', 'stockTake', 'spares', 'stockRequests', 'stockRequestsApprove', 'stockRequestsBuy', 'products', 'suppliers', 'dispatch', 'driverPod', 'deliveryNotes'] },
  { title: 'Finance', views: ['sarsCentre', 'financeSummary', 'financialStatements', 'accountsPayable', 'bankRec', 'generalLedger', 'fixedAssets', 'currencies', 'chartOfAccounts'] },
  { title: 'Payroll', views: ['payroll', 'employees', 'staffLeave', 'staffLeaveApprove', 'staffLoans', 'expenseClaims', 'expenseClaimsApprove', 'irp5Centre', 'staffWarnings'] },
  { title: 'Food Safety & Compliance', views: ['foodSafetyControlCentre', 'haccpRegister', 'sopRegister', 'nonConformance', 'traceability', 'complaints', 'staffTraining', 'ppeControl', 'pestControl', 'foreignObjectControl', 'toolBladeControl', 'visitorLog', 'chemicalRegister', 'foodSafeMaterials', 'cleaningLogs'] },
  { title: 'Staff portal', views: ['myPortal', 'notices'] },
  { title: 'Admin', views: ['documentVault', 'osConnector', 'visitorKiosk', 'permissions', 'settings'] },
];

/** Short, plain-English explanation of what each section is, shown as a hover
 *  hint next to its checkbox so whoever assigns access knows what they're granting. */
const VIEW_DESCRIPTIONS: Partial<Record<View, string>> = {
  dashboard: 'Home overview — key stats, alerts and what needs attention today.',
  salesDesk: 'Sales desk workspace for day-to-day sales activity.',
  calculator: 'Custom quote calculator — price one-off jobs from paper + cost inputs.',
  workTicket: 'Detailed production work tickets / job costing sheets.',
  costMasters: 'Master cost rates (ink, paper, press, finishing) used in costing.',
  costInputs: 'Cost profiles and rate inputs that drive pricing.',
  leads: 'CRM leads — enquiries, follow-ups and lead status.',
  permissions: 'Manage users, roles and who can see what (this screen).',
  settings: 'Company branding, document templates and defaults.',
  osConnector: 'Read-only API — control what curated data this dashboard shares with external systems (Aman OS, other dashboards, your website).',
  suppliers: 'Supplier records, contacts and accounts.',
  quotes: 'Saved quotes / estimates sent to customers.',
  priceList: 'Standard product price list (cost-plus pricing, breaks, tiers).',
  artwork: 'Artwork tracking — proofs, approvals and revisions.',
  customerStock: 'Customer-held stock releases and balances.',
  deliveryNotes: 'Delivery notes / dispatch paperwork.',
  invoices: 'Customer invoices, payments and outstanding balances.',
  productionSpecs: 'Production specification sheets per product/job.',
  machines: 'Machine register and details.',
  jobs: 'Job cards — the production order pipeline.',
  products: 'Product catalogue and standard product specs.',
  clients: 'Customer records, contacts, credit and stock-holding terms.',
  pricing: 'Pricing tiers and default margins.',
  finishedStock: 'Finished goods stock on hand.',
  spares: 'Spares, consumables and tools.',
  materials: 'Materials receiving (paper and other inputs).',
  chemicalRegister: 'Chemical register / MSDS safety data sheets.',
  foodSafeMaterials: 'Food-safe / food-contact approved materials.',
  cleaningLogs: 'Cleaning and sanitation logs.',
  foodSafetyControlCentre: 'Food safety control-centre overview.',
  haccpRegister: 'HACCP hazard analysis register.',
  nonConformance: 'Master incident register — non-conformance, customer complaints, foreign-object finds, process deviations, wrong artwork sent, equipment failures and corrective actions all in one place.',
  sopRegister: 'Standard operating procedure documents.',
  staffTraining: 'Staff training and hygiene records.',
  ppeControl: 'PPE issue and control.',
  pestControl: 'Pest control register.',
  foreignObjectControl: 'Foreign object control register.',
  contaminationControl: 'Retired (Phase 43). Foreign Object Register + Pest Control Register are now separate menu items; NCR is the unified incident view.',
  toolBladeControl: 'Tools and blade control / accountability.',
  visitorLog: 'Visitor and contractor sign-in log.',
  visitorKiosk: 'Full-screen reception kiosk for visitor self check-in / sign-out (lock an Android tablet to this).',
  traceability: 'Batch traceability and recall.',
  complaints: 'Customer complaints and recall handling.',
  agedDebtors: 'Aged debtors — who owes you and how overdue.',
  profitability: 'Profitability analysis by job / client / product.',
  salesPipeline: 'Sales pipeline (lead → quote → job → invoice).',
  productionSchedule: 'Production schedule and machine capacity.',
  materialRequirements: 'Material requirements forecast (what to buy).',
  cashFlow: 'Cash-flow forecast (30 / 60 / 90 day).',
  morningDigest: 'Daily morning briefing / digest.',
  reorderReminders: 'Reorder reminders for stock-holding customers.',
  leadAnalytics: 'Lead conversion analytics.',
  driverPod: 'Driver proof-of-delivery capture.',
  invoiceInbox: 'Supplier invoice inbox / OCR capture.',
  stockTake: 'Stock takes and variance counts.',
  documentVault: 'Document vault — client / supplier compliance docs.',
  shipments: 'Imports and shipments tracking.',
  chartOfAccounts: 'Chart of accounts.',
  accountsPayable: 'Accounts payable — supplier bills you owe.',
  sarsCentre: 'SARS centre — tax deadlines and VAT / EMP prep.',
  financeSummary: 'P&L and VAT summary report.',
  customerStatements: 'Customer statements (accounts receivable).',
  employees: 'Employee records (payroll).',
  payroll: 'Payroll runs and payslips.',
  bankRec: 'Bank reconciliation.',
  generalLedger: 'General ledger and journals.',
  financialStatements: 'Financial statements (trial balance, P&L, balance sheet).',
  fixedAssets: 'Fixed-asset register and depreciation.',
  currencies: 'Currencies and FX rates.',
  maintenance: 'Maintenance scheduling and work orders.',
  production: 'Production logs.',
  waste: 'Waste log.',
  paper: 'Paper usage log.',
  dispatch: 'Dispatch records.',
  reports: 'Reports and exports.',
  myPortal: 'Personal staff portal — pinned notices, training to acknowledge, SOP sign-offs and a link to their payslips.',
  notices: 'Post notices to the whole team or specific roles (admin only).',
  staffWarnings: 'Issue formal warnings (verbal / written 1 / 2 / final), commendations and notes to staff members. Sensitive — only grant to factory managers and HR.',
  stockRequests: 'Submit stock requests (need tape, gloves, tools, etc.). Default on for all staff.',
  stockRequestsApprove: 'Approve / decline stock requests before they reach the buyer. Grant to factory managers.',
  stockRequestsBuy: 'Fulfill approved stock requests — issue from stock or raise a PO. Grant to your buying team. This permission also unlocks the Suppliers page.',
  staffLeave: 'Leave register — every leave request, balance reports, BCEA accrual. Admin / HR view.',
  staffLeaveApprove: 'Approve or decline leave requests submitted by staff. Grant to factory managers / department heads.',
  staffLoans: 'Staff loans & salary advances — auto-deducted from monthly payslips. Grant to HR / accounts only.',
  irp5Centre: 'Year-end IRP5 / IT3(a) per employee + EMP501 reconciliation. Exports SARS easyFile-compatible CSV. Accounts / external accountant only.',
  expenseClaims: 'Expense / claim requests — staff submit, manager approves, accounts pays out (via payslip reimbursement or banking).',
  expenseClaimsApprove: 'Approve / decline expense claims. Grant to factory managers / department heads.',
  stockStatements: 'Generate stock-statement reports per client — opening + receipts + releases + closing on hand. Printable / CSV / email-ready. The physical-stock equivalent of Customer Statements (AR).',
};

function SectionAccessGrid({ selected, role, onChange }: {
  selected: View[];
  role: UserProfile['role'];
  onChange: (next: View[]) => void;
}) {
  const selectedSet = new Set(selected);
  const used = new Set<View>();
  const groups = PERMISSION_GROUPS
    .map((g) => {
      const views = g.views.filter((v): v is View => v in VIEW_LABELS);
      views.forEach((v) => used.add(v));
      return { title: g.title, views };
    })
    .filter((g) => g.views.length);
  const leftover = (Object.keys(VIEW_LABELS) as View[]).filter((v) => !used.has(v));
  if (leftover.length) groups.push({ title: 'Other', views: leftover });

  function setMany(views: View[], on: boolean) {
    const next = new Set(selected);
    views.forEach((v) => (on ? next.add(v) : next.delete(v)));
    onChange(normalizeProfilePermissions(role, Array.from(next)));
  }
  function toggleOne(view: View) {
    const next = selected.includes(view) ? selected.filter((v) => v !== view) : [...selected, view];
    onChange(normalizeProfilePermissions(role, next));
  }

  return (
    <div className="perm-groups">
      {groups.map((group) => {
        const onCount = group.views.filter((v) => selectedSet.has(v)).length;
        const allOn = onCount === group.views.length;
        return (
          <div className="perm-group" key={group.title}>
            <div className="perm-group-head">
              <span className="perm-group-title">{group.title}</span>
              <span className="perm-group-count">{onCount}/{group.views.length}</span>
              <button type="button" className="perm-group-toggle" onClick={() => setMany(group.views, !allOn)}>
                {allOn ? 'Clear' : 'Select all'}
              </button>
            </div>
            <div className="perm-group-grid">
              {group.views.map((view) => (
                <label key={view} className="permission-check" title={VIEW_DESCRIPTIONS[view] || VIEW_LABELS[view]}>
                  <input type="checkbox" checked={selectedSet.has(view)} onChange={() => toggleOne(view)} />
                  <span>{VIEW_LABELS[view]}</span>
                  {VIEW_DESCRIPTIONS[view] ? (
                    <span className="perm-info" tabIndex={0} role="img" aria-label={VIEW_DESCRIPTIONS[view]} title={VIEW_DESCRIPTIONS[view]}>ⓘ</span>
                  ) : null}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PermissionsPage({ profiles, loading, onSave, onCreateUser, staffOptions, clients, leads, jobs, employees, onHandover }: PermissionsPageProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftUsername, setDraftUsername] = useState('');
  const [draftPhoneNumber, setDraftPhoneNumber] = useState('');
  const [draftClientId, setDraftClientId] = useState('');
  const [draftLinkedEmployeeId, setDraftLinkedEmployeeId] = useState('');
  const [draftAccountType, setDraftAccountType] = useState<UserProfile['accountType']>('internal');
  const [draftPublicDisplayName, setDraftPublicDisplayName] = useState('');
  const [draftPublicDisplayRole, setDraftPublicDisplayRole] = useState('');
  const [draftRole, setDraftRole] = useState<UserProfile['role']>('ops');
  const [draftPermissions, setDraftPermissions] = useState<View[]>(ROLE_DEFAULT_VIEWS.ops);
  const [draftDashboardWidgets, setDraftDashboardWidgets] = useState<DashboardWidget[]>(ROLE_DEFAULT_DASHBOARD_WIDGETS.ops);
  const [createUserForm, setCreateUserForm] = useState(initialCreateUserForm);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [message, setMessage] = useState('');


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
        username: draftUsername,
        phoneNumber: draftPhoneNumber,
        clientId: draftClientId,
        linkedEmployeeId: draftLinkedEmployeeId || undefined,
        accountType: draftAccountType,
        publicDisplayName: draftPublicDisplayName,
        publicDisplayRole: draftPublicDisplayRole,
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
    setDraftUsername(profile.username);
    setDraftPhoneNumber(profile.phoneNumber);
    setDraftClientId(profile.clientId);
    setDraftLinkedEmployeeId(profile.linkedEmployeeId ?? '');
    setDraftAccountType(profile.accountType);
    setDraftPublicDisplayName(profile.publicDisplayName);
    setDraftPublicDisplayRole(profile.publicDisplayRole);
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
              <span>Username</span>
              <input
                value={createUserForm.username}
                onChange={(event) => setCreateUserForm({ ...createUserForm, username: event.target.value })}
                placeholder="lebo"
              />
            </label>
            <label>
              <span>Phone number</span>
              <input
                value={createUserForm.phoneNumber}
                onChange={(event) => setCreateUserForm({ ...createUserForm, phoneNumber: event.target.value })}
                placeholder="+27..."
              />
            </label>
            <label>
              <span>Linked client ID</span>
              <input
                value={createUserForm.clientId}
                onChange={(event) => setCreateUserForm({ ...createUserForm, clientId: event.target.value })}
                placeholder="Only for client accounts"
              />
            </label>
            <label>
              <span>Account type</span>
              <select
                value={createUserForm.accountType}
                onChange={(event) => setCreateUserForm({ ...createUserForm, accountType: event.target.value as UserProfile['accountType'] })}
              >
                <option value="internal">internal</option>
                <option value="client">client</option>
              </select>
            </label>
            <label>
              <span>Display name</span>
              <input
                value={createUserForm.publicDisplayName}
                onChange={(event) => setCreateUserForm({ ...createUserForm, publicDisplayName: event.target.value })}
                placeholder="Lebo"
              />
            </label>
            <label>
              <span>Display role</span>
              <input
                value={createUserForm.publicDisplayRole}
                onChange={(event) => setCreateUserForm({ ...createUserForm, publicDisplayRole: event.target.value })}
                placeholder="Client Care"
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
                <option value="accounts">accounts</option>
              </select>
            </label>
          </div>
          <div className="permission-panel">
            <div className="permission-panel-header">
              <strong>Section Access</strong>
              <span className="table-subtext">Tick exactly what this user can see in the dashboard.</span>
            </div>
            <SectionAccessGrid
              selected={createUserForm.permissions}
              role={createUserForm.role}
              onChange={(next) => setCreateUserForm({ ...createUserForm, permissions: next })}
            />
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

      <HandoverPanel
        staffOptions={staffOptions}
        clients={clients}
        leads={leads}
        jobs={jobs}
        onHandover={onHandover}
      />

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
                    <p className="muted">
                      {selectedProfile.accountType} · {selectedProfile.clientId || 'No linked client'} · {selectedProfile.publicDisplayName || 'No display name'} · {selectedProfile.publicDisplayRole || 'No display role'}
                    </p>
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
                    <span>Username</span>
                    <input value={draftUsername} onChange={(event) => setDraftUsername(event.target.value)} placeholder="lebo" />
                  </label>
                  <label>
                    <span>Phone number</span>
                    <input value={draftPhoneNumber} onChange={(event) => setDraftPhoneNumber(event.target.value)} placeholder="+27..." />
                  </label>
                  <label>
                    <span>Linked client ID</span>
                    <input value={draftClientId} onChange={(event) => setDraftClientId(event.target.value)} placeholder="Only for client accounts" />
                  </label>
                  <label>
                    <span>Linked employee (for payslips)</span>
                    <select value={draftLinkedEmployeeId} onChange={(event) => setDraftLinkedEmployeeId(event.target.value)}>
                      <option value="">— not linked —</option>
                      {employees.filter((e) => e.active !== false).map((e) => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}{e.jobTitle ? ` · ${e.jobTitle}` : ''}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Account type</span>
                    <select value={draftAccountType} onChange={(event) => setDraftAccountType(event.target.value as UserProfile['accountType'])}>
                      <option value="internal">internal</option>
                      <option value="client">client</option>
                    </select>
                  </label>
                  <label>
                    <span>Display name</span>
                    <input value={draftPublicDisplayName} onChange={(event) => setDraftPublicDisplayName(event.target.value)} placeholder="Lebo" />
                  </label>
                  <label>
                    <span>Display role</span>
                    <input value={draftPublicDisplayRole} onChange={(event) => setDraftPublicDisplayRole(event.target.value)} placeholder="Client Care" />
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
                      <option value="accounts">accounts</option>
                    </select>
                  </label>
                  <div className="permission-panel">
                    <div className="permission-panel-header">
                      <strong>Section Access</strong>
                      <span className="table-subtext">Tick the sections this user can access.</span>
                    </div>
                    <SectionAccessGrid
                      selected={draftPermissions}
                      role={draftRole}
                      onChange={setDraftPermissions}
                    />
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
