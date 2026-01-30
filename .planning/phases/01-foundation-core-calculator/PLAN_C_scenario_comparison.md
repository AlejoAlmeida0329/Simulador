# Plan C: Scenario Comparison & Real-time Updates

**Phase**: 1 - Foundation & Core Calculator
**Goal**: Side-by-side Traditional vs Tikin scenario comparison with savings metrics
**Requirements**: CALC-07, CALC-08, CALC-09, CALC-10
**Depends on**: Plan B (calculation engine)

## Success Criteria
- [ ] System calculates parafiscales for Traditional scenario (100% salary)
- [ ] System calculates parafiscales for Tikin scenario (optimized split)
- [ ] System displays clear side-by-side comparison
- [ ] System calculates and displays total savings and percentage reduction

## Technical Decisions

### Comparison Logic
- **Traditional Scenario**: 100% of compensation as salary → full parafiscales burden
- **Tikin Scenario**: User-defined split (60%-100% salary) → reduced parafiscales on salary portion only
- **Savings Calculation**: Traditional total - Tikin total = Monthly savings
- **Percentage Reduction**: (Savings / Traditional total) × 100

### UI Approach
- **Layout**: Side-by-side cards (Traditional | Tikin)
- **Highlight**: Visual emphasis on savings amount and percentage
- **Color Coding**: Red/gray for Traditional (higher cost), Green for Tikin (savings)

## Tasks

### Task 1: Implement Dual Scenario Calculator
**Estimated**: 20 minutes
**Dependencies**: Plan B complete

**Actions**:
1. Create scenario calculation functions
2. Implement Traditional scenario (100% salary, full parafiscales)
3. Implement Tikin scenario (split salary, reduced parafiscales)
4. Calculate savings (difference between scenarios)
5. Calculate percentage reduction
6. Add types for scenario results

**Deliverables**:
- `/src/lib/calculations/scenarios.ts` - Scenario comparison logic
- `/src/types/scenarios.ts` - Scenario result types

**Functions to implement**:
```typescript
calculateTraditionalScenario(
  employees: Employee[],
  arlRiskLevel: ARLRiskLevel
): ScenarioResult

calculateTikinScenario(
  employees: Employee[],
  salaryPercentage: number,
  arlRiskLevel: ARLRiskLevel
): ScenarioResult

calculateSavings(
  traditional: ScenarioResult,
  tikin: ScenarioResult
): SavingsResult
```

**Verification**:
```typescript
// Example: 1 employee, $3M COP, 70% salary split, Risk III
const traditional = calculateTraditionalScenario([{salary: 3000000}], 'III')
// Traditional: 3M × 29.936% = ~898,080 COP

const tikin = calculateTikinScenario([{salary: 3000000}], 0.70, 'III')
// Tikin: 2.1M (70%) × 29.936% = ~628,656 COP

const savings = calculateSavings(traditional, tikin)
// Savings: 898,080 - 628,656 = 269,424 COP (29.77% reduction)
```

---

### Task 2: Build Scenario Comparison UI
**Estimated**: 30 minutes
**Dependencies**: Task 1

**Actions**:
1. Create ScenarioCard component (reusable for both scenarios)
2. Create ComparisonView component (side-by-side layout)
3. Display parafiscales breakdown by contribution type
4. Highlight total parafiscales cost for each scenario
5. Add responsive layout (stack on mobile)

**Deliverables**:
- `/src/components/ScenarioCard.tsx` - Single scenario display
- `/src/components/ComparisonView.tsx` - Side-by-side comparison
- Updated `/src/app/page.tsx` - Integrate comparison view

**Verification**:
- Traditional scenario shows "100% Salario" label
- Tikin scenario shows dynamic split (e.g., "70% Salario + 30% Bono")
- Both scenarios show breakdown: Health, Pension, ARL, SENA, ICBF, Caja
- Total parafiscales cost displays for each scenario
- Layout is responsive (side-by-side on desktop, stacked on mobile)

---

### Task 3: Add Savings Metrics Display
**Estimated**: 20 minutes
**Dependencies**: Task 2

**Actions**:
1. Create SavingsMetrics component
2. Display monthly savings amount (highlighted)
3. Display percentage reduction (highlighted)
4. Add visual emphasis (large text, color, icons)
5. Ensure real-time updates as parameters change

**Deliverables**:
- `/src/components/SavingsMetrics.tsx` - Savings display component
- Updated `/src/app/page.tsx` - Position savings prominently

**Verification**:
- Savings amount displays in COP with proper formatting
- Percentage reduction displays with 2 decimal places
- Metrics update instantly when slider or ARL changes
- Visual hierarchy emphasizes savings (larger, bolder, colored)
- Zero savings scenario handled (100% salary split)

## Must Haves (Verification Checklist)
- [ ] ✅ **CALC-07**: Traditional scenario (100% salary) parafiscales calculated correctly
- [ ] ✅ **CALC-08**: Tikin scenario (optimized split) parafiscales calculated correctly
- [ ] ✅ **CALC-09**: Total savings = Traditional - Tikin calculated correctly
- [ ] ✅ **CALC-10**: Percentage reduction = (Savings / Traditional) × 100 calculated correctly
- [ ] ✅ **Success Criterion 5**: Clear side-by-side comparison displays
- [ ] ✅ **Success Criterion 6**: Calculations update in real-time (<200ms)

## Phase 1 Complete - Overall Verification

After completing Plans A, B, and C, verify all Phase 1 success criteria:

1. ✅ User can add, edit, and remove employees with individual salaries
2. ✅ User can adjust salary/bonus split slider and see immediate calculation updates
3. ✅ User can select ARL risk level and system applies correct rates
4. ✅ System accurately calculates all 6 parafiscal contributions (Health, Pension, ARL, SENA, ICBF, Caja)
5. ✅ System shows clear comparison between Traditional (100% salary) vs Tikin (optimized split) scenarios
6. ✅ Calculations update in real-time as user adjusts parameters

## Risk Assessment
- **Low Risk**: Straightforward comparison logic, standard UI patterns
- **Performance**: Verify calculation speed with 10+ employees
- **UX**: Ensure savings metrics are immediately obvious to sales teams

## Notes
- **Sales focus**: This comparison view is THE core value - make it visually obvious and compelling
- **Real-time updates**: Critical for live demos - test with multiple employees to ensure performance
- **Colombian context**: Use "Salario" and "Bono" terminology, format numbers with Colombian conventions
- **Next steps**: Phase 2 will add charts, multi-period projections, and professional polish
