/**
 * Types and prompt builder for AI-assisted unit generation.
 * Used by /api/ai/generate-unit.
 */

import type { NgssStandard } from '@/lib/ngss-standards';

export interface GenerateUnitRequest {
  gradeBand: 'MS' | 'HS';
  standardCodes: string[];
  phenomenonName: string;
  phenomenonDescription: string;
  model?: string;
}

export interface GeneratedLoop {
  title: string;
  dqIndex: number;   // 0-based index into subQuestions
  durationDays: number;
}

export interface GenerateUnitResponse {
  /** Populated when standardCodes were provided and no phenomenon was given. */
  phenomenon: { name: string; description: string } | null;
  /** Populated when phenomenon was provided and no standards were given. */
  suggestedStandardCodes: string[];
  unitDrivingQuestion: string;
  /** "Predicted Student Sub-Questions" — 3-5 items that each drive a loop. */
  subQuestions: string[];
  loops: GeneratedLoop[];
  /** targets[i] = learning target titles for loops[i]. Variable length (1–4) per loop. */
  targets: string[][];
}

const SYSTEM_PROMPT = `You are an expert NGSS science curriculum designer with deep expertise in Ambitious Science Teaching (AST) practices. You design coherent, phenomenon-driven NGSS storyline units.

Guiding principles:
- Units are anchored by a surprising, observable phenomenon that students can't immediately explain
- Each sensemaking loop addresses one student sub-question and progressively builds understanding
- Later loops reference mechanisms established in earlier loops
- Learning targets are specific and action-oriented, starting with "Students can..."
- The unit should build toward a complete causal explanation of the anchoring phenomenon

Return ONLY valid JSON — no prose, no markdown fences.`;

function standardBlock(s: NgssStandard): string {
  return `  ${s.code}: ${s.title}
    DCI: ${s.dci}
    SEP: ${s.sep}
    CCC: ${s.ccc}`;
}

const RESPONSE_SCHEMA_DESCRIPTION = `Return JSON with this exact shape:
{
  "phenomenon": { "name": "...", "description": "..." } | null,
  "suggestedStandardCodes": ["HS-PS1-1", ...] | [],
  "unitDrivingQuestion": "...",
  "subQuestions": ["...", "...", "..."],
  "loops": [
    { "title": "...", "dqIndex": 0, "durationDays": 5 }
  ],
  "targets": [
    ["Students can...", "Students can..."],
    ["Students can..."]
  ]
}`;

export function buildUnitGenerationPrompt(
  req: GenerateUnitRequest,
  standardsData: NgssStandard[]
): { system: string; user: string } {
  const isStandardsFirst = req.standardCodes.length > 0 && !req.phenomenonName;
  const isPhenomFirst = !!req.phenomenonName;

  const selectedStandards = req.standardCodes
    .map((code) => standardsData.find((s) => s.code === code))
    .filter((s): s is NgssStandard => !!s);

  const gradeBandLabel = req.gradeBand === 'HS' ? 'high school (grades 9-12)' : 'middle school (grades 6-8)';

  let userMessage: string;

  if (isStandardsFirst) {
    userMessage = `Design an NGSS storyline unit for ${gradeBandLabel} students based on these Performance Expectations:

${selectedStandards.map(standardBlock).join('\n\n')}

Instructions:
1. Suggest a phenomenon: surprising, observable at school scale, requires these DCIs to fully explain. Set "phenomenon" to { name, description } where description is 2-3 vivid sentences teachers can use.
2. Generate a unit driving question (the overarching "how/why" question students would ask after seeing the phenomenon).
3. Generate 3-5 predicted student sub-questions — genuine questions students might ask. Each sub-question will drive one sensemaking loop.
4. Design 3-5 sensemaking loops that build progressively. Each loop:
   - Has a title that is a concept statement (not a label like "Loop 1")
   - References dqIndex (0-based index into subQuestions) for the sub-question it addresses
   - Has a realistic durationDays (3-8 days each)
   - Later loops should explicitly build on mechanisms from earlier loops
5. For each loop, generate 1-4 learning targets depending on complexity. Each target starts with "Students can..." and names a specific SEP verb (explain, model, analyze, construct, etc.).
6. Set "suggestedStandardCodes" to [].

${RESPONSE_SCHEMA_DESCRIPTION}`;
  } else if (isPhenomFirst) {
    const gradeStandards = standardsData.filter((s) => s.gradeBand === req.gradeBand);
    const phenomenonDesc = req.phenomenonDescription
      ? `\nPhenomenon description: ${req.phenomenonDescription}`
      : '';

    userMessage = `Design an NGSS storyline unit for ${gradeBandLabel} students anchored by this phenomenon:

Phenomenon: "${req.phenomenonName}"${phenomenonDesc}

Instructions:
1. Set "phenomenon" to null (already provided).
2. Select 2-4 Performance Expectations from this list that this phenomenon most directly connects to. Set "suggestedStandardCodes" to those codes:

${gradeStandards.map(standardBlock).join('\n\n')}

3. Generate a unit driving question (the overarching "how/why" question students would ask after seeing the phenomenon).
4. Generate 3-5 predicted student sub-questions — genuine questions students might ask. Each will drive one sensemaking loop.
5. Design 3-5 sensemaking loops that build progressively. Each loop:
   - Has a title that is a concept statement (not a label)
   - References dqIndex (0-based) for which sub-question it addresses
   - Has realistic durationDays (3-8 days each)
   - Later loops should build on mechanisms from earlier ones
6. For each loop, generate 1-4 learning targets depending on complexity. Each starts with "Students can..." + a specific SEP verb.

${RESPONSE_SCHEMA_DESCRIPTION}`;
  } else {
    // Fallback: both provided
    const phenomenonDesc = req.phenomenonDescription
      ? `\nPhenomenon description: ${req.phenomenonDescription}`
      : '';
    const standardsSection =
      selectedStandards.length > 0
        ? `\nAligned standards:\n${selectedStandards.map(standardBlock).join('\n\n')}`
        : '';

    userMessage = `Design an NGSS storyline unit for ${gradeBandLabel} students.

Phenomenon: "${req.phenomenonName}"${phenomenonDesc}${standardsSection}

Instructions:
1. Set "phenomenon" to null and "suggestedStandardCodes" to [].
2. Generate a unit driving question.
3. Generate 3-5 predicted student sub-questions.
4. Design 3-5 sensemaking loops that build progressively with concept-statement titles.
5. For each loop, generate 1-4 learning targets starting with "Students can...".

${RESPONSE_SCHEMA_DESCRIPTION}`;
  }

  return { system: SYSTEM_PROMPT, user: userMessage };
}

/** Cost per 1M tokens for display in UI (paid tier rates, approx) */
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gemini-3.1-flash-lite-preview': { input: 0.25, output: 1.50 },
  'gemini-3-flash-preview': { input: 0.50, output: 3.00 },
  'gemini-2.5-pro': { input: 1.25, output: 10.00 },
};

/** Estimate cost for a typical generation call (3K input + 1.5K output tokens) */
export function estimateCallCost(model: string): number {
  const costs = MODEL_COSTS[model];
  if (!costs) return 0;
  return (costs.input * 3000 + costs.output * 1500) / 1_000_000;
}

export const SUPPORTED_MODELS = [
  { id: 'gemini-3.1-flash-lite-preview', label: 'Flash Lite (fastest)' },
  { id: 'gemini-3-flash-preview', label: 'Flash (recommended)' },
  { id: 'gemini-2.5-pro', label: 'Pro (highest quality)' },
] as const;

export const DEFAULT_MODEL = 'gemini-3-flash-preview';
export const MODEL_STORAGE_KEY = 'ai-unit-gen-model';

/** Gemini responseSchema definition for structured output */
export const UNIT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    phenomenon: {
      type: 'object',
      nullable: true,
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['name', 'description'],
    },
    suggestedStandardCodes: {
      type: 'array',
      items: { type: 'string' },
    },
    unitDrivingQuestion: { type: 'string' },
    subQuestions: {
      type: 'array',
      items: { type: 'string' },
    },
    loops: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          dqIndex: { type: 'integer' },
          durationDays: { type: 'integer' },
        },
        required: ['title', 'dqIndex', 'durationDays'],
      },
    },
    targets: {
      type: 'array',
      items: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },
  required: ['phenomenon', 'suggestedStandardCodes', 'unitDrivingQuestion', 'subQuestions', 'loops', 'targets'],
};
