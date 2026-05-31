-- Phase 97 Discovery — what's actually in your Supabase right now.
--
-- Run this in the Supabase SQL editor. It returns ONE row per table the
-- app expects, showing whether it exists and how many columns it has.
-- Tables marked 'MISSING' are why the app's falling back to localStorage.
--
-- Send me the output (copy/paste the result) and I'll write a surgical
-- catch-up migration that creates only the missing tables with the right
-- column shapes — no risk of clobbering anything that's already there.

with expected(table_name) as (values
  ('app_settings'),
  ('artwork_records'),
  ('bank_transactions'),
  ('bi_events'),
  ('chemical_register_entries'),
  ('cleaning_logs'),
  ('client_product_prices'),
  ('clients'),
  ('companies'),
  ('connector_feed'),
  ('cost_profiles'),
  ('customer_complaints'),
  ('customer_stock_releases'),
  ('delivery_notes'),
  ('dispatch_records'),
  ('dispatch_runs'),
  ('documents'),
  ('drill_entries'),                  -- Phase 95.2
  ('employees'),
  ('expense_claims'),
  ('finished_goods_stock'),
  ('finishing_operations'),
  ('first_aid_entries'),              -- Phase 82
  ('first_aid_aiders'),               -- Phase 82
  ('fixed_assets'),
  ('food_safe_materials'),
  ('foreign_object_records'),
  ('haccp_hazards'),
  ('incident_entries'),               -- Phase 95.1
  ('ink_rates'),
  ('inventory_movements'),
  ('invoice_inbox_items'),
  ('invoices'),
  ('jobs'),
  ('journal_entries'),
  ('leads'),
  ('leave_requests'),
  ('ledger_accounts'),
  ('machines'),
  ('maintenance_work_orders'),
  ('material_order_requests'),
  ('material_receipts'),
  ('non_conformances'),
  ('notices'),
  ('paper_logs'),
  ('paper_rates'),
  ('payroll_runs'),
  ('pest_control_records'),
  ('plate_costs'),
  ('ppe_issue_records'),
  ('press_rates'),
  ('pricing_tiers'),
  ('product_price_versions'),
  ('production_logs'),
  ('production_specs'),
  ('products'),
  ('profiles'),                       -- auth-linked
  ('proof_of_deliveries'),
  ('quote_estimates'),
  ('sars_filings'),
  ('she_meeting_entries'),            -- Phase 95.4
  ('shipments'),
  ('sop_documents'),
  ('spare_parts'),
  ('staff_loans'),
  ('staff_training_records'),
  ('staff_warnings'),
  ('stock_change_logs'),
  ('stock_count_lines'),
  ('stock_counts'),
  ('stock_issues'),
  ('stock_requests'),
  ('supplier_bills'),
  ('suppliers'),
  ('tool_blade_records'),
  ('toolbox_talk_entries'),           -- Phase 95.3
  ('tooling'),
  ('traded_goods_items'),             -- Phase 93
  ('traded_goods_receipts'),          -- Phase 93
  ('visitor_log_entries'),
  ('waste_entries'),
  ('work_tickets')
)
select
  e.table_name as expected_table,
  case when t.table_name is not null then 'EXISTS' else 'MISSING' end as status,
  coalesce(
    (select count(*) from information_schema.columns c
     where c.table_schema = 'public' and c.table_name = e.table_name),
    0
  ) as column_count
from expected e
left join information_schema.tables t
  on t.table_schema = 'public' and t.table_name = e.table_name
order by status desc, e.table_name;
