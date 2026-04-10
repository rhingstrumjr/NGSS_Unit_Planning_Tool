// NGSS Storyline Unit Planner — Data Model

export interface Unit {
  id: string;
  title: string;
  gradeBand: string;
  course: string;
  estimatedDays: number;

  // Phenomena (supports multiple — one is starred as primary anchor)
  phenomena: Phenomenon[];
  phenomenonSlidesUrl: string;

  // Unit-level
  unitDrivingQuestion: string;
  gaplessExplanation: string;
  standards: Standard[];
  googleDocUrl: string;

  // Children
  drivingQuestions: DrivingQuestion[];
  modelTemplate: string;
  modelStages: ModelStage[];
  loops: Loop[];
  transferTask: TransferTask;

  // Teacher notes (not exported — planning artifacts)
  notes: TeacherNote[];

  createdAt: string;
  updatedAt: string;
}

export interface Standard {
  id: string;
  code: string;
  description: string;
  type: 'PE' | 'DCI' | 'SEP' | 'CCC';
}

export interface DrivingQuestion {
  id: string;
  sortOrder: number;
  text: string;
  status: 'unanswered' | 'in-progress' | 'answered';
  linkedLoopId: string | null;
}

export interface ModelStage {
  id: string;
  sortOrder: number;
  label: string;
  description: string;
}

export interface Loop {
  id: string;
  sortOrder: number;
  title: string;
  dqRef: number;
  durationDays: number;
  phenomenonConnection: string;
  investigativePhenomenon: string;
  navigationRoutine: string;
  problematizingRoutine: string;
  slidesUrl: string;
  targets: Target[];
  resources: Resource[];
}

export interface Target {
  id: string;
  sortOrder: number;
  title: string;
  dciAlignment: string;
  sepAlignment: string;
  cccAlignment: string;
  modelContribution?: string;
  summaryTable: SummaryTableRow;
  activities: Activity[];
  formative: FormativeAssessment | null;
  resources: Resource[];
}

export interface SummaryTableRow {
  activity: string;
  observations: string;
  reasoning: string;
  connectionToPhenomenon: string;
}

export interface Activity {
  id: string;
  sortOrder: number;
  title: string;
  type: ActivityType;
  description: string;
  durationMinutes: number;
  keyQuestions: string;
  resources: Resource[];
}

export type ActivityType =
  | 'lab'
  | 'reading'
  | 'simulation'
  | 'discussion'
  | 'modeling'
  | 'video'
  | 'other';

export interface FormativeAssessment {
  id: string;
  text: string;
  format: FormativeFormat;
  resourceUrl: string;
  resourceTitle: string;
}

export type FormativeFormat =
  | 'Exit Ticket'
  | 'CER'
  | 'Warm-Up'
  | 'Whiteboard Check'
  | 'Discussion'
  | 'Mini Quiz'
  | 'Observation'
  | 'Other';

export interface Resource {
  id: string;
  sortOrder: number;
  title: string;
  url: string;
  type: ResourceType;
}

export type ResourceType =
  | 'youtube'
  | 'google-doc'
  | 'google-slides'
  | 'google-form'
  | 'pdf'
  | 'image'
  | 'article'
  | 'link';

export interface TeacherNote {
  id: string;
  text: string;
  color: 'yellow' | 'blue' | 'green' | 'red';
  taggedSection: string | null;
  createdAt: string;
}

export interface Phenomenon {
  id: string;
  name: string;
  description: string;
  mediaUrl: string;
  isPrimary: boolean;
}

export interface TransferTask {
  title: string;
  taskDescription: string;
  assessmentUrl: string;
  rubricUrl: string;
  slidesUrl: string;
  standards: string[];
  gottaHaveItems: GottaHaveItem[];
}

export interface GottaHaveItem {
  id: string;
  sortOrder: number;
  text: string;
  checked: boolean;
}
