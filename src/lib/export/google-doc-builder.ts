import type { Unit } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Request = Record<string, any>;

/** Sentinel text inserted where the planning table should go. The API route
 *  finds this paragraph, deletes it, and replaces it with a real Docs table. */
export const PLANNING_TABLE_PLACEHOLDER = '%%PLANNING_TABLE%%';

export const PLANNING_TABLE_COLUMNS = [
  'Driving Question',
  'Activity / Big Idea',
  'What we learned',
  'How it helps my understanding of my topic',
  'What do I need to modify in my model',
] as const;

export interface PlanningTableData {
  /** All rows including the header row. One data row per learning target. */
  rows: string[][];
  /** Zero-based indices of the header row (always [0]). Used for bold styling. */
  headerRowIndices: number[];
  /**
   * Groups of rows (0-based, 1-indexed to skip the header) where the DQ column
   * should be merged vertically — one entry per loop that has > 1 target.
   */
  dqMergeGroups: Array<{ startRow: number; rowCount: number }>;
  /**
   * Rows (0-based, 1-indexed to skip the header) where the Activity column
   * contains a hyperlink. The url is used to style the cell as a clickable link.
   */
  activityLinks: Array<{ rowIndex: number; url: string }>;
}

/** Builds the consolidated quick-reference planning table data from the unit. */
export function buildPlanningTableData(unit: Unit): PlanningTableData {
  const rows: string[][] = [Array.from(PLANNING_TABLE_COLUMNS)];
  const headerRowIndices: number[] = [0];
  const dqMergeGroups: Array<{ startRow: number; rowCount: number }> = [];
  const activityLinks: Array<{ rowIndex: number; url: string }> = [];

  for (let li = 0; li < unit.loops.length; li++) {
    const loop = unit.loops[li];
    if (loop.targets.length === 0) continue;

    const dq = loop.dqId ? unit.drivingQuestions.find((q) => q.id === loop.dqId) ?? null : null;
    const dqLabel = dq?.text
      ? `${dq.text}\n(${loop.durationDays} days)`
      : `Loop ${li + 1} (${loop.durationDays} days)`;

    const loopStartRow = rows.length; // index of first target row for this loop

    for (let ti = 0; ti < loop.targets.length; ti++) {
      const target = loop.targets[ti];
      const st = target.summaryTable;

      // Activity / Big Idea cell — collect primary resource URL for hyperlinking
      const allResources = target.activities.flatMap((a) => a.resources);
      const primaryResource =
        allResources.find((r) => r.type === 'google-doc') ?? allResources[0] ?? null;
      if (primaryResource?.url) {
        activityLinks.push({ rowIndex: rows.length, url: primaryResource.url });
      }

      rows.push([
        ti === 0 ? dqLabel : '', // DQ text only in first target row; blank for subsequent rows
        st.activity || '',
        st.observations || '',
        st.reasoning || '',
        st.connectionToPhenomenon || '',
      ]);
    }

    // Record a merge group if this loop has more than one target
    if (loop.targets.length > 1) {
      dqMergeGroups.push({ startRow: loopStartRow, rowCount: loop.targets.length });
    }
  }

  return { rows, headerRowIndices, dqMergeGroups, activityLinks };
}

/**
 * Converts a Unit into a Google Docs API batchUpdate requests array.
 * Insert all text first (tracking index offsets), then apply paragraph
 * styles, bold formatting, and hyperlinks.
 */
export function buildGoogleDocRequests(unit: Unit): Request[] {
  const insertRequests: Request[] = [];
  const styleRequests: Request[] = [];
  let index = 1; // Google Docs body always starts at index 1

  // ── helpers ──────────────────────────────────────────────────────────────

  function insertText(text: string) {
    insertRequests.push({ insertText: { location: { index }, text } });
    index += text.length;
  }

  function heading(text: string, level: 1 | 2 | 3) {
    const namedStyle =
      level === 1 ? 'HEADING_1' : level === 2 ? 'HEADING_2' : 'HEADING_3';
    const start = index;
    insertText(text + '\n');
    styleRequests.push({
      updateParagraphStyle: {
        range: { startIndex: start, endIndex: index - 1 },
        paragraphStyle: { namedStyleType: namedStyle },
        fields: 'namedStyleType',
      },
    });
  }

  function paragraph(text: string) {
    if (!text?.trim()) return;
    insertText(text + '\n');
  }

  function blank() {
    insertText('\n');
  }

  /** Bold label followed by plain value on the same line. */
  function labeled(label: string, value: string) {
    if (!value?.trim()) return;
    const labelStart = index;
    insertText(label + ': ');
    styleRequests.push({
      updateTextStyle: {
        range: { startIndex: labelStart, endIndex: index },
        textStyle: { bold: true },
        fields: 'bold',
      },
    });
    insertText(value + '\n');
  }

  /** Insert displayText as a clickable hyperlink. */
  function link(displayText: string, url: string) {
    if (!url?.trim()) return;
    const start = index;
    insertText(displayText);
    styleRequests.push({
      updateTextStyle: {
        range: { startIndex: start, endIndex: index },
        textStyle: { link: { url }, foregroundColor: { color: { rgbColor: { red: 0.067, green: 0.384, blue: 0.745 } } }, underline: true },
        fields: 'link,foregroundColor,underline',
      },
    });
  }

  /** Bold label + clickable URL as the value. */
  function labeledLink(label: string, displayText: string, url: string) {
    if (!url?.trim()) return;
    const labelStart = index;
    insertText(label + ': ');
    styleRequests.push({
      updateTextStyle: {
        range: { startIndex: labelStart, endIndex: index },
        textStyle: { bold: true },
        fields: 'bold',
      },
    });
    link(displayText, url);
    insertText('\n');
  }

  /** Bullet line: plain prefix, then title as link (if url), else plain title. */
  function bulletResource(prefix: string, title: string, url: string) {
    insertText(prefix);
    if (url?.trim()) {
      link(title || url, url);
    } else {
      insertText(title);
    }
    insertText('\n');
  }

  // ── document content ──────────────────────────────────────────────────────

  // Title
  heading(unit.title || 'Untitled Unit', 1);
  const meta = [
    unit.gradeBand && `Grade Band: ${unit.gradeBand}`,
    unit.course && `Course: ${unit.course}`,
    unit.estimatedDays && `Estimated Duration: ${unit.estimatedDays} days`,
  ]
    .filter(Boolean)
    .join('  ·  ');
  if (meta) paragraph(meta);
  blank();

  // Overview
  const primary = unit.phenomena.find((p) => p.isPrimary) ?? unit.phenomena[0];
  heading('Unit Overview', 2);
  if (primary) {
    labeled('Anchoring Phenomenon', primary.name);
    if (primary.description) paragraph(primary.description);
    if (primary.mediaUrl) labeledLink('Media', primary.mediaUrl, primary.mediaUrl);
  }
  if (unit.phenomenonSlidesUrl) labeledLink('Phenomenon Slides', unit.phenomenonSlidesUrl, unit.phenomenonSlidesUrl);
  blank();
  labeled('Unit Driving Question', unit.unitDrivingQuestion);
  blank();
  if (unit.gaplessExplanation) {
    labeled('Gapless Explanation (Teacher)', unit.gaplessExplanation);
    blank();
  }

  // Quick Reference Planning Table — placed immediately after overview for at-a-glance scanning
  if (unit.loops.some((l) => l.targets.length > 0)) {
    heading('Quick Reference: Planning Table', 2);
    insertText(PLANNING_TABLE_PLACEHOLDER + '\n');
  }

  // Standards
  if (unit.standards.length > 0) {
    heading('Standards', 2);
    for (const std of unit.standards) {
      const line = [std.code, std.description].filter(Boolean).join(' — ');
      paragraph('• ' + line);
    }
    blank();
  }

  // Driving Questions
  if (unit.drivingQuestions.length > 0) {
    heading('Driving Questions', 2);
    unit.drivingQuestions.forEach((dq, i) => {
      const status =
        dq.status === 'answered'
          ? '✓'
          : dq.status === 'in-progress'
          ? '→'
          : '?';
      paragraph(`${i + 1}. [${status}] ${dq.text}`);
    });
    blank();
  }

  // Model Progression
  if (unit.modelTemplate || unit.modelStages.length > 0) {
    heading('Model Progression', 2);
    if (unit.modelTemplate) labeled('Model Template', unit.modelTemplate);
    for (const stage of unit.modelStages) {
      labeled(`Stage ${stage.sortOrder + 1}: ${stage.label}`, stage.description);
    }
    blank();
  }

  // Additional phenomena
  const secondary = unit.phenomena.filter((p) => !p.isPrimary);
  if (secondary.length > 0) {
    heading('Additional Phenomena', 2);
    for (const ph of secondary) {
      labeled(ph.name, ph.description);
    }
    blank();
  }

  const PLACEHOLDER = '[To be completed]';

  // Sensemaking Loops
  for (let li = 0; li < unit.loops.length; li++) {
    const loop = unit.loops[li];
    heading(`Loop ${li + 1}: ${loop.title || 'Untitled Loop'}`, 2);

    if (loop.durationDays) labeled('Estimated Duration', `${loop.durationDays} days`);
    // Critical narrative fields — always shown with placeholders so nothing is accidentally lost
    labeled('Navigation Routine', loop.navigationRoutine || PLACEHOLDER);
    labeled('Phenomenon Connection', loop.phenomenonConnection || PLACEHOLDER);
    labeled('Investigative Phenomenon', loop.investigativePhenomenon || PLACEHOLDER);
    if (loop.slidesUrl) labeledLink('Slides', loop.slidesUrl, loop.slidesUrl);
    if (loop.resources?.length) {
      paragraph('Loop Resources:');
      for (const r of loop.resources) {
        bulletResource('  • ', r.title || r.url, r.url);
      }
    }
    blank();

    // Targets
    for (let ti = 0; ti < loop.targets.length; ti++) {
      const target = loop.targets[ti];
      heading(`${li + 1}.${ti + 1}  ${target.title || 'Untitled Target'}`, 3);

      // NGSS alignment — always shown so teachers are reminded to fill them in
      const dci = target.dciAlignment || PLACEHOLDER;
      const sep = target.sepAlignment || PLACEHOLDER;
      const ccc = target.cccAlignment || PLACEHOLDER;
      paragraph(`DCI: ${dci}  ·  SEP: ${sep}  ·  CCC: ${ccc}`);

      // Summary Table (AST) — always shown with placeholders
      const st = target.summaryTable;
      blank();
      paragraph('Summary Table (AST):');
      labeled('  Activity / Big Idea', st.activity || PLACEHOLDER);
      labeled('  What we learned', st.observations || PLACEHOLDER);
      labeled('  How it helps my understanding', st.reasoning || PLACEHOLDER);
      labeled('  What do I need to modify in my model', st.connectionToPhenomenon || PLACEHOLDER);

      // Activities
      if (target.activities.length > 0) {
        blank();
        paragraph('Activities:');
        for (const act of target.activities) {
          const actMeta = [
            act.type && act.type.charAt(0).toUpperCase() + act.type.slice(1),
            act.durationMinutes && `${act.durationMinutes} min`,
          ]
            .filter(Boolean)
            .join(', ');
          labeled(`  ${act.title || 'Activity'}`, actMeta ? `[${actMeta}]` : '');
          if (act.description) paragraph(`    ${act.description}`);
          if (act.keyQuestions) labeled('    Key Questions', act.keyQuestions);
          if (act.resources?.length) {
            for (const r of act.resources) {
              bulletResource('    ↳ ', r.title || r.url, r.url);
            }
          }
        }
      }

      // Formative — always shown
      blank();
      if (target.formative) {
        labeled('Formative Assessment', `[${target.formative.format}] ${target.formative.text}`);
        if (target.formative.resourceUrl) {
          labeledLink('  Resource', target.formative.resourceTitle || target.formative.resourceUrl, target.formative.resourceUrl);
        }
      } else {
        labeled('Formative Assessment', PLACEHOLDER);
      }

      // Target Resources
      if (target.resources.length > 0) {
        blank();
        paragraph('Resources:');
        for (const res of target.resources) {
          bulletResource('  • ', res.title || res.url, res.url);
        }
      }

      blank();
    }

    // Problematizing routine goes after all targets — always shown
    labeled('Problematizing Routine', loop.problematizingRoutine || PLACEHOLDER);
    blank();

  }

  // Transfer Task
  const tt = unit.transferTask;
  if (tt.title || tt.taskDescription) {
    heading('Transfer Task: ' + (tt.title || 'Untitled'), 2);
    if (tt.taskDescription) paragraph(tt.taskDescription);
    blank();
    if (tt.standards.length > 0) {
      paragraph('Standards Assessed:');
      for (const std of tt.standards) paragraph('  • ' + std);
    }
    if (tt.gottaHaveItems.length > 0) {
      paragraph('Gotta-Have-It Checklist:');
      for (const item of tt.gottaHaveItems) {
        paragraph(`  ${item.checked ? '☑' : '☐'} ${item.text}`);
      }
    }
    if (tt.assessmentUrl) labeledLink('Assessment', tt.assessmentUrl, tt.assessmentUrl);
    if (tt.rubricUrl) labeledLink('Rubric', tt.rubricUrl, tt.rubricUrl);
    if (tt.slidesUrl) labeledLink('Slides', tt.slidesUrl, tt.slidesUrl);
  }

  // Style requests go after all inserts (indices are already finalized)
  return [...insertRequests, ...styleRequests];
}
