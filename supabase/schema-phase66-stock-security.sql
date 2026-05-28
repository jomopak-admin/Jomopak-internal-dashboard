-- Phase 66 — Stock security: restricted visibility + high-value approval
--
-- Adds the small set of columns needed to enforce stock-room discipline
-- without restructuring the existing tables:
--
--   profiles.stock_visibility   — 'full' (default) or 'restricted'.
--                                  Restricted users see "In stock /
--                                  Out of stock" instead of exact qty
--                                  + unit cost on the Spares page.
--   profiles.approval_pin       — 4-digit PIN. Required to approve a
--                                  high-value issue. Only set for
--                                  foremen / ops / admin.
--
--   spare_parts.is_high_value   — flag for items that need foreman PIN
--                                  to be issued. Examples: premium ink
--                                  drums, branded uniforms, master die
--                                  sets.
--
--   stock_issues.signature_data_url  — receiver's on-screen signature.
--                                       Captured on every issue going
--                                       forward (legacy rows left null).
--   stock_issues.approver_user_id    — when high-value, the foreman who
--   stock_issues.approver_name        approved with PIN.
--   stock_issues.high_value_at_issue  — snapshot of the item's high-
--                                       value flag at issue time, so
--                                       later reclassification doesn't
--                                       lose the security context.
--
-- Idempotent. Safe to re-run.

alter table public.profiles
  add column if not exists stock_visibility text default 'full',
  add column if not exists approval_pin     text;

alter table public.spare_parts
  add column if not exists is_high_value    boolean default false;

alter table public.stock_issues
  add column if not exists signature_data_url    text,
  add column if not exists approver_user_id      text,
  add column if not exists approver_name         text,
  add column if not exists high_value_at_issue   boolean default false;

create index if not exists spare_parts_high_value_idx
  on public.spare_parts (is_high_value)
  where is_high_value = true;

create index if not exists stock_issues_high_value_idx
  on public.stock_issues (high_value_at_issue)
  where high_value_at_issue = true;

notify pgrst, 'reload schema';
