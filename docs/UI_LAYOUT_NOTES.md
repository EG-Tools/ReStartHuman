# UI_LAYOUT_NOTES.md

This document explains current UI layout ownership and tuning points.
It is not the full product or calculation guide.
For product rules, result-row rules, or save/load behavior, start in `README.md`.

## 1) Purpose
Use this file when adjusting:
- question-page numeric inputs
- result-table editable rows
- housing-row layout (`시가`, `공시가격`)
- projection quick-edit row (`나이`, `기간`, `물가`)
- spacing, alignment, width, and suffix behavior

If the task is unrelated to UI layout, this file is probably not the right place to start.

## 2) Ownership map
### Question page
- Structure owner: `src/components/question/questionScreen.sections.tsx`
- Frame owner: `src/components/question/QuestionScreen.tsx`
- Main CSS owner: `src/styles/base.css`
- Responsibility:
  - numeric input shell
  - numeric input field
  - suffix alignment on question screens
  - question-only spacing variables/classes

### Result table
- Row/data structure owner: `src/components/result/resultScreen.editors.tsx`
- Table rendering owner: `src/components/result/resultScreen.sections.tsx`
- Main CSS owner: `src/styles/result-table-layout.css`
- Responsibility:
  - result-table input row spacing
  - result-table suffix alignment
  - result-table width/alignment rules
  - housing-row layout tuning

### Projection quick-edit row
- Structure owner: `src/components/result/resultScreen.notices.tsx`
- Main CSS owner: `src/styles/projection-inline.css`
- Responsibility:
  - inline quick-edit field grouping
  - age / projection years / inflation spacing and wrapping
  - quick-edit field width and label alignment

### App-level responsive fallback
- File: `src/styles/app-chrome.css`
- Use only when the final owner is truly app-level or viewport-specific.
- Do not start here for normal result-table tuning.

### Pointer file only
- `src/styles/result-refinements.css`
- This file documents where result-specific rules were split.
- Do not treat it as the main owner for new layout fixes.

## 3) TSX vs CSS rule
### TSX should handle
- semantic structure
- row grouping
- class names
- conditional rendering
- field order

### CSS should handle
- spacing
- alignment
- positioning
- width tuning
- visual nudges
- final presentation tuning

Do not solve spacing or alignment issues with inline styles unless there is no safer option.

## 4) Housing row rules
The housing row is a special-case UI row.

### Current intent
- `시가` and `공시가격` are visually tuned labels.
- Their spacing may differ from normal rows.
- Housing-row tweaks should stay isolated from general result-table rows.

### Current owner split
- Class naming / editable cell structure:
  - `src/components/result/resultScreen.editors.tsx`
- Spacing / label alignment / housing-specific CSS variables:
  - `src/styles/result-table-layout.css`

### Editing rule
If only the housing row needs tuning:
- prefer housing-specific classes/selectors first
- do not change global result-table spacing first
- keep the rest of the result table stable

## 5) Practical guidance
### When adjusting question numeric inputs
Start in:
- `src/styles/base.css`

If structure or field order also needs to change, then check:
- `src/components/question/questionScreen.sections.tsx`

### When adjusting normal result-table numeric rows
Start in:
- `src/styles/result-table-layout.css`

If the row structure itself is wrong, then check:
- `src/components/result/resultScreen.editors.tsx`

### When adjusting the housing row
Start in:
- `src/components/result/resultScreen.editors.tsx` for class naming and structure
- `src/styles/result-table-layout.css` for spacing and alignment

### When adjusting the projection quick-edit row
Start in:
- `src/components/result/resultScreen.notices.tsx` for structure
- `src/styles/projection-inline.css` for layout tuning

## 6) Related logic owners that affect UI behavior
### Conditional question flow
- Step list and visibility: `src/data/questionFlow.ts`
- Next/previous navigation across visible steps: `src/hooks/useRetireCalcFlow.ts`
- In-step conditional rendering: `src/components/question/questionScreen.sections.tsx`

### Earned-income and employee-health-insurance link
- Question rendering owner: `src/components/question/questionScreen.sections.tsx`
- Calculation owner: `src/engine/calculator.ts`
- Product rule reference: `CALCULATION_LOGIC.md`

### Result projection quick-recalc behavior
- Structure owner: `src/components/result/resultScreen.notices.tsx`
- Calculation owner: `src/app/App.tsx`
- Layout owner: `src/styles/projection-inline.css`
- Result-screen rule reference: `RESULT_SCREEN_RULES.md`

## 7) What to avoid
- Do not mix question-page fixes into result-table CSS.
- Do not start result-table detail fixes in `app-chrome.css` unless the issue is proven to be viewport-specific.
- Do not change multiple layout systems at once when one row is the only issue.
- Do not assume a selector owns the final layout without confirming it.
- Do not treat `result-refinements.css` as the active owner for new result-table fixes.

## 8) Verification rule for UI work
After UI changes, verify with:
- `npm run build`
- `npm run lint`
- `npm test`

If the UI change also affects calculation, question flow, or conditional row visibility, update tests in the same task.
