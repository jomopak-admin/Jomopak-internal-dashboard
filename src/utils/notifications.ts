/**
 * Phase 106.5 — Pluggable notification dispatcher.
 *
 * Per Aman's spec: the system must NEVER hard-code one notification
 * method. Any approval / event surface goes through this dispatcher,
 * which fans the payload out to every enabled channel.
 *
 * Channels available at launch:
 *   - 'inbox'      → in-app Activity Inbox (always on; can't be disabled)
 *   - 'email'      → SMTP / Resend (stub here; activates when EmailProvider
 *                    is registered)
 *   - 'sms'        → SMS gateway (stub)
 *   - 'whatsapp'   → WhatsApp Business API (stub)
 *   - 'push'       → Browser / mobile push (stub)
 *   - 'app'        → Future JomoPak company messaging app (stub)
 *
 * Architecture:
 *   - NotificationProvider is the interface every channel implements.
 *   - The default registry only has the inbox provider (since the Inbox
 *     producer pipeline handles its own rendering). Other providers are
 *     registered later via registerProvider() when integration creds
 *     are added (Resend API key, Twilio SID, etc.).
 *   - dispatch() reads the recipient's channel preferences from their
 *     UserProfile / Employee — if no preference set, defaults to inbox
 *     + email so an approval never goes unseen.
 *   - Every dispatch attempt is logged so the audit trail records which
 *     channels actually fired (and which failed, for ops debugging).
 *
 * Why fully abstract instead of "just add Resend"?
 *   - Aman's spec explicitly calls out NOT hard-coding a method.
 *   - Visitor approvals, leave decisions, stock alerts, etc. will all
 *     reuse this layer — one dispatcher feeds every notification path.
 *   - When the company messaging app ships, it's a 30-line provider
 *     registration, not a rewrite.
 */

import { Employee, UserProfile } from '../types';

export type NotificationChannel =
  | 'inbox'      // always on (in-app Activity Inbox)
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'push'
  | 'app';       // company messaging app (future)

export const ALL_NOTIFICATION_CHANNELS: NotificationChannel[] = [
  'inbox', 'email', 'sms', 'whatsapp', 'push', 'app',
];

/** Severity drives styling + sound + which channels get used when the
 *  recipient hasn't opted in to everything. Critical always uses every
 *  enabled channel; routine respects user preference. */
export type NotificationPriority = 'routine' | 'important' | 'critical';

/** What the dispatcher needs to know about who to reach. We pass a
 *  shape rather than the full UserProfile so callers can synthesize
 *  one for ad-hoc recipients (e.g. an external partner not in our
 *  user table yet). */
export interface NotificationRecipient {
  /** Display name for the audit log + greeting. */
  name: string;
  /** Optional — when present, used to look up channel preferences. */
  userProfileId?: string;
  /** Optional — when present, used to look up channel addresses
   *  (email / phone) and channel preferences. */
  employeeId?: string;
  /** Explicit channel overrides for THIS notification — when set,
   *  bypasses the recipient's stored preferences. Used by escalations
   *  ("urgent — also SMS this one"). */
  overrideChannels?: NotificationChannel[];
  /** Direct addresses if we don't have a profile/employee record yet. */
  email?: string;
  phone?: string;
}

/** A single notification ready to dispatch. Channel-agnostic. */
export interface NotificationPayload {
  /** Stable id used to dedupe + correlate with the audit log. */
  id: string;
  recipient: NotificationRecipient;
  /** Short headline — the email subject, push title, SMS line 1. */
  title: string;
  /** Long-form body — falls through to email body / WhatsApp template
   *  variable. SMS truncates if needed. */
  body: string;
  priority: NotificationPriority;
  /** When set, the in-app Inbox + email both link back here on click. */
  deepLink?: string;
  /** Free metadata for the audit log. */
  meta?: Record<string, string | number | boolean>;
}

/** What a channel reports back after attempting delivery. */
export interface NotificationDispatchResult {
  channel: NotificationChannel;
  delivered: boolean;
  /** When delivered=false, why. Surfaced in the audit log. */
  error?: string;
  /** Optional channel-specific id (Resend message id, Twilio sid, etc). */
  externalId?: string;
}

/** Interface every channel implements. */
export interface NotificationProvider {
  channel: NotificationChannel;
  /** Returns true if this provider can deliver to this recipient on
   *  this channel — drives the "do we even attempt this" check. */
  canDeliver(payload: NotificationPayload): boolean;
  /** Attempt delivery. Returns the result; should NEVER throw — wrap
   *  network failures in delivered=false + error. */
  send(payload: NotificationPayload): Promise<NotificationDispatchResult>;
}

/* ─── Provider registry ───────────────────────────────────────────── */

const registry = new Map<NotificationChannel, NotificationProvider>();

export function registerProvider(provider: NotificationProvider): void {
  registry.set(provider.channel, provider);
}

export function unregisterProvider(channel: NotificationChannel): void {
  registry.delete(channel);
}

export function listRegisteredProviders(): NotificationChannel[] {
  return Array.from(registry.keys());
}

/* ─── The inbox provider — always available ──────────────────────── */

/** Inbox provider — no-op `send()` because the Activity Inbox is
 *  populated by the producer pipeline in utils/inbox.ts. We register
 *  this so dispatch() reports a successful 'inbox' channel result and
 *  the audit log says "delivered via inbox", even though the actual
 *  rendering happens server-side via state. */
const InboxProvider: NotificationProvider = {
  channel: 'inbox',
  canDeliver: () => true,
  async send(payload) {
    return {
      channel: 'inbox',
      delivered: true,
      externalId: `inbox:${payload.id}`,
    };
  },
};
registerProvider(InboxProvider);

/* ─── Dispatcher ──────────────────────────────────────────────────── */

/** Per-user channel preferences. Lives on UserProfile (Phase 106.5.1
 *  will add the picker UI on My Stuff). Defaults guarantee an approval
 *  request still reaches the user via at least Inbox + Email. */
export interface NotificationPreferences {
  /** Channels the user wants routine notifications on. */
  routineChannels?: NotificationChannel[];
  /** Channels for important notifications. */
  importantChannels?: NotificationChannel[];
  /** Critical always uses every available channel — preference ignored
   *  so escalations can't be missed. */
}

const DEFAULT_ROUTINE: NotificationChannel[] = ['inbox'];
const DEFAULT_IMPORTANT: NotificationChannel[] = ['inbox', 'email'];

/** Resolve which channels to use for this payload + recipient.
 *  Order of precedence:
 *    1. payload.recipient.overrideChannels (per-message override)
 *    2. recipient's stored preferences for this priority
 *    3. priority defaults
 *  Critical always fans out to every registered channel.
 */
export function resolveChannels(
  payload: NotificationPayload,
  preferences?: NotificationPreferences,
): NotificationChannel[] {
  if (payload.recipient.overrideChannels && payload.recipient.overrideChannels.length > 0) {
    return payload.recipient.overrideChannels;
  }
  if (payload.priority === 'critical') {
    return listRegisteredProviders();
  }
  if (payload.priority === 'important') {
    return preferences?.importantChannels ?? DEFAULT_IMPORTANT;
  }
  return preferences?.routineChannels ?? DEFAULT_ROUTINE;
}

/** Dispatch a notification across every applicable channel.
 *  Resolves channels → filters to registered + capable providers →
 *  calls each in parallel → returns the array of results so the
 *  caller can log + retry. Never throws. */
export async function dispatch(
  payload: NotificationPayload,
  preferences?: NotificationPreferences,
): Promise<NotificationDispatchResult[]> {
  const requestedChannels = resolveChannels(payload, preferences);
  const attempts = requestedChannels.map(async (channel): Promise<NotificationDispatchResult> => {
    const provider = registry.get(channel);
    if (!provider) {
      return {
        channel,
        delivered: false,
        error: `No provider registered for channel '${channel}'`,
      };
    }
    if (!provider.canDeliver(payload)) {
      return {
        channel,
        delivered: false,
        error: `Provider for '${channel}' cannot deliver (missing address?)`,
      };
    }
    try {
      return await provider.send(payload);
    } catch (e) {
      return {
        channel,
        delivered: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });
  return Promise.all(attempts);
}

/* ─── Recipient resolution helpers ───────────────────────────────── */

/** Build a NotificationRecipient from a UserProfile + the matching
 *  Employee record. Pulls email/phone from whichever source has them. */
export function recipientFromProfile(
  profile: Pick<UserProfile, 'id' | 'fullName' | 'email' | 'phoneNumber' | 'linkedEmployeeId'>,
  employee?: Pick<Employee, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>,
): NotificationRecipient {
  const employeeName = employee ? `${employee.firstName} ${employee.lastName}`.trim() : '';
  return {
    name: profile.fullName || employeeName || profile.email || 'Recipient',
    userProfileId: profile.id,
    employeeId: profile.linkedEmployeeId ?? employee?.id,
    email: profile.email || employee?.email,
    phone: profile.phoneNumber || employee?.phone,
  };
}

/** Lighter variant when we only have an Employee (no login profile yet). */
export function recipientFromEmployee(
  employee: Pick<Employee, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>,
): NotificationRecipient {
  return {
    name: `${employee.firstName} ${employee.lastName}`.trim() || 'Employee',
    employeeId: employee.id,
    email: employee.email,
    phone: employee.phone,
  };
}

/* ─── Provider stubs ─────────────────────────────────────────────── */
/* These get registered when integration credentials are configured
 * (Resend API key, Twilio SID, WhatsApp Business token, etc). Until
 * then they're not registered, so dispatch() falls back to Inbox-only
 * — no crashes, no missing notifications. */

/** Stub email provider — wire up when Resend/SES/etc. lands. */
export function createEmailProvider(_config: { apiKey: string; fromAddress: string }): NotificationProvider {
  return {
    channel: 'email',
    canDeliver: (payload) => !!payload.recipient.email,
    async send(payload) {
      // TODO: POST to Resend / SES / SMTP
      // For now, return delivered=false so callers know nothing left.
      void payload;
      return { channel: 'email', delivered: false, error: 'Email provider not yet implemented' };
    },
  };
}

/** Stub SMS provider — wire up when Twilio/MessageBird/etc. lands. */
export function createSmsProvider(_config: { accountSid: string; authToken: string; fromNumber: string }): NotificationProvider {
  return {
    channel: 'sms',
    canDeliver: (payload) => !!payload.recipient.phone,
    async send(payload) {
      void payload;
      return { channel: 'sms', delivered: false, error: 'SMS provider not yet implemented' };
    },
  };
}

/** Stub WhatsApp provider — wire up via the WhatsApp Business Cloud API. */
export function createWhatsAppProvider(_config: { phoneNumberId: string; accessToken: string }): NotificationProvider {
  return {
    channel: 'whatsapp',
    canDeliver: (payload) => !!payload.recipient.phone,
    async send(payload) {
      void payload;
      return { channel: 'whatsapp', delivered: false, error: 'WhatsApp provider not yet implemented' };
    },
  };
}

/** Stub push provider — browser push first, mobile push later. */
export function createPushProvider(_config: { vapidPublicKey: string }): NotificationProvider {
  return {
    channel: 'push',
    canDeliver: () => true,
    async send(payload) {
      void payload;
      return { channel: 'push', delivered: false, error: 'Push provider not yet implemented' };
    },
  };
}

/** Stub for the future JomoPak company messaging app. Wire up when
 *  the app's notification API lands. */
export function createCompanyAppProvider(_config: { apiUrl: string; apiKey: string }): NotificationProvider {
  return {
    channel: 'app',
    canDeliver: (payload) => !!payload.recipient.userProfileId,
    async send(payload) {
      void payload;
      return { channel: 'app', delivered: false, error: 'Company app provider not yet implemented' };
    },
  };
}
