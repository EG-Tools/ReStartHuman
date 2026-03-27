# KNOWN_LIMITATIONS_AND_LEGACY.md

This file lists known simplifications, legacy remnants, and fields that can mislead an editor.
Read this before assuming that every typed field is fully active.

## 1) Question-flow legacy remnants
In `src/types/alpha.ts`, `QuestionStepId` still includes:
- `housingType`
- `isa`
- `pension`

But the active step list in `src/data/questionFlow.ts` does not use separate visible steps for those anymore.
Also, `src/components/question/questionScreen.sections.tsx` still contains a `case 'isa': return null` branch.

Interpretation:
- The current app uses a simplified active step list.
- Not every old step name in the type is still part of the live UI.

## 2) Visibility API exists, but current flow is static
`questionFlow.ts` uses a `visibility` callback per step.
Right now every step returns `true`.

Interpretation:
- The navigation system supports filtered visible steps.
- The current project state is effectively a static step list.
- Do not assume there is already meaningful conditional step filtering.

## 3) Fields that exist but are not central in the live current UX
These fields are in `AlphaFormData`, but are not currently first-class active question-flow drivers or are only weakly connected.

Examples:
- `maintenanceIncludedInRent`
- `monthlyMaintenanceFee`
- `isaType`
- `isaYearsSinceOpen`
- `isaMaturityExtended`
- `hasPensionIncome`
- `pensionStartAge`
- `isBusinessOwner`
- `isUnpaidOwner`
- `nationalPensionMonthly`

Interpretation:
- Their presence in types does not guarantee full end-to-end support.
- Check actual render, calculation, and result usage before reusing them.

## 4) Save-slot caution
The save-slot record stores both `formData` and `result`.
But on load, the app restores the form state and recalculates using current logic.

Interpretation:
- Stored `result` should not be treated as stronger than current engine output.
- If you redesign save data, make that decision explicitly instead of assuming the current structure is ideal.

## 5) Housing simplification caution
Current housing handling is intentionally simplified.
Examples:
- owned housing uses market value for asset interpretation and official value for holding-tax modeling
- jeonse deposit behaves more like stored property value than monthly expense
- monthly-rent maintenance split fields exist, but active monthly housing cost logic uses rent amount directly

## 6) Loan simplification caution
Current loan modeling is not a full amortization model.
The user enters monthly interest burden plus the number of years to include it.
The cash projection stops applying that burden after the configured years.

## 7) Tax and policy caution
The project uses public-policy-inspired simplified rules from `src/config/policyConfig.ts`.
It is not a substitute for a fully authoritative legal or professional tax calculation.

If a task asks for legal accuracy changes, inspect:
- `src/config/policyConfig.ts`
- `src/engine/calculator.income.ts`
- `src/engine/calculator.costs.ts`

## 8) Result-table caution
The result table is intentionally selective.
A missing row does not automatically mean the data is ignored.
Sometimes the data is folded into:
- a summary value
- a note
- a helper row shown only under conditions

Always check `buildResultRows()` before deciding a row is missing by mistake.

## 9) Safe editing rule
Before changing a field, verify all of these:
1. where it is collected
2. where it is sanitized
3. where it is used in calculation
4. whether it has a result row
5. whether a test already protects it

If any of those are missing, treat the field as incomplete or legacy until proven otherwise.
