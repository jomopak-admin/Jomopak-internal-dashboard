-- Phase 71: food-safe inheritance chain for finished goods.
--
-- The food-safe property of a finished bag/box is derived from the materials
-- used to make it: the paper batch + every chemical (ink / glue / adhesive /
-- lubricant) on the job. Plus, paper carries an FSC claim.
--
-- This migration adds the source-of-truth flags on the upstream tables.
-- The derivation happens client-side in computeFgFoodSafe / computeFgFsc
-- (utils/calculations.ts) — no view needed.
--
-- Idempotent: safe to run more than once.

-- ----------- material_receipts (paper + other raw materials) -----------
alter table public.material_receipts
  add column if not exists is_food_safe text default 'unknown'
    check (is_food_safe in ('yes','no','unknown')),
  add column if not exists food_contact_cert_number text;

-- ----------- chemical_register_entries (inks, glues, adhesives) -----------
alter table public.chemical_register_entries
  add column if not exists is_food_safe text default 'unknown'
    check (is_food_safe in ('yes','no','unknown')),
  add column if not exists is_solvent_based boolean default false,
  add column if not exists food_contact_cert_number text;

-- ----------- jobs (chemicals used on this job) -----------
-- jsonb array of chemical_register_entries.id strings.
alter table public.jobs
  add column if not exists chemical_ids jsonb default '[]'::jsonb;
