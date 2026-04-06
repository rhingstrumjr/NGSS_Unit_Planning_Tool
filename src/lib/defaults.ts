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
  TeacherNote,
  GottaHaveItem,
  Standard,
  SummaryTableRow,
} from './types';

export function createBlankUnit(): Unit {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    title: '',
    gradeBand: '',
    course: '',
    estimatedDays: 0,
    phenomena: [createBlankPhenomenon(true)],
    phenomenonSlidesUrl: '',
    unitDrivingQuestion: '',
    gaplessExplanation: '',
    standards: [],
    googleDocUrl: '',
    drivingQuestions: [],
    modelTemplate: '',
    modelStages: [
      createModelStage('Initial Model', 0),
      createModelStage('Complete Model', 1),
    ],
    loops: [],
    transferTask: createBlankTransferTask(),
    notes: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createBlankPhenomenon(isPrimary = false): Phenomenon {
  return {
    id: uuid(),
    name: '',
    description: '',
    mediaUrl: '',
    isPrimary,
  };
}

export function createBlankLoop(sortOrder: number): Loop {
  return {
    id: uuid(),
    sortOrder,
    title: '',
    dqRef: 0,
    durationDays: 3,
    phenomenonConnection: '',
    investigativePhenomenon: '',
    navigationRoutine: '',
    problematizingRoutine: '',
    slidesUrl: '',
    targets: [createBlankTarget(0)],
    resources: [],
  };
}

export function createBlankTarget(sortOrder: number): Target {
  return {
    id: uuid(),
    sortOrder,
    title: '',
    dciAlignment: '',
    sepAlignment: '',
    cccAlignment: '',
    modelContribution: '',
    summaryTable: createBlankSummaryTable(),
    activities: [],
    formative: null,
    resources: [],
  };
}

export function createBlankSummaryTable(): SummaryTableRow {
  return {
    activity: '',
    observations: '',
    reasoning: '',
    connectionToPhenomenon: '',
  };
}

export function createBlankActivity(sortOrder: number): Activity {
  return {
    id: uuid(),
    sortOrder,
    title: '',
    type: 'other',
    description: '',
    durationMinutes: 0,
    keyQuestions: '',
    resources: [],
  };
}

export function createBlankFormative(): FormativeAssessment {
  return {
    id: uuid(),
    text: '',
    format: 'Other',
    resourceUrl: '',
    resourceTitle: '',
  };
}

export function createBlankResource(sortOrder: number): Resource {
  return {
    id: uuid(),
    sortOrder,
    title: '',
    url: '',
    type: 'link',
  };
}

export function createBlankDrivingQuestion(sortOrder: number): DrivingQuestion {
  return {
    id: uuid(),
    sortOrder,
    text: '',
    status: 'unanswered',
    linkedLoopId: null,
  };
}

export function createModelStage(label: string, sortOrder: number): ModelStage {
  return {
    id: uuid(),
    sortOrder,
    label,
    description: '',
  };
}

export function createBlankStandard(): Standard {
  return {
    id: uuid(),
    code: '',
    description: '',
    type: 'PE',
  };
}

export function createBlankNote(taggedSection: string | null = null): TeacherNote {
  return {
    id: uuid(),
    text: '',
    color: 'yellow',
    taggedSection,
    createdAt: new Date().toISOString(),
  };
}

export function createBlankGottaHaveItem(sortOrder: number): GottaHaveItem {
  return {
    id: uuid(),
    sortOrder,
    text: '',
    checked: false,
  };
}

export function createBlankTransferTask() {
  return {
    title: '',
    taskDescription: '',
    assessmentUrl: '',
    rubricUrl: '',
    slidesUrl: '',
    standards: [] as string[],
    gottaHaveItems: [] as GottaHaveItem[],
  };
}
