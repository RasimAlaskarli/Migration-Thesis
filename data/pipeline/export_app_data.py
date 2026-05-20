"""Reshape definitive_flows.json into the country-centric format the app expects.

Writes two files: one with 5-year aggregation, one with 10-year.
"""

import argparse
import json
from pathlib import Path


def add_flow(period, orig, dest, value):
    """Mutate period dict so that orig outflows and dest inflows are updated."""
    if orig not in period:
        period[orig] = {"ti": 0, "ai": {}, "to": 0, "ao": {}}
    if dest not in period:
        period[dest] = {"ti": 0, "ai": {}, "to": 0, "ao": {}}

    period[orig]["to"] += value
    period[orig]["ao"][dest] = period[orig]["ao"].get(dest, 0) + value

    period[dest]["ti"] += value
    period[dest]["ai"][orig] = period[dest]["ai"].get(orig, 0) + value


def drop_empty(period):
    out = {}
    for code, rec in period.items():
        ai = {k: v for k, v in rec["ai"].items() if v}
        ao = {k: v for k, v in rec["ao"].items() if v}
        if rec["ti"] or rec["to"] or ai or ao:
            out[code] = {"ti": rec["ti"], "ai": ai, "to": rec["to"], "ao": ao}
    return out


def build(payload, years, include_zeros=False):
    flows = payload.get("flows", {})
    app = {
        "_confidence": {},
        "_meta": {"dataset_kind": "definitive_median_iqr"},
    }

    for year in sorted(years, key=int):
        year_map = flows.get(year, {})
        period = {}
        confidence = {}

        for orig, orig_map in year_map.items():
            for dest, result in orig_map.items():
                raw = result.get("final_value", 0) or 0
                value = int(float(raw))   # floor — can't migrate half a person

                if value <= 0:
                    continue

                label = result.get("confidence")
                if label is not None:
                    confidence[f"{orig}-{dest}"] = label

                add_flow(period, orig, dest, value)

        app["_confidence"][year] = confidence
        app[year] = period if include_zeros else drop_empty(period)

    return app


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--out-5yr", required=True)
    ap.add_argument("--out-10yr", required=True)
    ap.add_argument("--include-zero-countries", action="store_true")
    args = ap.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise FileNotFoundError(f"Input not found: {input_path}")

    payload = json.loads(input_path.read_text(encoding="utf-8"))

    # 2010 is out of scope for the thesis
    years = {str(y) for y in payload.get("flows", {}).keys() if str(y).isdigit() and int(y) < 2010}
    y5  = {y for y in years if int(y) % 5  == 0}
    y10 = {y for y in years if int(y) % 10 == 0}

    out_5  = build(payload, y5,  args.include_zero_countries)
    out_10 = build(payload, y10, args.include_zero_countries)

    out5_path  = Path(args.out_5yr)
    out10_path = Path(args.out_10yr)
    out5_path.parent.mkdir(parents=True, exist_ok=True)
    out10_path.parent.mkdir(parents=True, exist_ok=True)

    out5_path.write_text(json.dumps(out_5,  ensure_ascii=False, indent=2), encoding="utf-8")
    out10_path.write_text(json.dumps(out_10, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[OK] wrote {out5_path}")
    print(f"[OK] wrote {out10_path}")


if __name__ == "__main__":
    main()