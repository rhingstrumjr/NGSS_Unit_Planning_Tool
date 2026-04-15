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

function buildTarget(target: Target, loopNum: number, targetNum: number): string {
  let out = '';
  out += section(`### Learning Target ${loopNum}.${targetNum}: ${target.title || 'Untitled'}`);
  out += '\n';
  if (target.dciAlignment) out += field('DCI', target.dciAlignment);
  if (target.sepAlignment) out += field('SEP', target.sepAlignment);
  if (target.cccAlignment) out += field('CCC', target.cccAlignment);
  const st = target.summaryTable;
  const hasSummary = st.activity || st.observations || st.reasoning || st.connectionToPhenomenon;
  if (hasSummary) {
    out += '- **Summary Table:**\n';
    if (st.activity) out += `  - Activity / Big Idea: ${st.activity}\n`;
    if (st.observations) out += `  - What we learned: ${st.observations}\n`;
    if (st.reasoning) out += `  - How it helps my understanding: ${st.reasoning}\n`;
    if (st.connectionToPhenomenon) out += `  - What do I need to modify in my model: ${st.connectionToPhenomenon}\n`;
  }

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
  }

  out += buildResources(target.resources);
  return out;
}

function buildLoop(loop: Loop, loopNum: number, dqs: DrivingQuestion[]): string {
  let out = '';
  out += section(`## §${loopNum + 3}. Sensemaking Loop ${loopNum}: ${loop.title || 'Untitled'}`);
  out += '\n';
  const dqIdx = loop.dqId ? dqs.findIndex((q) => q.id === loop.dqId) : -1;
  if (dqIdx >= 0) out += field('Driving Question', `#${dqIdx + 1}`);
  if (loop.durationDays) out += field('Estimated Duration', loop.durationDays);
  if (loop.phenomenonConnection) out += field('Phenomenon Connection', loop.phenomenonConnection);
  if (loop.investigativePhenomenon) out += field('Investigative Phenomenon', loop.investigativePhenomenon);
  if (loop.navigationRoutine) out += field('Navigation Routine', loop.navigationRoutine);
  if (loop.slidesUrl) out += field('Slides', loop.slidesUrl);

  if (loop.resources?.length) {
    out += buildResources(loop.resources);
  }

  out += '\n';

  for (let t = 0; t < loop.targets.length; t++) {
    out += buildTarget(loop.targets[t], loopNum, t + 1);
  }

  if (loop.problematizingRoutine) {
    out += '\n';
    out += field('Problematizing', loop.problematizingRoutine);
  }

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
      const allResources = target.activities.flatMap((a) => a.resources);
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

  // Sensemaking Loops
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
