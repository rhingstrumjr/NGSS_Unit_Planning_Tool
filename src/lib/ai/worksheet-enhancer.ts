/**
 * Types, prompt builder, and response schema for the Worksheet Enhancement Workshop.
 * Used by /api/ai/enhance-worksheet.
 */

export type EnhancementStrategy =
  | 'phenomenon-opener'
  | 'upgrade-cognitive-level'
  | 'cer-scaffolding'
  | 'crosscutting-prompts'
  | 'science-practice-alignment'
  | 'tiered-scaffolding'
  | 'metacognitive-reflection'
  | 'collaborative-structures'
  | 'real-world-connections'
  | 'student-choice'
  | 'mission-framing'
  | 'vocabulary-support';

export interface StrategyMeta {
  id: EnhancementStrategy;
  label: string;
  description: string;
  instructions: string;
  bestWithContext: boolean;
}

export const STRATEGY_METADATA: StrategyMeta[] = [
  {
    id: 'phenomenon-opener',
    label: 'Phenomenon Opener',
    description: 'Add an engaging scenario or data anomaly as a driving question before content begins',
    bestWithContext: true,
    instructions: `Add an opening section that presents an engaging, observable phenomenon or surprising data anomaly before any content or questions begin. The opener should spark curiosity and create intellectual need — students should feel compelled to figure out "why" or "how." If unit context is provided, connect the opener directly to the anchoring phenomenon. Include a driving question that the worksheet will help students investigate. Do NOT remove existing content — prepend the opener.`,
  },
  {
    id: 'upgrade-cognitive-level',
    label: 'Upgrade Cognitive Level',
    description: 'Rewrite recall questions (remember/understand) to analyze, evaluate, or create',
    bestWithContext: false,
    instructions: `Identify questions that only require recall or basic comprehension (Bloom's "Remember" or "Understand" levels) and rewrite them at higher cognitive levels (Apply, Analyze, Evaluate, or Create). For example, change "What is photosynthesis?" to "Predict what would happen to Plant A if we blocked all sunlight for a week. Use evidence from the data to support your prediction." Preserve the original topic of each question but require students to apply, compare, construct, or evaluate rather than simply recall definitions.`,
  },
  {
    id: 'cer-scaffolding',
    label: 'CER Scaffolding',
    description: 'Convert questions to Claim-Evidence-Reasoning format with sentence stems',
    bestWithContext: false,
    instructions: `Convert key questions into the Claim-Evidence-Reasoning (CER) framework. For each converted question, provide: (1) a clear prompt asking students to make a claim, (2) space/instructions to cite specific evidence from data, text, or observations, and (3) a reasoning section where students explain HOW the evidence supports the claim. Include optional sentence stems as scaffolding: "My claim is ___. The evidence that supports this is ___. This evidence supports my claim because ___." Apply CER to 2-4 of the most important questions — not every question needs this format.`,
  },
  {
    id: 'crosscutting-prompts',
    label: 'Crosscutting Concept Prompts',
    description: 'Add reflection questions about patterns, cause/effect, systems, etc.',
    bestWithContext: true,
    instructions: `Add 2-3 reflection questions that explicitly connect the worksheet content to NGSS Crosscutting Concepts. Choose the most relevant CCCs from: Patterns, Cause & Effect, Scale/Proportion/Quantity, Systems & System Models, Energy & Matter, Structure & Function, Stability & Change. If unit context provides CCC alignment, prioritize those concepts. Example: "What patterns do you notice in the data? What might cause these patterns?" Place these as reflection prompts near the end or after data analysis sections.`,
  },
  {
    id: 'science-practice-alignment',
    label: 'Science Practice Alignment',
    description: 'Add instructions for NGSS science and engineering practices',
    bestWithContext: true,
    instructions: `Enhance the worksheet by explicitly incorporating one or more NGSS Science and Engineering Practices (SEPs). Add instructions that require students to: ask questions, develop/use models, plan/carry out investigations, analyze/interpret data, use mathematical thinking, construct explanations, engage in argument from evidence, or obtain/evaluate/communicate information. If unit context provides SEP alignment, prioritize that practice. Transform passive tasks ("read about X") into active practice ("construct a model that explains X" or "analyze this data set to identify X").`,
  },
  {
    id: 'tiered-scaffolding',
    label: 'Tiered Scaffolding',
    description: 'Generate supported, standard, and extension versions of key questions',
    bestWithContext: false,
    instructions: `For 2-3 of the most important questions on the worksheet, create three tiers: (1) SUPPORTED — includes sentence starters, a word bank, or labeled diagrams to help struggling students get started; (2) STANDARD — the enhanced question as-is; (3) EXTENSION — a challenge version that pushes advanced students to go deeper (e.g., apply to a new context, consider limitations, or design an investigation). Format clearly so teachers can choose which tier to assign. Label tiers as "Getting Started," "On Track," and "Going Further."`,
  },
  {
    id: 'metacognitive-reflection',
    label: 'Metacognitive Reflection',
    description: 'Add self-assessment, confidence ratings, and reflection prompts',
    bestWithContext: false,
    instructions: `Add a brief reflection section at the end of the worksheet (3-5 minutes to complete). Include: (1) A confidence self-assessment where students rate their understanding on a 1-4 scale for 2-3 key concepts; (2) A "muddiest point" prompt: "What is still confusing or unclear?"; (3) A forward-looking question: "What would you still like to investigate?" This develops metacognitive awareness and gives teachers formative data. Keep it brief — no more than 4-5 lines.`,
  },
  {
    id: 'collaborative-structures',
    label: 'Collaborative Structures',
    description: 'Insert partner/group checkpoint prompts at key moments',
    bestWithContext: false,
    instructions: `Insert 2-3 collaborative checkpoint prompts at strategic points in the worksheet. Examples: "Partner Check: Compare your answer with a partner. What is similar? What is different?" or "Table Talk: Share your model with your group. Does everyone agree on the mechanism? Revise based on feedback." or "Peer Review: Read your partner's CER. Does their evidence support their claim? Suggest one improvement." Place these after major thinking tasks, not after simple recall questions. Use structured protocols so collaboration is productive, not just "discuss with a partner."`,
  },
  {
    id: 'real-world-connections',
    label: 'Real-World Connections',
    description: 'Connect content to community issues, careers, or global relevance',
    bestWithContext: false,
    instructions: `Add a "Why Does This Matter?" connection that ties the worksheet content to real-world applications, community issues, or current events. This could be a brief context paragraph, a career spotlight ("Scientists at NOAA use this same technique to..."), or a local connection prompt ("How might this concept affect your community?"). If the worksheet uses contrived or hypothetical data, suggest where authentic real-world data sources could be substituted (NASA, NOAA, local environmental data, etc.). Place this early to motivate engagement, not as an afterthought at the end.`,
  },
  {
    id: 'student-choice',
    label: 'Student Choice',
    description: 'Offer multiple pathways or "choose N of M" structures',
    bestWithContext: false,
    instructions: `Where the worksheet has repetitive practice (5+ similar problems), restructure as "Choose any 4 of these 6 problems" to give students agency. For open-ended tasks, offer 2-3 options for how to demonstrate understanding: (A) written explanation, (B) labeled diagram or model, or (C) data analysis with annotations. Frame choices clearly so all options assess the same learning target at equal rigor. The goal is autonomy, not reduced expectations.`,
  },
  {
    id: 'mission-framing',
    label: 'Mission / Challenge Framing',
    description: 'Wrap the worksheet in a scenario ("You are a scientist investigating...")',
    bestWithContext: false,
    instructions: `Add a scenario frame that gives the worksheet a narrative context. Example: "You are an environmental scientist hired by the city council to investigate why fish populations in Lake Morrison have declined by 40% in the last 5 years." The scenario should feel authentic (not cartoonish) and connect to the actual content of the worksheet. Reframe procedural instructions in terms of the scenario where natural (e.g., "Analyze the water quality data your team collected" instead of "Look at Table 1"). Keep the scenario consistent throughout — reference it in 2-3 places, not just the introduction.`,
  },
  {
    id: 'vocabulary-support',
    label: 'Vocabulary Support',
    description: 'Generate a word bank with student-friendly definitions',
    bestWithContext: false,
    instructions: `Identify 5-8 key scientific vocabulary terms used in the worksheet and create a "Word Bank" with student-friendly definitions. Definitions should be in plain language (not copied from a glossary) and include a usage example when helpful. Place the word bank as an optional sidebar or boxed section — it should feel like a support tool, not mandatory pre-reading. For terms with Greek/Latin roots, briefly note the root to build word analysis skills (e.g., "photo- = light, synthesis = putting together").`,
  },
];

export interface UnitContext {
  phenomenonName: string;
  phenomenonDescription: string;
  unitDrivingQuestion: string;
  gradeBand: string;
  standards: { code: string; description: string; type: string }[];
  loopTitle?: string;
  phenomenonConnection?: string;
  targetTitle?: string;
  dciAlignment?: string;
  sepAlignment?: string;
  cccAlignment?: string;
}

export interface EnhanceWorksheetRequest {
  originalText: string;
  strategies: EnhancementStrategy[];
  unitContext?: UnitContext;
  model?: string;
}

export interface ChangeLogEntry {
  strategy: string;
  description: string;
  section: string;
}

export interface EnhanceWorksheetResponse {
  enhancedText: string;
  changeLog: ChangeLogEntry[];
  vocabularyBank: { term: string; definition: string }[] | null;
}

const SYSTEM_PROMPT = `You are an expert NGSS science curriculum designer specializing in transforming traditional worksheets and labs into high-engagement, three-dimensional learning experiences. You draw on research from Ambitious Science Teaching (AST), Understanding by Design (UbD), and the NGSS Framework.

When enhancing a worksheet:
- PRESERVE the core content, learning goals, and overall structure — you are enhancing, not replacing
- Apply ONLY the specific strategies the teacher has selected — do not make changes outside those strategies
- Make changes that are practical for a real classroom (consider time, materials, feasibility)
- Maintain grade-appropriate reading level and language complexity
- Do NOT remove existing good questions — enhance or build on them
- Return the FULL enhanced worksheet text, not just the changed parts
- For each change, log what you changed, which strategy it serves, and a brief pedagogical justification

Return ONLY valid JSON — no prose, no markdown fences.`;

export function buildEnhancementPrompt(req: EnhanceWorksheetRequest): {
  system: string;
  user: string;
} {
  const selectedStrategies = STRATEGY_METADATA.filter((s) =>
    req.strategies.includes(s.id)
  );

  let contextBlock = '';
  if (req.unitContext) {
    const ctx = req.unitContext;
    const parts: string[] = [];
    if (ctx.phenomenonName) parts.push(`Anchoring Phenomenon: "${ctx.phenomenonName}"`);
    if (ctx.phenomenonDescription) parts.push(`Phenomenon Description: ${ctx.phenomenonDescription}`);
    if (ctx.unitDrivingQuestion) parts.push(`Unit Driving Question: "${ctx.unitDrivingQuestion}"`);
    if (ctx.gradeBand) parts.push(`Grade Band: ${ctx.gradeBand}`);
    if (ctx.loopTitle) parts.push(`Current Sensemaking Loop: "${ctx.loopTitle}"`);
    if (ctx.phenomenonConnection) parts.push(`Connection to Phenomenon: ${ctx.phenomenonConnection}`);
    if (ctx.targetTitle) parts.push(`Learning Target: "${ctx.targetTitle}"`);
    const threeD = [ctx.dciAlignment, ctx.sepAlignment, ctx.cccAlignment].filter(Boolean);
    if (threeD.length > 0) parts.push(`3D Alignment: ${threeD.join(' | ')}`);
    if (ctx.standards.length > 0) {
      parts.push(`NGSS Standards:\n${ctx.standards.map((s) => `  ${s.code}: ${s.description} (${s.type})`).join('\n')}`);
    }
    contextBlock = `\n\n=== UNIT CONTEXT ===\nThis worksheet is part of an NGSS storyline unit. Use this context to make enhancements more coherent and connected:\n${parts.join('\n')}\n=== END CONTEXT ===`;
  }

  const strategyInstructions = selectedStrategies
    .map((s, i) => `${i + 1}. **${s.label}**: ${s.instructions}`)
    .join('\n\n');

  const user = `Here is the original worksheet text:

=== ORIGINAL WORKSHEET ===
${req.originalText}
=== END WORKSHEET ===${contextBlock}

Please enhance this worksheet by applying the following ${selectedStrategies.length} strategies:

${strategyInstructions}

Return the enhanced worksheet as JSON with these fields:
- "enhancedText": the full enhanced worksheet text (use markdown formatting)
- "changeLog": an array of objects, each with "strategy" (strategy name), "section" (which part of the worksheet was changed), and "description" (what was changed and why — include brief pedagogical justification)
- "vocabularyBank": if vocabulary-support strategy was selected, an array of { "term", "definition" } objects; otherwise null`;

  return { system: SYSTEM_PROMPT, user };
}

/** Cost per 1M tokens (same rates as unit-generator) */
const ENHANCE_MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gemini-3.1-flash-lite-preview': { input: 0.25, output: 1.50 },
  'gemini-3-flash-preview': { input: 0.50, output: 3.00 },
  'gemini-2.5-pro': { input: 1.25, output: 10.00 },
};

/** Estimate cost for a worksheet enhancement call (6K input + 5K output tokens) */
export function estimateEnhanceCost(model: string): number {
  const c = ENHANCE_MODEL_COSTS[model];
  if (!c) return 0;
  return (c.input * 6000 + c.output * 5000) / 1_000_000;
}

export const ENHANCE_DEFAULT_MODEL = 'gemini-3-flash-preview';
export const ENHANCE_MODEL_STORAGE_KEY = 'ai-workshop-model';

export const ENHANCE_SUPPORTED_MODELS = [
  { id: 'gemini-3.1-flash-lite-preview', label: 'Flash Lite (fastest, cheapest)' },
  { id: 'gemini-3-flash-preview', label: 'Flash (recommended)' },
  { id: 'gemini-2.5-pro', label: 'Pro (highest quality)' },
] as const;

/** Gemini responseSchema for structured output */
export const ENHANCE_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    enhancedText: { type: 'string' },
    changeLog: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          strategy: { type: 'string' },
          description: { type: 'string' },
          section: { type: 'string' },
        },
        required: ['strategy', 'description', 'section'],
      },
    },
    vocabularyBank: {
      type: 'array',
      nullable: true,
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          definition: { type: 'string' },
        },
        required: ['term', 'definition'],
      },
    },
  },
  required: ['enhancedText', 'changeLog', 'vocabularyBank'],
};
