# JomoPak Dashboard — Deploy & Test Checklist

Walk top to bottom. For each item: do the action, confirm the expected result. Tick the box. Note anything that loads empty, errors, or looks wrong, and send it back.

Legend: ✅ should work now · 🔌 needs an external account/key before it works · 🧪 unproven until you click it

---

## 0. Deploy (do these first)

- [ ] In Supabase SQL editor, run migrations **24 → 31** in order (you've done these; re-run any you're unsure of — all idempotent).
- [ ] From your Mac in the repo:
  ```
  cd ~/Desktop/mnt/data/jomopak-production-dashboard
  rm -f .git/index.lock
  git add -A
  git commit -m "Finance + payroll + GL + fixed assets + maintenance + FX"
  git push origin main
  ```
- [ ] Wait for Vercel to finish deploying, then hard-refresh internal.jomopak.co.za.
- [ ] Sign in as an **admin** user (admins see every screen).

---

## 1. Smoke test (nothing is broken)

- [ ] App loads, no blank screen.
- [ ] Sidebar shows the new groups: **Finance** and **Payroll**, plus **Maintenance** under Production.
- [ ] Open the browser console (F12). Note any red errors as you click around — those are the real bugs.
- [ ] Click every item in Finance, Payroll, and Production once. Each page should render (not crash), even if empty.

---

## 2. Chart of Accounts (Finance)

- [ ] Opens showing ~40 pre-seeded accounts grouped Asset / Liability / Equity / Income / Expense.
- [ ] Confirm these exist: **1100** Accounts Receivable, **2000** Accounts Payable, **1000** Bank, **2100** VAT Output, **1400** VAT Input, **1590** Accumulated Depreciation, **6150** Depreciation, **4920** Foreign Exchange Gain/(Loss).
- [ ] Add a test account, edit it, delete it — all persist after refresh.

> If it's empty: migration 24 didn't run. Re-run it.

## 3. Accounts Payable (Finance)

- [ ] "New bill" → pick a supplier, enter subtotal, hit the **15%** VAT button → total computes.
- [ ] Save → appears in the list as **Unpaid**, outstanding = total.
- [ ] Open it, add a payment for part of it → status flips to **Partially Paid**; full payment → **Paid**.
- [ ] Outstanding + Overdue totals at the top look right.

## 4. Customer Statements (Finance)

- [ ] With no client selected → shows the "outstanding by client" overview.
- [ ] Pick a client with an unpaid invoice → statement shows their invoices, ageing (Current/30/60/90/120+), total due.
- [ ] "Print statement" opens a clean printable with your letterhead.

## 5. P&L & VAT Summary (Finance)

- [ ] Pick "This financial year" → Revenue, Cost of Sales, Gross/Net profit populate from invoices + bills.
- [ ] VAT box shows Output / Input / Net.
- [ ] Export buttons download CSVs (P&L+VAT, Invoices, Supplier bills).

## 6. Bank Reconciliation (Finance)

- [ ] "Import statement" → upload a bank CSV → column mapping auto-detects Date/Description/Amount → preview looks right → Import.
- [ ] Transactions list; money-in green, money-out red.
- [ ] Match a line to an invoice (type → record), tick **reconciled** → 🔌/✅ go to that **invoice** and confirm a payment was recorded and balance dropped.
- [ ] Un-tick reconciled → confirm the payment is **removed** from the invoice (reversible).

## 7. General Ledger (Finance)

- [ ] "New journal" → add 2 lines (one debit, one credit) → "✓ Balanced" appears only when debits = credits → Save (blocked if unbalanced).
- [ ] "Generate draft journals" for a date range that has invoices/bills → creates **Draft** journals (Dr AR/Cr Sales/Cr VAT etc.).
- [ ] Open a draft, set status **Posted**, save.

## 8. Financial Statements (Finance)

- [ ] After posting some journals: **Trial Balance** tab → debits = credits ("✓ Debits equal credits").
- [ ] **Income Statement** → income, expenses, net profit for the period.
- [ ] **Balance Sheet** → Assets = Liabilities + Equity ("✓ Balance sheet balances").
- [ ] Each tab exports CSV.

> Empty here is expected until you POST journals (drafts don't count).

## 9. Fixed Assets (Finance)

- [ ] "New asset" → cost, residual, useful life → form shows monthly depreciation + book value.
- [ ] Save → list shows cost, accumulated depreciation, book value.
- [ ] "Post depreciation to GL" for a date → message says a draft journal was posted → confirm it appears in **General Ledger** (Dr 6150 / Cr 1590).

## 10. Currencies & FX (Finance)

- [ ] Rates table shows USD/EUR/GBP → edit a rate, Save → persists after refresh.
- [ ] Create a **foreign-currency invoice** (e.g. USD) — confirm it saves.
- [ ] On Currencies: **Revaluation** preview shows AR/AP deltas + net gain/loss for open foreign balances → "Post revaluation to GL" → draft journal appears in GL, balanced.
- [ ] **Realised FX**: pay part of a foreign invoice/bill, then "Post realised FX to GL" → draft journal posts and the figure doesn't re-appear if you click again (no double-count).

## 11. Payroll (Payroll group)

- [ ] **Employees** → add a staff member with pay + bank details.
- [ ] **Payroll** → "New payroll run" (monthly) → pulls active staff, pre-fills gross + UIF (1%, capped) + SDL (1%); enter PAYE manually → net computes.
- [ ] "View / print payslips" renders a payslip per employee.
- [ ] "Download bank EFT file" downloads a CSV with bank details + net amounts.
- [ ] Run totals show Net to pay + **EMP201** total.
- [ ] 🔌 "Email payslips" → expect "Email is not set up yet" until the Resend function is deployed (see §16).

## 12. SARS Centre (Finance)

- [ ] Deadlines show under "Action needed" / "Upcoming" with countdowns.
- [ ] Open a **VAT** period → Output/Input VAT auto-fill from invoices/bills; "Recalculate" works.
- [ ] Open an **EMP201 (PAYE)** period → "Recalculate from payroll" pulls PAYE+UIF+SDL from that month's payroll run.
- [ ] Mark one Submitted/Paid → it leaves "Action needed".

## 13. Maintenance (Production group)

- [ ] "Service due" panel lists machines whose next service is near/overdue (needs machines to have a next-service date).
- [ ] "New work order" → pick machine, type Preventive, save.
- [ ] Open it → "Mark completed + reschedule" → confirm on the **Machines** page that machine's next-service date moved forward by the interval.

## 14. Calculator Quote PDF (Sales)

- [ ] Build a multi-line calculation (add 2+ lines, pick a client).
- [ ] "Print Quote" → printable shows **all lines** in one quote with your letterhead, a plates/setup line if any, subtotal, VAT 15%, total, terms, signature lines.

## 15. The cross-module links ("everything connects")

- [ ] **OCR Inbox → AP**: open a reviewed inbox item → "Post to Accounts Payable" → a supplier bill is created in AP with the supplier/amounts.
- [ ] **Shipment → AP**: receive a shipment into stock → confirm a supplier bill for the goods value appears in AP (and isn't duplicated if you re-open).
- [ ] **Bank rec → AR/AP**: covered in §6.
- [ ] **Live AR → credit**: confirm a client with big unpaid invoices shows the right balance on the dashboard "over credit" tile / job credit block (not a stale figure).
- [ ] **SARS in alerts**: a SARS deadline within 30 days appears in the notification bell and the printed Morning Briefing.
- [ ] **Depreciation / FX → GL**: covered in §9 / §10.

---

## 16. Known — needs your action before it works (🔌)

- [ ] **Email payslips / statements** — create a Resend account, verify a sending domain, then `supabase functions deploy send-payslip` and set `RESEND_API_KEY` + `PAYROLL_FROM_EMAIL`. Until then the button safely says "not set up yet."
- [ ] **OCR auto-extract** (Google Document AI) — needs GCP credentials. Manual review of inbox items works without it.
- [ ] **SARS eFiling API** — not built (the SARS Centre is a prep/organizer, not a filer).
- [ ] **Website client portal** — not built (separate project).

## 17. Deferred (not built yet, by choice)

- [ ] Operator floor app (mobile production logging).
- [ ] EU export-readiness pass.
- [ ] Calculator formula audit (best done after you've sanity-checked real quote numbers).

---

### How to report back
For anything wrong, note: which page, what you clicked, what happened vs. what you expected, and any red console error. That's enough to fix it fast.
