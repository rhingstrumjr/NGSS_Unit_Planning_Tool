/**
 * Generates a ready-to-paste AI prompt for creating a v2+ unit markdown file.
 * Teachers paste this into Claude/ChatGPT/Gemini to get a complete unit draft.
 */
export function generateAiPrompt(options: {
  gradeBand?: string;
  course?: string;
  phenomenon?: string;
  standards?: string[];
  loopCount?: number;
}): string {
  const { gradeBand = 'HS', course = 'Science', phenomenon = '', standards = [], loopCount = 3 } = options;

  const standardsList = standards.length > 0 ? standards.join(', ') : '[list your PE codes here]';
  const phenomenonText = phenomenon || '[describe your anchoring phenomenon]';

  return `You are an expert NGSS science curriculum designer familiar with Ambitious Science Teaching (AST) practices.

Create a complete NGSS storyline unit plan in the exact v2+ markdown format below.

UNIT DETAILS:
- Grade Band: ${gradeBand}
- Course: ${course}
- Anchoring Phenomenon: ${phenomenonText}
- Target Standards: ${standardsList}
- Number of Sensemaking Loops: ${loopCount}

REQUIRED FORMAT (copy this exactly, fill in all bracketed fields):

\`\`\`markdown
# [Unit Title]

## §1. Unit Overview

- **Phenomenon:** [phenomenon name]
- **Description:** [rich description of the anchoring phenomenon]
- **Unit Driving Question:** [the overarching question tied to the phenomenon]
- **Gapless Explanation:** [teacher-only: the complete causal explanation students will build toward]
- **Standards:**
  - [PE code]: [brief description]
- **Resources:**
  - [Title (YouTube)](https://...)

## §2. Predicted Driving Questions

1. [Question students might ask — drives Loop 1]
2. [Question students might ask — drives Loop 2]
3. [Question students might ask — drives Loop 3]

## §3. Model Progression

- **Model Template:** [describe the model scaffold, e.g. particle diagram]
- **Initial Model:** [what students draw/write before any investigation]
- **After Loop 1:** [what gets added or revised after Loop 1]
- **After Loop 2:** [what gets added or revised after Loop 2]
- **Complete Model:** [what the final model looks like]

## §4. Sensemaking Loop 1: [Loop Title]

- **Driving Question:** #1
- **Estimated Duration:** [number of days]
- **Phenomenon Connection:** [how this loop connects back to the anchoring phenomenon]
- **Investigative Phenomenon:** [optional smaller phenomenon for this loop]
- **Navigation Routine:** [how students connect this to what came before — what did we figure out last time? What questions remain?]

### Learning Target 1.1: [I can statement or learning performance]

- **DCI:** [e.g., PS1.B]
- **SEP:** [e.g., Developing and Using Models]
- **CCC:** [e.g., Energy and Matter]
- **Model Contribution:** [what students add or revise in the class model]
- **Summary Table:**
  - Activity: [what students did]
  - Observations: [patterns or observations they noticed]
  - Reasoning: [what they think caused the patterns]
  - Connection: [how it helps explain the anchoring phenomenon]
- **Activities:**
  - Lab: [Lab Title] (45 min) — [brief description]
  - Discussion: [Discussion Title] (20 min) — [brief description]
- **Formative:** Exit Ticket — [specific formative prompt]
- **Resources:**
  - [Resource Title (Google Doc)](https://...)

- **Problematizing:** [what gap in understanding bridges to Loop 2 — what can students NOT yet explain?]

## §5. Sensemaking Loop 2: [Loop Title]

[repeat structure for each loop]

## Putting It Together

- **Title:** [Transfer Task Title]
- **Task:** [describe the summative transfer task]
- **Standards Assessed:**
  - [PE code]
- **Gotta-Have-It:**
  - [Key idea 1 that must be in a complete explanation]
  - [Key idea 2 that must be in a complete explanation]
- **Assessment:** https://...
- **Rubric:** https://...
\`\`\`

IMPORTANT GUIDELINES:
- Navigation routines should explicitly connect to what students figured out in the previous loop
- Problematizing routines should reveal a gap that creates intellectual need for the next loop
- Each learning target should integrate a DCI, SEP, and CCC
- Formative assessments should be specific prompts, not just types
- Summary tables should be filled in from the teacher's perspective
- The gapless explanation should be a complete causal account that goes just beyond student expectations
- Include at least 2 learning targets per loop and 2 activities per target`;
}
