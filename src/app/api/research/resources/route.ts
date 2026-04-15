import { NextRequest, NextResponse } from 'next/server';
import type {
  ResearchContext,
  LoopResearchResult,
  TargetResearchResult,
  ResearchedResource,
  ResearchedReading,
} from '@/lib/research/types';

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ============================================================================
// Prompt Construction
// ============================================================================

const URL_RULES = `
URL GUIDANCE:
- Prefer URLs you found in your search results over ones you recall from memory.
- For YouTube, search "[title] YouTube" and copy the exact URL from the search result rather than guessing a video ID.
- If your direct URL turns out to be wrong, we'll show the teacher a search link as a fallback — but please try to give accurate URLs.`;

function buildLoopPrompt(ctx: Extract<ResearchContext, { tier: 'loop' }>): string {
  const dciList = ctx.dciConcepts.filter(Boolean).join(', ') || 'the key science concepts';
  const targets = ctx.targetTitles.filter(Boolean).join('; ') || 'the learning targets';
  return `You are a curriculum resource researcher for a ${ctx.gradeBand} science teacher.

The unit anchoring phenomenon is: "${ctx.phenomenonName || 'a science phenomenon'}"
The sensemaking loop title is: "${ctx.loopTitle || 'a sensemaking loop'}"
The learning targets in this loop are: ${targets}
Core science concepts (DCI): ${dciList}

Search the web and find the following resources. Return ONLY valid JSON (no markdown fences) matching this exact schema:

{
  "readings": [
    {
      "title": "string",
      "url": "string (real, working URL from search results)",
      "source": "string (website name)",
      "description": "string (1-2 sentences)",
      "readingLevel": "string (e.g., 'Grade 6-8', 'AP', 'General')"
    }
  ],
  "absentStudent": [
    {
      "modality": "video",
      "title": "string",
      "url": "string (real YouTube or educational video URL from search results)",
      "source": "string",
      "description": "string (what the video covers)",
      "whyUseful": "string (why good for absent student catch-up)",
      "duration": "string (e.g., '8 min')"
    }
  ],
  "discussionQuestions": ["string", "string", "string"]
}

Requirements:
- "readings": 2-3 reading passages/articles appropriate for ${ctx.gradeBand} students that synthesize the loop concepts. Use reputable sources (Khan Academy, PhET, CK-12, NGSS-aligned sites, science news sites).
- "absentStudent": 1-2 YouTube videos (or reputable educational videos) a student can watch independently to catch up on the whole loop.
- "discussionQuestions": 3-4 discussion questions connecting the loop concepts to the anchoring phenomenon "${ctx.phenomenonName || 'the phenomenon'}".
${URL_RULES}

Return only the JSON object. No explanation. No markdown.`;
}

function buildTargetPrompt(ctx: Extract<ResearchContext, { tier: 'target' }>): string {
  return `You are a curriculum resource researcher for a ${ctx.gradeBand} science teacher.

The unit anchoring phenomenon is: "${ctx.phenomenonName || 'a science phenomenon'}"
The sensemaking loop is: "${ctx.loopTitle || 'a sensemaking loop'}"
The learning target is: "${ctx.targetTitle || 'a learning target'}"
DCI (Disciplinary Core Idea): ${ctx.dciAlignment || 'not specified'}
SEP (Science and Engineering Practice): ${ctx.sepAlignment || 'not specified'}
CCC (Crosscutting Concept): ${ctx.cccAlignment || 'not specified'}

Search the web and find teaching resources for this specific learning target. Return ONLY valid JSON (no markdown fences) matching this exact schema:

{
  "resources": [
    {
      "modality": "lab" | "teacher-demo" | "video" | "reading" | "simulation",
      "title": "string",
      "url": "string (real, working URL from search results)",
      "source": "string (website name)",
      "description": "string (1-2 sentences about the resource)",
      "whyUseful": "string (why this helps students learn this specific concept)",
      "duration": "string (optional, e.g., '45 min', '12 min video')"
    }
  ]
}

Requirements:
- Find 2-3 resources per modality for the DCI concept: "${ctx.dciAlignment || ctx.targetTitle}"
- Modalities to include (in this order, concrete to abstract):
  1. "lab" — hands-on lab activities or investigations students can do
  2. "teacher-demo" — teacher-led demonstrations of the concept
  3. "video" — YouTube or educational videos explaining the concept
  4. "reading" — reading passages, articles, or text resources
- Target ${ctx.gradeBand} level. Use reputable sources (PhET, NSTA, CK-12, Khan Academy, YouTube, Teachers Pay Teachers for free resources, science museum sites).
- Total: ~8-12 resources across all modalities.
${URL_RULES}

Return only the JSON object. No explanation. No markdown.`;
}

function stripJsonFences(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
}

// ============================================================================
// Grounding — resolve Gemini's redirect wrappers to real source URLs
// ============================================================================

// Gemini's groundingChunks[].web.uri is a vertexaisearch.cloud.google.com/grounding-api-redirect/...
// URL that redirects to the actual source. Follow the redirect to get the real URL.
async function resolveGroundingUrl(wrapperUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(wrapperUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok ? res.url : null;
  } catch {
    return null;
  }
}

async function extractGroundingSources(
  data: unknown
): Promise<Array<{ url: string; title: string }>> {
  const chunks = (data as any)?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources = await Promise.all(
    chunks.map(async (c: any) => {
      const wrapperUrl = c?.web?.uri;
      const title = c?.web?.title ?? '';
      if (typeof wrapperUrl !== 'string') return null;
      const realUrl = await resolveGroundingUrl(wrapperUrl);
      return realUrl ? { url: realUrl, title } : null;
    })
  );
  return sources.filter((s): s is { url: string; title: string } => s !== null);
}

// ============================================================================
// Title similarity for matching AI resources to grounding sources
// ============================================================================

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Jaccard-style similarity over word tokens (length > 2 to skip stopwords)
function titleSimilarity(a: string, b: string): number {
  const aw = new Set(normalizeForMatch(a).split(' ').filter((w) => w.length > 2));
  const bw = new Set(normalizeForMatch(b).split(' ').filter((w) => w.length > 2));
  if (aw.size === 0 || bw.size === 0) return 0;
  let intersect = 0;
  for (const w of aw) if (bw.has(w)) intersect++;
  return intersect / Math.min(aw.size, bw.size);
}

function findGroundingMatch(
  resourceTitle: string,
  resourceUrl: string,
  sources: Array<{ url: string; title: string }>
): string | null {
  // 1. Exact URL match (rare — AI usually writes different URLs than grounding)
  const exact = sources.find((s) => s.url === resourceUrl);
  if (exact) return exact.url;
  // 2. Best title match above threshold
  let best = { score: 0, url: null as string | null };
  for (const s of sources) {
    const score = titleSimilarity(resourceTitle, s.title);
    if (score > best.score) best = { score, url: s.url };
  }
  return best.score >= 0.5 ? best.url : null;
}

// ============================================================================
// Search URL builders — guaranteed-working fallbacks
// ============================================================================

type Modality = 'lab' | 'teacher-demo' | 'video' | 'reading' | 'simulation';

function buildSearchUrl(title: string, modality: Modality | undefined, source: string): string {
  const q = encodeURIComponent(title);
  if (modality === 'video') {
    return `https://www.youtube.com/results?search_query=${q}`;
  }
  if (modality === 'simulation') {
    // PhET site search — most simulations live here
    return `https://phet.colorado.edu/en/simulations/filter?search=${q}`;
  }
  // reading / lab / teacher-demo / unknown: Google search, with source hint if useful
  const sourceHint = source ? `+${encodeURIComponent(source)}` : '';
  return `https://www.google.com/search?q=${q}${sourceHint}`;
}

// ============================================================================
// URL verification (unchanged logic from v1)
// ============================================================================

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com/watch') || url.includes('youtu.be/');
}

async function verifyYouTubeUrl(url: string): Promise<boolean | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(oembedUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) return true;
    if (res.status === 404) return false;
    return null;
  } catch {
    return false;
  }
}

async function verifyUrl(url: string): Promise<boolean | null> {
  if (!url) return false;
  if (isYouTubeUrl(url)) return verifyYouTubeUrl(url);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (res.status === 404) return false;
    if (res.ok) return true;
    return null;
  } catch {
    return false;
  }
}

// ============================================================================
// Per-resource processing: pick direct URL (via grounding) or fall back to search URL
// ============================================================================

type ProcessedFields = {
  url: string;
  searchUrl: string;
  urlVerified?: boolean | null;
  isSearchFallback?: boolean;
};

async function processResource(
  title: string,
  aiUrl: string,
  modality: Modality | undefined,
  source: string,
  groundingSources: Array<{ url: string; title: string }>
): Promise<ProcessedFields> {
  const searchUrl = buildSearchUrl(title, modality, source);

  // Try to find a real URL from grounding (via title similarity)
  const groundedUrl = findGroundingMatch(title, aiUrl, groundingSources);

  // Candidate direct URL: prefer grounded URL; if none, try the AI's URL as a last resort
  const candidate = groundedUrl ?? aiUrl;
  if (!candidate) {
    return { url: searchUrl, searchUrl, urlVerified: null, isSearchFallback: true };
  }

  const verified = await verifyUrl(candidate);
  if (verified === true) {
    return { url: candidate, searchUrl, urlVerified: true, isSearchFallback: false };
  }

  // Verification failed or ambiguous — fall back to the guaranteed-working search URL
  return {
    url: searchUrl,
    searchUrl,
    urlVerified: verified,
    isSearchFallback: true,
  };
}

// ============================================================================
// Route handler
// ============================================================================

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key not configured on server.' },
      { status: 500 }
    );
  }

  let ctx: ResearchContext;
  try {
    ctx = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const prompt = ctx.tier === 'loop' ? buildLoopPrompt(ctx) : buildTargetPrompt(ctx);

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tools: [{ google_search: {} }],
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048 },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message ?? `Gemini API error (${res.status})`;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const data = await res.json();
    const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = stripJsonFences(rawText);

    let parsed: LoopResearchResult | TargetResearchResult;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'AI returned malformed JSON. Try again.' },
        { status: 500 }
      );
    }

    // Resolve grounding redirect wrappers to real source URLs (in parallel with JSON parse)
    const groundingSources = await extractGroundingSources(data);

    if (ctx.tier === 'loop') {
      const loopParsed = parsed as LoopResearchResult;
      const [readings, absentStudent] = await Promise.all([
        Promise.all(
          (loopParsed.readings ?? []).map(async (r): Promise<ResearchedReading> => {
            const processed = await processResource(
              r.title,
              r.url,
              undefined, // readings have no modality
              r.source,
              groundingSources
            );
            return { ...r, ...processed };
          })
        ),
        Promise.all(
          (loopParsed.absentStudent ?? []).map(async (r): Promise<ResearchedResource> => {
            const processed = await processResource(
              r.title,
              r.url,
              r.modality,
              r.source,
              groundingSources
            );
            return { ...r, ...processed };
          })
        ),
      ]);
      return NextResponse.json({ ...loopParsed, readings, absentStudent });
    } else {
      const targetParsed = parsed as TargetResearchResult;
      const resources = await Promise.all(
        (targetParsed.resources ?? []).map(async (r): Promise<ResearchedResource> => {
          const processed = await processResource(
            r.title,
            r.url,
            r.modality,
            r.source,
            groundingSources
          );
          return { ...r, ...processed };
        })
      );
      return NextResponse.json({ resources });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
