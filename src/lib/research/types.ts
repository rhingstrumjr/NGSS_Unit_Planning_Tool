export interface ResearchedResource {
  modality: 'lab' | 'teacher-demo' | 'video' | 'reading' | 'simulation';
  title: string;
  /** Primary URL shown/used for this resource. Either a verified direct URL or (when unavailable) a search-URL fallback. */
  url: string;
  source: string;
  description: string;
  whyUseful: string;
  duration?: string;
  /** true = verified reachable, false = definitively broken, null/undefined = could not determine */
  urlVerified?: boolean | null;
  /** Always-present fallback URL: a pre-built search on YouTube/PhET/Google that is guaranteed to work. */
  searchUrl: string;
  /** true when `url === searchUrl` — we could not get a verified direct URL for this resource. */
  isSearchFallback?: boolean;
}

export interface ResearchedReading {
  title: string;
  /** Primary URL shown/used for this resource. Either a verified direct URL or (when unavailable) a search-URL fallback. */
  url: string;
  source: string;
  description: string;
  readingLevel?: string;
  /** true = verified reachable, false = definitively broken, null/undefined = could not determine */
  urlVerified?: boolean | null;
  /** Always-present fallback URL: a pre-built Google search guaranteed to work. */
  searchUrl: string;
  /** true when `url === searchUrl` — we could not get a verified direct URL for this reading. */
  isSearchFallback?: boolean;
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
