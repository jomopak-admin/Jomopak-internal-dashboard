import { JobCard, UserProfile } from '../types';
import { supabase } from './supabase';

type ThreadRole = 'admin' | 'sales' | 'artwork' | 'production' | 'ops';

function getConversationVisibilityScope(job: JobCard) {
  return job.clientId ? 'client_shared' : 'internal';
}

function deriveThreadRoles(job: JobCard): ThreadRole[] {
  const roles = new Set<ThreadRole>(['admin', 'sales']);

  if (
    job.artworkPreparationStatus === 'Needs Design' ||
    job.artworkPreparationStatus === 'Ready but Not Print Ready' ||
    job.approvalStatus === 'Awaiting Approval' ||
    !job.finalApprovalReceivedDate
  ) {
    roles.add('artwork');
  }

  if (job.factoryReleaseDate || job.productionStartDate || job.status === 'In Production' || job.status === 'Ready for Production') {
    roles.add('production');
  }

  if (
    job.readyForDispatchDate ||
    job.collectionOrDeliveryStatus === 'Delivery Required' ||
    job.dispatchStatus
  ) {
    roles.add('ops');
  }

  return [...roles];
}

export function deriveWaitingOn(job: JobCard): string {
  if (!job.quickbooksEstimateNumber) return 'Waiting on sales';
  if (job.commercialReleaseStatus !== 'Cleared for Production') return 'Waiting on client';
  if (
    job.artworkPreparationStatus === 'Needs Design' ||
    job.approvalStatus === 'Awaiting Approval' ||
    !job.finalApprovalReceivedDate
  ) {
    return 'Waiting on artwork';
  }
  if (!job.factoryReleaseDate || !job.productionStartDate) return 'Waiting on factory';
  if (!job.readyForDispatchDate || job.collectionOrDeliveryStatus === 'Not Confirmed') return 'Waiting on dispatch';
  return 'In motion';
}

function buildEventMessages(previousJob: JobCard | null, nextJob: JobCard) {
  const messages: string[] = [];

  if (!previousJob) {
    messages.push(`Job card ${nextJob.jobNumber} created for ${nextJob.customerName}.`);
  }

  const fieldEvents: Array<[keyof JobCard, string]> = [
    ['quickbooksEstimateNumber', `QuickBooks estimate linked: ${nextJob.quickbooksEstimateNumber}`],
    ['invoiceNumber', `Invoice linked: ${nextJob.invoiceNumber}`],
    ['paymentStatus', `Payment status updated to ${nextJob.paymentStatus}.`],
    ['commercialReleaseStatus', `Commercial release status updated to ${nextJob.commercialReleaseStatus}.`],
    ['artworkAssignedTo', `Artwork assigned to ${nextJob.artworkAssignedTo}.`],
    ['artworkPreparationStatus', `Artwork status updated to ${nextJob.artworkPreparationStatus}.`],
    ['proofSharedDate', `Proof shared${nextJob.proofSharedBy ? ` by ${nextJob.proofSharedBy}` : ''}.`],
    ['finalApprovalReceivedDate', `Final artwork approval received${nextJob.finalApprovalClearedBy ? ` by ${nextJob.finalApprovalClearedBy}` : ''}.`],
    ['factoryReleaseDate', `Job released to factory${nextJob.factoryReleasedBy ? ` by ${nextJob.factoryReleasedBy}` : ''}.`],
    ['productionStartDate', `Production started${nextJob.productionStartedBy ? ` by ${nextJob.productionStartedBy}` : ''}.`],
    ['readyForDispatchDate', `Job marked ready for dispatch${nextJob.readyForDispatchBy ? ` by ${nextJob.readyForDispatchBy}` : ''}.`],
    ['dispatchStatus', `Dispatch status updated to ${nextJob.dispatchStatus}.`],
    ['collectionOrDeliveryStatus', `Collection / delivery updated to ${nextJob.collectionOrDeliveryStatus}.`],
  ];

  fieldEvents.forEach(([field, message]) => {
    if (!previousJob) return;
    const prev = previousJob[field];
    const next = nextJob[field];
    if (!prev && next) {
      messages.push(message);
    }
  });

  if (previousJob && previousJob.status !== nextJob.status) {
    messages.push(`Job stage changed from ${previousJob.status} to ${nextJob.status}.`);
  }

  if (previousJob && previousJob.paymentRequirement !== nextJob.paymentRequirement) {
    messages.push(`Payment basis changed from ${previousJob.paymentRequirement} to ${nextJob.paymentRequirement}.`);
  }

  if (previousJob && previousJob.readyForDispatchBy !== nextJob.readyForDispatchBy && nextJob.readyForDispatchBy) {
    messages.push(`Dispatch owner set to ${nextJob.readyForDispatchBy}.`);
  }

  const previousWaitingOn = previousJob ? deriveWaitingOn(previousJob) : null;
  const nextWaitingOn = deriveWaitingOn(nextJob);
  if (!previousJob || previousWaitingOn !== nextWaitingOn) {
    messages.push(`Action marker: ${nextWaitingOn}.`);
  }

  return Array.from(new Set(messages));
}

async function ensureJobConversation(job: JobCard, actor: UserProfile) {
  const { data: existing, error: existingError } = await supabase
    .from('conversations')
    .select('id')
    .eq('linked_job_id', job.id)
    .eq('type', 'job')
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        linked_client_id: job.clientId || null,
        visibility_scope: getConversationVisibilityScope(job),
      })
      .eq('id', existing.id);
    if (updateError) throw updateError;
    return existing.id;
  }

  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({
      type: 'job',
      title: `${job.jobNumber} · ${job.productName || 'Job'}`,
      description: job.description || null,
      linked_job_id: job.id,
      linked_client_id: job.clientId || null,
      created_by_user_id: actor.id,
      created_by_full_name: actor.publicDisplayName || actor.fullName || actor.email || 'Unknown user',
      visibility_scope: getConversationVisibilityScope(job),
    })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
}

async function syncParticipants(conversationId: string, job: JobCard) {
  const roles = deriveThreadRoles(job);
  const { data: internalProfiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, public_display_name, public_display_role')
    .eq('account_type', 'internal')
    .in('role', roles);

  if (error) throw error;

  const participantRows = (internalProfiles || []).map((person) => ({
    conversation_id: conversationId,
    user_id: person.id,
    full_name: person.public_display_name || person.full_name || person.email || 'Unknown user',
    role: person.public_display_role || person.role || 'ops',
  }));

  if (job.clientId) {
    const { data: clientProfiles, error: clientError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, public_display_name, public_display_role')
      .eq('account_type', 'client')
      .eq('client_id', job.clientId);

    if (clientError) throw clientError;

    participantRows.push(
      ...(clientProfiles || []).map((person) => ({
        conversation_id: conversationId,
        user_id: person.id,
        full_name: person.public_display_name || person.full_name || person.email || 'Client user',
        role: person.public_display_role || 'Client',
      })),
    );
  }

  if (!participantRows.length) return;

  const { error: upsertError } = await supabase
    .from('conversation_participants')
    .upsert(participantRows, { onConflict: 'conversation_id,user_id' });

  if (upsertError) throw upsertError;

  const allowedIds = participantRows.map((row) => row.user_id);
  const { data: existingParticipants, error: existingError } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId);

  if (existingError) throw existingError;

  const removableIds = (existingParticipants || [])
    .map((entry) => entry.user_id)
    .filter((userId) => userId && !allowedIds.includes(userId));

  if (removableIds.length) {
    const { error: deleteError } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .in('user_id', removableIds);

    if (deleteError) throw deleteError;
  }
}

export async function syncJobThread(job: JobCard, previousJob: JobCard | null, actor: UserProfile | null) {
  if (!actor?.id) return;

  const conversationId = await ensureJobConversation(job, actor);
  await syncParticipants(conversationId, job);

  const messages = buildEventMessages(previousJob, job);
  if (!messages.length) return;

  const messageRows = messages.map((body) => ({
    conversation_id: conversationId,
    sender_user_id: actor.id,
    sender_full_name: 'System',
    sender_role: 'system',
    visibility_scope: getConversationVisibilityScope(job),
    body,
  }));

  const { error } = await supabase.from('messages').insert(messageRows);
  if (error) throw error;
}
