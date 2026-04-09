"""
Fetches all NGSS topic arrangement pages and extracts PE codes.
Outputs a JSON file with all discovered PE codes (HS first, then MS).
"""

import urllib.request
import re
import json
import time

BASE_URL = "https://www.nextgenscience.org"

HS_TOPICS = [
    "/topic-arrangement/hsstructure-and-properties-matter",
    "/topic-arrangement/hschemical-reactions",
    "/topic-arrangement/hsforces-and-interactions",
    "/topic-arrangement/hsenergy",
    "/topic-arrangement/hswaves-and-electromagnetic-radiation",
    "/topic-arrangement/hsstructure-and-function",
    "/topic-arrangement/hsmatter-and-energy-organisms-and-ecosystems",
    "/topic-arrangement/hsinterdependent-relationships-ecosystems",
    "/topic-arrangement/hsinheritance-and-variation-traits",
    "/topic-arrangement/hsnatural-selection-and-evolution",
    "/topic-arrangement/hsspace-systems",
    "/topic-arrangement/hshistory-earth",
    "/topic-arrangement/hsearths-systems",
    "/topic-arrangement/hsweather-and-climate",
    "/topic-arrangement/hshuman-sustainability",
    "/topic-arrangement/hsengineering-design",
]

MS_TOPICS = [
    "/topic-arrangement/msstructure-and-properties-matter",
    "/topic-arrangement/mschemical-reactions",
    "/topic-arrangement/msforces-and-interactions",
    "/topic-arrangement/msenergy",
    "/topic-arrangement/mswaves-and-electromagnetic-radiation",
    "/topic-arrangement/msstructure-function-and-information-processing",
    "/topic-arrangement/msmatter-and-energy-organisms-and-ecosystems",
    "/topic-arrangement/msinterdependent-relationships-ecosystems",
    "/topic-arrangement/msgrowth-development-and-reproduction-organisms",
    "/topic-arrangement/msnatural-selection-and-adaptations",
    "/topic-arrangement/msspace-systems",
    "/topic-arrangement/mshistory-earth",
    "/topic-arrangement/msearths-systems",
    "/topic-arrangement/msweather-and-climate",
    "/topic-arrangement/mshuman-impacts",
    "/topic-arrangement/msengineering-design",
]

# Regex to find PE codes like HS-PS1-1, MS-ESS2-4, HS-ETS1-3
PE_CODE_RE = re.compile(r'\b((?:HS|MS)-(?:PS[1-4]|LS[1-4]|ESS[1-3]|ETS1)-\d+)\b')


def fetch_page(path):
    url = BASE_URL + path
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  ERROR fetching {url}: {e}")
        return ""


def extract_pe_codes(html):
    return list(dict.fromkeys(PE_CODE_RE.findall(html)))  # deduplicated, order preserved


def collect_codes(topics, grade_label):
    all_codes = []
    seen = set()
    for path in topics:
        print(f"Fetching {grade_label}: {path}")
        html = fetch_page(path)
        codes = extract_pe_codes(html)
        for code in codes:
            if code not in seen:
                seen.add(code)
                all_codes.append(code)
        print(f"  Found: {codes}")
        time.sleep(0.5)
    return all_codes


if __name__ == "__main__":
    hs_codes = collect_codes(HS_TOPICS, "HS")
    ms_codes = collect_codes(MS_TOPICS, "MS")

    all_codes = hs_codes + ms_codes
    print(f"\nTotal PE codes found: {len(all_codes)}")
    print(f"  HS: {len(hs_codes)}")
    print(f"  MS: {len(ms_codes)}")

    output = {
        "hs": sorted(hs_codes),
        "ms": sorted(ms_codes),
        "all": all_codes
    }

    with open("scripts/pe-codes.json", "w") as f:
        json.dump(output, f, indent=2)

    print("\nSaved to scripts/pe-codes.json")
