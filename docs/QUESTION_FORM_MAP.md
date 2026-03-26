# QUESTION_FORM_MAP.md

This file maps question steps to `RetireCalcFormData` and points out the important conditional behavior.
The source files are:
- `src/data/questionFlow.ts`
- `src/components/question/questionScreen.sections.tsx`
- `src/types/retireCalc.ts`
- `src/data/defaultFormData.ts`

## 1) Current visible step order
1. `household`
2. `housingDetails`
3. `propertyAssets`
4. `assets`
5. `dividends`
6. `income`
7. `healthInsurance`
8. `fixedExpenses`
9. `livingCosts`
10. `cashReserve`

`questionFlow.ts` currently returns all steps as visible. It still uses a visibility API, but all current `visibility` functions return `true`.

## 2) Step-by-step mapping
### `household`
Main fields:
- `currentAge`
- `householdType`
- `isJointOwnership`
- `hasChildren`
- `childCount`
- `academyMonthly`

Behavior notes:
- `householdType === 'couple'` sets `isJointOwnership` to `true`.
- Toggling children off resets `childCount` to `0` and resets `academyMonthly` to `0`.
- Child count is only shown when `hasChildren` is true.

### `housingDetails`
Main fields:
- `housingType`
- `homeMarketValue`
- `homeOfficialValue`
- `jeonseDeposit`
- `monthlyRentDeposit`
- `monthlyRentAmount`
- `isSingleHomeOwner`
- `maintenanceIncludedInRent`
- `monthlyMaintenanceFee`

Behavior notes:
- `housingType === 'own'` marks `isSingleHomeOwner` as true.
- Monthly rent mode resets the currently unused maintenance fee fields to rent-friendly defaults.
- UI currently collects monthly-rent deposit and monthly-rent amount, but does not expose a separate maintenance fee control.

### `propertyAssets`
Main fields:
- `landValue`
- `landOwnershipType`
- `myLandShare`
- `spouseLandShare`
- `otherPropertyOfficialValue`
- `otherPropertyOwnershipType`
- `myOtherPropertyShare`
- `spouseOtherPropertyShare`

Behavior notes:
- Ownership controls appear only for `householdType === 'couple'`.
- `split` sets 50/50 automatically.
- `mineOnly` and `spouseOnly` set 100/0 automatically.

### `assets`
Main fields:
- `taxableAccountAssets`
- `isaAssets`
- `pensionAccountAssets`
- `otherAssets`

Behavior notes:
- These values affect asset interpretation, but not every asset value directly drives monthly cash flow.

### `dividends`
Main fields:
- `taxableAccountDividendAnnual`
- `isaDividendAnnual`
- `pensionDividendAnnual`
- `dividendInputMode`
- `dividendOwnershipType`
- `myAnnualDividendAttributed`
- `spouseAnnualDividendAttributed`
- `isaOwnershipType`
- `myAnnualIsaDividendAttributed`
- `spouseAnnualIsaDividendAttributed`
- `pensionMonthlyAmount`
- `myIsaType`
- `spouseIsaType`

Behavior notes:
- Dividend inputs can be treated as gross or net.
- Ownership controls matter for comprehensive tax and ISA tax-free limits.
- The UI currently uses person-level ISA type fields for actual ISA tax treatment.

### `income`
Main fields:
- `otherIncomeType`
- `otherIncomeMonthly`
- `salaryMonthly`

Behavior notes:
- `otherIncomeType === 'earned'` is special.
- When health insurance is in an employee-style mode, earned income may also drive `salaryMonthly`.
- The calculation later applies `Math.max(otherIncomeMonthly, salaryMonthly)` for earned-income scenarios.

### `healthInsurance`
Main fields:
- `healthInsuranceType`
- `salaryMonthly`

Behavior notes:
- If employee-style health insurance is selected and the other-income type is `earned`, the salary can be auto-linked to that earned-income value.
- Manual premium override is not collected in the question flow. It is edited from the result table.

### `fixedExpenses`
Main fields:
- `insuranceMonthly`
- `maintenanceMonthly`
- `telecomMonthly`
- `otherFixedMonthly`
- `hasLoan`
- `loanInterestMonthly`
- `loanInterestYears`

Behavior notes:
- Toggling loan off resets interest amount and years to `0`.
- Loan here means monthly interest-only burden input, not full principal amortization modeling.

### `livingCosts`
Main fields:
- `livingCostInputMode`
- `livingCostMonthlyTotal`
- `foodMonthly`
- `necessitiesMonthly`
- `diningOutMonthly`
- `hobbyMonthly`
- `academyMonthly`
- `otherLivingMonthly`
- `hasCar`
- `currentCarMarketValue`
- `carYearlyCost`

Behavior notes:
- Total mode uses one monthly number.
- Detailed mode adds the component fields.
- `academyMonthly` only appears when the household has children.
- Turning car ownership off resets both current car value and annual car cost to `0`.

### `cashReserve`
Main fields:
- `startingCashReserve`
- `simulationYears`

Behavior notes:
- The question screen currently offers fixed choices for projection years: 10 / 30 / 50.
- The result screen later allows direct numeric editing in the 1 to 80 range.

## 3) Fields edited mainly on the result screen
These are not the main question-flow entry points, but they affect final outputs directly.
- `healthInsuranceOverrideMonthly`
- `currentAge`
- `simulationYears`
- `inflationRateAnnual`
- `inflationEnabled`

## 4) Type fields that are not part of the active visible step list
These fields exist in `RetireCalcFormData`, but the active question flow does not expose them as standalone steps right now.
- `isaType`
- `isaYearsSinceOpen`
- `isaMaturityExtended`
- `hasPensionIncome`
- `pensionStartAge`
- `isBusinessOwner`
- `isUnpaidOwner`
- `nationalPensionMonthly`

Read `KNOWN_LIMITATIONS_AND_LEGACY.md` before touching those.
