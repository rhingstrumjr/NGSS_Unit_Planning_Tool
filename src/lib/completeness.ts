import type { Unit } from '@/lib/types';

export interface CompletenessBreakdown {
  label: string;
  done: boolean;
}

export interface CompletenessResult {
  score: number;
  total: number;
  pct: number;
  breakdown: CompletenessBreakdown[];
}

export function computeCompleteness(unit: Unit): CompletenessResult {
  const items: CompletenessBreakdown[] = [];

  function check(label: string, done: boolean) {
    items.push({ label, done });
  }

  // ── Unit-level ──────────────────────────────────────────────
  const primaryPhenomenon =
    unit.phenomena.find((p) => p.isPrimary) ?? unit.phenomena[0];

  check('Phenomenon description', !!primaryPhenomenon?.description?.trim());
  check('At least one standard', unit.standards.length > 0);
  check('Unit driving question', !!unit.unitDrivingQuestion?.trim());
  check('Gapless explanation', !!unit.gaplessExplanation?.trim());
  check(
    'Sub-questions (2+)',
    unit.drivingQuestions.filter((dq) => dq.text?.trim()).length >= 2
  );
  check('At least one loop', unit.loops.length > 0);
  check('Transfer task', !!unit.transferTask?.title?.trim());

  // ── Per-loop ─────────────────────────────────────────────────
  unit.loops.forEach((loop, li) => {
    const prefix = `Loop ${li + 1}`;
    check(`${prefix}: title`, !!loop.title?.trim());
    check(
      `${prefix}: phenomenon connection`,
      !!loop.phenomenonConnection?.trim()
    );
    check(`${prefix}: has at least one target`, loop.targets.length > 0);

    // ── Per-target ───────────────────────────────────────────────
    loop.targets.forEach((target, ti) => {
      const tPrefix = `${prefix} › Target ${ti + 1}`;
      check(`${tPrefix}: title`, !!target.title?.trim());
      check(`${tPrefix}: DCI alignment`, !!target.dciAlignment?.trim());
      check(`${tPrefix}: SEP alignment`, !!target.sepAlignment?.trim());
      check(`${tPrefix}: CCC alignment`, !!target.cccAlignment?.trim());
      check(
        `${tPrefix}: summary table activity`,
        !!target.summaryTable?.activity?.trim()
      );
    });
  });

  const score = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((score / total) * 100);

  return { score, total, pct, breakdown: items };
}
