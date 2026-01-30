# Requirements: Tikin Parafiscales Savings Simulator

**Defined:** 2026-01-29
**Core Value:** Enable sales teams to instantly demonstrate quantified, credible savings that compel Colombian companies to adopt Tikin's salary flexibility platform by showing exact parafiscal cost reductions over 3, 6, and 12 month periods.

## v1 Requirements

### Input & Configuration

- [ ] **INPUT-01**: User can add multiple employees with individual salary amounts
- [ ] **INPUT-02**: User can edit employee salaries after adding them
- [ ] **INPUT-03**: User can remove employees from the calculation
- [ ] **INPUT-04**: System calculates aggregate parafiscal impact across all employees
- [ ] **INPUT-05**: User can adjust salary/bonus split via interactive slider (60% minimum to 100%)
- [ ] **INPUT-06**: System updates parafiscal calculations in real-time as slider moves
- [ ] **INPUT-07**: User can select company-wide ARL risk level (I through V)
- [ ] **INPUT-08**: System applies corresponding ARL rates (0.5% to 6.96%) based on selected risk level

### Calculation Engine

- [ ] **CALC-01**: System calculates Health contribution (8.5% of salary base)
- [ ] **CALC-02**: System calculates Pension contribution (12% of salary base)
- [ ] **CALC-03**: System calculates ARL contribution (rate based on risk level)
- [ ] **CALC-04**: System calculates SENA contribution (2% of salary base)
- [ ] **CALC-05**: System calculates ICBF contribution (3% of salary base)
- [ ] **CALC-06**: System calculates Caja Compensación contribution (4% of salary base)
- [ ] **CALC-07**: System calculates parafiscales for traditional scenario (100% salary)
- [ ] **CALC-08**: System calculates parafiscales for Tikin scenario (optimized salary/bonus split)
- [ ] **CALC-09**: System calculates total savings (traditional minus Tikin scenario)
- [ ] **CALC-10**: System calculates percentage reduction in parafiscal burden

### Service Cost Analysis

- [ ] **COST-01**: User can adjust Tikin commission rate (1.25% to 4%)
- [ ] **COST-02**: System calculates commission amount on total bonus payments
- [ ] **COST-03**: System calculates IVA (19% on commission amount)
- [ ] **COST-04**: System calculates Retención en la fuente (4% on commission amount)
- [ ] **COST-05**: System calculates Reteica (9.66/1000 on commission amount)
- [ ] **COST-06**: System calculates total service cost (commission + IVA - retenciones)
- [ ] **COST-07**: System calculates net savings (parafiscal savings minus service cost)
- [ ] **COST-08**: System displays ROI as percentage (net savings / service cost)

### Results & Visualization

- [ ] **VIZ-01**: System displays side-by-side comparison of Traditional vs Tikin scenarios
- [ ] **VIZ-02**: System highlights total savings amount in comparison view
- [ ] **VIZ-03**: System highlights percentage reduction in comparison view
- [ ] **VIZ-04**: System displays service cost prominently in Tikin scenario
- [ ] **VIZ-05**: System displays net savings (after service cost) as primary metric
- [ ] **VIZ-06**: System displays cumulative monthly breakdown table for 12 months
- [ ] **VIZ-07**: System highlights 3-month cumulative savings in table
- [ ] **VIZ-08**: System highlights 6-month cumulative savings in table
- [ ] **VIZ-09**: System displays professional charts showing total savings trends
- [ ] **VIZ-10**: System displays chart showing percentage reduction over time
- [ ] **VIZ-11**: System displays chart showing month-over-month savings progression
- [ ] **VIZ-12**: User can expand section to view calculation details
- [ ] **VIZ-13**: Expandable section shows all parafiscales rates used
- [ ] **VIZ-14**: Expandable section shows formulas applied
- [ ] **VIZ-15**: Expandable section shows assumptions and constraints

### Export & Reporting

- [ ] **EXPORT-01**: User can generate downloadable report with all calculations
- [ ] **EXPORT-02**: Report includes detailed breakdown of parafiscales by contribution type
- [ ] **EXPORT-03**: Report includes service cost breakdown (commission, IVA, retenciones)
- [ ] **EXPORT-04**: Report includes 12-month projection table
- [ ] **EXPORT-05**: Report includes visual charts and graphs
- [ ] **EXPORT-06**: Report format available as PDF
- [ ] **EXPORT-07**: Report format available as Excel/CSV
- [ ] **EXPORT-08**: Report includes calculation assumptions and methodology

## v2 Requirements

### Validation & Compliance

- **VALID-01**: System validates that 60% of total compensation does not fall below Colombian minimum wage (currently $1,300,000 COP)
- **VALID-02**: System prevents calculations when minimum wage constraint is violated
- **VALID-03**: System displays clear error message explaining minimum wage violation

### Branding & Professional UI

- **BRAND-01**: Interface displays Tikin logo prominently
- **BRAND-02**: Interface uses Tikin brand colors throughout
- **BRAND-03**: Interface applies professional styling consistent with Tikin brand guidelines
- **BRAND-04**: All reports include Tikin branding elements

## Out of Scope

| Feature | Reason |
|---------|--------|
| User Accounts & Authentication | No login, registration, or personal user profiles - tool is utility-focused |
| Lead Capture Forms | No contact information collection before showing results - focus on calculation utility, sales team handles leads directly |
| Payment Integration | No Tikin pricing display or signup flow within the simulator - sales team handles contracts |
| Calculation History | No saving, tracking, or dashboard of past calculations - each session is independent |
| Email Delivery | No sending results via email - download only to maintain simplicity |
| Multi-company Comparison | No comparing multiple companies side-by-side in single session - scope control |
| Custom Parafiscal Rates | Use standard Colombian rates only, no custom rate entry beyond ARL risk level - ensures legal accuracy |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INPUT-01 | Phase 1 | Pending |
| INPUT-02 | Phase 1 | Pending |
| INPUT-03 | Phase 1 | Pending |
| INPUT-04 | Phase 1 | Pending |
| INPUT-05 | Phase 1 | Pending |
| INPUT-06 | Phase 1 | Pending |
| INPUT-07 | Phase 1 | Pending |
| INPUT-08 | Phase 1 | Pending |
| CALC-01 | Phase 1 | Pending |
| CALC-02 | Phase 1 | Pending |
| CALC-03 | Phase 1 | Pending |
| CALC-04 | Phase 1 | Pending |
| CALC-05 | Phase 1 | Pending |
| CALC-06 | Phase 1 | Pending |
| CALC-07 | Phase 1 | Pending |
| CALC-08 | Phase 1 | Pending |
| CALC-09 | Phase 1 | Pending |
| CALC-10 | Phase 1 | Pending |
| VIZ-01 | Phase 2 | Complete |
| VIZ-02 | Phase 2 | Complete |
| VIZ-03 | Phase 2 | Complete |
| VIZ-04 | Phase 2 | Pending |
| VIZ-05 | Phase 2 | Pending |
| VIZ-06 | Phase 2 | Complete |
| VIZ-07 | Phase 2 | Complete |
| VIZ-08 | Phase 2 | Complete |
| VIZ-09 | Phase 2 | Complete |
| VIZ-10 | Phase 2 | Complete |
| VIZ-11 | Phase 2 | Complete |
| VIZ-12 | Phase 2 | Complete |
| VIZ-13 | Phase 2 | Complete |
| VIZ-14 | Phase 2 | Complete |
| VIZ-15 | Phase 2 | Complete |
| EXPORT-01 | Phase 3 | Pending |
| EXPORT-02 | Phase 3 | Pending |
| EXPORT-03 | Phase 3 | Pending |
| EXPORT-04 | Phase 3 | Pending |
| EXPORT-05 | Phase 3 | Pending |
| EXPORT-06 | Phase 3 | Pending |
| EXPORT-07 | Phase 3 | Pending |
| EXPORT-08 | Phase 3 | Pending |
| COST-01 | Phase 4 | Pending |
| COST-02 | Phase 4 | Pending |
| COST-03 | Phase 4 | Pending |
| COST-04 | Phase 4 | Pending |
| COST-05 | Phase 4 | Pending |
| COST-06 | Phase 4 | Pending |
| COST-07 | Phase 4 | Pending |
| COST-08 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-01-29 after phase reordering*
