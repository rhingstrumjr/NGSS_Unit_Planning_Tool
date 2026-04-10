# Contributing to NGSS Storyline Planner

Thanks for your interest in contributing. This document covers everything you need to get up and running.

---

## Prerequisites

- **Node.js 18+**
- A **Google AI Studio API key** (free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)) — needed to test AI features

---

## Setup

```bash
git clone <repo-url>
cd ngss-planner
npm install
cp .env.local.example .env.local   # or create .env.local manually
# Add: GEMINI_API_KEY=your_key_here
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Layout

```
src/
├── app/                # Next.js App Router — pages and API routes
│   ├── api/            # Server-side only: AI, export, research
│   ├── units/
│   │   ├── new/        # Wizard
│   │   └── [id]/       # Builder
│   └── settings/
│
├── components/
│   ├── ui/             # Reusable primitives (no business logic)
│   ├── unit-editor/    # Builder section cards
│   └── wizard/         # Wizard step components
│
└── lib/
    ├── types.ts        # ALL TypeScript interfaces — start here
    ├── storage.ts      # localStorage CRUD (getUnit, saveUnit, deleteUnit, ...)
    ├── defaults.ts     # makeUnit(), makeLoop(), makeTarget(), etc.
    ├── ngss-standards.ts  # NGSS PE database
    ├── ai/             # Gemini prompt templates + fetch wrapper
    ├── hooks/          # useUnit (load + auto-save), useUnitList
    ├── parser/         # Markdown ↔ Unit serialization
    ├── export/         # Google Docs API builder
    └── research/       # Types for resource research results
```

### Where to look first

| Task | File |
|---|---|
| Data shape change | `src/lib/types.ts`, then `src/lib/defaults.ts` |
| New builder section | `src/components/unit-editor/` |
| New wizard step | `src/components/wizard/` |
| New AI suggestion field | `src/lib/ai/suggestions.ts` |
| New API route | `src/app/api/` |
| Markdown format change | `src/lib/parser/markdown-builder.ts` + `markdown-parser.ts` |

---

## Key Conventions

### Storage

All units live in `localStorage['ngss-units']` as a JSON object keyed by unit ID. Never write to localStorage directly — use the functions in `src/lib/storage.ts`:

```ts
import { getUnit, saveUnit, deleteUnit } from '@/lib/storage';
```

The `useUnit` hook (`src/lib/hooks/useUnit.ts`) handles loading and debounced auto-save; use it in any page that edits a single unit.

### Adding a New Data Field

1. Add the field to the relevant interface in `src/lib/types.ts`.
2. Add a default value in the corresponding factory in `src/lib/defaults.ts` (so existing units without the field still load without crashing).
3. Wire the field into any relevant component and, if it should be exported, update `src/lib/parser/markdown-builder.ts` and `src/lib/parser/markdown-parser.ts`.

### Adding an AI Suggestion Field

All AI suggestions go through a single endpoint (`/api/ai/suggest`) and a shared prompt system.

1. Add your field name to `AiFieldType` in `src/lib/ai/suggestions.ts`.
2. Add a `case` in the `buildUserMessage` switch that returns the right prompt, using the `AiSuggestionContext` fields available.
3. Drop an `<AiSuggestButton>` in the relevant component, passing `fieldType` and whatever context props apply.

The `AiSuggestionContext` interface (in `src/lib/ai/suggestions.ts`) lists all available context keys.

### API Routes

All routes under `src/app/api/` are **server-side only**. The `GEMINI_API_KEY` is available only there — never import it in client components.

Routes return plain JSON. Keep them thin: parsing/building logic belongs in `src/lib/`.

### Components

- `src/components/ui/` — no business logic, no direct storage access
- `src/components/unit-editor/` — receive a `unit` prop and an `onChange` callback; call `onChange(updatedUnit)` for every edit
- `src/components/wizard/` — read/write wizard state from `WizardShell` via props

### Styling

Tailwind CSS only. No external CSS files except `src/app/globals.css` (theme tokens and global resets). Avoid inline `style=` props unless absolutely necessary for dynamic values.

---

## Before Submitting a PR

```bash
npm run lint    # must pass with no errors
npm run build   # must complete without type errors
```

There are no automated tests yet. Manually verify:

- [ ] Create a new unit end-to-end (wizard → builder)
- [ ] AI suggestion works on at least one field (requires `GEMINI_API_KEY`)
- [ ] Export to Markdown and re-import without data loss
- [ ] No console errors on the pages you touched
