# EG_Tools Constitution (MASTER RULES v1.26 + B-Style)

> **Purpose:** Single source of truth for EG_Tools work: **Project MASTER RULES (v1.26 · 2026-02-25)** + **B-Style (Efficiency + Intuition)**.
> Use the **8-line English “AI Rules”** at the top of everyday prompts.

---

## Korean Summary (User Intent · 8 lines)
1) 모든 툴은 **효율 + 직관(B-Style)** 철학이 기본 탑재되어야 한다.  
2) 기능 추가보다 **파이프라인 최적화(속도/안정/직관/유지보수)** 가 우선이다.  
3) 코딩 전에 반드시 **설계(유저 플로우/데이터 흐름/모듈 구조/리스크)** 를 먼저 제시한다.  
4) 구조는 **3-Layer(UI / Core Preview / Finalize Bake+Post)** 를 기본으로 유지한다.  
5) 기능은 모듈로 붙이고, 상태는 **전역이 아니라 씬 노드/오브젝트 attrs** 가 소유한다(선택 기반 개별 조절). **최소 구현/단순 구현 우선, global 선언 최소화, 요청 없는 구현 금지(필요 시 먼저 질문).**  
6) Bake는 **대상 attr를 명시**해서 정확히 처리하며, 광역 베이크는 지양한다.  
7) UI/기본값은 요청 없으면 변경하지 않고, UI 텍스트는 **English only**.  
8) EG_Tools **MASTER RULES(v1.26)** 를 최우선 준수한다(SSoT/Common/파일 규칙/품질 게이트 등).

---

## English “AI Rules” (Paste this at the top of every request · 8 lines)

1) **MEL only (no Python). No code in chat—deliver files only (.mel/.zip).**  
2) **No UI/layout/default changes unless explicitly requested. English UI only.**  
3) **Baseline:** if not specified, continue from **the latest AI-delivered file** (or user-specified file).  
4) **B-Style:** 3 layers (UI / Core Preview / Finalize Bake+Post), modular hooks Build/Update/Bake/Teardown (+ optional Validate/PostBake/Serialize/Bind/Migrate). **Minimal implementation; minimize globals; ask before adding anything not requested.**  
5) **Update must NOT create nodes or change connections** (values only).  
6) **Bake targets explicit objects+attrs only** (avoid broad hierarchy baking).  
7) **No leaks:** Teardown removes temp nodes/connections/scriptJobs 100%; `source` must be error-free.  
8) **SSoT/Common rules:** do NOT edit SSoT; reuse Common first; propose tickets for SSoT/Common extension.

---

# PART A — EG_Tools MASTER RULES (v1.23 · 2026-02-08)

## 0) Top Principles
- **Do not change anything the user didn’t request.**
  - Especially **UI (button positions/sizes, input sizes, layout, design, defaults)** — no changes unless requested.
  - If UI change is unavoidable: explain why → apply only after user approval.
- **Minimal implementation first:** keep solutions as simple as possible, **minimize global declarations**, and **never implement behavior the user didn’t ask for**. If it seems necessary, **ask first**.
- Maya 2024 + Maya 2026, **MEL only**.

## 1) Baseline Source Priority
1) Default: latest `EG_Tools_v1.xx.zip`
2) If user specifies a file/version: that file
3) If unspecified: continue from **the latest file previously delivered by the AI** (.mel/.zip/.md)

## 2) File Delivery Rules
- Default: **.mel**
- Use **.zip only when 4+ files change**
- Never paste long code in chat — **files only**
- If file delivery is not possible: **“skip one turn”** + share progress only
- (Integrated) **No version/fix in filename** (version in chat/comments/UI only)

## 3) Standalone Naming Exception (Drag & Drop)
- Standalone file must include version in filename:
  - `EG_<ToolName>_vX.XX.mel` (2 decimals)
- Integrated (inside EG_Tools) must **not** include version in filename.

## 4) SSoT Policy (Do NOT edit directly)
- SSoT: `EG_core.mel / EG_registry.mel / EG_shelf.mel + Install/Common/docs/icons`
- Direct edits forbidden:
  - propose as a **Ticket**
  - user does the merge/integration

## 5) Common Operations (Reuse First + Approval)
- Before new features/changes: scan **Common** (and Install if relevant)
- **No copy/paste** of Common — call/reference only
- If Common expansion is needed:
  - do NOT implement immediately → request user approval
  - after approval: deliver 1–3 `.mel`, 4+ `.zip`

## 6) Quality Gates (Must pass)
- No duplicate global proc definitions (especially signature changes)
- `source` must have **0 syntax errors**
- Minimum smoke test:
  - new scene / open-close UI / core actions / safe re-run
  - if relevant: Undo/Redo, Ctrl+D

## 7) “Meeting Room” Scope
- `회의실_n` is the central control room:
  - Common / Registry / loader-install / icons-docs etc. (outside `EG_Tools/tools/`)
- Individual tool changes (`EG_Tools/tools/`) should be handled in each tool’s room by default.

## 8) Integrated Loader Absolute-Path Rule
- Integrated loader/reload/open must load via **absolute path relative to EG_Tools folder**
- Prevent pollution/conflicts from standalone scripts in Maya script paths.

---

# PART B — B-Style Architecture Standard (Efficiency + Intuition)

## Work Order (Mandatory)
1) **Architecture first (no code)**:
   - User flow (3–6 steps)
   - Data flow (Selection → Preview → Bake → Cleanup)
   - Module mapping (hooks)
   - Top 3 risks + mitigations
2) Implementation next (files only).

## Fixed 3-Layer Architecture
- **UI Layer**: input + display only
- **Core Engine**: preview Build/Update/Teardown only
- **Finalize**: Bake + PostBake only (clamp/range/cleanup)

## Hooks Standard
- Required: **Build / Update / Bake / Teardown**
- Optional (only when necessary): **Validate / PostBake / Serialize(Deserialize) / Bind(Unbind) / Migrate**

## Design Constraints (Hard)
- State belongs to **per-object attrs / scene nodes**, not global managers.
- Preview path and Bake path must not be mixed.
- Bake must be explicit (target attrs only; avoid broad hierarchy bake).
- scriptJob is minimal and must not leak.

---

## Request Template (Fill-in)
- Tool name:
- Integrated vs Standalone:
- Core features (required):
- Optional features:
- UI change allowance (if any):
- Scene/Rig constraints (e.g., face controls 0–1, blendShape, SDK):
- Hard “Do NOT” items (if any):
