/**
 * POD notifications — Phase 60
 *
 * When a POD lands (Delivered / Partial / Refused / Failed), figure out
 * who needs to know and dispatch the message via the messaging service.
 *
 * Recipients we resolve:
 *   1. Sales owner of the linked job (job.salesOwnerName → profile email)
 *   2. Account manager of the client (client.accountManagerEmail)
 *   3. Dispatch / ops supervisor — every active user with role 'ops' or
 *      'admin' whose profile flags `notifyOnPod` (future) or, for now,
 *      every admin so nothing falls through the cracks
 *   4. Accounts — only when the linked invoice has COD / deposit-required
 *      terms and an outstanding balance > 0
 *   5. The client — to the client's contact email, if the client profile
 *      opted in via `notifyClientOnDelivery` (default true)
 *
 * This module is intentionally pure: it accepts the data it needs and
 * returns a notification plan. The caller (App.tsx onPodCaptured) is
 * responsible for actually firing notifyRecipients() so the logic is
 * testable in isolation and can be re-used by the morning digest later.
 */

import {
  AppData,
  Client,
  Invoice,
  JobCard,
  ProofOfDelivery,
  UserProfile,
} from '../types';
import { Message, MessageRecipient } from './messagingService';

export interface PodNotificationPlan {
  recipients: MessageRecipient[];
  message: Message;
}

function emailFromName(name: string, profiles: UserProfile[]): string | undefined {
  if (!name) return undefined;
  const lower = name.trim().toLowerCase();
  const match = profiles.find((p) => (p.fullName || p.email || '').toLowerCase() === lower);
  return match?.email;
}

function buildPodMessage(pod: ProofOfDelivery, client: Client | undefined, job: JobCard | undefined): Message {
  const outcomeLabel = pod.outcome === 'Delivered' ? 'Delivered' : pod.outcome;
  const subject = `POD ${pod.podNumber} — ${outcomeLabel} (${pod.clientName || client?.name || 'Client'})`;
  const lines = [
    `Outcome:      ${pod.outcome}${pod.failureReason ? ` — ${pod.failureReason}` : ''}`,
    `Client:       ${pod.clientName || client?.name || '—'}`,
    `Job:          ${pod.jobNumber || job?.jobNumber || '—'}`,
    `Dispatch:     ${pod.dispatchNumber || '—'}`,
    `Driver:       ${pod.driverName || '—'}`,
    `Receiver:     ${pod.receiverName || '—'}${pod.receiverRole ? ` (${pod.receiverRole})` : ''}`,
    `Qty delivered: ${pod.quantityDelivered} ${pod.quantityUnit}`,
    `Condition:    ${pod.goodsCondition}${pod.conditionNotes ? ` — ${pod.conditionNotes}` : ''}`,
    `Captured:     ${pod.createdAt}`,
  ];
  return {
    subject,
    text: lines.join('\n'),
    metadata: {
      podId: pod.id,
      outcome: pod.outcome,
      clientId: pod.clientId,
      jobId: pod.jobId,
    },
  };
}

function buildClientFacingMessage(pod: ProofOfDelivery, client: Client | undefined, companyName: string): Message {
  const subject = pod.outcome === 'Delivered'
    ? `Your JomoPak delivery has been signed for (POD ${pod.podNumber})`
    : `JomoPak delivery update — ${pod.outcome} (POD ${pod.podNumber})`;
  const greeting = client?.contactName ? `Hi ${client.contactName}` : 'Hello';
  const body = pod.outcome === 'Delivered'
    ? [
        greeting + ',',
        '',
        `Your order ${pod.jobNumber ? `(Job ${pod.jobNumber})` : ''} has been delivered and signed for.`,
        '',
        `Received by: ${pod.receiverName}${pod.receiverRole ? ` (${pod.receiverRole})` : ''}`,
        `Quantity:    ${pod.quantityDelivered} ${pod.quantityUnit}`,
        `Condition:   ${pod.goodsCondition}`,
        `Time:        ${pod.createdAt}`,
        '',
        'A signed proof of delivery is on file. Reply to this email if anything looks wrong — we will investigate within one business day.',
        '',
        `Thank you,`,
        companyName || 'JomoPak',
      ].join('\n')
    : [
        greeting + ',',
        '',
        `Your delivery (POD ${pod.podNumber}) could not be completed: ${pod.outcome}.`,
        pod.failureReason ? `Reason: ${pod.failureReason}` : '',
        '',
        'Our team will be in touch shortly to arrange a re-delivery.',
        '',
        `Thank you,`,
        companyName || 'JomoPak',
      ].filter(Boolean).join('\n');
  return { subject, text: body };
}

/**
 * Compute who should be notified for a POD and the message body for each.
 * Returns separate plans for staff and the client so the caller can fire
 * them as distinct messages (different subject lines + tone).
 */
export function buildPodNotificationPlans(
  pod: ProofOfDelivery,
  data: AppData,
  profiles: UserProfile[],
): { staff: PodNotificationPlan; client: PodNotificationPlan | null } {
  const job = pod.jobId ? data.jobs.find((j) => j.id === pod.jobId) : undefined;
  const client = pod.clientId ? data.clients.find((c) => c.id === pod.clientId) : undefined;
  const invoice: Invoice | undefined = job
    ? data.invoices.find((inv) => inv.jobId === job.id)
    : undefined;

  const staffRecipients: MessageRecipient[] = [];
  const seen = new Set<string>();
  const pushIfEmail = (name: string, email?: string) => {
    if (!email) return;
    const key = email.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    staffRecipients.push({ name, email, channels: ['email', 'inApp'] });
  };

  // (1) Sales owner of the job
  if (job?.salesOwnerName) {
    pushIfEmail(`Sales: ${job.salesOwnerName}`, emailFromName(job.salesOwnerName, profiles));
  }
  // (2) Account manager of the client (lookup email via profile name match)
  if (client?.accountManagerName) {
    pushIfEmail(`Account mgr: ${client.accountManagerName}`, emailFromName(client.accountManagerName, profiles));
  }
  // (3) Dispatch / ops supervisors — every admin + every ops user with an email
  for (const p of profiles) {
    if (!p.email) continue;
    if (p.role === 'admin' || p.role === 'ops') {
      pushIfEmail(`${p.role}: ${p.fullName || p.email}`, p.email);
    }
  }
  // (4) Accounts — only for COD / deposit jobs with outstanding balance
  if (pod.outcome === 'Delivered' && invoice && (Number(invoice.amountOutstanding) || 0) > 0) {
    const isCod = job?.paymentRequirement === 'Full Payment' || job?.paymentRequirement === '50% Deposit';
    if (isCod) {
      for (const p of profiles) {
        if (p.role === 'accounts' && p.email) {
          pushIfEmail(`Accounts (COD): ${p.fullName || p.email}`, p.email);
        }
      }
    }
  }

  const staff: PodNotificationPlan = {
    recipients: staffRecipients,
    message: buildPodMessage(pod, client, job),
  };

  // (5) The client — only if they have an email and opted in.
  let clientPlan: PodNotificationPlan | null = null;
  const clientEmail = client?.contactEmail;
  const optedIn = client?.notifyClientOnDelivery !== false; // default true
  if (clientEmail && optedIn) {
    clientPlan = {
      recipients: [{ name: client?.name || pod.clientName || 'Client', email: clientEmail, channels: ['email'] }],
      message: buildClientFacingMessage(pod, client, data.appSettings?.company?.name || 'JomoPak'),
    };
  }

  return { staff, client: clientPlan };
}
