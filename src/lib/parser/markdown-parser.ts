/**
 * markdown-parser.ts
 * Parses v2+ NGSS unit markdown into a Unit object.
 * TypeScript port + extension of Parser.gs from the Apps Script prototype.
 * Backward compatible with v2 format; new AST fields are optional.
 */

import { v4 as uuid } from 'uuid';
import type {
  Unit,
  Loop,
  Target,
  Activity,
  FormativeAssessment,
  Resource,
  DrivingQuestion,
  ModelStage,
  Phenomenon,
  GottaHaveItem,
  Standard,
  SummaryTableRow,
  ActivityType,
  FormativeFormat,
  ResourceType,
} from '../types';
import { createBlankSummaryTable, createBlankTransferTask } from '../defaults';

// ─── Resource Type Detection ────────────────────────────────────────────────

function detectResourceType(url: string): ResourceType {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('docs.google.com/presentation')) return 'google-slides';
  if (lower.includes('docs.google.com/forms')) return 'google-form';
  if (lower.includes('docs.google.com')) return 'google-doc';
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/.test(lower)) return 'image';
  if (/\.pdf(\?|$)/.test(lower)) return 'pdf';
  if (/\.(md|docx|doc|txt)(\?|$)/.test(lower)) return 'article';
  return 'link';
}

function detectTypeFromTitle(title: string): ResourceType | null {
  const match = title.match(/\(([^)]+)\)\s*$/);
  if (!match) return null;
  const hint = match[1].toLowerCase();
  if (hint.includes('youtube') || hint.includes('video')) return 'youtube';
  if (hint.includes('google doc') || hint.includes('gdoc')) return 'google-doc';
  if (hint.includes('google slides') || hint.includes('slides')) return 'google-slides';
  if (hint.includes('google form') || hint.includes('form')) return 'google-form';
  if (hint.includes('article') || hint.includes('reading')) return 'article';
  if (hint.includes('image') || hint.includes('photo')) return 'image';
  if (hint.includes('pdf')) return 'pdf';
  return null;
}

function cleanTitle(title: string): string {
  return title.replace(/\s*\([^)]+\)\s*$/, '').trim();
}

function parseResourceBlock(block: string): Resource[] {
  const items: Resource[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  let sortOrder = 0;
  while ((match = linkRegex.exec(block)) !== null) {
    const rawTitle = match[1].trim();
    const url = match[2].trim();
    const typeFromTitle = detectTypeFromTitle(rawTitle);
    items.push({
      id: uuid(),
      sortOrder: sortOrder++,
      title: cleanTitle(rawTitle),
      url,
      type: typeFromTitle ?? detectResourceType(url),
    });
  }
  return items;
}

// ─── Field Extractors ────────────────────────────────────────────────────────

function extractField(block: string, fieldName: string): string {
  const inlineRegex = new RegExp(
    `^[\\s-]*\\*\\*${fieldName}:?\\*\\*:?\\s*(.+)$`,
    'm'
  );
  const inlineMatch = block.match(inlineRegex);
  if (inlineMatch) return inlineMatch[1].trim();

  const multilineRegex = new RegExp(
    `^[\\s-]*\\*\\*${fieldName}:?\\*\\*:?\\s*$\\s*^([^\\-#].+)$`,
    'm'
  );
  const multilineMatch = block.match(multilineRegex);
  if (multilineMatch) return multilineMatch[1].trim();

  return '';
}

function extractListField(block: string, fieldName: string): string[] {
  const fieldRegex = new RegExp(
    `\\*\\*${fieldName}\\*\\*:[\\s\\S]*?(?=\\n\\s*\\*\\*|\\n##|$)`,
    'm'
  );
  const fieldMatch = block.match(fieldRegex);
  if (!fieldMatch) return [];

  const items: string[] = [];
  const listRegex = /^\s{2,}-\s+(.+)$/gm;
  let m;
  while ((m = listRegex.exec(fieldMatch[0])) !== null) {
    items.push(m[1].trim());
  }
  return items;
}

// ─── Formative Helpers ───────────────────────────────────────────────────────

function inferFormativeFormat(text: string): FormativeFormat {
  const lower = text.toLowerCase();
  if (lower.includes('exit ticket') || lower.includes('exit slip')) return 'Exit Ticket';
  if (lower.includes('cer') || lower.includes('claim') || lower.includes('evidence')) return 'CER';
  if (lower.includes('warm') || lower.includes('bell ringer') || lower.includes('do now')) return 'Warm-Up';
  if (lower.includes('whiteboard')) return 'Whiteboard Check';
  if (lower.includes('discussion') || lower.includes('socratic')) return 'Discussion';
  if (lower.includes('quiz') || lower.includes('check')) return 'Mini Quiz';
  if (lower.includes('observation') || lower.includes('observe')) return 'Observation';
  return 'Other';
}

// ─── Section Splitter ────────────────────────────────────────────────────────

interface Section {
  title: string;
  body: string;
}

function splitSections(markdown: string): Section[] {
  const sectionRegex = /^## (§\d+\..+|Putting It Together.*)$/gm;
  const matches: { title: string; index: number; length: number }[] = [];
  let m;
  while ((m = sectionRegex.exec(markdown)) !== null) {
    matches.push({ title: m[1].trim(), index: m.index, length: m[0].length });
  }

  return matches.map((match, i) => {
    const start = match.index + match.length;
    const end = i + 1 < matches.length ? matches[i + 1].index : markdown.length;
    return { title: match.title, body: markdown.slice(start, end) };
  });
}

// ─── Section Parsers ─────────────────────────────────────────────────────────

function parseOverview(block: string) {
  const phenomenon = extractField(block, 'Phenomenon');
  const description = extractField(block, 'Description');
  const unitDrivingQuestion = extractField(block, 'Unit Driving Question');
  const gaplessExplanation = extractField(block, 'Gapless Explanation');
  const slidesUrl = extractField(block, 'Slides');

  // Standards — sub-bullets under **Standards:**
  const standardsMatch = block.match(/\*\*Standards:?\*\*:?([\s\S]*?)(?=\n\s*-\s*\*\*[^S]|$)/);
  const standards: Standard[] = [];
  if (standardsMatch) {
    const sr = /^\s{2,}-\s+(.+)$/gm;
    let sm;
    while ((sm = sr.exec(standardsMatch[1])) !== null) {
      const raw = sm[1].trim();
      // Support "CODE: description" format
      const colonIdx = raw.indexOf(':');
      if (colonIdx > 0 && colonIdx < 20) {
        standards.push({
          id: uuid(),
          code: raw.slice(0, colonIdx).trim(),
          description: raw.slice(colonIdx + 1).trim(),
          type: 'PE',
        });
      } else {
        standards.push({ id: uuid(), code: raw, description: '', type: 'PE' });
      }
    }
  }

  const resourcesMatch = block.match(/\*\*Resources:?\*\*:?([\s\S]*?)(?=\n\s*-\s*\*\*[^R]|$)/);
  const resources = resourcesMatch ? parseResourceBlock(resourcesMatch[1]) : [];

  return { phenomenon, description, unitDrivingQuestion, gaplessExplanation, standards, slidesUrl, resources };
}

function parsePredictedDQs(block: string): string[] {
  const dqs: string[] = [];
  const regex = /^\d+\.\s+(.+)$/gm;
  let m;
  while ((m = regex.exec(block)) !== null) {
    dqs.push(m[1].trim());
  }
  return dqs;
}

function parseModelProgression(block: string): { stages: ModelStage[]; template: string } {
  const template = extractField(block, 'Model Template');
  const stages: ModelStage[] = [];
  const stageRegex = /^-\s+\*\*(Initial Model|After Loop \d+|Complete Model):?\*\*:?\s*(.+)$/gm;
  let m;
  let sortOrder = 0;
  while ((m = stageRegex.exec(block)) !== null) {
    stages.push({ id: uuid(), sortOrder: sortOrder++, label: m[1].trim(), description: m[2].trim() });
  }
  return { stages, template };
}

function parseSummaryTable(block: string): SummaryTableRow {
  const table = createBlankSummaryTable();
  const summaryMatch = block.match(/\*\*Summary Table:?\*\*:?([\s\S]*?)(?=\n\s*-\s*\*\*|###|$)/);
  if (!summaryMatch) return table;

  const activity = summaryMatch[1].match(/Activity:\s*(.+)/)?.[1]?.trim() ?? '';
  const observations = summaryMatch[1].match(/Observations?:\s*(.+)/)?.[1]?.trim() ?? '';
  const reasoning = summaryMatch[1].match(/Reasoning:\s*(.+)/)?.[1]?.trim() ?? '';
  const connection = summaryMatch[1].match(/Connection(?:\s+to\s+Phenomenon)?:\s*(.+)/)?.[1]?.trim() ?? '';

  return { activity, observations, reasoning, connectionToPhenomenon: connection };
}

function parseActivities(block: string): Activity[] {
  const activitiesMatch = block.match(/\*\*Activities:?\*\*:?([\s\S]*?)(?=\n\s*-\s*\*\*|###|$)/);
  if (!activitiesMatch) return [];

  const activities: Activity[] = [];
  // Match: - Type: Title (Xmin/X min) — description
  const actRegex = /^\s{2,}-\s+(\w+):\s+(.+?)(?:\s+\((\d+)\s*min\))?\s*(?:—\s*(.+))?$/gm;
  let m;
  let sortOrder = 0;
  while ((m = actRegex.exec(activitiesMatch[1])) !== null) {
    const typeRaw = m[1].toLowerCase() as ActivityType;
    const validTypes: ActivityType[] = ['lab', 'reading', 'simulation', 'discussion', 'modeling', 'video', 'other'];
    activities.push({
      id: uuid(),
      sortOrder: sortOrder++,
      type: validTypes.includes(typeRaw) ? typeRaw : 'other',
      title: m[2]?.trim() ?? '',
      durationMinutes: parseInt(m[3] ?? '0') || 0,
      description: m[4]?.trim() ?? '',
      keyQuestions: '',
      resources: [],
    });
  }
  return activities;
}

function parseTarget(block: string): Omit<Target, 'id' | 'sortOrder' | 'title'> {
  const modelContribution = extractField(block, 'Model Contribution');
  const dciAlignment = extractField(block, 'DCI');
  const sepAlignment = extractField(block, 'SEP');
  const cccAlignment = extractField(block, 'CCC');
  const summaryTable = parseSummaryTable(block);
  const activities = parseActivities(block);

  const resourcesMatch = block.match(/\*\*Resources:?\*\*:?([\s\S]*?)(?=###|$)/);
  const resources = resourcesMatch ? parseResourceBlock(resourcesMatch[1]) : [];

  // Formative
  const formativeRaw = extractField(block, 'Formative');
  let formative: FormativeAssessment | null = null;
  if (formativeRaw) {
    const linkMatch = formativeRaw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const rawTitle = linkMatch[1].trim();
      const url = linkMatch[2].trim();
      formative = {
        id: uuid(),
        text: cleanTitle(rawTitle),
        format: inferFormativeFormat(rawTitle),
        resourceUrl: url,
        resourceTitle: cleanTitle(rawTitle),
      };
    } else {
      formative = {
        id: uuid(),
        text: formativeRaw,
        format: inferFormativeFormat(formativeRaw),
        resourceUrl: '',
        resourceTitle: '',
      };
    }
  }

  return { dciAlignment, sepAlignment, cccAlignment, modelContribution, summaryTable, activities, formative, resources };
}

function parseLoop(title: string, body: string, loopIndex: number): Loop {
  const dqRefRaw = extractField(body, 'Driving Question');
  const dqRef = parseInt(dqRefRaw.replace(/^#/, ''), 10) || loopIndex + 1;
  const slidesUrl = extractField(body, 'Slides');
  const durationRaw = extractField(body, 'Estimated Duration');
  const durationDays = parseInt(durationRaw, 10) || 0;
  const phenomenonConnection = extractField(body, 'Phenomenon Connection');
  const investigativePhenomenon = extractField(body, 'Investigative Phenomenon');
  const navigationRoutine = extractField(body, 'Navigation Routine');
  const problematizingRoutine = extractField(body, 'Problematizing') || extractField(body, 'Problematizing Routine');

  // Parse targets
  const targetRegex = /^### Learning Target [\d.]+:\s*(.+)$/gm;
  const targetMatches: { title: string; index: number; length: number }[] = [];
  let m;
  while ((m = targetRegex.exec(body)) !== null) {
    targetMatches.push({ title: m[1].trim(), index: m.index, length: m[0].length });
  }

  const targets: Target[] = targetMatches.map((tm, i) => {
    const start = tm.index + tm.length;
    const end = i + 1 < targetMatches.length ? targetMatches[i + 1].index : body.length;
    const targetBlock = body.slice(start, end);
    const parsed = parseTarget(targetBlock);
    return { id: uuid(), sortOrder: i, title: tm.title, ...parsed };
  });

  return {
    id: uuid(),
    sortOrder: loopIndex,
    title,
    dqId: null,    // resolved to UUID by the caller after DQs are built
    dqRef,         // kept temporarily so the caller can resolve it
    durationDays,
    phenomenonConnection,
    investigativePhenomenon,
    navigationRoutine,
    problematizingRoutine,
    slidesUrl,
    targets,
    resources: [],
  };
}

function parseTransferTask(block: string) {
  const task = createBlankTransferTask();
  task.title = extractField(block, 'Title') || 'Putting It Together';
  task.taskDescription = extractField(block, 'Task');
  task.assessmentUrl = extractField(block, 'Assessment');
  task.rubricUrl = extractField(block, 'Rubric');
  task.slidesUrl = extractField(block, 'Slides');

  const stdList = extractListField(block, 'Standards Assessed');
  task.standards = stdList;

  // Gotta-Have-It items
  const gottaMatch = block.match(/\*\*Gotta-Have-It:?\*\*:?([\s\S]*?)(?=\n\s*-\s*\*\*|$)/);
  if (gottaMatch) {
    const listRegex = /^\s{2,}-\s+(.+)$/gm;
    let m;
    let sortOrder = 0;
    while ((m = listRegex.exec(gottaMatch[1])) !== null) {
      task.gottaHaveItems.push({ id: uuid(), sortOrder: sortOrder++, text: m[1].trim(), checked: false });
    }
  }

  return task;
}

// ─── Warnings ────────────────────────────────────────────────────────────────

export function collectParseWarnings(unit: Unit): string[] {
  const warnings: string[] = [];
  const primary = unit.phenomena?.find((p) => p.isPrimary);
  if (!primary?.name) warnings.push('No phenomenon name set');
  if (!unit.standards?.length) warnings.push('No standards listed');
  if (!unit.drivingQuestions?.length) warnings.push('No driving questions');
  unit.loops?.forEach((loop, i) => {
    if (!loop.phenomenonConnection) warnings.push(`Loop ${i + 1}: missing phenomenon connection`);
    if (!loop.navigationRoutine) warnings.push(`Loop ${i + 1}: missing navigation routine`);
    if (!loop.problematizingRoutine) warnings.push(`Loop ${i + 1}: missing problematizing routine`);
    if (!loop.targets?.length) warnings.push(`Loop ${i + 1}: no learning targets`);
    loop.targets?.forEach((t, j) => {
      if (!t.formative) warnings.push(`Loop ${i + 1}, Target ${j + 1}: no formative assessment`);
    });
  });
  return warnings;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export function parseMarkdownV2(markdown: string): Unit {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Unit';

  const sections = splitSections(markdown);
  const findSection = (prefix: string) =>
    sections.find((s) => s.title.startsWith(prefix))?.body ?? null;

  // §1 Overview
  const overviewBody = findSection('§1');
  if (!overviewBody) throw new Error('Missing "§1. Unit Overview" section.');
  const overview = parseOverview(overviewBody);

  // §2 DQs
  const dqBody = findSection('§2');
  const dqTexts = dqBody ? parsePredictedDQs(dqBody) : [];
  const drivingQuestions: DrivingQuestion[] = dqTexts.map((text, i) => ({
    id: uuid(),
    sortOrder: i,
    text,
    status: 'unanswered',
    linkedLoopId: null,
  }));

  // §3 Model Progression
  const modelBody = findSection('§3');
  const { stages: modelStages, template: modelTemplate } = modelBody
    ? parseModelProgression(modelBody)
    : { stages: [], template: '' };

  // §4+ Loops
  const rawLoops: Loop[] = [];
  let loopIndex = 0;
  for (const section of sections) {
    const loopMatch = section.title.match(/^§\d+\.\s+Sensemaking Loop \d+:\s*(.+)$/);
    if (loopMatch) {
      rawLoops.push(parseLoop(loopMatch[1].trim(), section.body, loopIndex++));
    }
  }

  // Resolve legacy dqRef (1-based index from markdown) → dqId (UUID)
  const loops: Loop[] = rawLoops.map((loop) => {
    const legacyRef = (loop as Loop & { dqRef?: number }).dqRef;
    const dqId = (legacyRef != null && legacyRef > 0)
      ? drivingQuestions[legacyRef - 1]?.id ?? null  // markdown uses 1-based, display-accurate
      : null;
    return { ...loop, dqId };
  });

  // Transfer Task
  const transferBody = findSection('Putting It Together');
  const transferTask = transferBody ? parseTransferTask(transferBody) : createBlankTransferTask();

  // Build phenomena from overview
  const phenomena: Phenomenon[] = [
    {
      id: uuid(),
      name: overview.phenomenon,
      description: overview.description,
      mediaUrl: '',
      isPrimary: true,
    },
  ];

  // Auto-generate model stages if none parsed
  const finalModelStages: ModelStage[] =
    modelStages.length > 0
      ? modelStages
      : [
          { id: uuid(), sortOrder: 0, label: 'Initial Model', description: '' },
          ...loops.map((_, i) => ({
            id: uuid(),
            sortOrder: i + 1,
            label: `After Loop ${i + 1}`,
            description: '',
          })),
          { id: uuid(), sortOrder: loops.length + 1, label: 'Complete Model', description: '' },
        ];

  const now = new Date().toISOString();
  return {
    id: uuid(),
    title,
    gradeBand: '',
    course: '',
    estimatedDays: loops.reduce((sum, l) => sum + l.durationDays, 0),
    phenomena,
    phenomenonSlidesUrl: overview.slidesUrl,
    unitDrivingQuestion: overview.unitDrivingQuestion,
    gaplessExplanation: overview.gaplessExplanation,
    standards: overview.standards,
    googleDocUrl: '',
    drivingQuestions,
    modelTemplate,
    modelStages: finalModelStages,
    loops,
    transferTask,
    notes: [],
    createdAt: now,
    updatedAt: now,
  };
}
