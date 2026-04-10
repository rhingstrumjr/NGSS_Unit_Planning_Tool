/**
 * Prompt templates for inline AI field suggestions.
 * Each function returns a system prompt + user message for the Claude API.
 */

export type AiFieldType =
  | 'phenomenon-description'
  | 'unit-driving-question'
  | 'sub-questions'
  | 'phenomenon-connection'
  | 'investigative-phenomenon'
  | 'navigation-routine'
  | 'problematizing-routine'
  | 'model-contribution'
  | 'summary-table-activity'
  | 'summary-table-observations'
  | 'summary-table-reasoning'
  | 'summary-table-connection'
  | 'formative'
  | 'activity-description'
  | 'key-questions'
  | 'gotta-have-it'
  | 'gapless-explanation';

export interface AiSuggestionContext {
  fieldType: AiFieldType;
  phenomenonName?: string;
  phenomenonDescription?: string;
  unitDrivingQuestion?: string;
  loopTitle?: string;
  loopIndex?: number;
  targetTitle?: string;
  dciAlignment?: string;
  sepAlignment?: string;
  cccAlignment?: string;
  prevLoopTitle?: string;
  nextLoopTitle?: string;
  currentValue?: string;
  /** Activities already entered for this target (title + description + key questions) */
  activitiesText?: string;
}

const SYSTEM_PROMPT = `You are an expert NGSS science curriculum designer with deep knowledge of Ambitious Science Teaching (AST) practices. You help teachers design coherent NGSS storyline units.

When generating suggestions:
- Be concise and specific — return 1-3 sentences unless asked for more
- Write in a teacher-facing voice (professional, practical)
- Anchor everything to the phenomenon provided
- Use NGSS language naturally (phenomenon-driven, three-dimensional, sense-making)
- For routines, model the AST discourse moves (navigation: "Last time we figured out...", problematizing: "But that raises a new question...")
- Do NOT include any preamble, explanation, or formatting — return only the suggested text`;

function buildUserMessage(ctx: AiSuggestionContext): string {
  const ph = ctx.phenomenonName ? `Phenomenon: "${ctx.phenomenonName}"` : '';
  const phDesc = ctx.phenomenonDescription ? `Phenomenon description: ${ctx.phenomenonDescription}` : '';
  const udq = ctx.unitDrivingQuestion ? `Unit driving question: "${ctx.unitDrivingQuestion}"` : '';
  const loop = ctx.loopTitle ? `Current loop (Loop ${(ctx.loopIndex ?? 0) + 1}): "${ctx.loopTitle}"` : '';
  const target = ctx.targetTitle ? `Current learning target: "${ctx.targetTitle}"` : '';
  const threeD = [ctx.dciAlignment, ctx.sepAlignment, ctx.cccAlignment].filter(Boolean).join(' | ');
  const prevLoop = ctx.prevLoopTitle ? `Previous loop: "${ctx.prevLoopTitle}"` : '';
  const nextLoop = ctx.nextLoopTitle ? `Next loop: "${ctx.nextLoopTitle}"` : '';
  const activities = ctx.activitiesText ? `Activities in this target:\n${ctx.activitiesText}` : '';
  const context = [ph, phDesc, udq, loop, threeD && `3D alignment: ${threeD}`, prevLoop, nextLoop, target, activities]
    .filter(Boolean)
    .join('\n');

  const prompts: Record<AiFieldType, string> = {
    'phenomenon-description': `${context}\n\nWrite a rich, vivid description of this phenomenon for teachers. Describe what students will observe, why it's surprising or puzzling, and how it connects to science ideas.`,

    'unit-driving-question': `${context}\n\nWrite a compelling unit driving question that a student might genuinely ask after encountering this phenomenon. It should be open-ended and drive the whole unit investigation.`,

    'sub-questions': `${context}\n\nGenerate 3-4 specific sub-questions students might ask after seeing this phenomenon. These will each drive a sensemaking loop. Format as a numbered list, one question per line.`,

    'phenomenon-connection': `${context}\n\nWrite a brief teacher note explaining how this loop connects back to the anchoring phenomenon. What aspect of the phenomenon does this loop help explain? (2-3 sentences)`,

    'investigative-phenomenon': `${context}\n\nSuggest a smaller investigative phenomenon for this loop — something students can directly observe in class that connects to the larger anchoring phenomenon. (1-2 sentences)`,

    'navigation-routine': `${context}\n\nWrite a navigation routine for this loop using AST language. Start with "Last time we figured out..." and bridge to what students still cannot explain. This creates coherence between loops.`,

    'problematizing-routine': `${context}\n\nWrite a problematizing routine that reveals a gap in understanding at the end of this loop — something students now know but still can't explain — creating intellectual need for the next loop. Start with "But we still can't explain..."`,

    'model-contribution': `${context}\n\nWhat should students add or revise in the class model after completing this learning target? Describe the specific change (1-2 sentences).`,

    'summary-table-activity': `${context}\n\nDescribe the key activity or big idea from this learning target — what students did or the main concept addressed (1-2 sentences).`,

    'summary-table-observations': `${context}\n\nBased on the activities listed above, what are the key things students learned? Summarize in student-friendly language (1-2 sentences). Draw directly from the activity descriptions and key questions if provided.`,

    'summary-table-reasoning': `${context}\n\nBased on what students did and learned in these activities, how does it help them understand the driving question or anchoring phenomenon? Write a direct connection (1-2 sentences).`,

    'summary-table-connection': `${context}\n\nWhat specific additions or changes should students make to their model after this activity? Be concrete about what gets added or revised (1-2 sentences).`,

    'formative': `${context}\n\nWrite a specific Exit Ticket prompt for this learning target. The prompt should ask students to apply their new understanding to the anchoring phenomenon (1 focused question or prompt).`,

    'activity-description': `${context}\n\nWrite a brief teacher description of an activity for this learning target. Include what students do and what they should figure out (2-3 sentences).`,

    'key-questions': `${context}\n\nGenerate 2-3 back-pocket discussion questions a teacher could ask to advance student thinking during this activity. These should push students to explain mechanisms, not just describe observations.`,

    'gotta-have-it': `${context}\n\nGenerate 3-4 "gotta-have-it" items — key ideas that must appear in a complete student explanation of the anchoring phenomenon. Format as a bulleted list.`,

    'gapless-explanation': `${context}\n\nWrite a gapless causal explanation of the phenomenon from the teacher's perspective — the complete scientific account students will build toward. This should go just beyond student expectations and be written for teachers. (1 paragraph)`,
  };

  return prompts[ctx.fieldType] ?? `Suggest text for this field in the context of: ${context}`;
}

export function buildSuggestionPrompt(ctx: AiSuggestionContext): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPT,
    user: buildUserMessage(ctx),
  };
}
