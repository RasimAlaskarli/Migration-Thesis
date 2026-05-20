"""Pick a final value and reliability label for each (year, orig, dest) flow.

Drops estimates below `threshold`, then reports the median of the rest
with a label based on IQR/median.
"""

import argparse
import json
import math


CONFIDENCE_RULE = {
    "high_confidence":      "IQR/median < 0.75",
    "moderate_confidence":  "0.75 <= IQR/median < 1.5",
    "low_confidence":       "IQR/median >= 1.5",
    "insufficient_evidence": "fewer than 2 retained values",
}

#Computing the median of the list
def median_sorted(vals):
    n = len(vals)
    if n == 0:
        return None
    mid = n // 2
    return vals[mid] if n % 2 else (vals[mid - 1] + vals[mid]) / 2

#Finding Q1, median and Q3
def quartiles(vals):
    """Q1, median, Q3 using 'median of halves' (the same method numpy calls 'lower')."""
    vals = sorted(vals)
    n = len(vals)
    if n == 0:
        return None, None, None
    if n == 1:
        return vals[0], vals[0], vals[0]

    med = median_sorted(vals)
    mid = n // 2
    lower = vals[:mid]
    upper = vals[mid:] if n % 2 == 0 else vals[mid + 1:]

    q1 = median_sorted(lower) if lower else vals[0]
    q3 = median_sorted(upper) if upper else vals[-1]
    return q1, med, q3


#Finding the reliability metric from the retained value
def label_for(ratio, n_retained):
    if n_retained < 2:
        return "insufficient_evidence"
    if ratio < 0.75:
        return "high_confidence"
    if ratio < 1.5:
        return "moderate_confidence"
    return "low_confidence"


#Converting a value into float
def to_float(x):
    try:
        return float(x) if x is not None else None
    except (TypeError, ValueError):
        return None


#Collecting all estimates of a flow that meets the threshold
def retained(entry, threshold):
    out = []
    for item in entry.get("old_values", []):
        v = to_float(item.get("flow") if isinstance(item, dict) else item)
        if v is not None and v >= threshold:
            out.append(v)
    for v in (entry.get("new_values") or {}).values():
        v = to_float(v)
        if v is not None and v >= threshold:
            out.append(v)
    return sorted(out)


#Producing the final value and reliability per flow
def finalize(year, orig, dest, entry, threshold):
    vals = retained(entry, threshold)

    result = {
        "year": str(year),
        "orig": orig,
        "dest": dest,
        "threshold": threshold,
        "retained_count": len(vals),
        "retained_values": vals,
    }

    if not vals:
        result.update({
            "final_value": 0, "q1": None, "median": None, "q3": None,
            "iqr": None, "ratio": None, "confidence": "insufficient_evidence",
        })
        return result

    q1, med, q3 = quartiles(vals)
    iqr = q3 - q1 if q1 is not None and q3 is not None else None
    ratio = (iqr / med) if (iqr is not None and med) else None
    label = label_for(ratio if ratio is not None else math.inf, len(vals))

    result.update({
        "final_value": med or 0,
        "q1": q1, "median": med, "q3": q3,
        "iqr": iqr, "ratio": ratio,
        "confidence": label,
    })
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--threshold", type=float, default=100.0)
    args = ap.parse_args()

    data = json.load(open(args.input, encoding="utf-8"))
    flows_in = data.get("flows", data)

    out = {
        "_meta": {"threshold": args.threshold, "confidence_rule": CONFIDENCE_RULE},
        "flows": {},
    }
    total = 0

    for year, ym in flows_in.items():
        if str(year).startswith("_") or not isinstance(ym, dict):
            continue
        out["flows"][str(year)] = {}
        for orig, om in ym.items():
            if not isinstance(om, dict):
                continue
            out["flows"][str(year)][orig] = {}
            for dest, entry in om.items():
                if not isinstance(entry, dict):
                    continue
                out["flows"][str(year)][orig][dest] = finalize(year, orig, dest, entry, args.threshold)
                total += 1

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    print(f"[OK] wrote {args.output} ({total} flows)")


if __name__ == "__main__":
    main()