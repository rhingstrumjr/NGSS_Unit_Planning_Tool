export interface ResearchedResource {
  modality: 'lab' | 'teacher-demo' | 'video' | 'reading' | 'simulation';
  title: string;
  url: string;
  source: string;
  description: string;
  whyUseful: string;
  duration?: string;
}

export interface ResearchedReading {
  title: string;
  url: string;
  source: string;
  description: string;
  readingLevel?: string;
}

export interface LoopResearchResult {
  readings: ResearchedReading[];
  absentStudent: ResearchedResource[];
  discussionQuestions: string[];
}

export interface TargetResearchResult {
  resources: ResearchedResource[];
}

export interface LoopResearchContext {
  tier: 'loop';
  gradeBand: string;
  phenomenonName: string;
  loopTitle: string;
  targetTitles: string[];
  dciConcepts: string[];
}

export interface TargetResearchContext {
  tier: 'target';
  gradeBand: string;
  phenomenonName: string;
  loopTitle: string;
  targetTitle: string;
  dciAlignment: string;
  sepAlignment: string;
  cccAlignment: string;
}

export type ResearchContext = LoopResearchContext | TargetResearchContext;
