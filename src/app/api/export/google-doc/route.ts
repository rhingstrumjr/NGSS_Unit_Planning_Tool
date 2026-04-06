import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { buildGoogleDocRequests } from '@/lib/export/google-doc-builder';
import type { Unit } from '@/lib/types';

export async function POST(req: NextRequest) {
  let unit: Unit;
  let accessToken: string;

  try {
    const body = await req.json();
    unit = body.unit;
    accessToken = body.accessToken;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'No access token provided' }, { status: 401 });
  }
  if (!unit) {
    return NextResponse.json({ error: 'No unit data provided' }, { status: 400 });
  }

  try {
    const oauth2 = new google.auth.OAuth2();
    oauth2.setCredentials({ access_token: accessToken });

    const docs = google.docs({ version: 'v1', auth: oauth2 });

    // Create the document
    const createRes = await docs.documents.create({
      requestBody: { title: unit.title || 'Untitled Unit' },
    });

    const documentId = createRes.data.documentId;
    if (!documentId) {
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }

    // Build and apply content
    const requests = buildGoogleDocRequests(unit);
    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });
    }

    const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;
    return NextResponse.json({ docUrl });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to export to Google Docs';
    // Surface Google API errors clearly
    const status =
      message.toLowerCase().includes('invalid') ||
      message.toLowerCase().includes('unauthorized') ||
      message.toLowerCase().includes('401')
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
