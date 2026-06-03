-- Phase 126.3 — Multi-use-case array + requires_slitting flag.
--
-- Rationale (Aman, 2026-06-03):
--   "What if paper has more than one use case? Also if I slit paper,
--    it's usually not the end product unless it's for paper handle
--    patches."
--
-- Slitting is moved OUT of PaperUseCase into a process flag because it's
-- a manufacturing step, not an end-use. The same reel can now be tagged
-- with multiple end-uses (e.g. 70gsm Unbleached Kraft → Paper Bags AND
-- Handle Patches).

alter table public.paper_rates
  add column if not exists use_cases text[] default '{}'::text[],
  add column if not exists requires_slitting boolean default false;

comment on column public.paper_rates.use_cases is
  'Array of end-uses (Paper Bags / Handle Patches / Rope / Greaseproof Paper / Liner / Other). Same paper can serve multiple.';
comment on column public.paper_rates.requires_slitting is
  'Set true when this reel must go through the slitter before it can be used (e.g. wide jumbo to be slit into handle-patch width).';

-- Seed migration — populate use_cases from the legacy single-value
-- use_case column so existing rows render under their group in the
-- multi-select UI without an admin having to re-touch them.
update public.paper_rates
   set use_cases = array[use_case]
 where use_case is not null
   and (use_cases is null or array_length(use_cases, 1) is null);

-- Tighten the Sappi PrimePak U seed (Phase 126.1) — it was originally
-- tagged "Slitting" which we've now dropped as a use case. Re-tag as
-- Paper Bags + Handle Patches (the realistic end-uses) and flag
-- requires_slitting = true so production knows to slit them first.
update public.paper_rates
   set use_cases = array['Paper Bags', 'Handle Patches']::text[],
       use_case = 'Paper Bags',
       requires_slitting = true
 where supplier_id = 'sup-sappi'
   and product_code = 'PrimePak U';
