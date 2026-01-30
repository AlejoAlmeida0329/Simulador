# Plan A: Project Setup & Employee Input System

**Phase**: 1 - Foundation & Core Calculator
**Goal**: Initialize Next.js project with employee management interface
**Requirements**: INPUT-01, INPUT-02, INPUT-03, INPUT-04

## Success Criteria
- [ ] Next.js project initialized with TypeScript and Tailwind CSS
- [ ] Users can add employees with individual salary amounts
- [ ] Users can edit and remove employees from list
- [ ] System displays aggregate employee count and total salary

## Technical Decisions

### Stack Selection
- **Framework**: Next.js 14 (App Router) + React 18
  - **Why**: Static export capability, excellent performance, popular in LATAM, Spanish documentation available
- **Language**: TypeScript
  - **Why**: Type safety for financial calculations, better IDE support
- **Styling**: Tailwind CSS
  - **Why**: Rapid professional UI development, responsive by default
- **Validation**: Zod
  - **Why**: Type-safe validation, integrates with TypeScript

### Architecture Approach
- **Deployment**: Static site (no backend required)
- **State Management**: React hooks + Context API (sufficient for scope)
- **Component Structure**: Feature-based organization
- **Data Flow**: Unidirectional (React patterns)

## Tasks

### Task 1: Initialize Next.js Project
**Estimated**: 15 minutes
**Dependencies**: None

**Actions**:
1. Create Next.js 14 app with TypeScript template
2. Configure Tailwind CSS
3. Set up basic project structure (components, lib, types directories)
4. Configure static export in next.config.js
5. Create basic layout with placeholder header

**Deliverables**:
- `package.json` with dependencies
- `next.config.js` configured for static export
- `tailwind.config.js` with base configuration
- `/src/app/layout.tsx` with basic structure
- `/src/app/page.tsx` with placeholder content

**Verification**:
```bash
npm run dev  # Should start without errors
npm run build  # Should generate static export
```

---

### Task 2: Create Employee Data Model & Validation
**Estimated**: 20 minutes
**Dependencies**: Task 1

**Actions**:
1. Define Employee TypeScript interface
2. Create Zod validation schema for employee data
3. Create Colombian currency formatting utilities
4. Set up employee state management with React hooks
5. Create custom hook `useEmployees` for CRUD operations

**Deliverables**:
- `/src/types/employee.ts` - Employee interface
- `/src/lib/validation.ts` - Zod schemas
- `/src/lib/formatters.ts` - Currency formatting (COP)
- `/src/hooks/useEmployees.ts` - Employee management hook

**Verification**:
- TypeScript compiles without errors
- Zod validation accepts valid salaries (>= 0)
- Zod validation rejects invalid inputs

---

### Task 3: Build Employee Input UI Component
**Estimated**: 30 minutes
**Dependencies**: Task 2

**Actions**:
1. Create EmployeeForm component (add new employee)
2. Create EmployeeList component (display all employees)
3. Create EmployeeItem component (edit/delete individual employee)
4. Implement add, edit, remove functionality
5. Display aggregate totals (count, total salary)
6. Add basic input validation and error messages

**Deliverables**:
- `/src/components/EmployeeForm.tsx` - Form for adding employees
- `/src/components/EmployeeList.tsx` - List display with aggregates
- `/src/components/EmployeeItem.tsx` - Individual employee card with edit/delete
- Updated `/src/app/page.tsx` - Integrate employee components

**Verification**:
- Can add employee with salary amount
- Can edit employee salary after adding
- Can remove employee from list
- Total employee count updates correctly
- Total salary sum calculates correctly
- Input validation shows errors for invalid data

## Must Haves (Verification Checklist)
- [ ] ✅ **INPUT-01**: Multiple employees can be added with individual salaries
- [ ] ✅ **INPUT-02**: Employee salaries can be edited in place
- [ ] ✅ **INPUT-03**: Employees can be removed from the list
- [ ] ✅ **INPUT-04**: Aggregate totals (count, salary sum) display and update automatically

## Risk Assessment
- **Low Risk**: Standard Next.js setup, well-documented patterns
- **Dependencies**: None (greenfield project)
- **Unknowns**: None significant

## Notes
- Keep UI simple and functional for Phase 1 (professional styling comes later)
- Focus on correctness of calculations over visual polish
- Colombian peso (COP) formatting: Use `Intl.NumberFormat` with locale 'es-CO'
