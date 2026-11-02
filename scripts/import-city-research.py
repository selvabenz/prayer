"""Read a supplied research workbook without executing formulas or changing it.

Usage: python scripts/import-city-research.py path/to/workbook.xlsx
Requires openpyxl for extraction only; the app has no Python dependency.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

import openpyxl


def records(book, name):
    rows = list(book[name].values)
    header = rows[0]
    return [dict(zip(header, row)) | {"sourceSheet": name, "sourceRow": i}
            for i, row in enumerate(rows[1:], 2) if any(v is not None for v in row)]


def extract(source):
    book = openpyxl.load_workbook(source, read_only=True, data_only=True)
    catalogue = records(book, "CITY CATALOGUE")
    cities = []
    for row in catalogue:
        cities.append({
            "id": re.sub(r"[^a-z0-9]+", "-", row["City"].lower()).strip("-"),
            "name": row["City"], "state": row["State / UT"],
            "country": "India", "reviewStatus": "research-starter",
            "catalogue": row,
        })
    if len(cities) != 42 or len({c['id'] for c in cities}) != len(cities):
        raise ValueError("Expected 42 uniquely identified city records")
    return {
        "schemaVersion": 1, "asOf": "2026-11-02",
        "workbook": source.name, "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "status": "Research starter; local source and community review required",
        "cities": cities,
        "sources": records(book, "SOURCE REGISTER"),
        "delhi": {
            "indicators": records(book, "DELHI INDICATORS"),
            "prayerGuide": records(book, "DELHI PRAYER GUIDE"),
            "socialSafety": records(book, "DELHI SOCIAL SAFETY"),
            "religions": records(book, "DELHI RELIGIONS"),
            "languages": records(book, "DELHI LANGUAGES"),
            "labour": records(book, "BONDED LABOUR NOTES"),
        },
        "faithAndPeople": records(book, "CITY FAITH & PEOPLE"),
    }


if __name__ == "__main__":
    source = Path(sys.argv[1])
    output = Path(__file__).resolve().parents[1] / "src" / "research" / "india-2026.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    data = extract(source)
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2, default=str) + "\n", encoding="utf-8")
    print(json.dumps({"cities": len(data['cities']), "sources": len(data['sources']),
                      "output": str(output), "sourceSha256": data['sha256']}))
