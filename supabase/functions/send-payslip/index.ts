// send-payslip — Supabase Edge Function (Phase 26.1)
//
// Sends payslip emails via Resend. The frontend posts a batch of messages
// ({ to, subject, html }); we verify the caller is an authenticated dashboard
// user, then relay each message to the Resend API.
//
// Required function secrets (set with `supabase secrets set ...`):
//   RESEND_API_KEY      — your Resend API key
//   PAYROLL_FROM_EMAIL  — a verified Resend sender, e.g. "payroll@jomopak.co.za"
// SUPABASE_URL / SUPABASE_ANON_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  cc?: string;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('PAYROLL_FROM_EMAIL');

    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ error: 'Supabase function environment is not configured.' }, 500);
    }
    if (!resendApiKey || !fromEmail) {
      return json({ error: 'Email is not set up yet. Add RESEND_API_KEY and PAYROLL_FROM_EMAIL as function secrets.' }, 500);
    }

    // Verify the caller is a signed-in dashboard user.
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization header.' }, 401);
    }
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      return json({ error: 'Unable to verify the current user.' }, 401);
    }

    const body = await request.json();
    const emails: OutgoingEmail[] = Array.isArray(body?.emails) ? body.emails : [];
    if (emails.length === 0) {
      return json({ error: 'No emails to send.' }, 400);
    }

    const results: { to: string; ok: boolean; error?: string }[] = [];
    for (const msg of emails) {
      if (!msg.to || !msg.subject || !msg.html) {
        results.push({ to: msg.to || '(blank)', ok: false, error: 'Missing to / subject / html.' });
        continue;
      }
      try {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [msg.to],
            cc: msg.cc ? [msg.cc] : undefined,
            subject: msg.subject,
            html: msg.html,
          }),
        });
        if (resp.ok) {
          results.push({ to: msg.to, ok: true });
        } else {
          const errText = await resp.text();
          results.push({ to: msg.to, ok: false, error: `Resend ${resp.status}: ${errText.slice(0, 200)}` });
        }
      } catch (err) {
        results.push({ to: msg.to, ok: false, error: String(err) });
      }
    }

    const sent = results.filter((r) => r.ok).length;
    return json({ sent, total: emails.length, results });
  } catch (err) {
    return json({ error: `Unexpected error: ${String(err)}` }, 500);
  }
});
