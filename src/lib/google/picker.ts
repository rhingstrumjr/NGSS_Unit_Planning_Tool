import type { Resource, ResourceType } from '@/lib/types';
import {
  loadGapiScript,
  type GooglePickerNamespace,
  type PickerDocument,
} from './gis';

/** Loads the 'picker' library inside gapi if not already loaded. */
export async function loadPicker(): Promise<GooglePickerNamespace> {
  await loadGapiScript();
  if (window.google?.picker) return window.google.picker;
  await new Promise<void>((resolve) => {
    window.gapi!.load('picker', () => resolve());
  });
  if (!window.google?.picker) {
    throw new Error('Google Picker failed to initialize.');
  }
  return window.google.picker;
}

/** Map Drive mimeType to our Resource['type']. */
export function mimeTypeToResourceType(mimeType: string): ResourceType {
  if (mimeType === 'application/vnd.google-apps.document') return 'google-doc';
  if (mimeType === 'application/vnd.google-apps.presentation')
    return 'google-slides';
  if (mimeType === 'application/vnd.google-apps.form') return 'google-form';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  // Spreadsheets, folders, and anything else fall back to generic link.
  return 'link';
}

/** Convert a PickerDocument into our Resource shape (minus id/sortOrder). */
export function pickerDocToResource(
  doc: PickerDocument
): Omit<Resource, 'id' | 'sortOrder'> {
  return {
    title: doc.name || 'Untitled',
    url: doc.url,
    type: mimeTypeToResourceType(doc.mimeType || ''),
  };
}

export interface OpenDrivePickerOptions {
  accessToken: string;
  apiKey: string;
  /** Called with picked documents. Empty array on cancel. */
  onPicked: (docs: PickerDocument[]) => void;
  title?: string;
}

/**
 * Builds and shows a Drive Picker. Includes common classroom-relevant views:
 * Docs / Slides / Sheets / PDFs / Images. Uses drive.file scope, so only files
 * the user explicitly picks become accessible to the app.
 */
export async function openDrivePicker(
  opts: OpenDrivePickerOptions
): Promise<void> {
  const picker = await loadPicker();

  const docsView = new picker.DocsView(picker.ViewId.DOCS)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(false)
    .setMimeTypes(
      [
        'application/vnd.google-apps.document',
        'application/vnd.google-apps.presentation',
        'application/vnd.google-apps.spreadsheet',
        'application/vnd.google-apps.form',
        'application/pdf',
      ].join(',')
    );

  const pdfView = new picker.DocsView(picker.ViewId.PDFS);
  const imagesView = new picker.DocsView(picker.ViewId.DOCS_IMAGES);

  const builder = new picker.PickerBuilder()
    .addView(docsView)
    .addView(pdfView)
    .addView(imagesView)
    .enableFeature(picker.Feature.MULTISELECT_ENABLED)
    .setOAuthToken(opts.accessToken)
    .setDeveloperKey(opts.apiKey)
    .setTitle(opts.title ?? 'Add from Google Drive')
    .setCallback((data) => {
      const action = (data as { action?: string }).action;
      if (action === picker.Action.PICKED) {
        const docs = (data as { docs?: PickerDocument[] }).docs ?? [];
        opts.onPicked(docs);
      } else if (action === picker.Action.CANCEL) {
        opts.onPicked([]);
      }
    });

  builder.build().setVisible(true);
}
