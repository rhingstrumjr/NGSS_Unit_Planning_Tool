# NGSS Storyline Planner — Feature Roadmap

> Research basis: NGSS Storyline design principles (nextgenstorylines.org), Ambitious Science Teaching framework (Windschitl et al.), EQuIP rubric, OpenSciEd teacher feedback, and WestEd student engagement research.

---

## ✅ Completed UX Improvements

These were the first batch of polish items, completed April 2026:

| # | Change | Files |
|---|--------|-------|
| 1 | **Drag-and-drop reordering** — loops (sidebar), targets (LoopCard), activities (ActivityCard) | `OutlineSidebar`, `LoopCard`, `ActivityCard` |
| 2 | **Model Progression horizontal timeline** — stages rendered as a visual stepper with connecting arrows | `ModelProgressionCard` |
| 3 | **Unit Completeness Indicator** — circular progress ring in builder header with hover tooltip of missing fields | `UnitEditor`, `src/lib/completeness.ts` |
| 4 | **Resource tier relabeling** — "Teacher Reference Materials" (loop), "Target Resources" (target), "Student-Facing Resources" (activity) with help text | `ResourceList`, `LoopCard`, `TargetCard`, `ActivityCard` |
| 5 | **Workshop rename + discovery** — Nav renamed to "AI Workshop"; page heading updated; "✨ Enhance a worksheet" link added to each activity; URL params auto-fill unit/loop context | `layout`, `workshop/page`, `UnitContextPicker`, `ActivityCard` |
| 6 | **DQ-to-Loop linkage hardened** — migrated from fragile `dqRef: number` (1-based index) to `dqId: string` (UUID); auto-migration runs on load for existing units | `types`, `storage`, `LoopCard`, `markdown-builder`, `markdown-parser`, `google-doc-builder`, `PlanningTableView` |

---

## 🔴 Tier 1 — High Impact (do next)

These directly address the top gaps identified by EQuIP rubric, NGSS Storyline research, and AST framework.

### A. 3D Coverage Matrix
**Why:** EQuIP rubric's #1 criterion is 3D integration. Teachers routinely design 1D or 2D units without realizing it.  
**What:** A live grid in the Overview tab showing every Target × DCI/SEP/CCC dimension. Cells are green/yellow/red. AI button on empty cells suggests alignments.  
**Effort:** Medium  
**Files:** New `CoverageMatrixCard.tsx`, `src/components/unit-editor/`

---

### B. Driving Question Board (DQB) Visualizer
**Why:** AST names the DQB as one of its two most essential classroom tools (alongside the summary table). OpenSciEd structures entire units around it. Current UI is just a flat list.  
**What:** Upgrade to a Kanban-style board: *Student Questions* → *Investigating* (linked to loop) → *Figured Out* (answered). DQs drag between columns. "Student-generated" flag.  
**Effort:** Medium  
**Files:** `src/components/unit-editor/DrivingQuestionsCard.tsx`

---

### C. Phenomenon Quality Evaluator
**Why:** Selecting a high-quality phenomenon is the #1 identified teacher difficulty. NGSS Storyline framework has explicit criteria.  
**What:** After phenomenon entry, AI scores it on 5 criteria: Observable, Student-Relevant, Requires Multiple DCIs, Standards-Aligned, Equitable/Accessible. Shows brief feedback + suggestions.  
**Effort:** Low-Medium (AI prompt + scoring UI)  
**Files:** `src/components/unit-editor/PhenomenonCard.tsx`, `/api/ai/suggest`

---

### D. EQuIP Self-Assessment Rubric
**Why:** EQuIP is the authoritative NGSS curriculum quality tool. Teachers can't get expert reviewers for every unit — they need a self-check.  
**What:** Collapsible checklist (or modal) in Wrap-Up tab with 3 EQuIP columns: Alignment, Instructional Supports, Monitoring Progress. Each criterion is a 0–3 slider. AI pre-fills scores; teacher overrides. Radar chart of scores.  
**Effort:** Medium  
**Files:** New `EQuipRubricCard.tsx`

---

### E. Unit Storyline / Coherence View
**Why:** "Coherence from the student's perspective" is the defining feature of NGSS storylines per NGSS Storyline.org. Teachers need to see the narrative arc.  
**What:** A read-only visual map at `/units/[id]/storyline` showing: Anchoring Phenomenon → [DQ1] → Loop 1 → Model Update → [DQ2] → Loop 2 → … → Transfer Task. Clickable nodes jump to builder sections. Printable.  
**Effort:** Medium  
**Files:** New `src/app/units/[id]/storyline/page.tsx`

---

## 🟡 Tier 2 — High Value, Moderate Effort

### F. CER Formative Templates
**Why:** CER (Claims-Evidence-Reasoning) is a core AST tool. Current app has one free-text formative per target.  
**What:** Upgrade `FormativeCard` with a CER template mode: three labeled prompts (Claim, Evidence, Reasoning) AI-filled based on target alignment. Second formative slot per target (exit ticket + warm-up revisit). CER worksheet export.  
**Effort:** Medium  
**Files:** `src/components/unit-editor/FormativeCard.tsx`, `src/lib/types.ts`

---

### G. Pacing Calendar View
**Why:** 50%+ of districts cite pacing as a major challenge. Teachers use pacing guides as their primary companion tool.  
**What:** Toggle in Planning tab between current table view and a monthly calendar grid. Teacher picks unit start date; activities auto-populate across days. Drag to shift. Color-coded lab/assessment/discussion days.  
**Effort:** High  
**Files:** `src/components/unit-editor/PlanningTableView.tsx`

---

### H. Talk Move / Discussion Prompt Library
**Why:** AST's productive classroom talk routines are research-validated for engagement. A/B Partner Talk, pressing for evidence, synthesis discussions are the highest-leverage practices.  
**What:** Slide-out drawer on each Activity card with a curated library of talk prompts: Elicitation, Pressing for Evidence, Making Connections, Synthesis. Click to insert into Key Questions. AI generates situation-specific prompts.  
**Effort:** Low-Medium  
**Files:** `src/components/unit-editor/ActivityCard.tsx` (new drawer component)

---

### I. Equity & Access Planner
**Why:** EQuIP Column 2 explicitly evaluates support for diverse learners. OpenSciEd's biggest strength is UDL integration. NGSS has explicit equity design requirements.  
**What:** Per-loop collapsible "Equity & Access" section with structured prompts: Who might be excluded? Scaffolds for multilingual learners? Cultural connections? Alternative representations? AI drafts based on activity type. Included in Google Docs export.  
**Effort:** Low-Medium  
**Files:** `src/components/unit-editor/LoopCard.tsx`, `src/lib/types.ts`

---

### J. Full NGSS Standards Browser
**Why:** App currently has ~50 curated PEs. Full NGSS is 180+ PEs across K-12. Teachers planning cross-disciplinary units or non-covered areas are blocked.  
**What:** Expand `ngss-standards.ts` to the complete standard set. Searchable/filterable modal in wizard `StandardsStep` and Overview tab. Filters: grade band, domain (physical/life/earth), DCI topic, keyword. Shows full 3D breakdown per PE.  
**Effort:** Medium (data + search UI)  
**Files:** `src/lib/ngss-standards.ts`, `src/components/wizard/StandardsStep.tsx`

---

## 🟢 Tier 3 — Nice-to-Have / Longer Term

### K. Unit Template Library
Pre-built unit shells for common course archetypes (HS Chemistry: Conservation of Matter, MS Life Science: Ecosystems, HS Physics: Forces). Teachers start from a template and customize. Avoids blank-page paralysis.  
**Effort:** Low (data + selection UI); AI fills content on demand.

---

### L. Share via Link (No Account)
Generate a read-only share URL that encodes the unit as a compressed param or uploads to a lightweight paste service. Other teachers open the link and can "Fork to My Planner." No backend required if using client-side encoding.  
**Effort:** Medium-High

---

### M. Student Storyline View
A student-facing read-only page showing the phenomenon, driving questions, and "what we've figured out so far" — a living KWL chart. Teachers share via QR code or URL. Students see the narrative arc of the unit.  
**Effort:** High (requires some hosting/backend or clever URL encoding)

---

### N. Professional Reflection Journal
Upgrade the Notes panel from generic sticky notes to a structured post-unit reflection log tied to AST's reflection cycle: "What worked? What confused students? What would I change? Evidence of engagement?" Exportable as a teacher portfolio artifact.  
**Effort:** Low  
**Files:** `src/components/unit-editor/NotesPanel.tsx`

---

## Suggested Implementation Sequence

Ordered by **impact-to-effort ratio**, accounting for what's already built:

1. **C** — Phenomenon Quality Evaluator (low effort, addresses #1 teacher pain point)
2. **H** — Talk Move Library (low effort, high engagement value, builds on existing Activity UI)
3. **A** — 3D Coverage Matrix (addresses top EQuIP gap, medium effort)
4. **N** — Reflection Journal (low effort, easy win, uses existing NotesPanel)
5. **F** — CER Formative Templates (upgrades existing FormativeCard)
6. **B** — DQB Visualizer (upgrades existing DrivingQuestionsCard)
7. **E** — Storyline Coherence View (new page, very visual, great for sharing)
8. **I** — Equity & Access Planner (new type fields + prompts per loop)
9. **D** — EQuIP Self-Assessment (differentiator; requires scoring logic + radar chart)
10. **J** — Full NGSS Standards Browser (data work + search UI)
11. **G** — Pacing Calendar (highest effort; implement after other features stable)
12. **K** — Template Library (data work; good for onboarding new users)
13. **L** — Share via Link (infrastructure work)
14. **M** — Student Storyline View (requires hosting decision)

---

## Research Sources

- [Next Generation Science Storylines](https://www.nextgenstorylines.org/)
- [Ambitious Science Teaching](https://ambitiousscienceteaching.org/)
- [EQuIP Rubric for Science](https://www.nextgenscience.org/resources/equip-rubric-science)
- [OpenSciEd Teacher Resources](https://openscied.org/curriculum/high-school/teacher-resources/)
- [WestEd M-PLANS Student Engagement Research](https://www.wested.org/resource/equipping-teachers-to-support-student-motivation-ngss-m-plans-program/)
- [STEM Teaching Tools — Using Phenomena](https://stemteachingtools.org/brief/42)
- [NGSS Three-Dimensional Learning](https://www.nextgenscience.org/three-dimensional-learning)
