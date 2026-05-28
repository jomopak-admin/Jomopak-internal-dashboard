-- Phase 68: rename the default food-safety hold status from "In Production"
-- to "In Stock". A batch sitting in finished goods isn't in production any more —
-- the old label made no sense to anyone reading the badge in the UI.
--
-- This is purely a label change. Lifecycle is otherwise unchanged:
--   In Stock        -> default for non-food batches (no QC required)
--   Awaiting QC     -> default for food-contact batches awaiting release
--   On Hold         -> held by QC for investigation
--   Released        -> QC approved
--   Rejected        -> QC rejected
--   Reworked        -> sent back and reworked
--   Dispatched      -> left the building
--   Recalled        -> recalled after dispatch
--
-- Idempotent: safe to run more than once.

update public.finished_goods_stock
   set food_safety_hold_status = 'In Stock'
 where food_safety_hold_status = 'In Production';
