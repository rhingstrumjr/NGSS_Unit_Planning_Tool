import { NextRequest, NextResponse } from 'next/server';

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are an expert NGSS science curriculum designer specializing in phenomenon-driven storyline units. Your role is to evaluate anchoring phenomena against research-based quality criteria and provide constructive, specific feedback to help teachers improve their phenomenon selection.`;

const CRITERIA_PROMPT = `
Evaluate the phenomenon against these 5 NGSS Storyline quality criteria. Score each from 0–3:
  0 = Not met
  1 = Partially met
  2 = Mostly met
  3 = Fully met

Criteria definitions:
1. Observable: Students can directly witness or experience this phenomenon firsthand (in person or via authentic media). A low score means students are only told about it or read about it secondhand.
2. Student-Relevant: The phenomenon connects to students' lives, prior experiences, or genuine curiosity. A high score means most students would find it naturally interesting and personally relevant without much prompting.
3. Requires Multiple DCIs: A complete scientific explanation requires drawing on 2 or more Disciplinary Core Ideas. A low score means a single DCI is sufficient to fully explain it.
4. Standards-Aligned: The phenomenon motivates learning the targeted NGSS performance expectations — the targeted PEs are necessary and sufficient to explain it. A low score means it doesn't connect naturally to specific PEs.
5. Equitable/Accessible: All students can meaningfully engage regardless of background, language proficiency, or prior knowledge. A high score means diverse cultural contexts are honored and no significant barriers exist.
`;

export interface EvalCriterion {
  name: string;
  score: number;
  feedback: string;
}

export interface PhenomenonEvalResult {
  criteria: EvalCriterion[];
  summary: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured on server.' }, { status: 500 });
  }

  let body: { phenomenonName: string; phenomenonDescription?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { phenomenonName, phenomenonDescription } = body;
  if (!phenomenonName?.trim()) {
    return NextResponse.json({ error: 'phenomenonName is required' }, { status: 400 });
  }

  const userMessage = `Phenomenon to evaluate:
Name: ${phenomenonName}
Description: ${phenomenonDescription?.trim() || '(no description provided)'}

${CRITERIA_PROMPT}

Return ONLY valid JSON matching this exact schema:
{
  "criteria": [
    { "name": "Observable", "score": <0-3>, "feedback": "<1-2 sentences of specific feedback>" },
    { "name": "Student-Relevant", "score": <0-3>, "feedback": "<1-2 sentences of specific feedback>" },
    { "name": "Requires Multiple DCIs", "score": <0-3>, "feedback": "<1-2 sentences of specific feedback>" },
    { "name": "Standards-Aligned", "score": <0-3>, "feedback": "<1-2 sentences of specific feedback>" },
    { "name": "Equitable/Accessible", "score": <0-3>, "feedback": "<1-2 sentences of specific feedback>" }
  ],
  "summary": "<2-3 sentences: overall quality assessment and the single most important improvement suggestion>"
}`;

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: {
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message ?? `Gemini API error (${res.status})`;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let result: PhenomenonEvalResult;
    try {
      result = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON. Please try again.' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
