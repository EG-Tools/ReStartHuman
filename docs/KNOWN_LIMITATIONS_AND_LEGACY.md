# KNOWN_LIMITATIONS_AND_LEGACY.md

This file lists known simplifications, legacy remnants, and fields that can mislead an editor.
Read this before assuming that every typed field is fully active.

## 1) Visibility API exists, but current flow is static
`questionFlow.ts` uses a `visibility` callback per step.
Right now every step returns `true`.

Interpretation:
- The navigation system supports filtered visible steps.
- The current project state is effectively a static step list.
- Do not assume there is already meaningful conditional step filtering.

## 2) Fields with important cross-screen behavior
These fields are covered by the current calculation and result tests, but changes still need to follow the full path from question flow to calculation to result output.

Examples:
- `isaType`, `myIsaType`, `spouseIsaType`
- `pensionStartAge`
- income duration fields

## 3) Save-slot caution
The save-slot record stores both `formData` and `result`.
But on load, the app restores the form state and recalculates using current logic.

Interpretation:
- Stored `result` should not be treated as stronger than current engine output.
- If you redesign save data, make that decision explicitly instead of assuming the current structure is ideal.

## 4) Housing simplification caution
Current housing handling is intentionally simplified.
Examples:
- owned housing uses market value for asset interpretation and official value for holding-tax modeling
- jeonse deposit behaves more like stored property value than monthly expense
- monthly rent uses deposit plus rent amount without a separate maintenance-fee input

## 5) Loan simplification caution
Current loan modeling is not a full amortization model.
The user enters monthly interest burden plus the number of years to include it.
The cash projection stops applying that burden after the configured years.

## 6) Tax and policy caution
The project uses public-policy-inspired simplified rules from `src/config/policyConfig.ts`.
It is not a substitute for a fully authoritative legal or professional tax calculation.

The ISA input is an annual dividend estimate, not an account-closure gain/loss statement. The app uses the entered ISA asset balance as a proxy for cumulative contributed principal, reduces the principal-withdrawal allowance by annual withdrawals, and settles when that allowance is exhausted. Market-value changes, additional contributions, fees, and separate losses are not entered, so the displayed settlement cannot reproduce an actual account statement.

The financial comprehensive-tax estimate uses the Article 62 comparison-tax structure with the app's simplified other-income taxable base. Non-financial income is attributed to the primary user because spouse-specific earned or business income is not collected. Rental-income and private-pension taxes remain separate estimates, so this is not a tax-return reproduction.

Estimated employee health insurance automatically changes to regional coverage after the selected earned-income or corporate-executive duration ends. A single household uses the regional model and a couple uses the both-regional label. Manual premium overrides remain fixed for the projection because they are treated as explicit user-entered amounts.

Asset-rank and household-spending comparisons are dated internal reference bands, not live official-statistics integrations. The result text must keep that limitation visible.

If a task asks for legal accuracy changes, inspect:
- `src/config/policyConfig.ts`
- `src/engine/calculator.income.ts`
- `src/engine/calculator.costs.ts`

## 7) Result-table caution
The result table is intentionally selective.
A missing row does not automatically mean the data is ignored.
Sometimes the data is folded into:
- a summary value
- a note
- a helper row shown only under conditions

Always check `buildResultRows()` before deciding a row is missing by mistake.

## 8) Safe editing rule
Before changing a field, verify all of these:
1. where it is collected
2. where it is sanitized
3. where it is used in calculation
4. whether it has a result row
5. whether a test already protects it

If any of those are missing, treat the field as incomplete or legacy until proven otherwise.
