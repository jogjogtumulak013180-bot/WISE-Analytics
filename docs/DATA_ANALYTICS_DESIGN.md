# WISE Analytics — Data Import & Analytics Architecture (Design for Review)

Status: DRAFT for review — no code written yet.
Grounded in: `Files/Construction Project Management/Program of Works_3storey_bldg.xlsx`,
`Files/Municipal Water Supply System/Waterworks_Operation_2025.xlsx`,
`Hydraulic Design Criteria.xls`, `Water_System_Feasibility_Study.xls`,
plus existing Supabase tables (`wa_projects`, `wa_gis_features`).

---

## 1. What the sample files actually contain

### 1.1 Program of Works (Construction)
- **POW sheet** — one row per work item: `item_no, description, quantity, unit, unit_cost, amount` plus cost components `materials, equipment, manpower, mob_demob (1%), ocm (12%), profit (8%), vat (5%), total_amount`.
- **BOQ sheet** — hierarchical bill: division (`I.`, `II.` …) → item (`A.1` …) → sub-lines, each with `qty, unit, unit_cost, amount`.
- **DUPA sheets** (one per work item) — Detailed Unit Price Analysis: Materials (`desc, qty, unit, unit_cost, amount`), Equipment (`desc, qty, rate_per_day, no_of_days, amount`), Manpower (same shape), then indirect costs as % of direct cost → total construction cost and unit cost.
- Note: sample has `#REF!` errors — validation must reject non-numeric cost cells.

### 1.2 Waterworks Operation 2025 (Water — Operations + Financial)
- **Consumption** — per barangay per month (`barangay, source, Jan..Dec`), plus prior-year totals (YoY comparison exists in file).
- **Production** — per source per month; **Water losses = production − consumption** (NRW) already computed in file.
- **Operating costs** — Power (per electric meter/station, incl. boosters), Treatment (per source), Manpower (per position × headcount), Loan amortization (interest/principal). File computes **cost per cu.m.** for each.
- **Collections** — total collectible + collections per barangay per month → collection efficiency.

### 1.3 Hydraulic Design Criteria (Water — DED)
- Design parameters (lpcd, demand factors ADD/MDD/PHD, pressure/velocity limits, fire flow, tank capacity %, etc.).
- Demand projections per barangay (`households, hh_size, projected_pop, lpcd → demand lps/cmd`), demand **per EPANET node**, pump and tank sizing. Hydraulic analysis is EPANET 2 → the `.inp` import.

### 1.4 Water System Feasibility Study (Dev Planning — Pre-FS/FS)
- **Market exhibits (MKT-01..04)** — projected demand: residential/commercial/institutional; assumptions (hh size, lpcd, AAGR, market share, UFW %).
- **Technical exhibits (TCH-01..09)** — site, buildings, M&E, project cost summary.
- **O&M exhibits** — staffing/cost schedules.
- **Financial exhibits (FIN-01..18)** — depreciation, opex schedule, revenue requirement per m³ vs proposed tariff, loan amortization, projected income statement / cash flow / balance sheet — 20-year projection, one column per project year.

---

## 2. Architecture: staging → core (same pattern as DPMS)

```
Upload (XLSX/.inp)
   └─> parse server-side → rows land RAW in staging (jsonb, untouched)
        └─> validate every row against the sub-pillar schema (zod)
             └─> AUTO-REPAIR pass: deterministic fixes (#REF!, blanks, ≈ mismatches)
                 recomputed from the template's own formula rules; every fix logged
                  ├─ any UNREPAIRABLE row → dataset REJECTED, per-cell report
                  └─ all rows clean or repaired → AUTO-PROMOTE (single transaction,
                     Postgres RPC) into typed CORE tables — no manual step
                       └─> item dashboards read CORE via analytics views/queries
```

Cleaning is three-tier (confirmed 2026-07-12):

1. **Auto-clean (silent, logged)** — data-type coercion ("1,234" → 1234, "85%" → 0.85),
   whitespace/capitalization normalization against canonical enum values
   ("bagakay " → "Bagakay"), `N/A`, `n/a`, `-`, `—`, blank → NULL for optional
   fields, date format normalization. Never blocks, never deletes a row.
2. **Auto-repair (logged, audited)** — broken derived cells (`#REF!`, mismatches)
   recomputed from the template's own formula rules (see §3).
3. **Uncleanable** — the dataset still PROMOTES: all clean/repaired rows go to
   core, uncleanable rows are quarantined in staging (`needs_review`), dataset
   status = `promoted_with_warnings`, and the user is notified with a cell-level
   list of what couldn't be cleaned. Only a structurally invalid file (wrong/missing
   sheets or columns vs the template) is rejected outright.

### 2.1 Control tables

```sql
wa_projects            -- exists; extend with: pillar, sub_pillar, location,
                       -- status, general_info jsonb (name/location/unique fields
                       -- from the info sheet: contract amount, NTP date, tariff, etc.)

wa_datasets (
  id uuid pk,
  project_id -> wa_projects,
  sub_pillar text,             -- e.g. 'operations-monitoring'
  template_code text,          -- e.g. 'water-ops-v1', 'construction-pow-v1', 'epanet-inp'
  file_name text,
  status text,                 -- uploaded | validating | repairing | promoting
                               --   | promoted | promoted_with_warnings | rejected
  validation_report jsonb,     -- summary: rows, errors count, per-column stats
  created_at timestamptz
)
```

### 2.2 Staging — one generic table (jsonb), like DPMS raw landing

```sql
wa_staging_rows (
  id bigint pk,
  dataset_id -> wa_datasets,
  sheet text,                  -- which template sheet/section the row came from
  row_num int,
  raw jsonb,                   -- exact uploaded values, untouched
  clean jsonb,                 -- values after auto-repair (what gets promoted)
  errors jsonb,                -- [{col, rule, message}] — unrepairable only
  repairs jsonb,               -- [{col, rule, old, new}] — audit trail of fixes
  is_valid boolean,
  is_repaired boolean
)
```

One staging table for ALL sub-pillars keeps the pipeline uniform; the template
definition (see §3) decides how each row is validated and where it promotes to.

### 2.3 Core tables (typed, clean) — per domain

**Construction**
```sql
core_boq_items      (project_id, dataset_id, item_no, parent_item_no, description,
                     qty numeric, unit, unit_cost numeric, amount numeric)
core_pow_items      (project_id, dataset_id, item_no, description, qty, unit,
                     unit_cost, amount, materials, equipment, manpower,
                     mob_demob, ocm, profit, vat, total_amount)
core_dupa_lines     (project_id, dataset_id, item_no, resource_type m|e|l,
                     description, qty, unit, rate, days, amount)
core_progress       (project_id, dataset_id, period date, item_no,
                     planned_pct, actual_pct, actual_cost)      -- feeds Gantt/S-curve
core_variation_orders(project_id, vo_no, date, description, amount, time_ext_days, status)
core_quality_tests  (project_id, date, item_no, test_type, result, passed bool, remarks)
core_safety_logs    (project_id, date, incident_type, severity, manhours_lost, remarks)
core_punch_list     (project_id, ref_no, location, description, raised_date,
                     closed_date, status)
```

**Water — Operations & Financial**
```sql
core_water_production  (project_id, period date, source, volume_cum)
core_water_consumption (project_id, period date, barangay, source, volume_cum)
core_water_costs       (project_id, period date, cost_type power|treatment|manpower|loan,
                        ref text /* meter/station/position */, amount)
core_water_billing     (project_id, period date, barangay, billed_amount, collected_amount)
```

**Water — DED (EPANET)**
```sql
core_epanet_nodes  (project_id, dataset_id, node_id, kind junction|reservoir|tank,
                    elevation, base_demand, x, y, props jsonb)
core_epanet_links  (project_id, dataset_id, link_id, kind pipe|pump|valve,
                    node1, node2, length, diameter, roughness, props jsonb)
core_design_criteria (project_id, param, value numeric, unit, note)
```

**Dev Planning — FS/Pre-FS (long format handles 20-yr exhibits cleanly)**
```sql
core_fs_assumptions (project_id, param, value, unit)
core_fs_projections (project_id, exhibit text /* demand|opex|revenue|cashflow|balance */,
                     line_item text, year int, value numeric)
```

NRW, unit costs, collection efficiency, S-curves, variances are **derived — never stored as core data**; they're computed by analytics views/queries (§4).

---

## 3. Templates & validation

Template definitions live in code: `app/lib/templates/<template_code>.ts`
— single source of truth used for (a) generating the downloadable template,
(b) zod row validation, (c) staging→core promotion mapping.

| Pillar / Sub-pillar | Template | Populates items |
|---|---|---|
| Construction / Project Delivery | `construction-delivery-v1` — sheets: POW, BOQ, DUPA, VariationOrders, Contract, QualityTests | project-monitoring, variation-orders, contract-management, quality-control |
| Construction / Schedule & Cost Control | `construction-schedule-v1` — sheets: Progress (period × item planned/actual), SafetyLog, PunchList, AsBuiltRegister | schedule-gantt-scurve, cost-budget-monitoring, safety-monitoring, punch-list, as-built |
| Water / Detailed Engineering Design | **EPANET `.inp`** + `water-design-criteria-v1` CSV | interactive-gis-map |
| Water / Operations Monitoring | `water-ops-v1` — sheets: Production (source × month), Consumption (barangay × month), PowerCost (meter × month), PressureReadings (node/point × date), LeakReports (date, location, status), ReservoirLevels (tank × date) | ALL 10 items: production, consumption, nrw, energy, pump-ops, source-monitoring, pressure, leak, reservoir, ops-dashboard |
| Water / Utility Financial Ops | `water-fin-v1` — sheets: Costs (treatment/manpower/loan), Billing (barangay × month billed/collected) | revenue, opex, collection-efficiency, cash-flow, tariff, fin-dashboard |
| Water / Operations Report | no import — **generated output** from the two datasets above | water-operations-report |
| Dev Planning / Pre-FS + FS | `fs-model-v1` — sheets: Assumptions, DemandProjection, CapitalCost, OpexSchedule, Financing | FS/Pre-FS items (demand, cost, FIRR/NPV, tariff, financial statements) |
| Dev Planning / others + Municipal Intel | no sample files yet — **design deferred**, generic PPA-matrix / indicator templates in a later phase |
| Event Organizing | `event-training-v1` — sheets: Participants (name, office, sex, attendance), Scores (participant × pre/post-test), Evaluations (participant × criteria rating) | light analytics: attendance rate, score gain, evaluation summaries across Training Design/Tracks/Evaluation items |

**Validation + auto-repair (per row).** Each cell failure is classified as
REPAIRABLE (deterministically recomputable from other valid cells + the template's
declared rates) or UNREPAIRABLE (an input value is itself missing/broken).

*Auto-repair rules (grounded in the `#REF!` cases in your POW sample):*

| Broken cell | Recompute as | Needs valid |
|---|---|---|
| `amount` (BOQ/POW/DUPA) | `qty × unit_cost` (DUPA equip/labor: `qty × rate × days`) | qty, unit_cost |
| `unit_cost` | `amount ÷ qty` | amount, qty ≠ 0 |
| POW `mob_demob` | `rate_md × direct_cost` — rates read from the workbook's declared row (1%/12%/8%/5% in your sample), never hard-coded | materials+equipment+manpower |
| POW `ocm`, `profit` | `rate × direct_cost` | direct cost |
| POW `vat` | `rate_vat × (direct + ocm + profit)` | direct, ocm, profit |
| POW `total_amount` | `direct + md + ocm + profit + vat` | components |
| `amount ≈ qty × unit_cost` mismatch beyond tolerance | recompute amount, keep qty & unit_cost as source of truth | qty, unit_cost |

*Rows never imported:* TOTAL / summary rows (e.g., `TOTAL CONSTRUCTION COST:` = `#REF!`
in your sample) are dropped at parse time — totals are always derived by analytics,
so broken totals in the source file can't poison anything.

*Auto-clean rules (tier 1 — silent, logged, never blocks):*
- Numeric coercion: `"1,234.50"` → 1234.5, `"85%"` → 0.85, currency symbols stripped.
- Enum normalization: case-insensitive + trimmed match against the project's canonical lists (`"bagakay "` → `"Bagakay"`; fuzzy suggestion recorded if no exact case-fold match).
- Null normalization: `N/A`, `n/a`, `NA`, `-`, `—`, `""` → NULL for **optional** fields.
- Date normalization: `Jan`, `JANUARY`, `2025-01`, `1/2025` → period date.

*Uncleanable (row is QUARANTINED, not deleted — file still promotes):*
- All inputs broken — e.g., your `II.5 Temporary Fence` row where qty, unit AND unit_cost are `#REF!`. No arithmetic can recover invented quantities.
- Missing required identity fields (item_no/description, barangay, source, period).
- Enum value with no case-fold match against declared lists.
- Logical bounds: `actual_pct > 100`, period outside the project's reporting year.
- `.inp`: links referencing nonexistent nodes.
Quarantined rows stay in staging flagged `needs_review`; the dataset promotes as
`promoted_with_warnings` and the user is notified with the exact cells and reasons.

*Rejected outright (structural only):*
- Unknown/missing sheets or columns vs the template definition.
- `.inp`: missing `[JUNCTIONS] [PIPES] [COORDINATES]` sections.

Every repair is logged to `wa_staging_rows.repairs` and summarized in
`wa_datasets.validation_report`, so you can audit exactly what was changed —
raw values stay untouched in `raw`, promoted values come from `clean`.

**Automated promotion.** A `SECURITY DEFINER` Postgres function
`promote_dataset(dataset_id)` moves `clean` staging rows into the core tables in
one transaction and flips status to `promoted`. The upload server action calls it
automatically the moment validation ends with zero unrepairable rows — upload →
validated → repaired → promoted with no manual click. Re-uploading a file for the
same project + sub-pillar supersedes the previous dataset (old core rows for that
dataset are replaced atomically).

---

## 4. Analytics layer

Small data volumes → **compute on read, no precomputed result tables.**

- Postgres **views** for the standard aggregations, e.g.
  `v_water_nrw(project_id, period, source, production, consumption, nrw_cum, nrw_pct)`,
  `v_water_unit_cost`, `v_collection_efficiency`, `v_scurve(project_id, period, planned_cum_pct, actual_cum_pct)`.
- One analytics module per pillar: `app/lib/analytics/<pillar>.ts` mapping
  `item slug → query + chart config`. `CapabilityDashboard` gets a data-driven
  spec (KPI cards, series, table) instead of hard-coded fetches.
- API route `app/api/analytics/[pillar]/[group]/[item]/route.ts` runs the mapped
  query server-side and returns a uniform `DashboardPayload`.

Example mappings (Water / Operations Monitoring, all from one `water-ops-v1` import):
- production-monitoring → monthly production by source + trend
- consumption-monitoring → by barangay/source, top-10, YoY delta
- nrw-dashboard → production − consumption, % by month & source
- energy-monitoring → power cost per station, cost/cu.m.
- pump-operations → booster-station power & volume profiles
- water-source-monitoring → source share, capacity vs assumed efficiency
- operations-dashboard → KPI rollup of the above

---

## 5. UI flow (matches your 5-step spec)

1. **+ New Project** → picker: pillar → sub-pillar only.
2. **General info sheet** → writes `wa_projects` (name, location, pillar, sub_pillar, `general_info` jsonb with sub-pillar-specific fields: contract amount & NTP for construction; sources/barangays list, tariff, reporting year for water ops; design period & lpcd for DED/FS).
3. **Download template** → generated from the template definition (correct headers + one example row + a README sheet listing the rules).
4. **Upload → validate → auto-repair → auto-promote** in one pass. If everything is clean or repairable, the dataset lands in core with no further clicks; the result screen shows a repairs audit (what was fixed, old → new). If anything is unrepairable, the dataset is rejected with a cell-level report — fix in Excel, re-upload.
5. **Analytics live** → every item dashboard under the sub-pillar renders from core via the analytics views.

---

## 6. Build order (proposed)

1. Migration 1: `wa_datasets`, `wa_staging_rows`, extend `wa_projects`.
2. Pilot sub-pillar end-to-end (see open question): template def → new-project flow → upload/validate/promote → analytics views → wire its item dashboards.
3. Second sub-pillar of the same pillar (reuses the whole pipeline).
4. Roll pattern across remaining grounded sub-pillars (Construction ×2, Water ×4, FS/Pre-FS).
5. Deferred: Dev Planning thematic/PPA templates, Municipal Intelligence, Event Organizing (pending your call).

## 7. Decisions (confirmed 2026-07-12)

1. **Pilot pillar:** Municipal Water Systems.
2. **Template format:** one XLSX workbook per sub-pillar with fixed named sheets (`.inp` stays for EPANET/DED).
3. **Event Organizing:** yes — light analytics via `event-training-v1` (participants, attendance, pre/post-test scores, evaluation ratings).
4. **Pressure / Leak / Reservoir:** sourced from the Operations Monitoring dataset — included as sheets in `water-ops-v1` so one import populates all 10 Operations items.
5. **`#REF!` handling:** auto-repair, not reject — broken derived cells (amount, unit cost, indirect-cost components, totals) are recomputed from the template's own formula rules with a full audit trail.
6. **Staging → core clean-up is automated:** validation, repair, and promotion run as one pipeline via a transactional Postgres RPC — no manual promote step.
7. **Minor errors never delete rows:** type/case/N-A issues auto-clean silently; anything uncleanable is quarantined while the rest of the file promotes (`promoted_with_warnings`) and the user is notified cell-by-cell. Only structurally invalid files reject.

Additional core tables for the above:
```sql
core_water_pressure   (project_id, reading_date date, location, pressure_psi numeric)
core_water_leaks      (project_id, report_date date, location, description,
                       repaired_date date, status)
core_reservoir_levels (project_id, reading_date date, tank, level_m numeric,
                       capacity_cum numeric)
core_event_participants (project_id, name, office, sex, attendance_days int)
core_event_scores       (project_id, participant, pre_test numeric, post_test numeric)
core_event_evaluations  (project_id, participant, criteria, rating numeric)
```
