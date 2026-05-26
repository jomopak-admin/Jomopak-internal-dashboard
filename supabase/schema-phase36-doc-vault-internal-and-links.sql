-- Phase 36 — Document Vault: internal company docs + deep links + role visibility
--
--   * ownerType already supports 'supplier' | 'client'; the app code now also
--     emits 'internal' (no schema change required for the text column).
--   * Optional deep links from a doc to the specific invoice / job / quote /
--     delivery note it belongs to (used for operational client docs like a
--     signed POD against delivery note DLV-9).
--   * visible_to_roles for internal documents — empty array = visible to
--     everyone; otherwise visible only to the listed roles (admin always sees).
--
-- Idempotent — safe to re-run.

alter table public.documents add column if not exists linked_invoice_id       text;
alter table public.documents add column if not exists linked_job_id           text;
alter table public.documents add column if not exists linked_quote_id         text;
alter table public.documents add column if not exists linked_delivery_note_id text;
alter table public.documents add column if not exists visible_to_roles        text[];

create index if not exists documents_linked_invoice_idx on public.documents(linked_invoice_id);
create index if not exists documents_linked_job_idx     on public.documents(linked_job_id);
create index if not exists documents_owner_type_idx     on public.documents(owner_type);

notify pgrst, 'reload schema';
