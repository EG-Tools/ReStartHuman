# AI Docs Index

This folder is the practical handoff set for AI work on ReStartHuman.
It is meant to answer three questions fast:

1. What is this tool trying to do?
2. Where does each input flow into the calculation?
3. Which files and rules matter before editing?

## Read order
### If you are new to the project
1. `../AGENTS.md`
2. `PRODUCT_OVERVIEW.md`
3. `QUESTION_FORM_MAP.md`
4. `CALCULATION_LOGIC.md`
5. `RESULT_SCREEN_RULES.md`
6. `SAVE_LOAD_SHARE_RULES.md`
7. `TESTING_RULES.md`
8. `KNOWN_LIMITATIONS_AND_LEGACY.md`

### If you only need UI layout work
1. `../AGENTS.md`
2. `UI_LAYOUT_NOTES.md`
3. `RESULT_SCREEN_RULES.md`

## File list
- `PRODUCT_OVERVIEW.md`
  - product goal, screen flow, and current design philosophy
- `QUESTION_FORM_MAP.md`
  - question step to `AlphaFormData` mapping and conditional input notes
- `CALCULATION_LOGIC.md`
  - how `calculateAlphaScenario` works and which engine files own each calculation group
- `RESULT_SCREEN_RULES.md`
  - result-table row rules, visibility rules, and quick-edit behavior
- `SAVE_LOAD_SHARE_RULES.md`
  - save slot structure, loading behavior, and share-image ownership
- `TESTING_RULES.md`
  - required commands, current tests, and when tests must be updated
- `KNOWN_LIMITATIONS_AND_LEGACY.md`
  - non-final or legacy fields, known simplifications, and caution points

## Ground truth files
- Type source of truth: `src/types/alpha.ts`
- Default state: `src/data/defaultFormData.ts`
- Question step list: `src/data/questionFlow.ts`
- Main calculation entry: `src/engine/calculator.ts`
- Result-row assembly: `src/components/result/resultScreen.editors.tsx`
- Persistence helpers: `src/utils/saveSlots.ts`
