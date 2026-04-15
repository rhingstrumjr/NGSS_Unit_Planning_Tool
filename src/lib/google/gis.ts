/**
 * Shared helpers for Google Identity Services (GIS) + Google API client scripts.
 * Used by the Docs exporter and the Drive Picker.
 */

export const GOOGLE_CLIENT_ID =
  '956010149319-dudbpb2hinpo97tq30fgq5bt463de012.apps.googleusercontent.com';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GAPI_SCRIPT_URL = 'https://apis.google.com/js/api.js';

// Minimal types for what we use off of window.google / window.gapi
interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }) => TokenClient;
        };
      };
      // Picker is loaded on demand via gapi.load('picker')
      picker?: GooglePickerNamespace;
    };
    gapi?: {
      load: (lib: string, cb: () => void) => void;
    };
  }
}

/**
 * Minimal shape of the google.picker namespace we interact with.
 * The full types aren't published by Google; we declare just what we use.
 */
export interface GooglePickerNamespace {
  PickerBuilder: new () => GooglePickerBuilder;
  DocsView: new (viewId?: unknown) => GooglePickerDocsView;
  ViewId: {
    DOCS: unknown;
    DOCS_IMAGES: unknown;
    PDFS: unknown;
    FOLDERS: unknown;
  };
  Feature: {
    MULTISELECT_ENABLED: unknown;
    NAV_HIDDEN: unknown;
  };
  Action: {
    PICKED: string;
    CANCEL: string;
  };
  Response: {
    ACTION: string;
    DOCUMENTS: string;
  };
  Document: {
    ID: string;
    NAME: string;
    URL: string;
    MIME_TYPE: string;
  };
}

export interface GooglePickerDocsView {
  setIncludeFolders: (v: boolean) => GooglePickerDocsView;
  setSelectFolderEnabled: (v: boolean) => GooglePickerDocsView;
  setMimeTypes: (mimeTypes: string) => GooglePickerDocsView;
  setMode: (mode: unknown) => GooglePickerDocsView;
  setOwnedByMe: (v: boolean) => GooglePickerDocsView;
}

export interface GooglePickerBuilder {
  addView: (view: GooglePickerDocsView | unknown) => GooglePickerBuilder;
  enableFeature: (feature: unknown) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setAppId: (id: string) => GooglePickerBuilder;
  setCallback: (cb: (data: PickerResponse) => void) => GooglePickerBuilder;
  setTitle: (title: string) => GooglePickerBuilder;
  build: () => { setVisible: (v: boolean) => void };
}

export interface PickerResponse {
  [key: string]: unknown;
  action?: string;
  docs?: PickerDocument[];
}

export interface PickerDocument {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  [key: string]: unknown;
}

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`
    );
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return;
  await loadScriptOnce(GIS_SCRIPT_URL);
}

export async function loadGapiScript(): Promise<void> {
  if (window.gapi) return;
  await loadScriptOnce(GAPI_SCRIPT_URL);
}

/**
 * Request a Drive access token via GIS. Returns the token or rejects.
 * Re-initializes the token client each call so the callback captures fresh closure.
 */
export async function requestDriveAccessToken(): Promise<string> {
  await loadGisScript();
  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error ?? 'Google sign-in was cancelled.'));
          return;
        }
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken();
  });
}
