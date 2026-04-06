import { NextRequest, NextResponse } from 'next/server';
import type { ResearchContext, LoopResearchResult, TargetResearchResult } from '@/lib/research/types';

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
      "url": "string (real, working URL)",
      "source": "string (website name)",
      "description": "string (1-2 sentences)",
      "readingLevel": "string (e.g., 'Grade 6-8', 'AP', 'General')"
    }
  ],
  "absentStudent": [
    {
      "modality": "video",
      "title": "string",
      "url": "string (real YouTube or educational video URL)",
      "source": "string",
      "description": "string (what the video covers)",
      "whyUseful": "string (why good for absent student catch-up)",
      "duration": "string (e.g., '8 min')"
    }
  ],
  "discussionQuestions": ["string", "string", "string"]
}

Requirements:
- "readings": 2-3 reading passages/articles appropriate for ${ctx.gradeBand} students that synthesize the loop concepts. Include real, working URLs from reputable sources (Khan Academy, PhET, CK-12, NGSS-aligned sites, science news sites).
- "absentStudent": 1-2 YouTube videos (or reputable educational videos) a student can watch independently to catch up on the whole loop. Include real YouTube URLs.
- "discussionQuestions": 3-4 discussion questions connecting the loop concepts to the anchoring phenomenon "${ctx.phenomenonName || 'the phenomenon'}".

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
      "url": "string (real, working URL)",
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
- Target ${ctx.gradeBand} level. Use real, working URLs from reputable sources (PhET, NSTA, CK-12, Khan Academy, YouTube, Teachers Pay Teachers for free resources, science museum sites).
- Total: ~8-12 resources across all modalities.

Return only the JSON object. No explanation. No markdown.`;
}

function stripJsonFences(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-gemini-key');
  if (!apiKey) {
    return NextResponse.json(
      { error: 'No API key provided. Add your Google AI API key in Settings.' },
      { status: 401 }
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

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
