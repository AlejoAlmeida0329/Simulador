# Roadmap: Tikin Parafiscales Savings Simulator

## Overview

Build a professional web calculator that demonstrates payroll tax savings for Colombian companies using Tikin's salary flexibility bonuses. Journey from basic input/calculation engine → service cost analysis → visual presentation → exportable reports for sales demonstrations.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Foundation & Core Calculator** - Employee input and parafiscales calculation engine
- [ ] **Phase 2: Results Visualization & Comparison** - Professional charts, tables, and scenario comparison
- [ ] **Phase 3: Export & Reporting** - Downloadable PDF/Excel reports with full analysis
- [ ] **Phase 4: Service Cost Analysis** - Commercial tool for Tikin commission calculation

## Phase Details

### Phase 1: Foundation & Core Calculator
**Goal**: Working calculation engine with employee input and real-time parafiscales calculations

**Depends on**: Nothing (first phase)

**Requirements**: INPUT-01, INPUT-02, INPUT-03, INPUT-04, INPUT-05, INPUT-06, INPUT-07, INPUT-08, CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07, CALC-08, CALC-09, CALC-10

**Success Criteria** (what must be TRUE):
  1. User can add, edit, and remove employees with individual salaries
  2. User can adjust salary/bonus split slider and see immediate calculation updates
  3. User can select ARL risk level and system applies correct rates
  4. System accurately calculates all 6 parafiscal contributions (Health, Pension, ARL, SENA, ICBF, Caja)
  5. System shows clear comparison between Traditional (100% salary) vs Tikin (optimized split) scenarios
  6. Calculations update in real-time as user adjusts parameters

**Research**: Likely (web framework choice, state management, calculation validation)
**Research topics**: Modern web framework for Colombian market (React/Next.js vs alternatives), real-time calculation patterns, Colombian parafiscales rate validation sources

**Plans**: 3 plans created

Plans:
- **Plan A**: Project Setup & Employee Input System (INPUT-01 to INPUT-04)
  - Task 1: Initialize Next.js Project
  - Task 2: Create Employee Data Model & Validation
  - Task 3: Build Employee Input UI Component
- **Plan B**: Calculation Engine & ARL Configuration (INPUT-05 to INPUT-08, CALC-01 to CALC-06)
  - Task 1: Create Calculation Engine
  - Task 2: Implement Salary/Bonus Split Controls
  - Task 3: Add ARL Risk Level Selector & Integration
- **Plan C**: Scenario Comparison & Real-time Updates (CALC-07 to CALC-10)
  - Task 1: Implement Dual Scenario Calculator
  - Task 2: Build Scenario Comparison UI
  - Task 3: Add Savings Metrics Display

### Phase 2: Results Visualization & Comparison
**Goal**: Professional presentation with charts, multi-period projections, and calculation transparency

**Depends on**: Phase 1

**Requirements**: VIZ-01, VIZ-02, VIZ-03, VIZ-04, VIZ-05, VIZ-06, VIZ-07, VIZ-08, VIZ-09, VIZ-10, VIZ-11, VIZ-12, VIZ-13, VIZ-14, VIZ-15

**Success Criteria** (what must be TRUE):
  1. User sees side-by-side Traditional vs Tikin comparison with highlighted savings
  2. User sees 12-month projection table with 3-month and 6-month highlights
  3. User sees professional charts showing savings trends and percentage reductions
  4. User can expand section to view detailed calculation methodology (rates, formulas, assumptions)
  5. Interface looks professional and trustworthy for B2B sales presentations

**Research**: Likely (charting library selection, professional UI components)
**Research topics**: React charting libraries (Chart.js vs Recharts vs alternatives), Colombian business UI expectations, table/chart export capabilities

**Plans**: 3 plans created

Plans:
- **Plan A**: Multi-period Projection Table (VIZ-06, VIZ-07, VIZ-08)
  - Task 1: Create multi-period projection calculations
  - Task 2: Build projection table component
- **Plan B**: Professional Charts with Recharts (VIZ-09, VIZ-10, VIZ-11)
  - Task 1: Install and configure Recharts
  - Task 2: Create charts component (3 charts)
- **Plan C**: Calculation Transparency Section (VIZ-12, VIZ-13, VIZ-14, VIZ-15)
  - Task 1: Create expandable details component
  - Task 2: Integrate into comparison view

### Phase 3: Export & Reporting
**Goal**: Downloadable reports for client meetings and internal approval processes

**Depends on**: Phase 2

**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04, EXPORT-05, EXPORT-06, EXPORT-07, EXPORT-08

**Success Criteria** (what must be TRUE):
  1. User can generate downloadable report with single click
  2. Report includes complete parafiscales breakdown by contribution type
  3. Report includes 12-month projection table
  4. Report includes visual charts and graphs
  5. Report available in both PDF and Excel/CSV formats
  6. Report includes calculation methodology and assumptions

**Research**: Likely (PDF/Excel generation libraries)
**Research topics**: PDF generation libraries (jsPDF, react-pdf, Puppeteer), Excel generation (ExcelJS, SheetJS), chart-to-image conversion for reports

**Plans**: TBD

Plans:
- TBD

### Phase 4: Service Cost Analysis
**Goal**: Commercial tool for calculating Tikin service costs and platform recharge amounts

**Depends on**: Phase 1 (can be independent of Phases 2-3)

**Requirements**: COST-01, COST-02, COST-03, COST-04, COST-05, COST-06, COST-07, COST-08

**Success Criteria** (what must be TRUE):
  1. User can enter bonus payment amount and see required platform recharge
  2. User can adjust Tikin commission rate (1.25% to 4%)
  3. System accurately calculates commission with IVA (19%), Retención en la fuente (4%), and Reteica (9.66/1000)
  4. System displays total service cost breakdown (commission + IVA - retenciones)
  5. System can optionally integrate with main calculator to show net savings (parafiscal savings minus service cost)
  6. System shows ROI percentage when used with main calculator

**Research**: Unlikely (extends existing calculation engine with standard Colombian tax formulas)

**Plans**: TBD

Plans:
- TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Core Calculator | 3/3 | ✅ Complete | 2026-01-29 |
| 2. Results Visualization & Comparison | 3/3 | ✅ Complete | 2026-01-29 |
| 3. Export & Reporting | 0/TBD | Not started | - |
| 4. Service Cost Analysis | 0/TBD | Not started | - |
