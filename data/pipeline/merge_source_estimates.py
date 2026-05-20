"""Combine gf_imr and bilat_mig CSVs into a single intermediate JSON.

Groups every raw estimate by (year, origin, destination) so the next
step can pick a final value and compute reliability.
"""

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path


BILAT_METHOD_COLS = [
    "sd_drop_neg", "sd_rev_neg", "mig_rate",
    "da_min_open", "da_min_closed", "da_pb_closed",
]


def to_float(x):
    if x is None or not str(x).strip():
        return None
    try:
        return float(x)
    except ValueError:
        return None


def empty_flow():
    return {"old_values": [], "new_values": {}}


def ingest_gf_imr(path, flows):
    """Read gf_imr.csv and append every sex='b' row to flows[year][orig][dest]['old_values']."""
    kept = 0
    skipped_non_b = 0

    with open(path, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            if (row.get("sex") or "").strip().lower() != "b":
                skipped_non_b += 1
                continue

            year = (row.get("year0") or "").strip()
            orig = (row.get("orig") or "").strip().upper()
            dest = (row.get("dest") or "").strip().upper()
            if not (year and orig and dest):
                continue

            flows[year][orig][dest]["old_values"].append({
                "stock":     (row.get("stock") or "").strip(),
                "demo":      (row.get("demo") or "").strip(),
                "interval":  (row.get("interval") or "").strip(),
                "sex":       "b",
                "orig_code": (row.get("orig_code") or "").strip(),
                "dest_code": (row.get("dest_code") or "").strip(),
                "flow":      to_float(row.get("flow")),
            })
            kept += 1

    return {"kept": kept, "skipped_non_b": skipped_non_b}


def ingest_bilat_mig(path, flows):
    """Read bilat_mig.csv and store each method column under flows[year][orig][dest]['new_values']."""
    kept = 0
    with open(path, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            year = (row.get("year0") or "").strip()
            orig = (row.get("orig") or "").strip().upper()
            dest = (row.get("dest") or "").strip().upper()
            if not (year and orig and dest):
                continue

            entry = flows[year][orig][dest]["new_values"]
            for col in BILAT_METHOD_COLS:
                entry[col] = to_float(row.get(col))
            kept += 1
    return {"kept": kept}


def freeze(flows):
    # convert nested defaultdicts to plain dicts so json.dump is clean
    return {year: {o: dict(om) for o, om in ym.items()} for year, ym in flows.items()}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--gf-imr", required=True)
    ap.add_argument("--bilat-mig", required=True)
    ap.add_argument("--output", required=True)
    args = ap.parse_args()

    gf_path    = Path(args.gf_imr)
    bilat_path = Path(args.bilat_mig)
    out_path   = Path(args.output)

    if not gf_path.exists():
        raise FileNotFoundError(f"gf_imr file not found: {gf_path}")
    if not bilat_path.exists():
        raise FileNotFoundError(f"bilat_mig file not found: {bilat_path}")

    flows = defaultdict(lambda: defaultdict(lambda: defaultdict(empty_flow)))

    gf_stats    = ingest_gf_imr(gf_path, flows)
    bilat_stats = ingest_bilat_mig(bilat_path, flows)

    payload = {
        "meta": {
            "gf_imr_source": str(gf_path),
            "bilat_mig_source": str(bilat_path),
            "gf_imr_filter": {"sex": "b"},
            "new_value_columns": BILAT_METHOD_COLS,
            "stats": {"gf_imr": gf_stats, "bilat_mig": bilat_stats},
        },
        "flows": freeze(flows),
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"[OK] wrote {out_path}")


if __name__ == "__main__":
    main()