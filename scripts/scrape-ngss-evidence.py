"""
Downloads NGSS Evidence Statement PDFs for each PE code and parses them.
Outputs a complete ngss-standards.ts file.

Requires: pypdf (pip install pypdf)
Run after discover-pe-codes.py has produced scripts/pe-codes.json
"""

import urllib.request
import json
import re
import time
import io
import sys

try:
    from pypdf import PdfReader
except ImportError:
    print("ERROR: pypdf not installed. Run: pip install pypdf")
    sys.exit(1)

BASE_PDF_URL = (
    "https://www.nextgenscience.org/sites/default/files/evidence_statement/black_white/"
    "{code}%20Evidence%20Statements%20June%202015%20asterisks.pdf"
)

# Alternative URL patterns to try if the primary one fails
ALT_PDF_URLS = [
    "https://www.nextgenscience.org/sites/default/files/evidence_statement/black_white/"
    "{code}%20Evidence%20Statements%20Jan%202015.pdf",
    "https://www.nextgenscience.org/sites/default/files/evidence_statement/black_white/"
    "{code}_Evidence%20Statements%20June%202015%20asterisks.pdf",
]

# Determine domain from PE code
def get_domain(code):
    if "-PS" in code:
        return "PS"
    elif "-LS" in code:
        return "LS"
    elif "-ESS" in code:
        return "ESS"
    elif "-ETS" in code:
        return "ETS"
    return "PS"

def get_grade_band(code):
    return "HS" if code.startswith("HS-") else "MS"


def download_pdf(code):
    """Try to download evidence statement PDF, returning bytes or None."""
    urls = [BASE_PDF_URL.format(code=code)] + [u.format(code=code) for u in ALT_PDF_URLS]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = resp.read()
                if len(data) > 10000:  # sanity check — real PDFs are large
                    return data, url
        except Exception:
            continue
    return None, None


def clean_text(text):
    """Remove bullet-point characters and normalize whitespace."""
    if not text:
        return ""
    # Remove common PDF bullet chars
    text = text.replace("\uf0b7", "").replace("\u2022", "")
    # Collapse multiple spaces/newlines
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_evidence_pdf(pdf_bytes, code):
    """Parse a PDF and return a dict with all extracted fields."""
    reader = PdfReader(io.BytesIO(pdf_bytes))

    full_text = ""
    for page in reader.pages:
        t = page.extract_text() or ""
        full_text += t + "\n"

    result = {
        "code": code,
        "title": "",
        "gradeBand": get_grade_band(code),
        "domain": get_domain(code),
        "dci": "",
        "sep": "",
        "ccc": "",
        "clarification": "",
        "boundary": "",
        "observableFeatures": "",
    }

    # --- Extract full PE title ---
    # Pattern: "CODE. <title text> [Clarification" or just end of line
    title_match = re.search(
        rf"{re.escape(code)}\.\s+(.+?)(?:\[Clarification|\[Assessment Boundary|$)",
        full_text,
        re.IGNORECASE | re.DOTALL
    )
    if title_match:
        result["title"] = clean_text(title_match.group(1))

    # --- Extract Clarification Statement ---
    clar_match = re.search(
        r"\[Clarification Statement:\s*(.+?)\]",
        full_text,
        re.IGNORECASE | re.DOTALL
    )
    if clar_match:
        result["clarification"] = clean_text(clar_match.group(1))

    # --- Extract Assessment Boundary ---
    boundary_match = re.search(
        r"\[Assessment Boundary:\s*(.+?)\]",
        full_text,
        re.IGNORECASE | re.DOTALL
    )
    if boundary_match:
        result["boundary"] = clean_text(boundary_match.group(1))

    # --- Extract DCI code (e.g., PS1.A, LS2.B, ESS3.D) ---
    dci_match = re.search(
        r"((?:PS|LS|ESS|ETS)\d+\.[A-Z]):",
        full_text
    )
    if dci_match:
        result["dci"] = dci_match.group(1)

    # --- Extract primary SEP name ---
    # The SEP section header appears before the bullet explaining it
    sep_sections = [
        "Asking Questions and Defining Problems",
        "Developing and Using Models",
        "Planning and Carrying Out Investigations",
        "Analyzing and Interpreting Data",
        "Using Mathematics and Computational Thinking",
        "Constructing Explanations and Designing Solutions",
        "Engaging in Argument from Evidence",
        "Obtaining, Evaluating, and Communicating Information",
    ]
    for sep in sep_sections:
        if sep.lower() in full_text.lower():
            result["sep"] = sep
            break

    # --- Extract primary CCC name ---
    ccc_sections = [
        "Patterns",
        "Cause and Effect",
        "Scale, Proportion, and Quantity",
        "Systems and System Models",
        "Energy and Matter",
        "Structure and Function",
        "Stability and Change",
    ]
    # Find first CCC that appears as a section header (on its own line-ish)
    for ccc in ccc_sections:
        if re.search(rf"(?:^|\n){re.escape(ccc)}\s*(?:\n|$)", full_text, re.MULTILINE | re.IGNORECASE):
            result["ccc"] = ccc
            break
    # Fallback: any occurrence
    if not result["ccc"]:
        for ccc in ccc_sections:
            if ccc.lower() in full_text.lower():
                result["ccc"] = ccc
                break

    # --- Extract Observable Features ---
    obs_match = re.search(
        r"Observable features of the student performance[^\n]*\n(.+?)(?:\n\s*\n\s*(?:June|Page|\Z))",
        full_text,
        re.IGNORECASE | re.DOTALL
    )
    if obs_match:
        result["observableFeatures"] = clean_text(obs_match.group(1))
    else:
        # Simpler fallback: everything after the observable features header
        obs_match2 = re.search(
            r"Observable features of the student performance[^\n]*\n(.+)",
            full_text,
            re.IGNORECASE | re.DOTALL
        )
        if obs_match2:
            result["observableFeatures"] = clean_text(obs_match2.group(1))

    return result


def escape_ts_string(s):
    """Escape a string for TypeScript template literal or single-quoted string."""
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def format_ts_entry(entry):
    """Format a single NgssStandard entry as TypeScript object literal."""
    lines = [
        "  {",
        f"    code: '{entry['code']}',",
        f"    title: `{escape_ts_string(entry['title'])}`,",
        f"    gradeBand: '{entry['gradeBand']}',",
        f"    domain: '{entry['domain']}',",
        f"    dci: '{entry['dci']}',",
        f"    sep: '{entry['sep']}',",
        f"    ccc: '{entry['ccc']}',",
    ]
    if entry.get("clarification"):
        lines.append(f"    clarification: `{escape_ts_string(entry['clarification'])}`,")
    if entry.get("boundary"):
        lines.append(f"    boundary: `{escape_ts_string(entry['boundary'])}`,")
    if entry.get("observableFeatures"):
        lines.append(f"    observableFeatures: `{escape_ts_string(entry['observableFeatures'])}`,")
    lines.append("  },")
    return "\n".join(lines)


def main():
    # Load PE codes
    try:
        with open("scripts/pe-codes.json") as f:
            pe_data = json.load(f)
    except FileNotFoundError:
        print("ERROR: scripts/pe-codes.json not found. Run discover-pe-codes.py first.")
        sys.exit(1)

    all_codes = pe_data["all"]
    print(f"Processing {len(all_codes)} PE codes...")

    entries = []
    failed = []

    for i, code in enumerate(all_codes):
        print(f"[{i+1}/{len(all_codes)}] {code} ", end="", flush=True)
        pdf_bytes, url = download_pdf(code)
        if not pdf_bytes:
            print("FAILED (no PDF found)")
            failed.append(code)
            # Add a minimal entry so the code isn't lost
            entries.append({
                "code": code,
                "title": f"(See nextgenscience.org for {code})",
                "gradeBand": get_grade_band(code),
                "domain": get_domain(code),
                "dci": "",
                "sep": "",
                "ccc": "",
            })
        else:
            try:
                entry = parse_evidence_pdf(pdf_bytes, code)
                entries.append(entry)
                print(f"OK — {entry['title'][:60]}...")
            except Exception as e:
                print(f"PARSE ERROR: {e}")
                failed.append(code)
        time.sleep(0.8)

    # Save raw JSON for debugging
    with open("scripts/ngss-evidence-data.json", "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)
    print(f"\nSaved raw data to scripts/ngss-evidence-data.json")

    # Generate TypeScript file
    ts_header = '''\
/**
 * Complete NGSS Performance Expectations with Evidence Statement data.
 * Generated by scripts/scrape-ngss-evidence.py from official NGSS Evidence Statements.
 * Source: https://www.nextgenscience.org/evidence-statements
 */

export interface NgssStandard {
  code: string;
  title: string;
  gradeBand: \'MS\' | \'HS\';
  domain: \'PS\' | \'LS\' | \'ESS\' | \'ETS\';
  dci: string;
  sep: string;
  ccc: string;
  /** Clarification statement from NGSS Evidence Statements */
  clarification?: string;
  /** Assessment boundary from NGSS Evidence Statements */
  boundary?: string;
  /** Observable features of student performance from NGSS Evidence Statements */
  observableFeatures?: string;
}

export const NGSS_STANDARDS: NgssStandard[] = [
'''

    ts_body = "\n".join(format_ts_entry(e) for e in entries)
    ts_footer = "\n];\n"

    ts_content = ts_header + ts_body + ts_footer

    with open("src/lib/ngss-standards.ts", "w", encoding="utf-8") as f:
        f.write(ts_content)

    print(f"Generated src/lib/ngss-standards.ts with {len(entries)} standards")
    if failed:
        print(f"\nFailed codes ({len(failed)}): {', '.join(failed)}")


if __name__ == "__main__":
    main()
