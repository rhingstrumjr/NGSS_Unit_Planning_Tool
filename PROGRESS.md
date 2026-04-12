# NGSS Planner — Build Progress

Last updated: 2026-04-12

---

## Phase 1 — Local-First MVP

### ✅ Done

**Data layer**
- `src/lib/types.ts` — all TypeScript interfaces (Unit, Loop, Target, etc.)
- `src/lib/storage.ts` — localStorage CRUD (getUnit, saveUnit, deleteUnit, importFromJson, exportAsJson)
- `src/lib/defaults.ts` — factory functions for blank Unit, Loop, Target, etc.
- `src/lib/hooks/useUnit.ts` — load + debounced auto-save hook
- `src/lib/hooks/useUnitList.ts` — list all units for home page
- `src/lib/ngss-standards.ts` — ~50 curated NGSS PEs for wizard

**Pages**
- `/` — home page: unit cards, new unit, import from markdown, import/export JSON
- `/units/new` — 7-step Discovery Wizard (entry point → standards → phenomena → DQs → loop skeleton → targets → review)
- `/units/import` — markdown import: paste/drag-and-drop .md, live preview, warnings, "Copy AI Prompt" button
- `/units/[id]` — full structured editor (builder)
- `/settings` — Google AI API key management

**Builder — all section cards built**
- `PhenomenonCard` — name, description, media URL, slides URL
- `DrivingQuestionsCard` — unit DQ + sub-questions with clickable cycling status badge, loop linking
- `ModelProgressionCard` — auto-generated stages, editable descriptions
- `LoopCard` — title, DQ ref, duration, phenomenon connection, investigative phenomenon, navigation routine, problematizing routine, slides URL + AI buttons on all narrative fields
- `TargetCard` — title, 3D alignment (DCI/SEP/CCC), model contribution (+ AI), summary table, activities, formative, resources
- `SummaryTableCard` — 4-field AST summary table (activity/observations/reasoning/connection)
- `ActivityCard` / `ActivityList` — add/remove activities with type, duration, description
- `FormativeCard` — prompt, format dropdown, optional resource URL
- `ResourceList` — add/remove resources with auto-detected type
- `TransferTaskCard` — title, task description, standards, assessment/rubric URLs, gotta-have-it checklist
- `GottaHaveList` — add/remove/check checklist items
- `OutlineSidebar` — left nav tree, click-to-scroll to sections
- `NotesPanel` — right-side sticky notes with colors and section tags

**Shared UI**
- `CollapsibleCard`, `AddButton`, `StatusBadge`, `RichTextEditor` (Tiptap), `AiSuggestButton`

**AI suggestions**
- `src/lib/ai/suggestions.ts` — prompt templates for 17 field types
- `src/lib/ai/client.ts` — sends request to `/api/ai/suggest` with Gemini key
- `src/app/api/ai/suggest/route.ts` — calls Gemini 3.1 Flash-Lite Preview via REST
- AI wired up in: LoopCard (4 fields), TargetCard (model contribution)

**Parser / export**
- `src/lib/parser/markdown-parser.ts` — v2+ markdown → Unit (backward compatible with v1/v2)
- `src/lib/parser/ai-prompt-template.ts` — generates "Copy AI Prompt" text

---

## 🔲 Still To Build

### High priority (Phase 1b)

**~~1. `markdown-builder.ts` — Unit → v2+ markdown~~** ✅ Done
- `src/lib/parser/markdown-builder.ts` — converts Unit → v2+ markdown
- "Export Markdown" button in the builder header downloads a `.md` file

**~~2. Google Docs export~~** ✅ Done
- `src/lib/export/google-doc-builder.ts` — Unit → Google Docs batchUpdate requests (headings, bold labels, full content tree)
- `src/app/api/export/google-doc/route.ts` — POST handler, creates doc + batchUpdate, returns `docUrl`
- `src/components/unit-editor/ExportGoogleDocButton.tsx` — GIS token flow client-side, posts to API route, saves `googleDocUrl` on unit
- "Google Doc" button added to builder header (next to Export Markdown); shows "Open Doc ↗" + "Re-export" when a doc already exists
- `src/app/settings/page.tsx` — Google Client ID input field (stored in localStorage as `ngss-google-client-id`)
- Auth: Google Identity Services token flow — no `GOOGLE_CLIENT_SECRET` needed; scope `drive.file`
- `googleapis` npm package installed

**~~3. More AI coverage in TargetCard~~** ✅ Done
- `SummaryTableCard` — AI buttons on all 4 AST fields (activity, observations, reasoning, connection to phenomenon)
- `FormativeCard` — AI button on the assessment prompt (triggers after format dropdown)
- `ActivityList` — AI buttons on description and key questions for each activity
- All use context from the parent target (phenomenon, loop, target title, 3D alignment)

### Medium priority (polish)

**~~4. Drag-and-drop reordering~~** ✅ Done
- Loops: drag handles (⠿) in the OutlineSidebar — `@dnd-kit/sortable`
- Targets: drag handles on each TargetCard within a loop
- Activities: drag handles on each activity row within a target
- `sortOrder` re-indexed on drop; active loop tab follows the dragged item

**~~4b. Unit completeness indicator~~** ✅ Done
- Circular SVG progress ring in the builder header (amber → teal → green)
- Hover tooltip lists all incomplete fields by name
- Scoring logic in `src/lib/completeness.ts`

**~~4c. Model progression horizontal timeline~~** ✅ Done
- Stages rendered as a horizontal stepper: Initial → After Loop N → Complete
- Distinct node colors per stage type; falls back to vertical on small screens

**~~4d. Resource tier relabeling~~** ✅ Done
- Loop: "Teacher Reference Materials" | Target: "Target Resources" | Activity: "Files & Links" (unchanged)
- Help text added to loop and target tiers for clarity

**~~4e. DQ-to-Loop linkage hardened~~** ✅ Done
- Replaced fragile `loop.dqRef: number` (1-based index) with `loop.dqId: string` (UUID)
- Auto-migration in `storage.ts` upgrades existing localStorage data on load
- All consumers updated (LoopCard, PlanningTableView, markdown builder/parser, Google Doc builder)

**~~4f. AI Workshop discoverability~~** ✅ Done
- Nav link renamed "Workshop" → "AI Workshop"
- Page heading updated to "AI Worksheet Enhancer" with descriptive subtitle
- Each activity card has a "✨ Enhance a worksheet" link that opens Workshop with unit/loop pre-selected via URL params

**5. Wizard AI suggestions**
- Standards step: "Suggest phenomena for these standards" button
- Phenomena step: "What standards connect to this phenomenon?" button
- DQ step: "Suggest driving questions" button
- Loop skeleton step: "Suggest loop breakdown" button
- All currently render the AI button UI but may not have their prompts fully wired

**6. Unit arc visualization**
- Visual horizontal timeline in the builder showing loops → transfer task
- Could replace or supplement the outline sidebar for quick overview
- See ROADMAP.md item E (Storyline Coherence View)

### Phase 2 (future)

**7. Supabase persistence + auth**
- Replace localStorage with Supabase database
- User accounts (email/Google sign-in)
- Units associated with a user's account, accessible from any browser

**8. Real-time collaboration**
- Yjs + Liveblocks (or Supabase Realtime) for multi-teacher co-editing
- See who else is editing, live cursor/presence

**9. Team management**
- Create teams (e.g., "9th Grade Science")
- Share units with a team
- Comments on any field

---

## Quick Reference

| Route | Status |
|---|---|
| `/` | ✅ Done |
| `/units/new` | ✅ Done |
| `/units/import` | ✅ Done |
| `/units/[id]` | ✅ Done |
| `/units/[id]/export` | N/A (button redirects directly to doc) |
| `/settings` | ✅ Done |
| `/workshop` | ✅ Done (AI Worksheet Enhancer) |
| `/api/ai/suggest` | ✅ Done (Gemini 3.1 Flash-Lite) |
| `/api/ai/enhance-worksheet` | ✅ Done |
| `/api/export/google-doc` | ✅ Done |

## AI Model

Uses **Gemini 3.1 Flash-Lite Preview** (`gemini-3.1-flash-lite-preview`).
API key stored in localStorage under `ngss-gemini-key`.
Get a key at `aistudio.google.com/apikey`.
