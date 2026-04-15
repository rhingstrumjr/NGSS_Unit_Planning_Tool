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

        // ── Pass 3: fill cells + apply bold on header + apply hyperlinks ──

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

        const tableStartIndex = tableEl?.startIndex ?? -1;

        if (tableEl) {
          // Collect (index, text) pairs for every non-empty cell, plus metadata for
          // bold rows and hyperlinked activity cells.
          const inserts: { index: number; text: string }[] = [];
          const boldRanges: { startIndex: number; endIndex: number }[] = [];
          // Activity column hyperlinks: rowIndex → { insertIndex, url }
          const linkMap = new Map<number, { insertIndex: number; url: string }>();

          const tableRows = tableEl.table?.tableRows ?? [];
          for (let r = 0; r < tableRows.length; r++) {
            const cells = tableRows[r].tableCells ?? [];
            for (let c = 0; c < cells.length; c++) {
              const cellText = tableData.rows[r]?.[c] ?? '';
              if (!cellText) continue;
              const cellPara = cells[c].content?.[0];
              const insertIdx = cellPara?.startIndex;
              if (insertIdx == null) continue;
              inserts.push({ index: insertIdx, text: cellText });
              // Bold the header row (row 0)
              if (tableData.headerRowIndices.includes(r)) {
                boldRanges.push({ startIndex: insertIdx, endIndex: insertIdx + cellText.length });
              }
              // Record activity column (col 1) inserts for hyperlinking
              if (c === 1) {
                const link = tableData.activityLinks.find((l) => l.rowIndex === r);
                if (link) {
                  linkMap.set(r, { insertIndex: insertIdx, url: link.url });
                }
              }
            }
          }

          if (inserts.length > 0) {
            // Insert in reverse order so earlier insertions don't shift later indices
            inserts.sort((a, b) => b.index - a.index);
            const fillRequests: DocRequest[] = inserts.map(({ index, text }) => ({
              insertText: { location: { index }, text },
            }));

            // Compute shifted indices for style requests.
            // Inserts were applied in descending-index order, so each insert at position P
            // shifts all positions P+ forward. For text that was originally at index X, the
            // accumulated shift equals the total length of all inserts at positions LESS than X
            // (each of those inserts happened after X's insert and pushed X forward).
            const sortedAsc = [...inserts].sort((a, b) => a.index - b.index);
            const shiftFor = (origIdx: number) =>
              sortedAsc
                .filter((ins) => ins.index < origIdx)
                .reduce((sum, ins) => sum + ins.text.length, 0);

            // Bold header row
            const boldRequests: DocRequest[] = boldRanges.map(({ startIndex, endIndex }) => {
              const shift = shiftFor(startIndex);
              return {
                updateTextStyle: {
                  range: { startIndex: startIndex + shift, endIndex: endIndex + shift },
                  textStyle: { bold: true },
                  fields: 'bold',
                },
              };
            });

            // Hyperlink activity cells
            const linkRequests: DocRequest[] = [];
            for (const { insertIndex, url } of linkMap.values()) {
              const text = inserts.find((ins) => ins.index === insertIndex)?.text ?? '';
              if (!text) continue;
              const shift = shiftFor(insertIndex);
              linkRequests.push({
                updateTextStyle: {
                  range: {
                    startIndex: insertIndex + shift,
                    endIndex: insertIndex + shift + text.length,
                  },
                  textStyle: {
                    link: { url },
                    foregroundColor: {
                      color: { rgbColor: { red: 0.067, green: 0.384, blue: 0.745 } },
                    },
                    underline: true,
                  },
                  fields: 'link,foregroundColor,underline',
                },
              });
            }

            await docs.documents.batchUpdate({
              documentId,
              requestBody: { requests: [...fillRequests, ...boldRequests, ...linkRequests] },
            });
          }
        }

        // ── Pass 4: merge DQ cells vertically within each loop ──
        // Done AFTER filling so the merged cell retains the DQ text; consumed cells
        // had empty content, so no text is lost.

        if (tableStartIndex !== -1 && tableData.dqMergeGroups.length > 0) {
          const mergeRequests: DocRequest[] = tableData.dqMergeGroups.map(
            ({ startRow, rowCount }) => ({
              mergeTableCells: {
                tableRange: {
                  tableCellLocation: {
                    tableStartLocation: { index: tableStartIndex },
                    rowIndex: startRow,
                    columnIndex: 0,
                  },
                  rowSpan: rowCount,
                  columnSpan: 1,
                },
              },
            })
          );
          await docs.documents.batchUpdate({
            documentId,
            requestBody: { requests: mergeRequests },
          });
        }
      }   // end if (paraStart !== -1)
    }     // end if (hasTable)

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
