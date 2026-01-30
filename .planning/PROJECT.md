# Tikin Parafiscales Savings Simulator

## What This Is

A professional web-based calculator for the Colombian market that demonstrates the payroll tax (parafiscales) savings companies achieve by using Tikin's salary flexibility bonuses. Sales teams use it to show potential clients clear, detailed comparisons between traditional 100% salary compensation versus optimized 60% salary + 40% bonus structures.

## Core Value

Enable sales teams to instantly demonstrate quantified, credible savings that compel Colombian companies to adopt Tikin's salary flexibility platform by showing exact parafiscal cost reductions over 3, 6, and 12 month periods.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Employee Input System**: Add multiple employees with individual salaries, calculate aggregate parafiscal impact
- [ ] **Salary Flexibility Controls**: Interactive slider allowing users to adjust salary/bonus split from 60% (min) to 100%, see real-time parafiscal impact
- [ ] **Colombian Parafiscales Calculation**: Accurate calculation of all standard contributions: Health (8.5%), Pension (12%), ARL (by risk level), SENA (2%), ICBF (3%), Caja Compensación (4%)
- [ ] **ARL Risk Level Selection**: Company-wide risk level selector (Risk I-V) with corresponding rates (0.5% to 6.96%)
- [ ] **Minimum Wage Validation**: Hard validation preventing calculations where 60% of compensation falls below Colombian minimum wage
- [ ] **Scenario Comparison View**: Side-by-side comparison showing Traditional (100% salary) vs. Tikin (optimized split) with clear savings highlights
- [ ] **Multi-Period Projections**: Cumulative monthly breakdown table showing savings progression over 12 months, with 3-month and 6-month highlights
- [ ] **Visual Results Dashboard**: Professional on-screen summary with charts showing total savings, percentage reduction, and month-over-month trends
- [ ] **Downloadable Report**: Generate PDF/Excel report with detailed breakdown, calculation assumptions, and Tikin branding
- [ ] **Calculation Transparency**: Expandable section showing rates, formulas, and assumptions used in calculations
- [ ] **Tikin Brand Integration**: Full company branding (logo, colors, professional styling) throughout the interface

### Out of Scope

- **User Accounts & Authentication** — No login, registration, or personal user profiles
- **Lead Capture Forms** — No contact information collection before showing results (focus on calculation utility)
- **Payment Integration** — No Tikin pricing display or signup flow within the simulator
- **Calculation History** — No saving, tracking, or dashboard of past calculations
- **Email Delivery** — No sending results via email (download only)
- **Multi-company Comparison** — No comparing multiple companies side-by-side in single session
- **Custom Parafiscal Rates** — Use standard Colombian rates only, no custom rate entry beyond ARL risk level

## Context

**Target Market**: Colombian companies evaluating salary flexibility solutions, primarily reached through Tikin's B2B sales process. Sales teams need credible, detailed cost-benefit analysis to overcome inertia and demonstrate clear ROI.

**Colombian Parafiscales System**: Employers pay multiple mandatory contributions on salary basis:
- **Health (Salud)**: 8.5% of salary
- **Pension (Pensión)**: 12% of salary
- **ARL (Occupational Risk)**: 0.5% to 6.96% based on role risk level (I-V)
- **SENA**: 2% of salary (vocational training)
- **ICBF**: 3% of salary (family welfare)
- **Caja Compensación**: 4% of salary (family compensation fund)

**Tikin's Value Proposition**: By paying up to 40% of compensation as non-salary bonuses (keeping minimum 60% as salary, never below minimum wage), companies reduce the base for parafiscal calculations, achieving 30-40% savings on total parafiscal burden.

**Usage Pattern**: Sales representative opens calculator during client meeting, enters client's employee count and salary distribution, adjusts parameters in real-time during conversation, generates downloadable report for client to review internally.

## Constraints

- **Legal Compliance**: Minimum 60% must be constitutive salary AND cannot be less than Colombian minimum wage (2024: $1,300,000 COP monthly)
- **Calculation Accuracy**: Parafiscal rates must match current Colombian legal requirements; errors damage credibility
- **Professional Presentation**: Must look polished and trustworthy — poor design undermines ROI message
- **Performance**: Calculations must be instant (<200ms) as users adjust sliders during live demos
- **Browser Compatibility**: Must work on modern browsers (Chrome, Firefox, Safari, Edge) without installation
- **Offline Capability**: Preferable to work without backend for reliability during client meetings (static hosting possible)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web application (not Excel) | Sales teams need portable, professional tool that works on any device without installation | — Pending |
| Detailed employee input mode | Sales teams need granular per-employee breakdown to match client's actual payroll structure | — Pending |
| User-adjustable salary/bonus ratio | Interactive exploration helps clients understand the flexibility and constraints of the system | — Pending |
| Company-wide ARL risk level | Simplifies input while maintaining calculation accuracy (most companies have single risk classification) | — Pending |
| Hard validation on minimum wage | Prevents legal compliance violations and maintains Tikin's credibility | — Pending |
| Downloadable report generation | Clients need artifacts to share internally with finance/HR teams for approval | — Pending |
| No user accounts or lead capture | Focus on utility and trust-building, not friction; lead capture happens through sales team directly | — Pending |
| Cumulative monthly table | Shows savings building over time, making annual projections more tangible than single numbers | — Pending |

---
*Last updated: 2026-01-29 after initialization*
