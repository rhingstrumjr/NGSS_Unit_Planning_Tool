"""
Re-downloads PDFs for entries missing SEP values and fixes the SEP extraction
by normalizing whitespace before searching.
"""
import json, sys, io, urllib.request, re, time
sys.stdout.reconfigure(encoding="utf-8")
from pypdf import PdfReader

with open("scripts/ngss-evidence-data.json", encoding="utf-8") as f:
    data = json.load(f)

SEP_NAMES = [
    "Asking Questions and Defining Problems",
    "Developing and Using Models",
    "Planning and Carrying Out Investigations",
    "Analyzing and Interpreting Data",
    "Using Mathematics and Computational Thinking",
    "Constructing Explanations and Designing Solutions",
    "Engaging in Argument from Evidence",
    "Obtaining, Evaluating, and Communicating Information",
]

CCC_NAMES = [
    "Patterns",
    "Cause and Effect",
    "Scale, Proportion, and Quantity",
    "Systems and System Models",
    "Energy and Matter",
    "Structure and Function",
    "Stability and Change",
]

BASE_URL = (
    "https://www.nextgenscience.org/sites/default/files/evidence_statement/black_white/"
    "{code}%20Evidence%20Statements%20June%202015%20asterisks.pdf"
)
ALT_URL = (
    "https://www.nextgenscience.org/sites/default/files/evidence_statement/black_white/"
    "{code}%20Evidence%20Statements%20Jan%202015.pdf"
)


def normalize(text):
    """Collapse all whitespace to single spaces."""
    return re.sub(r"\s+", " ", text)


def find_sep(normalized_text):
    for sep in SEP_NAMES:
        if sep.lower() in normalized_text.lower():
            return sep
    return ""


def find_ccc(normalized_text):
    # Look for CCC as a section header (preceded/followed by newline or space)
    for ccc in CCC_NAMES:
        if re.search(rf"(?<!\w){re.escape(ccc)}(?!\w)", normalized_text, re.IGNORECASE):
            return ccc
    return ""


def fetch_pdf(code):
    for url_tmpl in [BASE_URL, ALT_URL]:
        url = url_tmpl.format(code=code)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                b = resp.read()
                if len(b) > 10000:
                    return b
        except Exception:
            pass
    return None


missing_sep = [e for e in data if not e.get("sep")]
print(f"Entries missing SEP: {len(missing_sep)}")

for e in missing_sep:
    code = e["code"]
    print(f"  {code} ...", end="", flush=True)
    pdf_bytes = fetch_pdf(code)
    if not pdf_bytes:
        print(" no PDF")
        continue
    reader = PdfReader(io.BytesIO(pdf_bytes))
    full_text = ""
    for page in reader.pages:
        full_text += (page.extract_text() or "") + "\n"
    norm = normalize(full_text)
    sep = find_sep(norm)
    ccc = find_ccc(norm) if not e.get("ccc") else e["ccc"]
    e["sep"] = sep
    if not e.get("ccc"):
        e["ccc"] = ccc
    print(f" sep={sep or '???'}, ccc={ccc or e.get('ccc','???')}")
    time.sleep(0.6)

still_missing = [e for e in data if not e.get("sep")]
print(f"\nStill missing SEP after fix: {len(still_missing)}")
for e in still_missing:
    print(f"  {e['code']}")

with open("scripts/ngss-evidence-data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Saved updated data.")
