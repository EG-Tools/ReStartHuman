# AGENTS.md

## Scope
This file defines the short, project-wide working rules for ReStartHuman.
Detailed UI layout guidance lives in `UI_LAYOUT_NOTES.md`.

## Core rules
- Always work from the latest user-provided project version. Treat that as source of truth.
- Keep the currently approved UI/design unchanged unless the user explicitly asks to change it.
- Make the smallest possible change for the requested scope. Do not refactor unrelated areas.
- Keep structure/data flow in TSX and styling/spacing/alignment in CSS.
- Keep calculation changes and UI changes separated unless the user explicitly requests both.
- Before editing UI, identify the actual owning file/selector first. Do not guess.
- Deliver overwrite-ready files in original folder structure as ZIP by default. Do not send patch files unless requested.

## File ownership
- Question-page input layout: `src/styles/base.css`
- Result-table layout and special row tuning: `src/styles/result-refinements.css`
- Avoid using `src/styles/app-chrome.css` for detailed result-table layout fixes unless there is no other valid owner.

## Special note
- The housing row is a UI exception. Follow `UI_LAYOUT_NOTES.md` for its structure and tuning rules.
