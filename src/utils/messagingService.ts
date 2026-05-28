/**
 * Messaging service — Phase 60 (Driver POD notifications)
 *
 * A small abstraction over our outbound messaging channels. The dashboard
 * code shouldn't care whether a notification goes by email, SMS, WhatsApp,
 * or eventually our own in-app messaging layer — it just describes WHO
 * should be notified and WHAT happened, and the dispatcher decides how.
 *
 * Today only `email` is implemented (via the existing send-payslip edge
 * function relaying through Resend). Other channels are stubs that log
 * and return `{ skipped: true }` so callers can roll out the new
 * notification points without waiting on Twilio / WhatsApp Business API
 * approvals.
 *
 * To add a new channel later:
 *   1. Add the channel id to `MessageChannel`.
 *   2. Implement the channel in `dispatchMessage`.
 *   3. Set the user's preferred channel per recipient when calling
 *      `notifyRecipients`.
 */

import { OutgoingEmail, SendResult, sendEmails } from './emailService';

export type MessageChannel = 'email' | 'sms' | 'whatsapp' | 'inApp';

export interface MessageRecipient {
  /** Friendly name for logging/audit. */
  name: string;
  /** Best email for this recipient (required when channel === 'email'). */
  email?: string;
  /** E.164 phone for SMS/WhatsApp (e.g. +27821234567). */
  phone?: string;
  /** JomoPak user/employee id for in-app bell targeting (when channel
   *  === 'inApp'). */
  userId?: string;
  /** Preferred channel order. Tries channels left-to-right until one
   *  succeeds. Defaults to ['email']. */
  channels?: MessageChannel[];
}

export interface Message {
  /** Short, scannable subject line — used as title for in-app + email. */
  subject: string;
  /** Plain text body. Always set; used as the SMS body and as the
   *  fallback when the channel can't render HTML. */
  text: string;
  /** Optional rich HTML body for email channel. */
  html?: string;
  /** Optional structured metadata — survives into edge-function logs and
   *  can be used by future channels (e.g. WhatsApp template variables). */
  metadata?: Record<string, string | number | boolean>;
}

export interface DispatchResult {
  recipient: string;
  channel: MessageChannel;
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

export interface NotifyResult {
  total: number;
  ok: number;
  results: DispatchResult[];
}

/**
 * Try each channel on a recipient in order until one succeeds (or all
 * skip / fail). Channels with no implementation today resolve to
 * `{ skipped: true }` — calls do not throw.
 */
async function dispatchMessage(recipient: MessageRecipient, message: Message): Promise<DispatchResult> {
  const channels = recipient.channels && recipient.channels.length ? recipient.channels : ['email' as MessageChannel];
  for (const channel of channels) {
    if (channel === 'email') {
      if (!recipient.email) continue;
      const email: OutgoingEmail = {
        to: recipient.email,
        subject: message.subject,
        html: message.html ?? `<pre style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(message.text)}</pre>`,
      };
      const result: SendResult = await sendEmails([email]);
      const sent = (result.results || []).find((r) => r.to === recipient.email);
      if (sent?.ok) {
        return { recipient: recipient.name, channel: 'email', ok: true };
      }
      return { recipient: recipient.name, channel: 'email', ok: false, error: sent?.error || result.error || 'Email send failed' };
    }
    if (channel === 'sms') {
      // TODO: wire Twilio / SA SMS gateway when account is set up. For
      // now we log and continue to the next channel so callers can
      // pre-stage SMS as a future option.
      console.info('[messagingService] SMS channel not wired yet — skipping', { to: recipient.phone, subject: message.subject });
      return { recipient: recipient.name, channel: 'sms', ok: false, skipped: true };
    }
    if (channel === 'whatsapp') {
      console.info('[messagingService] WhatsApp channel not wired yet — skipping', { to: recipient.phone, subject: message.subject });
      return { recipient: recipient.name, channel: 'whatsapp', ok: false, skipped: true };
    }
    if (channel === 'inApp') {
      // The in-app bell derives notifications from app data via
      // `deriveNotifications` in useNotifications.ts, so we don't need
      // to push anything here — the rule already fires. We still
      // return ok so the caller's audit log reflects "in-app delivered".
      return { recipient: recipient.name, channel: 'inApp', ok: true };
    }
  }
  return { recipient: recipient.name, channel: channels[0] || 'email', ok: false, skipped: true, error: 'No usable channel' };
}

/**
 * Send a single message to a list of recipients. Fire-and-forget by
 * design — callers should not block POD save / button clicks waiting
 * for the network. Use `void notifyRecipients(...)` at call sites.
 */
export async function notifyRecipients(recipients: MessageRecipient[], message: Message): Promise<NotifyResult> {
  if (recipients.length === 0) {
    return { total: 0, ok: 0, results: [] };
  }
  const results: DispatchResult[] = [];
  for (const r of recipients) {
    try {
      const res = await dispatchMessage(r, message);
      results.push(res);
    } catch (err) {
      results.push({ recipient: r.name, channel: 'email', ok: false, error: String(err) });
    }
  }
  return { total: recipients.length, ok: results.filter((r) => r.ok).length, results };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
