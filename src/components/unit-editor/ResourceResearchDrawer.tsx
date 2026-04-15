'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Resource, Activity } from '@/lib/types';
import type {
  ResearchContext,
  LoopResearchResult,
  TargetResearchResult,
  ResearchedResource,
  ResearchedReading,
} from '@/lib/research/types';


interface ResourceResearchDrawerProps {
  tier: 'loop' | 'target';
  context: ResearchContext;
  onAddResource: (r: Resource) => void;
  onAddActivity?: (a: Activity) => void;
}

type DrawerState = 'closed' | 'loading' | 'results' | 'error';

function inferResourceType(url: string): Resource['type'] {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('docs.google.com/document')) return 'google-doc';
  if (url.includes('docs.google.com/presentation')) return 'google-slides';
  if (url.includes('docs.google.com/forms')) return 'google-form';
  if (url.endsWith('.pdf')) return 'pdf';
  return 'article';
}

function searchSiteLabel(searchUrl: string): string {
  if (searchUrl.includes('youtube.com')) return 'YouTube';
  if (searchUrl.includes('phet.colorado.edu')) return 'PhET';
  return 'Google';
}

function ModalityIcon({ modality }: { modality: ResearchedResource['modality'] }) {
  const icons: Record<ResearchedResource['modality'], string> = {
    'lab': '🧪',
    'teacher-demo': '👩‍🏫',
    'video': '▶️',
    'reading': '📄',
    'simulation': '💻',
  };
  return <span>{icons[modality] ?? '📎'}</span>;
}

function ModalityLabel({ modality }: { modality: ResearchedResource['modality'] }) {
  const labels: Record<ResearchedResource['modality'], string> = {
    'lab': 'Lab / Hands-on',
    'teacher-demo': 'Teacher Demo',
    'video': 'Video',
    'reading': 'Reading',
    'simulation': 'Simulation',
  };
  return <>{labels[modality] ?? modality}</>;
}

function ReadingCard({
  reading,
  onAdd,
  added,
}: {
  reading: ResearchedReading;
  onAdd: () => void;
  added: boolean;
}) {
  const isFallback = reading.isSearchFallback === true;
  const siteName = searchSiteLabel(reading.searchUrl ?? '');
  return (
    <div className={`bg-surface border rounded-lg p-3 space-y-1 ${isFallback ? 'border-amber/40' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-foreground truncate">{reading.title}</p>
          <span className="inline-block text-sm bg-teal/10 text-teal rounded px-1.5 py-0.5 mt-0.5">
            {reading.source}
          </span>
          {reading.readingLevel && (
            <span className="inline-block text-sm bg-surface-light text-muted rounded px-1.5 py-0.5 mt-0.5 ml-1">
              {reading.readingLevel}
            </span>
          )}
        </div>
        <a
          href={reading.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm flex-shrink-0 ${isFallback ? 'text-amber hover:text-amber/80' : 'text-teal hover:text-teal-light'}`}
          title={isFallback ? `Opens ${siteName} search` : 'Open link'}
        >
          {isFallback ? '🔍' : '↗'}
        </a>
      </div>
      {isFallback && (
        <p className="text-xs text-amber">
          Direct link unavailable — 🔍 opens {siteName} search for this title
        </p>
      )}
      <p className="text-sm text-muted">{reading.description}</p>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onAdd}
          disabled={added}
          className="text-sm text-teal hover:text-teal-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {added ? '✓ Added' : '+ Add to Loop Resources'}
        </button>
        {!isFallback && reading.searchUrl && (
          <a
            href={reading.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-teal-light"
            title={`Search ${siteName} for alternatives`}
          >
            🔍 Search {siteName}
          </a>
        )}
      </div>
    </div>
  );
}

function ResourceCard({
  resource,
  onAddAsActivity,
  onAddAsResource,
  addedActivity,
  addedResource,
}: {
  resource: ResearchedResource;
  onAddAsActivity?: () => void;
  onAddAsResource?: () => void;
  addedActivity: boolean;
  addedResource: boolean;
}) {
  const canAddActivity = resource.modality === 'lab' || resource.modality === 'teacher-demo';
  const isFallback = resource.isSearchFallback === true;
  const siteName = searchSiteLabel(resource.searchUrl ?? '');

  return (
    <div className={`bg-surface border rounded-lg p-3 space-y-1 ${isFallback ? 'border-amber/40' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-foreground truncate">{resource.title}</p>
          <span className="inline-block text-sm bg-surface-light text-muted rounded px-1.5 py-0.5 mt-0.5">
            {resource.source}
          </span>
          {resource.duration && (
            <span className="inline-block text-sm bg-surface-light text-muted rounded px-1.5 py-0.5 mt-0.5 ml-1">
              {resource.duration}
            </span>
          )}
        </div>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm flex-shrink-0 ${isFallback ? 'text-amber hover:text-amber/80' : 'text-teal hover:text-teal-light'}`}
          title={isFallback ? `Opens ${siteName} search` : 'Open link'}
        >
          {isFallback ? '🔍' : '↗'}
        </a>
      </div>
      {isFallback && (
        <p className="text-xs text-amber">
          Direct link unavailable — 🔍 opens {siteName} search for this title
        </p>
      )}
      <p className="text-sm text-muted">{resource.description}</p>
      <p className="text-sm text-foreground/60 italic">{resource.whyUseful}</p>
      <div className="flex gap-3 pt-0.5 flex-wrap">
        {canAddActivity && onAddAsActivity && (
          <button
            onClick={onAddAsActivity}
            disabled={addedActivity}
            className="text-sm text-amber hover:text-amber/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addedActivity ? '✓ Added as Activity' : '+ Add as Activity'}
          </button>
        )}
        {!canAddActivity && onAddAsResource && (
          <button
            onClick={onAddAsResource}
            disabled={addedResource}
            className="text-sm text-teal hover:text-teal-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addedResource ? '✓ Added as Resource' : '+ Add as Resource'}
          </button>
        )}
        {!isFallback && resource.searchUrl && (
          <a
            href={resource.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-teal-light"
            title={`Search ${siteName} for alternatives`}
          >
            🔍 Search {siteName}
          </a>
        )}
      </div>
    </div>
  );
}

export function ResourceResearchDrawer({
  tier,
  context,
  onAddResource,
  onAddActivity,
}: ResourceResearchDrawerProps) {
  const [drawerState, setDrawerState] = useState<DrawerState>('closed');
  const [errorMsg, setErrorMsg] = useState('');
  const [loopResult, setLoopResult] = useState<LoopResearchResult | null>(null);
  const [targetResult, setTargetResult] = useState<TargetResearchResult | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [copiedQuestions, setCopiedQuestions] = useState(false);

  const isOpen = drawerState !== 'closed';

  function markAdded(key: string) {
    setAddedIds((prev) => new Set(prev).add(key));
  }

  async function handleResearch() {
    if (drawerState === 'loading') return;

    setDrawerState('loading');
    setErrorMsg('');
    setLoopResult(null);
    setTargetResult(null);
    setAddedIds(new Set());

    try {
      const res = await fetch('/api/research/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Research failed (${res.status})`);
      }

      if (tier === 'loop') {
        setLoopResult(data as LoopResearchResult);
      } else {
        setTargetResult(data as TargetResearchResult);
      }
      setDrawerState('results');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Research failed.');
      setDrawerState('error');
    }
  }

  function toggleDrawer() {
    if (drawerState === 'closed') {
      handleResearch();
    } else {
      setDrawerState('closed');
    }
  }

  function addReadingAsResource(reading: ResearchedReading, key: string) {
    onAddResource({
      id: uuid(),
      sortOrder: 0,
      title: reading.title,
      url: reading.url,
      type: 'article',
    });
    markAdded(key);
  }

  function addResearchedResource(r: ResearchedResource, key: string) {
    onAddResource({
      id: uuid(),
      sortOrder: 0,
      title: r.title,
      url: r.url,
      type: inferResourceType(r.url),
    });
    markAdded(key);
  }

  function addResearchedActivity(r: ResearchedResource, key: string) {
    if (!onAddActivity) return;
    const activityType: Activity['type'] = r.modality === 'lab' ? 'lab' : 'other';
    const sourceResource: Resource = {
      id: uuid(),
      sortOrder: 0,
      title: r.source || r.title,
      url: r.url,
      type: inferResourceType(r.url),
    };
    onAddActivity({
      id: uuid(),
      sortOrder: 0,
      title: r.title,
      type: activityType,
      description: `${r.description}\n\n${r.whyUseful}`,
      durationMinutes: 0,
      keyQuestions: '',
      resources: r.url ? [sourceResource] : [],
    });
    markAdded(key);
  }

  async function copyDiscussionQuestions(questions: string[]) {
    const text = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedQuestions(true);
    setTimeout(() => setCopiedQuestions(false), 2000);
  }

  // Group target resources by modality
  const modalityOrder: ResearchedResource['modality'][] = [
    'lab',
    'teacher-demo',
    'video',
    'reading',
    'simulation',
  ];

  const grouped =
    targetResult?.resources.reduce<
      Partial<Record<ResearchedResource['modality'], ResearchedResource[]>>
    >((acc, r) => {
      if (!acc[r.modality]) acc[r.modality] = [];
      acc[r.modality]!.push(r);
      return acc;
    }, {}) ?? {};

  const buttonLabel = tier === 'loop' ? 'Research Loop Resources' : 'Research Activities';

  return (
    <div className="mb-4">
      {/* Toggle button */}
      <button
        onClick={toggleDrawer}
        disabled={drawerState === 'loading'}
        className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
          isOpen
            ? 'bg-teal/10 border-teal/30 text-teal'
            : 'bg-surface border-border text-muted hover:text-foreground hover:border-teal/40'
        }`}
      >
        {drawerState === 'loading' ? (
          <>
            <span className="inline-block w-3 h-3 border border-muted/40 border-t-muted rounded-full animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <span>🔍</span>
            {isOpen ? `Close ${tier === 'loop' ? 'Loop' : 'Activity'} Research` : buttonLabel}
          </>
        )}
      </button>

      {/* Error state */}
      {drawerState === 'error' && (
        <div className="mt-2 p-3 bg-red/5 border border-red/20 rounded-lg">
          <p className="text-sm text-red mb-2">{errorMsg}</p>
          {errorMsg.includes('Settings') ? (
            <a href="/settings" className="text-sm text-teal hover:text-teal-light underline">
              Go to Settings →
            </a>
          ) : (
            <button
              onClick={() => setDrawerState('closed')}
              className="text-sm text-muted hover:text-foreground"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Results panel */}
      {drawerState === 'results' && (
        <div className="mt-3 border border-border rounded-xl overflow-hidden">
          <div className="bg-surface-light/30 px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground/70">
              {tier === 'loop' ? 'Loop Resources' : 'Activity & Resource Suggestions'}
            </span>
            <button
              onClick={handleResearch}
              className="text-sm text-muted hover:text-teal"
            >
              ↺ Re-search
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* LOOP TIER */}
            {tier === 'loop' && loopResult && (
              <>
                {/* Reading Passages */}
                {loopResult.readings?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide mb-2">
                      📖 Reading Passages
                    </h4>
                    <div className="space-y-2">
                      {loopResult.readings.map((reading, i) => (
                        <ReadingCard
                          key={i}
                          reading={reading}
                          onAdd={() => addReadingAsResource(reading, `reading-${i}`)}
                          added={addedIds.has(`reading-${i}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Absent Student Version */}
                {loopResult.absentStudent?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide mb-2">
                      🏠 Absent Student Version
                    </h4>
                    <div className="space-y-2">
                      {loopResult.absentStudent.map((r, i) => (
                        <ResourceCard
                          key={i}
                          resource={r}
                          onAddAsResource={() => addResearchedResource(r, `absent-${i}`)}
                          addedActivity={false}
                          addedResource={addedIds.has(`absent-${i}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Discussion Questions */}
                {loopResult.discussionQuestions?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                        💬 Discussion Questions
                      </h4>
                      <button
                        onClick={() => copyDiscussionQuestions(loopResult.discussionQuestions)}
                        className="text-sm text-muted hover:text-teal"
                      >
                        {copiedQuestions ? '✓ Copied!' : 'Copy all'}
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {loopResult.discussionQuestions.map((q, i) => (
                        <li key={i} className="text-base text-foreground/80 flex gap-2">
                          <span className="text-muted flex-shrink-0">{i + 1}.</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* TARGET TIER */}
            {tier === 'target' && targetResult && (
              <>
                {modalityOrder.map((modality) => {
                  const items = grouped[modality];
                  if (!items?.length) return null;
                  return (
                    <div key={modality}>
                      <h4 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide mb-2">
                        <ModalityIcon modality={modality} />{' '}
                        <ModalityLabel modality={modality} />
                      </h4>
                      <div className="space-y-2">
                        {items.map((r, i) => {
                          const actKey = `${modality}-act-${i}`;
                          const resKey = `${modality}-res-${i}`;
                          const canBeActivity = modality === 'lab' || modality === 'teacher-demo';
                          return (
                            <ResourceCard
                              key={i}
                              resource={r}
                              onAddAsActivity={
                                canBeActivity && onAddActivity
                                  ? () => addResearchedActivity(r, actKey)
                                  : undefined
                              }
                              onAddAsResource={
                                !canBeActivity
                                  ? () => addResearchedResource(r, resKey)
                                  : undefined
                              }
                              addedActivity={addedIds.has(actKey)}
                              addedResource={addedIds.has(resKey)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
