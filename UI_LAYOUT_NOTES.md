# UI_LAYOUT_NOTES.md

This document explains only the current UI layout ownership and tuning points.
It is not a full project architecture document.

## 1) Purpose
Use this file when adjusting:
- question-page numeric inputs
- result-table input rows
- housing-row layout (`시가`, `공시가격`)
- spacing/alignment/suffix behavior

If the task is unrelated to UI layout, this file is probably not the right place to start.

## 2) Ownership map
### Question page
- Main owner: `src/styles/base.css`
- Responsibility:
  - numeric input shell
  - numeric input field
  - suffix alignment on question screens
  - question-only spacing variables/classes

### Result table
- Main owner: `src/styles/result-refinements.css`
- Responsibility:
  - result-table input row spacing
  - result-table suffix alignment
  - result-table width/alignment overrides
  - housing-row final visual tuning

### Not preferred for detailed result-table fixes
- `src/styles/app-chrome.css`
- Use only if the real final owner is proven to be there.
- Do not start there by default.

## 2-1) Current canonical housing classes
Use only these names for the result-table housing row:
- `table-edit-cluster-housing`
- `table-edit-group-housing-market`
- `table-edit-group-housing-official`

Avoid reviving older alias-style names if the housing-only classes already solve the task.

## 3) TSX vs CSS rule
### TSX should handle
- semantic structure
- row grouping
- class names
- conditional rendering

### CSS should handle
- spacing
- alignment
- positioning
- visual nudges
- final presentation tuning

Do not solve spacing/alignment issues with inline styles unless there is no safer option.

## 4) Housing row rules
The housing row is a special-case UI row.

### Current intent
- `시가` and `공시가격` are visually tuned labels.
- Their spacing may differ from normal rows.
- Housing-row tweaks should stay isolated from general result-table rows.

### Required structure idea
Use explicit, readable classes for housing-specific parts.
Examples:
- `table-edit-cluster-housing`
- `table-edit-group-housing-market`
- `table-edit-group-housing-official`

Do not rely on vague selectors like deep descendant chains when a dedicated class can be added safely.

### Editing rule
If only the housing row needs tuning:
- prefer changing housing-specific classes/selectors
- do not change global result-table spacing first
- keep the rest of the result table stable

## 5) Safe workflow for UI edits
1. Start from the latest user-confirmed working version.
2. Identify the real owner file.
3. Change only one visual concern at a time.
   - alignment only
   - spacing only
   - suffix only
4. Keep exception-row fixes isolated.
5. Preserve file paths so the result can be overwrite-applied.

## 6) Practical guidance
### When adjusting question numeric inputs
Start in:
- `src/styles/base.css`

### When adjusting normal result-table numeric rows
Start in:
- `src/styles/result-refinements.css`

### When adjusting the housing row
Start in:
- `src/components/result/ResultScreen.tsx` for class naming/structure
- `src/styles/result-refinements.css` for layout tuning

## 7) What to avoid
- Do not mix question-page fixes into result-table CSS.
- Do not mix result-table detail fixes into app-level chrome styles unless proven necessary.
- Do not change multiple layout systems at once when one row is the only issue.
- Do not assume a selector owns the final layout without confirming it.

## 8) Output rule
Default delivery format for project edits:
- overwrite-ready ZIP
- original folder structure preserved
- no patch file unless the user explicitly asks for one
