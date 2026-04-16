import type { ResourceType } from './types';

// Match http(s) URLs. Excludes whitespace and common quote/angle-bracket chars.
const URL_RE = /(https?:\/\/[^\s<>"'`]+)/gi;

/**
 * Extract all http(s) URLs from a blob of text (paste buffer, multi-line, etc.).
 * Trailing punctuation commonly adjacent to URLs (periods, commas, closing parens)
 * is trimmed so "see https://foo.com/bar." yields "https://foo.com/bar".
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  const matches = text.match(URL_RE) ?? [];
  const cleaned = matches
    .map((u) => u.replace(/[.,;:!?)\]]+$/, ''))
    .filter((u) => u.length > 0);
  // De-duplicate while preserving order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of cleaned) {
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

/** True iff the entire input (trimmed) is a single URL. */
export function isSingleUrl(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const urls = extractUrls(trimmed);
  return urls.length === 1 && urls[0] === trimmed;
}

export function inferResourceType(url: string): ResourceType {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const path = u.pathname.toLowerCase();
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') return 'youtube';
    if (host === 'docs.google.com') {
      if (path.startsWith('/presentation')) return 'google-slides';
      if (path.startsWith('/forms')) return 'google-form';
      return 'google-doc'; // document, spreadsheets, or generic docs path
    }
    if (host === 'drive.google.com' || host === 'slides.google.com') return 'google-slides';
    if (path.endsWith('.pdf')) return 'pdf';
    if (/\.(png|jpe?g|gif|webp|svg)$/i.test(path)) return 'image';
    return 'link';
  } catch {
    return 'link';
  }
}

/**
 * Derive a human-readable title from a URL using hostname/path heuristics.
 * Never performs network requests — safe to call in render paths.
 */
export function inferResourceTitle(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const path = u.pathname;
    const lowerPath = path.toLowerCase();

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') return 'YouTube video';
    if (host === 'docs.google.com') {
      if (lowerPath.startsWith('/document')) return 'Google Doc';
      if (lowerPath.startsWith('/spreadsheets')) return 'Google Sheet';
      if (lowerPath.startsWith('/presentation')) return 'Google Slides';
      if (lowerPath.startsWith('/forms')) return 'Google Form';
      return 'Google Drive file';
    }
    if (host === 'drive.google.com') return 'Google Drive file';
    if (host === 'phet.colorado.edu') return 'PhET Simulation';
    if (host === 'pbslearningmedia.org') return 'PBS Learning Media';
    if (host === 'newsela.com') return 'Newsela article';
    if (host === 'ck12.org') return 'CK-12 resource';

    // Fall back to the last path segment, prettified.
    const last = path.split('/').filter(Boolean).pop();
    if (last) {
      const pretty = decodeURIComponent(last)
        .replace(/\.[a-z0-9]+$/i, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      if (pretty.length > 0 && pretty.length <= 80) {
        return pretty.charAt(0).toUpperCase() + pretty.slice(1);
      }
    }
    return host;
  } catch {
    return url;
  }
}
