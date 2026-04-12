'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WizardShell } from '@/components/wizard/WizardShell';
import { EntryPointStep } from '@/components/wizard/EntryPointStep';
import { StandardsStep } from '@/components/wizard/StandardsStep';
import { PhenomenaStep } from '@/components/wizard/PhenomenaStep';
import { AiDraftStep } from '@/components/wizard/AiDraftStep';
import { DrivingQuestionsStep } from '@/components/wizard/DrivingQuestionsStep';
import { LoopSkeletonStep } from '@/components/wizard/LoopSkeletonStep';
import { TargetSketchStep } from '@/components/wizard/TargetSketchStep';
import { ReviewStep } from '@/components/wizard/ReviewStep';
import type { GenerateUnitResponse } from '@/lib/ai/unit-generator';
import { v4 as uuid } from 'uuid';
import { createBlankUnit, createBlankLoop, createBlankTarget, createBlankDrivingQuestion, createModelStage, createBlankPhenomenon } from '@/lib/defaults';
import { saveUnit } from '@/lib/storage';
import { NGSS_STANDARDS } from '@/lib/ngss-standards';

interface PhenomenonDraft {
  name: string;
  description: string;
  mediaUrl: string;
  isPrimary: boolean;
}

interface LoopDraft {
  title: string;
  dqIndex: number;
  durationDays: number;
}

interface WizardState {
  entryPoint: 'standards' | 'phenomenon' | null;
  gradeBand: string;
  course: string;
  title: string;
  phenomena: PhenomenonDraft[];
  standardCodes: string[];
  unitDrivingQuestion: string;
  subQuestions: string[];
  loops: LoopDraft[];
  targets: string[][];
}

const STEP_LABELS = [
  'Start',
  'Standards',
  'Phenomenon',
  'AI Draft',
  'Driving Questions',
  'Unit Arc',
  'Targets',
  'Review',
];

const initialState: WizardState = {
  entryPoint: null,
  gradeBand: 'HS',
  course: '',
  title: '',
  phenomena: [{ name: '', description: '', mediaUrl: '', isPrimary: true }],
  standardCodes: [],
  unitDrivingQuestion: '',
  subQuestions: ['', ''],
  loops: [
    { title: '', dqIndex: 0, durationDays: 5 },
    { title: '', dqIndex: 1, durationDays: 4 },
  ],
  targets: [['', ''], ['', '']],
};

export default function NewUnitPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(initialState);

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function toggleStandard(code: string) {
    setState((s) => ({
      ...s,
      standardCodes: s.standardCodes.includes(code)
        ? s.standardCodes.filter((c) => c !== code)
        : [...s.standardCodes, code],
    }));
  }

  // When loops change, sync targets array length
  function updateLoops(loops: LoopDraft[]) {
    setState((s) => {
      const targets = loops.map((_, i) => s.targets[i] ?? ['', '']);
      return { ...s, loops, targets };
    });
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0: return state.entryPoint !== null;
      case 1: return true; // standards are optional
      case 2: return state.phenomena.some((p) => p.isPrimary && p.name.trim().length > 0) || state.standardCodes.length > 0;
      case 3: return true; // AI Draft is optional — always skippable
      case 4: return state.unitDrivingQuestion.trim().length > 0;
      case 5: return state.loops.length > 0;
      case 6: return true;
      case 7: return true;
      default: return true;
    }
  }

  function handleAiDraftAccept(draft: GenerateUnitResponse) {
    setState((s) => ({
      ...s,
      phenomena: draft.phenomenon
        ? [{ name: draft.phenomenon.name, description: draft.phenomenon.description, mediaUrl: '', isPrimary: true }]
        : s.phenomena,
      standardCodes: draft.suggestedStandardCodes.length > 0 ? draft.suggestedStandardCodes : s.standardCodes,
      unitDrivingQuestion: draft.unitDrivingQuestion,
      subQuestions: draft.subQuestions,
      loops: draft.loops,
      targets: draft.targets,
    }));
    setStep((s) => s + 1);
  }

  function handleComplete() {
    const unit = createBlankUnit();

    // Basic metadata
    const primary = state.phenomena.find((p) => p.isPrimary);
    unit.title = state.title || (primary?.name ? `${primary.name} Unit` : 'New Unit');
    unit.gradeBand = state.gradeBand;
    unit.course = state.course;
    unit.unitDrivingQuestion = state.unitDrivingQuestion;

    // Phenomena
    unit.phenomena = state.phenomena.map((p) => ({
      ...createBlankPhenomenon(p.isPrimary),
      name: p.name,
      description: p.description,
      mediaUrl: p.mediaUrl,
      isPrimary: p.isPrimary,
    }));

    // Standards
    unit.standards = state.standardCodes.map((code) => {
      const ngss = NGSS_STANDARDS.find((s) => s.code === code);
      return {
        id: uuid(),
        code,
        description: ngss?.title ?? '',
        type: 'PE' as const,
      };
    });

    // Driving questions
    unit.drivingQuestions = state.subQuestions
      .filter((q) => q.trim())
      .map((q, i) => ({
        ...createBlankDrivingQuestion(i),
        text: q,
        status: 'unanswered' as const,
      }));

    // Model stages (auto-generate from loop count)
    unit.modelStages = [
      createModelStage('Initial Model', 0),
      ...state.loops.map((_, i) => createModelStage(`After Loop ${i + 1}`, i + 1)),
      createModelStage('Complete Model', state.loops.length + 1),
    ];

    // Loops with targets
    unit.loops = state.loops.map((loopDraft, li) => {
      const loop = createBlankLoop(li);
      loop.title = loopDraft.title || `Loop ${li + 1}`;
      // Resolve dqIndex → dqId (UUID) using the driving questions we just built
      loop.dqId = unit.drivingQuestions[loopDraft.dqIndex]?.id ?? null;
      loop.durationDays = loopDraft.durationDays;
      loop.targets = (state.targets[li] ?? [])
        .filter((t) => t.trim())
        .map((title, ti) => {
          const target = createBlankTarget(ti);
          target.title = title;
          return target;
        });
      if (loop.targets.length === 0) {
        loop.targets = [createBlankTarget(0)];
      }
      return loop;
    });

    unit.estimatedDays = state.loops.reduce((s, l) => s + l.durationDays, 0);

    saveUnit(unit);
    router.push(`/units/${unit.id}`);
  }

  // Determine which standards step to use based on entry point
  // Standards-first: step order is Entry → Standards → Phenomena → DQs → Arc → Targets → Review
  // Phenomenon-first: same order (user still fills in standards at step 1, just has less preselected)

  const stepContent = [
    <EntryPointStep
      key="entry"
      value={state.entryPoint}
      onChange={(v) => update('entryPoint', v)}
    />,
    <StandardsStep
      key="standards"
      gradeBand={state.gradeBand}
      selectedCodes={state.standardCodes}
      onGradeBandChange={(v) => update('gradeBand', v)}
      onToggle={toggleStandard}
    />,
    <PhenomenaStep
      key="phenomena"
      phenomena={state.phenomena}
      onChange={(p) => update('phenomena', p)}
    />,
    <AiDraftStep
      key="ai-draft"
      entryPoint={state.entryPoint}
      gradeBand={state.gradeBand}
      standardCodes={state.standardCodes}
      phenomenon={state.phenomena.find((p) => p.isPrimary) ?? state.phenomena[0] ?? { name: '', description: '', mediaUrl: '', isPrimary: true }}
      onAccept={handleAiDraftAccept}
    />,
    <DrivingQuestionsStep
      key="dqs"
      unitDrivingQuestion={state.unitDrivingQuestion}
      subQuestions={state.subQuestions}
      onUnitDQChange={(v) => update('unitDrivingQuestion', v)}
      onSubQuestionsChange={(qs) => update('subQuestions', qs)}
    />,
    <LoopSkeletonStep
      key="loops"
      loops={state.loops}
      subQuestions={state.subQuestions.filter(Boolean)}
      onChange={updateLoops}
    />,
    <TargetSketchStep
      key="targets"
      loops={state.loops}
      targets={state.targets}
      onChange={(t) => update('targets', t)}
    />,
    <ReviewStep
      key="review"
      title={state.title}
      gradeBand={state.gradeBand}
      course={state.course}
      phenomena={state.phenomena}
      standardCodes={state.standardCodes}
      unitDrivingQuestion={state.unitDrivingQuestion}
      subQuestions={state.subQuestions}
      loops={state.loops}
      targets={state.targets}
      onTitleChange={(v) => update('title', v)}
      onCourseChange={(v) => update('course', v)}
    />,
  ];

  return (
    <WizardShell
      step={step}
      totalSteps={STEP_LABELS.length}
      stepLabels={STEP_LABELS}
      onPrev={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1))}
      onComplete={handleComplete}
      canNext={canAdvance()}
      isLastStep={step === STEP_LABELS.length - 1}
    >
      {stepContent[step]}
    </WizardShell>
  );
}
