"""

Build chartData JSON from World Bank + UN WPP CSVs.

This script takes the raw csv files and outputs annual and 5-year interval values.

All these values are put into dataset/chartData.json and intermediate/chartData_5yr.json accordingly
"""

import argparse
import csv
import json
from pathlib import Path


#(label, filename, format) — wdi is wide-format World Bank, long is one-row-per-year
#median age is taken from UN WPP, so it has a different structure
INDICATORS = [
    ("netMigration", "net_migration.csv", "wdi"),
    ("urbanization", "urbanization.csv",  "wdi"),
    ("unemployment", "unemployment.csv",  "wdi"),
    ("population",   "population.csv",    "wdi"),
    ("medianAge",    "median_age.csv",    "long"),
]

#parsing a CSV cell as a float and returning None for empty or non-numeric values
def parse_number(text):
    if text is None or not text.strip():
        return None
    try:
        return float(text)
    except ValueError:
        return None

#Loading a wide-format World Bank CSV file with format country_code: {year: value}
def load_wdi(path):
    out = {}
    rows = list(csv.reader(open(path, encoding="utf-8-sig")))

    # WB CSVs have a few rows before the header that are not used
    header_idx = next(i for i, r in enumerate(rows) if r and r[0].strip() == "Country Name")
    header = rows[header_idx]
    code_idx = header.index("Country Code")
    year_cols = [(c, i) for i, c in enumerate(header) if c.isdigit()]

    for row in rows[header_idx + 1:]:
        if len(row) <= code_idx:
            continue
        code = row[code_idx].strip().upper()
        if len(code) != 3:
            continue
        values = {}
        for year, idx in year_cols:
            if idx < len(row):
                v = parse_number(row[idx])
                if v is not None:
                    values[year] = v
        if values:
            out[code] = values
    return out

#Loading a long-format CSV (Entity, Code, Year, value) into country_code: {year: value}
def load_long(path):
    out = {}
    with open(path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        value_cols = [c for c in reader.fieldnames if c not in ("Entity", "Code", "Year")]

        for row in reader:
            code = (row.get("Code") or "").strip().upper()
            year = (row.get("Year") or "").strip()
            if len(code) != 3 or not year.isdigit():
                continue
            # trying value columns in order and taking the first non-empty
            value = None
            for col in value_cols:
                value = parse_number(row.get(col))
                if value is not None:
                    break
            if value is not None:
                out.setdefault(code, {})[year] = value
    return out

#Rounding a value based on indicator type (millions, thousands)
def round_value(indicator, v):
    if indicator in ("netMigration", "population"):
        return int(round(v))
    return round(v, 1)

#Combine all indicators into the per-country output structure, filtered by year
def merge(indicators, allowed_years):
    out = {}
    all_codes = set().union(*(d.keys() for d in indicators.values()))
    for code in sorted(all_codes):
        block = {}
        for name, data in indicators.items():
            values = {y: round_value(name, v) for y, v in data.get(code, {}).items() if y in allowed_years}
            if values:
                block[name] = values
        if block:
            out[code] = block
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input-dir", default=".")
    ap.add_argument("--out-annual", default="chartData_annual.json")
    ap.add_argument("--out-5yr",    default="chartData_5yr.json")
    ap.add_argument("--start-year", type=int, default=1960)
    ap.add_argument("--end-year",   type=int, default=2010)
    args = ap.parse_args()

    indir = Path(args.input_dir)

    indicators = {}
    for label, fname, fmt in INDICATORS:
        path = indir / fname
        if not path.exists():
            raise FileNotFoundError(f"Required input not found: {path}. Place the raw CSV in {indir}.")
        loader = load_wdi if fmt == "wdi" else load_long
        indicators[label] = loader(path)
        print(f"[OK] loaded {label}: {len(indicators[label])} countries from {fname}")

    years_all = {str(y) for y in range(args.start_year, args.end_year + 1)}
    years_5yr = {y for y in years_all if int(y) % 5 == 0}

    annual = merge(indicators, years_all)
    five   = merge(indicators, years_5yr)

    Path(args.out_annual).write_text(json.dumps(annual, ensure_ascii=False, indent=2), encoding="utf-8")
    Path(args.out_5yr).write_text(json.dumps(five, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n[OK] wrote {args.out_annual}: {len(annual)} countries")
    print(f"[OK] wrote {args.out_5yr}:    {len(five)} countries")


if __name__ == "__main__":
    main()