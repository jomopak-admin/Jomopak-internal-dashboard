import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const VIEW_LABELS = {
  dashboard: 'Dashboard',
  salesDesk: 'Sales Desk',
  leads: 'Leads',
  calculator: 'Calculator',
  costInputs: 'Cost Inputs',
  permissions: 'Permissions',
  suppliers: 'Suppliers',
  quotes: 'Quotes & Estimates',
  artwork: 'Artwork',
  customerStock: 'Customer Stock',
  machines: 'Machines',
  jobs: 'Job Cards',
  products: 'Products',
  clients: 'Clients',
  pricing: 'Pricing Tiers',
  finishedStock: 'Finished Stock',
  spares: 'Parts & Spares',
  materials: 'Materials Receiving',
  production: 'Production Logs',
  waste: 'Waste Log',
  paper: 'Paper Log',
  dispatch: 'Dispatch',
  reports: 'Reports',
} as const;

type View = keyof typeof VIEW_LABELS;
type UserRole = 'admin' | 'ops' | 'production' | 'sales' | 'artwork';
type DashboardWidget =
  | 'stats'
  | 'monthSummary'
  | 'alerts'
  | 'quickCalculator'
  | 'finishedStock'
  | 'partsAttention'
  | 'recentJobs'
  | 'recentMaterials'
  | 'recentWaste'
  | 'recentProduction'
  | 'recentPaper'
  | 'recentDispatch'
  | 'wasteByReason'
  | 'topPaper';

const ROLE_DEFAULT_VIEWS: Record<UserRole, View[]> = {
  admin: [
    'dashboard',
    'salesDesk',
    'leads',
    'calculator',
    'costInputs',
    'permissions',
    'suppliers',
    'quotes',
    'artwork',
    'customerStock',
    'machines',
    'jobs',
    'products',
    'clients',
    'pricing',
    'finishedStock',
    'spares',
    'materials',
    'production',
    'waste',
    'paper',
    'dispatch',
    'reports',
  ],
  ops: [
    'dashboard',
    'leads',
    'calculator',
    'suppliers',
    'quotes',
    'artwork',
    'customerStock',
    'machines',
    'jobs',
    'products',
    'finishedStock',
    'spares',
    'materials',
    'production',
    'waste',
    'paper',
    'dispatch',
    'reports',
  ],
  production: [
    'dashboard',
    'jobs',
    'finishedStock',
    'materials',
    'production',
    'waste',
    'paper',
    'dispatch',
  ],
  sales: [
    'dashboard',
    'salesDesk',
    'leads',
    'calculator',
    'quotes',
    'artwork',
    'jobs',
    'products',
    'reports',
  ],
  artwork: [
    'dashboard',
    'artwork',
    'quotes',
    'jobs',
    'products',
    'reports',
  ],
};

const DASHBOARD_WIDGET_LABELS: Record<DashboardWidget, string> = {
  stats: 'Top Stats',
  monthSummary: 'Month Summary',
  alerts: 'Exceptions & Alerts',
  quickCalculator: 'Quick Calculator',
  finishedStock: 'Finished Stock On Hand',
  partsAttention: 'Parts Needing Attention',
  recentJobs: 'Recent Jobs',
  recentMaterials: 'Recent Material Receipts',
  recentWaste: 'Recent Waste Entries',
  recentProduction: 'Recent Production Logs',
  recentPaper: 'Recent Paper Logs',
  recentDispatch: 'Recent Dispatches',
  wasteByReason: 'Waste By Reason',
  topPaper: 'Top Paper Types Used',
};

const ROLE_DEFAULT_DASHBOARD_WIDGETS: Record<UserRole, DashboardWidget[]> = {
  admin: Object.keys(DASHBOARD_WIDGET_LABELS) as DashboardWidget[],
  ops: ['stats', 'monthSummary', 'alerts', 'finishedStock', 'partsAttention', 'recentJobs', 'recentMaterials', 'recentWaste', 'recentProduction', 'recentPaper', 'recentDispatch', 'wasteByReason', 'topPaper'],
  production: ['stats', 'monthSummary', 'alerts', 'finishedStock', 'partsAttention', 'recentJobs', 'recentMaterials', 'recentWaste', 'recentProduction', 'recentPaper', 'recentDispatch', 'wasteByReason', 'topPaper'],
  sales: ['stats', 'monthSummary', 'alerts', 'quickCalculator', 'recentJobs', 'recentDispatch'],
  artwork: ['stats', 'monthSummary', 'alerts', 'recentJobs'],
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizePermissions(role: UserRole, permissions?: string[] | null): View[] {
  const source = Array.isArray(permissions) && permissions.length
    ? permissions
    : ROLE_DEFAULT_VIEWS[role];
  const valid = source.filter((permission): permission is View => permission in VIEW_LABELS);
  if (!valid.includes('dashboard')) {
    valid.push('dashboard');
  }
  if (role === 'admin' && !valid.includes('permissions')) {
    valid.push('permissions');
  }
  return Array.from(new Set(valid));
}

function normalizeDashboardWidgets(role: UserRole, widgets?: string[] | null): DashboardWidget[] {
  const source = Array.isArray(widgets) && widgets.length
    ? widgets
    : ROLE_DEFAULT_DASHBOARD_WIDGETS[role];
  return Array.from(new Set(source.filter((widget): widget is DashboardWidget => widget in DASHBOARD_WIDGET_LABELS)));
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return json({ error: 'Supabase function environment is not configured.' }, 500);
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization header.' }, 401);
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) {
      return json({ error: 'Unable to verify the current user.' }, 401);
    }

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (callerProfileError || callerProfile?.role !== 'admin') {
      return json({ error: 'Only admin users can create dashboard users.' }, 403);
    }

    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const fullName = String(body.fullName ?? '').trim();
    const role = (String(body.role ?? 'ops') as UserRole);
    const permissions = normalizePermissions(role, body.permissions);
    const dashboardWidgets = normalizeDashboardWidgets(role, body.dashboardWidgets);

    if (!email || !password || !fullName) {
      return json({ error: 'Email, password, and full name are required.' }, 400);
    }

    if (!['admin', 'ops', 'production', 'sales', 'artwork'].includes(role)) {
      return json({ error: 'Invalid role provided.' }, 400);
    }

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (createUserError || !createdUser.user) {
      return json({ error: createUserError?.message ?? 'Failed to create auth user.' }, 400);
    }

    const nextProfile = {
      id: createdUser.user.id,
      email,
      full_name: fullName,
      role,
      permissions,
      dashboard_widgets: dashboardWidgets,
    };

    const { error: profileError } = await adminClient.from('profiles').upsert(nextProfile);
    if (profileError) {
      return json({ error: profileError.message }, 400);
    }

    return json(nextProfile, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return json({ error: message }, 500);
  }
});
