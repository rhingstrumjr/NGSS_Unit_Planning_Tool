# NGSS Storyline Planner

A curriculum design tool for K–12 science teachers building phenomenon-driven units aligned to the [Next Generation Science Standards (NGSS)](https://www.nextgenscience.org/) and [Ambitious Science Teaching (AST)](https://ambitiousscienceteaching.org/) practices.

> **Local-first.** All your units live in your browser. No account required.

---

## Features

- **8-step unit wizard** — guided flow from anchoring phenomenon through standards, driving questions, sensemaking loops, and learning targets
- **Structured unit builder** — full editor for phenomena, driving questions, model progression, loops, targets, activities, formative assessments, and transfer tasks
- **AI-powered suggestions** — one-click Gemini suggestions on 17 narrative fields (loop routines, target descriptions, summary table entries, formative prompts, and more)
- **AI Worksheet Enhancer** — transform existing worksheets with research-backed strategies (CER scaffolding, cognitive level upgrades, metacognitive prompts, and more); accessible from each activity or from the nav
- **AST summary table** — activity → observations → reasoning → connection to phenomenon for every learning target
- **Drag-and-drop reordering** — drag loops in the sidebar, drag targets within a loop, drag activities within a target
- **Unit completeness indicator** — progress ring in the builder header with hover tooltip listing all incomplete fields
- **Model progression timeline** — visual horizontal stepper from Initial Model through each loop to Complete Model
- **Resource research** — AI-powered teaching resource finder for loops and targets; resources labeled by tier (Teacher Reference / Student-Facing)
- **Google Docs export** — one-click export to a formatted Google Doc (requires a Google account sign-in in the browser)
- **Google Drive Picker** — "From Drive" button on every resource list lets you add Docs, Slides, Sheets, Forms, PDFs, and images directly from your Drive without copy-pasting share links (requires `NEXT_PUBLIC_GOOGLE_API_KEY` — see below)
- **Markdown import/export** — share or version-control units as `.md` files
- **JSON backup/restore** — export and import all units at once
- **Teacher notes** — color-coded sticky notes pinned to any section
- **Outline sidebar** — jump-to-section navigation while editing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Rich text | Tiptap v3 |
| AI | Google Gemini via REST |
| Export | Google Docs API v1 (OAuth) |
| Storage | Browser `localStorage` |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A [Google AI Studio API key](https://aistudio.google.com/apikey) (free) for AI suggestions

### Installation

```bash
git clone <repo-url>
cd ngss-planner
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_google_ai_studio_key_here
# Optional — enables "From Drive" picker next to every Add Resource button
NEXT_PUBLIC_GOOGLE_API_KEY=your_gcp_browser_api_key_here
```

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI Studio key. Used by all `/api/ai/*` and `/api/research/*` routes. |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | No | Browser API key from the same GCP project as the OAuth client ID. Required only if you want the in-app Google Drive Picker ("From Drive" button on resource lists). Enable the **Google Picker API** on that project. |

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### Creating a Unit

1. Click **New Unit** on the home page.
2. Choose your entry point: start from NGSS standards or from a phenomenon.
3. Complete the 8-step wizard (standards → phenomenon → AI draft → driving questions → loops → targets → review).
4. The unit opens in the full builder for detailed editing.

### Editing a Unit

The builder is organized into four tabs:

- **Overview** — phenomenon, driving questions, model progression
- **Loops** — one card per sensemaking loop, each with targets, activities, and formative assessments
- **Wrap-Up** — transfer task and "gotta-have-it" checklist
- **Planning** — flat activity table for pacing and sequencing

Click the **AI** button on any narrative field to get a Gemini-generated suggestion.

### Exporting

| Format | How |
|---|---|
| Google Doc | Click **Export → Google Doc** in the builder header. Sign in with Google when prompted. |
| Markdown | Click **Export → Markdown** to download a `.md` file. |
| JSON (all units) | Click **Export JSON** on the home page. |

### Importing

| Format | How |
|---|---|
| Markdown | Click **Import Markdown** on the home page. Paste or drag a `.md` file. |
| JSON (all units) | Click **Import JSON** on the home page. **Warning: this replaces all existing units.** |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ai/             # /api/ai/suggest, /api/ai/generate-unit
│   │   ├── export/         # /api/export/google-doc
│   │   └── research/       # /api/research/resources
│   ├── units/
│   │   ├── new/            # 8-step wizard
│   │   ├── [id]/           # Unit builder
│   │   └── import/         # Markdown import
│   ├── settings/           # Google Client ID, storage info
│   ├── layout.tsx
│   └── page.tsx            # Home (unit list)
│
├── components/
│   ├── ui/                 # Shared primitives (Tabs, AddButton, RichTextEditor, etc.)
│   ├── unit-editor/        # Builder section cards
│   └── wizard/             # Wizard step components
│
└── lib/
    ├── types.ts            # All TypeScript interfaces
    ├── storage.ts          # localStorage CRUD
    ├── defaults.ts         # Factory functions for blank objects
    ├── ngss-standards.ts   # NGSS Performance Expectation database
    ├── hooks/              # useUnit (load + auto-save), useUnitList
    ├── ai/                 # Gemini client + prompt templates
    ├── parser/             # Markdown ↔ Unit conversion
    ├── export/             # Google Docs builder
    └── research/           # Resource research types
```

---

## Data Model

Units are stored as JSON in `localStorage['ngss-units']`. The top-level shape:

```
Unit
├── phenomena[]           (anchoring phenomenon + optional secondary)
├── standards[]           (NGSS Performance Expectations)
├── drivingQuestions[]    (unit DQ + sub-questions)
├── modelStages[]         (initial → after each loop → complete)
├── loops[]
│   └── targets[]
│       ├── activities[]
│       ├── formative
│       ├── summaryTable  (AST: activity / observations / reasoning / connection)
│       └── resources[]
├── transferTask
│   └── gottaHaveItems[]
└── notes[]               (teacher sticky notes)
```

See [`src/lib/types.ts`](src/lib/types.ts) for the full TypeScript definitions.

---

## Deployment

The fastest path is [Vercel](https://vercel.com):

```bash
npx vercel
```

Set the `GEMINI_API_KEY` environment variable in the Vercel project settings. No database or other backend infrastructure is required.

---

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for the full feature backlog with research rationale and suggested sequencing. See [`PROGRESS.md`](PROGRESS.md) for detailed build status. Planned future work includes:

- Phenomenon quality evaluator (AI scores against NGSS Storyline criteria)
- 3D Coverage Matrix (live EQuIP-style DCI/SEP/CCC grid across all targets)
- Driving Question Board visualizer (Kanban-style: Unanswered → Investigating → Figured Out)
- EQuIP self-assessment rubric
- Supabase persistence and user accounts
- Real-time collaboration (Yjs / Liveblocks)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT
