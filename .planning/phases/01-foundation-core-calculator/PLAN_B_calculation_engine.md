# Plan B: Calculation Engine & ARL Configuration

**Phase**: 1 - Foundation & Core Calculator
**Goal**: Implement parafiscales calculation engine with salary/bonus split controls
**Requirements**: INPUT-05, INPUT-06, INPUT-07, INPUT-08, CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06
**Depends on**: Plan A (employee data structure)

## Success Criteria
- [ ] User can adjust salary/bonus split via slider (60%-100%)
- [ ] User can select company-wide ARL risk level (I-V)
- [ ] System calculates all 6 parafiscal contributions accurately
- [ ] Calculations update in real-time (<200ms) as slider moves

## Technical Decisions

### Calculation Architecture
- **Engine**: Pure TypeScript functions (no external libraries)
- **Performance**: Memoization with `useMemo` for expensive calculations
- **Precision**: JavaScript number type (sufficient for currency calculations in COP)
- **Constants**: Centralized rate definitions

### Colombian Parafiscales Rates (2024)
```typescript
Health (Salud): 8.5%
Pension (Pensión): 12%
ARL (Risk I): 0.522%
ARL (Risk II): 1.044%
ARL (Risk III): 2.436%
ARL (Risk IV): 4.350%
ARL (Risk V): 6.960%
SENA: 2%
ICBF: 3%
Caja Compensación: 4%
```

## Tasks

### Task 1: Create Calculation Engine
**Estimated**: 25 minutes
**Dependencies**: Plan A complete

**Actions**:
1. Define parafiscales rate constants
2. Create calculation utility functions
3. Implement individual contribution calculators (Health, Pension, ARL, SENA, ICBF, Caja)
4. Create aggregate calculation function
5. Add TypeScript types for calculation results

**Deliverables**:
- `/src/lib/constants/parafiscales.ts` - Rate definitions
- `/src/lib/calculations/parafiscales.ts` - Calculation functions
- `/src/types/calculations.ts` - Result type definitions

**Functions to implement**:
```typescript
calculateHealth(salaryBase: number): number
calculatePension(salaryBase: number): number
calculateARL(salaryBase: number, riskLevel: ARLRiskLevel): number
calculateSENA(salaryBase: number): number
calculateICBF(salaryBase: number): number
calculateCajaCompensacion(salaryBase: number): number
calculateTotalParafiscales(salaryBase: number, riskLevel: ARLRiskLevel): ParafiscalesBreakdown
```

**Verification**:
```typescript
// Test with example: $3,000,000 COP salary, Risk Level III
const result = calculateTotalParafiscales(3000000, 'III')
expect(result.health).toBe(255000) // 8.5% of 3M
expect(result.pension).toBe(360000) // 12% of 3M
expect(result.arl).toBe(73080) // 2.436% of 3M
expect(result.sena).toBe(60000) // 2% of 3M
expect(result.icbf).toBe(90000) // 3% of 3M
expect(result.caja).toBe(120000) // 4% of 3M
expect(result.total).toBe(958080)
```

---

### Task 2: Implement Salary/Bonus Split Controls
**Estimated**: 25 minutes
**Dependencies**: Task 1

**Actions**:
1. Create SalaryBonusSlider component
2. Implement slider with 60%-100% range (1% increments)
3. Display current split percentages and amounts
4. Add visual feedback for minimum constraint (60%)
5. Create custom hook `useSalaryBonusSplit` for state management

**Deliverables**:
- `/src/components/SalaryBonusSlider.tsx` - Interactive slider component
- `/src/hooks/useSalaryBonusSplit.ts` - Split state management

**Verification**:
- Slider cannot go below 60%
- Slider can go up to 100%
- Split percentages always sum to 100%
- Dollar amounts update instantly as slider moves
- Bonus amount = Total compensation × (1 - salary percentage)

---

### Task 3: Add ARL Risk Level Selector & Integration
**Estimated**: 20 minutes
**Dependencies**: Task 1, Task 2

**Actions**:
1. Create ARLRiskSelector component (dropdown or radio buttons)
2. Display ARL rates for each risk level (I: 0.522% → V: 6.960%)
3. Integrate with calculation engine
4. Create custom hook `useCalculations` to coordinate all calculations
5. Implement real-time recalculation on any parameter change

**Deliverables**:
- `/src/components/ARLRiskSelector.tsx` - Risk level selector
- `/src/hooks/useCalculations.ts` - Main calculation coordinator
- Updated `/src/app/page.tsx` - Integrate all controls

**Verification**:
- All 5 risk levels (I-V) are selectable
- Correct ARL rate displays for selected level
- ARL contribution updates when risk level changes
- Total parafiscales recalculate instantly (<200ms)
- Calculations work correctly with multiple employees

## Must Haves (Verification Checklist)
- [ ] ✅ **INPUT-05**: Salary/bonus slider adjustable from 60% to 100%
- [ ] ✅ **INPUT-06**: Parafiscales recalculate in real-time as slider moves
- [ ] ✅ **INPUT-07**: Company-wide ARL risk level (I-V) can be selected
- [ ] ✅ **INPUT-08**: Correct ARL rates (0.522% to 6.960%) applied based on selection
- [ ] ✅ **CALC-01**: Health contribution = 8.5% of salary base
- [ ] ✅ **CALC-02**: Pension contribution = 12% of salary base
- [ ] ✅ **CALC-03**: ARL contribution = rate based on risk level
- [ ] ✅ **CALC-04**: SENA contribution = 2% of salary base
- [ ] ✅ **CALC-05**: ICBF contribution = 3% of salary base
- [ ] ✅ **CALC-06**: Caja Compensación contribution = 4% of salary base

## Risk Assessment
- **Low Risk**: Pure calculation functions, well-defined requirements
- **Performance**: Must verify <200ms calculation time with multiple employees
- **Accuracy**: Critical - must validate against known examples

## Notes
- **Salary base for parafiscales**: In Tikin scenario, only the salary portion (not bonus) is subject to parafiscales
- **Performance optimization**: Use `useMemo` to cache calculations, only recalculate when dependencies change
- **Testing strategy**: Create test cases with known values from Colombian payroll examples
