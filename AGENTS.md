# AGENTS.md

## Scope
This file is the short project-wide guide for ReStartHuman.
If you need product context, logic notes, or testing details, start in `docs/README.md` and follow the linked files from there.

## Core rules
- Always work from the latest user-provided project version. Treat that as source of truth.
- Keep the currently approved UI/design unchanged unless the user explicitly asks to change it.
- Make the smallest possible change for the requested scope. Do not refactor unrelated areas.
- Keep structure, state flow, and semantic grouping in TSX. Keep spacing, alignment, sizing, and visual tuning in CSS.
- Keep calculation changes and UI changes separated unless the user explicitly requests both.
- Before editing UI, identify the actual owning file and selector first. Do not guess.
- Preserve existing file paths and naming unless the user explicitly asks to reorganize them.
- If a feature touches calculation logic, result-row visibility, save/load behavior, or conditional question behavior, read the matching file in `docs/` before editing.
- Preserve Korean text in UTF-8. When editing files that contain Korean, write them in UTF-8, reopen them in UTF-8, and confirm no `????` or garbled text was introduced.

## Verification rules
- After code changes, run all of the following before calling the work complete:
  - `npm run build`
  - `npm run lint`
  - `npm test`
- If the change adds or alters calculation logic, question flow rules, save/load behavior, or conditional result-table rows, add or update tests in the same task.
- Do not mark the work complete while any of the above checks are failing.

## Doc map for AI work
- Product purpose and screen-by-screen overview: `docs/PRODUCT_OVERVIEW.md`
- Question step to form-data mapping: `docs/QUESTION_FORM_MAP.md`
- Calculation logic and policy-driven rules: `docs/CALCULATION_LOGIC.md`
- Result screen and row visibility rules: `docs/RESULT_SCREEN_RULES.md`
- Save/load/share behavior: `docs/SAVE_LOAD_SHARE_RULES.md`
- Test commands and current coverage: `docs/TESTING_RULES.md`
- Known limitations, legacy fields, and caution points: `docs/KNOWN_LIMITATIONS_AND_LEGACY.md`

## File ownership map
### App shell and route-level flow
- App shell / deferred calculation / modal routing: `src/app/App.tsx`
- Route constants: `src/app/routes.ts`
- Browser history sync for route/question/modal state: `src/hooks/useAppHistoryNavigation.ts`

### Question flow and question rendering
- Step order and visibility owner: `src/data/questionFlow.ts`
- Navigation through visible steps: `src/hooks/useAlphaFlow.ts`
- Question content structure: `src/components/question/questionScreen.sections.tsx`
- Question screen frame/wrapper: `src/components/question/QuestionScreen.tsx`
- Shared question layout shell: `src/components/question/questionScreen.shared.tsx`

### Question-page layout
- Main owner: `src/styles/base.css`
- Use this for question-page numeric inputs, suffix alignment, spacing, and question-only layout tuning.

### Result screen layout
- Result-table layout owner: `src/styles/result-table-layout.css`
- Projection quick-edit row owner: `src/styles/projection-inline.css`
- Result screen panel/chrome owner: `src/styles/result-screen.css`
- App-level responsive fallback only: `src/styles/app-chrome.css`
- `src/styles/result-refinements.css` is only a pointer file. Do not treat it as the main owner for new result-table fixes.

### Result screen structure
- Result-table row construction and editable cells: `src/components/result/resultScreen.editors.tsx`
- Result-table rendering sections: `src/components/result/resultScreen.sections.tsx`
- Projection quick-edit structure and result help drawer: `src/components/result/resultScreen.notices.tsx`
- Result helper/value formatting glue: `src/components/result/resultScreen.helpers.ts`
- Share image flow: `src/components/result/useResultShare.ts`

### Calculation and persistence
- Default input state: `src/data/defaultFormData.ts`
- Source-of-truth types: `src/types/alpha.ts`
- Main orchestration: `src/engine/calculator.ts`
- Expense / holding tax / health insurance / cash projection: `src/engine/calculator.costs.ts`
- Dividend / ISA / comprehensive tax: `src/engine/calculator.income.ts`
- Shared numeric helpers: `src/engine/calculator.shared.ts`
- Save-slot persistence helpers: `src/utils/saveSlots.ts`
- Save-slot hook: `src/hooks/useSaveSlots.ts`

## Special note
- The housing row is a UI exception.
- For housing-row class naming and editable cell structure, start in `src/components/result/resultScreen.editors.tsx`.
- For housing-row spacing, label alignment, and final layout tuning, start in `src/styles/result-table-layout.css`.
- Use `src/styles/app-chrome.css` for housing-row fixes only when the issue is proven to be responsive or viewport-specific.
