import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import {
  buildGoogleDocRequests,
  buildPlanningTableData,
  PLANNING_TABLE_PLACEHOLDER,
  PLANNING_TABLE_COLUMNS,
} from '@/lib/export/google-doc-builder';
import type { Unit } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocRequest = Record<string, any>;

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

    // ── Pass 1: create doc and insert all content (table section = placeholder) ──

    const createRes = await docs.documents.create({
      requestBody: { title: unit.title || 'Untitled Unit' },
    });
    const documentId = createRes.data.documentId;
    if (!documentId) {
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }

    const contentRequests = buildGoogleDocRequests(unit);
    if (contentRequests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: contentRequests },
      });
    }

    // ── Pass 2: locate placeholder, delete it, insert the real table ──

    const hasTable = unit.loops.some((l) => l.targets.length > 0);
    if (hasTable) {
      const snapshot = await docs.documents.get({ documentId });
      const bodyContent = snapshot.data.body?.content ?? [];

      // Find the paragraph that contains the placeholder
      let paraStart = -1;
      let paraEnd = -1;
      outer: for (const el of bodyContent) {
        if (el.paragraph) {
          for (const pe of el.paragraph.elements ?? []) {
            if (pe.textRun?.content?.includes(PLANNING_TABLE_PLACEHOLDER)) {
              paraStart = el.startIndex!;
              paraEnd = el.endIndex!;
              break outer;
            }
          }
        }
      }

      if (paraStart !== -1) {
        const tableData = buildPlanningTableData(unit);
        const numRows = tableData.rows.length;
        const numCols = PLANNING_TABLE_COLUMNS.length;

        // Delete the placeholder paragraph and insert an empty table in its place.
        // Note: insertTable prepends a newline, so the table's structural element
        // lands at paraStart + 1. We capture paraStart for the GET below.
        await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                deleteContentRange: {
                  range: { startIndex: paraStart, endIndex: paraEnd },
                },
              },
              {
                insertTable: {
                  rows: numRows,
                  columns: numCols,
                  location: { index: paraStart },
                },
              },
            ],
          },
        });

        // ── Pass 3: fill cells ──

        const docWithTable = await docs.documents.get({ documentId });
        const updatedContent = docWithTable.data.body?.content ?? [];

        // Find the table element (there is exactly one table in this doc)
        let tableEl: (typeof updatedContent)[number] | null = null;
        for (const el of updatedContent) {
          if (el.table) {
            tableEl = el;
            break;
          }
        }

        if (tableEl) {
          // Collect (index, text) pairs for every non-empty cell
          const inserts: { index: number; text: string }[] = [];
          const boldRanges: { startIndex: number; endIndex: number }[] = [];

          const tableRows = tableEl.table?.tableRows ?? [];
          for (let r = 0; r < tableRows.length; r++) {
            const cells = tableRows[r].tableCells ?? [];
            for (let c = 0; c < cells.length; c++) {
              const cellText = tableData.rows[r]?.[c] ?? '';
              if (!cellText) continue;
              // Each empty cell has one paragraph element; insert at its startIndex
              const cellPara = cells[c].content?.[0];
              const insertIdx = cellPara?.startIndex;
              if (insertIdx == null) continue;
              inserts.push({ index: insertIdx, text: cellText });
              if (tableData.headerRowIndices.includes(r)) {
                boldRanges.push({ startIndex: insertIdx, endIndex: insertIdx + cellText.length });
              }
            }
          }

          if (inserts.length > 0) {
            // Insert in reverse order so earlier insertions don't shift later indices
            inserts.sort((a, b) => b.index - a.index);

            const fillRequests: DocRequest[] = inserts.map(({ index, text }) => ({
              insertText: { location: { index }, text },
            }));

            // Bold requests go after all inserts. Because we inserted in reverse
            // order the accumulated forward shift for each bold range equals the
            // total length of text inserted AFTER that range — so we add that offset.
            const sortedAsc = [...inserts].sort((a, b) => a.index - b.index);
            const boldRequests: DocRequest[] = boldRanges.map(({ startIndex, endIndex }) => {
              // Sum lengths of all inserts whose original index is > startIndex
              const shift = sortedAsc
                .filter((ins) => ins.index > startIndex)
                .reduce((sum, ins) => sum + ins.text.length, 0);
              return {
                updateTextStyle: {
                  range: {
                    startIndex: startIndex + shift,
                    endIndex: endIndex + shift,
                  },
                  textStyle: { bold: true },
                  fields: 'bold',
                },
              };
            });

            await docs.documents.batchUpdate({
              documentId,
              requestBody: { requests: [...fillRequests, ...boldRequests] },
            });
          }
        }
      }
    }

    const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;
    return NextResponse.json({ docUrl });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to export to Google Docs';
    const status =
      message.toLowerCase().includes('invalid') ||
      message.toLowerCase().includes('unauthorized') ||
      message.toLowerCase().includes('401')
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
