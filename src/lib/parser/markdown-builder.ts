import type { Unit, Loop, Target, Activity, Resource, DrivingQuestion } from '@/lib/types';

function line(text: string): string {
  return text + '\n';
}

function section(text: string): string {
  return '\n' + text + '\n';
}

function field(label: string, value: string | number | undefined | null): string {
  if (!value && value !== 0) return '';
  return `- **${label}:** ${value}\n`;
}

function buildResources(resources: Resource[]): string {
  if (!resources.length) return '';
  let out = '- **Resources:**\n';
  for (const r of resources) {
    out += r.url ? `  - [${r.title || r.url} (${r.type})](${r.url})\n` : `  - ${r.title}\n`;
  }
  return out;
}

function buildActivity(a: Activity): string {
  const dur = a.durationMinutes ? ` (${a.durationMinutes} min)` : '';
  const desc = a.description ? ` — ${a.description}` : '';
  let out = `  - ${capitalizeFirst(a.type)}: ${a.title}${dur}${desc}\n`;
  if (a.keyQuestions) {
    out += `    - **Key Questions:** ${a.keyQuestions}\n`;
  }
  if (a.resources?.length) {
    for (const r of a.resources) {
      const label = r.title || r.url;
      out += r.url ? `    - [${label}](${r.url})\n` : `    - ${label}\n`;
    }
  }
  return out;
}

const PLACEHOLDER = '[To be completed]';

function buildTarget(target: Target, loopNum: number, targetNum: number): string {
  let out = '';
  out += section(`### Learning Target ${loopNum}.${targetNum}: ${target.title || 'Untitled'}`);
  out += '\n';
  // NGSS alignment — always shown so teachers are reminded to fill them in
  out += field('DCI', target.dciAlignment || PLACEHOLDER);
  out += field('SEP', target.sepAlignment || PLACEHOLDER);
  out += field('CCC', target.cccAlignment || PLACEHOLDER);

  // Summary Table — always shown with placeholders for empty cells
  const st = target.summaryTable;
  out += '- **Summary Table:**\n';
  out += `  - Activity / Big Idea: ${st.activity || PLACEHOLDER}\n`;
  out += `  - What we learned: ${st.observations || PLACEHOLDER}\n`;
  out += `  - How it helps my understanding: ${st.reasoning || PLACEHOLDER}\n`;
  out += `  - What do I need to modify in my model: ${st.connectionToPhenomenon || PLACEHOLDER}\n`;

  if (target.activities.length) {
    out += '- **Activities:**\n';
    for (const a of target.activities) {
      out += buildActivity(a);
    }
  }

  if (target.formative) {
    const f = target.formative;
    const link = f.resourceUrl ? ` [${f.resourceTitle || 'Link'}](${f.resourceUrl})` : '';
    out += field('Formative', `${f.format}: ${f.text}${link}`);
  } else {
    out += field('Formative', PLACEHOLDER);
  }

  out += buildResources(target.resources);
  return out;
}

/**
 * Emit an auto-synthesized "Sensemaking Loop 0: Anchoring Phenomenon Launch"
 * block before the user-authored loops. This guarantees every exported unit
 * contains a Day 1 launch lesson even though the anchoring lesson itself is
 * not a first-class editable entity in the unit model — it is derived from
 * §1 Unit Overview (primary phenomenon) and §3 Model Progression (initial
 * model). The companion parser in markdown-parser.ts skips this loop on
 * ingest so round-trips don't duplicate it.
 */
function buildAnchoringLoop(unit: Unit): string {
  const primary = unit.phenomena.find((p) => p.isPrimary) ?? unit.phenomena[0];
  if (!primary || !primary.name) return '';

  const initialStage =
    unit.modelStages.find((s) => /initial/i.test(s.label)) ?? unit.modelStages[0] ?? null;
  const initialModelPrompt = initialStage?.description || 'Draw a first-draft model of the phenomenon before any instruction.';

  const dciCode = unit.standards[0]?.code || '[inherit from unit standards]';

  const investigative = primary.description
    ? `${primary.name} — ${primary.description}`
    : primary.name;

  const mediaLink = primary.mediaUrl
    ? `Cold view of [${primary.name}](${primary.mediaUrl})`
    : `Cold view of the phenomenon`;

  let out = '';
  out += section('## §4. Sensemaking Loop 0: Anchoring Phenomenon Launch');
  out += '\n';
  out += field('Driving Question', 'Unit Opener');
  out += field('Estimated Duration', 1);
  out += field(
    'Phenomenon Connection',
    'Students encounter the anchoring phenomenon for the first time and build the shared questions the unit will answer.'
  );
  out += field('Investigative Phenomenon', investigative);
  out += field(
    'Navigation Routine',
    'Launch the phenomenon cold. Students watch/observe, complete a Notice & Wonder routine, and contribute questions to the Driving Question Board.'
  );
  out += '\n';

  out += section('### Learning Target 0.1: Observe the anchoring phenomenon and generate driving questions');
  out += '\n';
  out += field('DCI', dciCode);
  out += field('SEP', 'Asking Questions and Defining Problems');
  out += field('CCC', 'Patterns');
  out += '- **Summary Table:**\n';
  out += '  - Activity / Big Idea: Phenomenon launch + Notice/Wonder + Initial Model\n';
  out += '  - What we learned: (captured live by students)\n';
  out += '  - How it helps my understanding: Defines the mystery the unit must resolve\n';
  out += '  - What do I need to modify in my model: Create the first-draft initial model\n';
  out += '- **Activities:**\n';
  out += `  - Video: Phenomenon Launch (15 min) — ${mediaLink}\n`;
  out += '  - Discussion: Notice & Wonder (15 min) — Individual → pair → whole-class. Build the Driving Question Board.\n';
  out += `  - Modeling: Initial Model (20 min) — ${initialModelPrompt}\n`;
  out += field('Formative', 'Observation: Initial model sketch and contributions to the Driving Question Board');

  out += '\n';
  out += field(
    'Problematizing',
    'We have big questions but no answers yet. Loop 1 begins tomorrow — we start by investigating the first mystery.'
  );

  return out;
}

function buildLoop(loop: Loop, loopNum: number, dqs: DrivingQuestion[]): string {
  let out = '';
  out += section(`## §${loopNum + 4}. Sensemaking Loop ${loopNum}: ${loop.title || 'Untitled'}`);
  out += '\n';
  const dqIdx = loop.dqId ? dqs.findIndex((q) => q.id === loop.dqId) : -1;
  if (dqIdx >= 0) out += field('Driving Question', `#${dqIdx + 1}`);
  if (loop.durationDays) out += field('Estimated Duration', loop.durationDays);
  // Critical narrative fields — always shown with placeholders so nothing is accidentally lost
  out += field('Phenomenon Connection', loop.phenomenonConnection || PLACEHOLDER);
  out += field('Investigative Phenomenon', loop.investigativePhenomenon || PLACEHOLDER);
  out += field('Navigation Routine', loop.navigationRoutine || PLACEHOLDER);
  if (loop.slidesUrl) out += field('Slides', loop.slidesUrl);

  if (loop.resources?.length) {
    out += buildResources(loop.resources);
  }

  out += '\n';

  for (let t = 0; t < loop.targets.length; t++) {
    out += buildTarget(loop.targets[t], loopNum, t + 1);
  }

  out += '\n';
  out += field('Problematizing', loop.problematizingRoutine || PLACEHOLDER);

  return out;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapePipeChars(text: string): string {
  return text.replace(/\|/g, '\\|');
}

function buildPlanningTable(unit: Unit): string {
  if (unit.loops.length === 0) return '';

  // One consolidated table with Driving Question as first column.
  // DQ text appears only in the first target row of each loop; blank thereafter.
  let out = section('## Quick Reference: Planning Table');
  out += '\n';
  out +=
    '| Driving Question | Activity / Big Idea | What we learned | How it helps my understanding of my topic | What do I need to modify in my model |\n';
  out += '|---|---|---|---|---|\n';

  for (let i = 0; i < unit.loops.length; i++) {
    const loop = unit.loops[i];
    const dq = loop.dqId
      ? unit.drivingQuestions.find((q) => q.id === loop.dqId) ?? null
      : null;
    const dqCell = dq?.text
      ? `**${escapePipeChars(dq.text)}** (${loop.durationDays} days)`
      : `Loop ${i + 1} (${loop.durationDays} days)`;

    if (loop.targets.length === 0) {
      out += `| ${dqCell} | | | | |\n`;
      continue;
    }

    for (let ti = 0; ti < loop.targets.length; ti++) {
      const target = loop.targets[ti];
      const st = target.summaryTable;

      // Link to first google-doc resource across all activities; fall back to any resource
      const allResources = target.activities.flatMap((a) => a.resources ?? []);
      const primaryResource =
        allResources.find((r) => r.type === 'google-doc') ?? allResources[0] ?? null;
      const activityText = escapePipeChars(st.activity || '');
      const activityCell =
        primaryResource?.url ? `[${activityText}](${primaryResource.url})` : activityText;

      const cells = [
        ti === 0 ? dqCell : '', // DQ only on first row of each loop
        activityCell,
        escapePipeChars(st.observations || ''),
        escapePipeChars(st.reasoning || ''),
        escapePipeChars(st.connectionToPhenomenon || ''),
      ];
      out += `| ${cells.join(' | ')} |\n`;
    }
  }

  return out + '\n';
}

export function buildMarkdownV2(unit: Unit): string {
  let out = '';

  // Title
  out += line(`# ${unit.title || 'Untitled Unit'}`);

  // §1. Unit Overview
  out += section('## §1. Unit Overview');
  out += '\n';

  const primary = unit.phenomena.find((p) => p.isPrimary) ?? unit.phenomena[0];
  if (primary) {
    out += field('Phenomenon', primary.name);
    if (primary.description) out += field('Description', primary.description);
    if (primary.mediaUrl) out += field('Media', primary.mediaUrl);
  }

  if (unit.unitDrivingQuestion) out += field('Unit Driving Question', unit.unitDrivingQuestion);
  if (unit.gaplessExplanation) out += field('Gapless Explanation', unit.gaplessExplanation);
  if (unit.gradeBand || unit.course) {
    out += field('Grade Band', unit.gradeBand);
    if (unit.course) out += field('Course', unit.course);
  }
  if (unit.estimatedDays) out += field('Estimated Duration', `${unit.estimatedDays} days`);

  if (unit.standards.length) {
    out += '- **Standards:**\n';
    for (const s of unit.standards) {
      const desc = s.description ? `: ${s.description}` : '';
      out += `  - ${s.code}${desc}\n`;
    }
  }

  // Secondary phenomena
  const secondary = unit.phenomena.filter((p) => !p.isPrimary);
  if (secondary.length) {
    out += '- **Additional Phenomena:**\n';
    for (const p of secondary) {
      out += `  - ${p.name}${p.description ? ': ' + p.description : ''}\n`;
    }
  }

  if (unit.phenomenonSlidesUrl) out += field('Phenomenon Slides', unit.phenomenonSlidesUrl);

  // Quick Reference planning table — immediately after overview for at-a-glance scanning
  out += buildPlanningTable(unit);

  // §2. Predicted Driving Questions
  out += section('## §2. Predicted Driving Questions');
  out += '\n';
  if (unit.drivingQuestions.length) {
    for (let i = 0; i < unit.drivingQuestions.length; i++) {
      const dq = unit.drivingQuestions[i];
      out += `${i + 1}. ${dq.text || '(empty)'}`;
      if (dq.status !== 'unanswered') out += ` *(${dq.status})*`;
      out += '\n';
    }
  } else {
    out += '_(none yet)_\n';
  }

  // §3. Model Progression
  out += section('## §3. Model Progression');
  out += '\n';
  if (unit.modelTemplate) out += field('Model Template', unit.modelTemplate);
  for (const stage of unit.modelStages) {
    out += field(stage.label, stage.description);
  }

  // Auto-synthesized anchoring phenomenon launch (Loop 0) — always §4 when present
  out += buildAnchoringLoop(unit);

  // Sensemaking Loops (user-authored, numbered 1+ and rendered at §5+)
  for (let i = 0; i < unit.loops.length; i++) {
    out += buildLoop(unit.loops[i], i + 1, unit.drivingQuestions);
  }

  // Putting It Together (Transfer Task)
  const tt = unit.transferTask;
  const hasTransfer =
    tt.title || tt.taskDescription || tt.standards.length || tt.gottaHaveItems.length;

  if (hasTransfer) {
    out += section('## Putting It Together');
    out += '\n';
    if (tt.title) out += field('Title', tt.title);
    if (tt.taskDescription) out += field('Task', tt.taskDescription);
    if (tt.standards.length) {
      out += '- **Standards Assessed:**\n';
      for (const s of tt.standards) {
        out += `  - ${s}\n`;
      }
    }
    if (tt.gottaHaveItems.length) {
      out += '- **Gotta-Have-It:**\n';
      for (const item of tt.gottaHaveItems) {
        out += `  - ${item.text}\n`;
      }
    }
    if (tt.assessmentUrl) out += field('Assessment', tt.assessmentUrl);
    if (tt.rubricUrl) out += field('Rubric', tt.rubricUrl);
    if (tt.slidesUrl) out += field('Slides', tt.slidesUrl);
  }

  return out;
}
