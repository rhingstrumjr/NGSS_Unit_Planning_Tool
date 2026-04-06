import type { Unit } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Request = Record<string, any>;

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

  // Sensemaking Loops
  for (let li = 0; li < unit.loops.length; li++) {
    const loop = unit.loops[li];
    heading(`Loop ${li + 1}: ${loop.title || 'Untitled Loop'}`, 2);

    if (loop.durationDays) labeled('Estimated Duration', `${loop.durationDays} days`);
    if (loop.navigationRoutine) labeled('Navigation Routine', loop.navigationRoutine);
    if (loop.phenomenonConnection) labeled('Phenomenon Connection', loop.phenomenonConnection);
    if (loop.investigativePhenomenon) labeled('Investigative Phenomenon', loop.investigativePhenomenon);
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

      const alignment = [
        target.dciAlignment && `DCI: ${target.dciAlignment}`,
        target.sepAlignment && `SEP: ${target.sepAlignment}`,
        target.cccAlignment && `CCC: ${target.cccAlignment}`,
      ]
        .filter(Boolean)
        .join('  ·  ');
      if (alignment) paragraph(alignment);

      if (target.modelContribution) labeled('Model Contribution', target.modelContribution);

      // Summary Table (AST)
      const st = target.summaryTable;
      if (st.activity || st.observations || st.reasoning || st.connectionToPhenomenon) {
        blank();
        paragraph('Summary Table (AST):');
        if (st.activity) labeled('  Activity', st.activity);
        if (st.observations) labeled('  Observations', st.observations);
        if (st.reasoning) labeled('  Reasoning', st.reasoning);
        if (st.connectionToPhenomenon) labeled('  Connection to Phenomenon', st.connectionToPhenomenon);
      }

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

      // Formative
      if (target.formative) {
        blank();
        labeled('Formative Assessment', `[${target.formative.format}] ${target.formative.text}`);
        if (target.formative.resourceUrl) {
          labeledLink('  Resource', target.formative.resourceTitle || target.formative.resourceUrl, target.formative.resourceUrl);
        }
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

    // Problematizing routine goes after all targets
    if (loop.problematizingRoutine) {
      labeled('Problematizing Routine', loop.problematizingRoutine);
      blank();
    }

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
