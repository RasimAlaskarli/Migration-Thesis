"""Chapter 4 analysis: regional aggregates, headline numbers, and four figures."""

import argparse
import csv
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.lines import Line2D


WESTERN = {
    "AUT": "Austria", "BEL": "Belgium", "CYP": "Cyprus", "DNK": "Denmark","FIN": "Finland", "FRA": "France", "DEU": "Germany", "GRC": "Greece",
    "ISL": "Iceland", "IRL": "Ireland", "ITA": "Italy", "LIE": "Liechtenstein","LUX": "Luxembourg", "MLT": "Malta", "NLD": "Netherlands", "NOR": "Norway",
    "PRT": "Portugal", "ESP": "Spain", "SWE": "Sweden", "CHE": "Switzerland","GBR": "United Kingdom",
}

EASTERN = {
    "ALB": "Albania", "BIH": "Bosnia and Herzegovina", "BGR": "Bulgaria","HRV": "Croatia", "CZE": "Czech Republic", "EST": "Estonia",
    "HUN": "Hungary", "LVA": "Latvia", "LTU": "Lithuania", "MDA": "Moldova","MNE": "Montenegro", "MKD": "North Macedonia", "POL": "Poland",
    "ROU": "Romania", "SRB": "Serbia", "SVK": "Slovakia", "SVN": "Slovenia",
}

START_YEAR = 1960
END_YEAR = 2010
#Unemployments data starts in 1991 in WB data, so a shorter window is used
UNEMP_START = 1991
UNEMP_END = 2010

COLOR_WEST = "#4878a8"
COLOR_EAST = "#c44e52"
COLOR_TEXT = "#3d3a35"
COLOR_GRID = "#e8e4dc"
COLOR_AXIS = "#8a857a"

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 9,
    "axes.edgecolor": COLOR_AXIS,
    "axes.labelcolor": COLOR_TEXT,
    "axes.titlecolor": COLOR_TEXT,
    "xtick.color": COLOR_AXIS,
    "ytick.color": COLOR_AXIS,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "grid.color": COLOR_GRID,
    "grid.linewidth": 0.5,
})



def cumulative_net_migration(country, start=START_YEAR, end=END_YEAR):
    nm = country.get("netMigration", {})
    vals = [nm[str(y)] for y in range(start, end + 1) if str(y) in nm]
    return sum(vals) if vals else None


#Calculating the difference between the end value and start value
def indicator_change(country, indicator, start=START_YEAR, end=END_YEAR, window=5):
    series = country.get(indicator, {})
    if not series:
        return None

    def find_near(target):
        for offset in range(window + 1):
            for y in (target + offset, target - offset):
                if str(y) in series:
                    return series[str(y)]
        return None

    start_val = find_near(start)
    end_val = find_near(end)
    if start_val is None or end_val is None:
        return None
    return end_val - start_val


#Stricter version of the previous function
def unemployment_change_fixed(country):
    s = country.get("unemployment", {})
    a, b = s.get(str(UNEMP_START)), s.get(str(UNEMP_END))
    if a is None or b is None:
        return None
    return b - a, a, b


#Building per country row used for figures
def build_country_dataset(chart_data):
    rows = []
    for region, codes in [("Western", WESTERN), ("Eastern", EASTERN)]:
        for code, name in codes.items():
            c = chart_data.get(code, {})
            ue = unemployment_change_fixed(c)
            rows.append({
                "code": code,
                "name": name,
                "region": region,
                "cumulative_net_migration": cumulative_net_migration(c),
                "urbanization_change": indicator_change(c, "urbanization"),
                "median_age_change": indicator_change(c, "medianAge"),
                "unemployment_change": ue[0] if ue else None,
                "unemployment_1991":   ue[1] if ue else None,
                "unemployment_2010":   ue[2] if ue else None,
                "urbanization_1960": c.get("urbanization", {}).get(str(START_YEAR)),
                "urbanization_2010": c.get("urbanization", {}).get(str(END_YEAR)),
                "median_age_1960":   c.get("medianAge", {}).get(str(START_YEAR)),
                "median_age_2010":   c.get("medianAge", {}).get(str(END_YEAR)),
                "population_1960":   c.get("population", {}).get(str(START_YEAR)),
                "population_2010":   c.get("population", {}).get(str(END_YEAR)),
            })
    return rows


def write_csv(rows, path):
    if not rows:
        return
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)


def regional_total(rows, region, key):
    return sum(r[key] for r in rows if r["region"] == region and r[key] is not None)


def regional_mean(rows, region, key):
    vals = [r[key] for r in rows if r["region"] == region and r[key] is not None]
    return sum(vals) / len(vals) if vals else None


#Total net migration change
def timeline_phase_total(chart_data, codes, start, end):
    total = 0.0
    for code in codes:
        nm = chart_data.get(code, {}).get("netMigration", {})
        for y in range(start, end + 1):
            v = nm.get(str(y))
            if v is not None:
                total += v
    return total


#Calculating the Pearson's correlation
def correlation(rows, x_key, y_key):
    pairs = [(r[x_key], r[y_key]) for r in rows
             if r[x_key] is not None and r[y_key] is not None]
    if len(pairs) < 3:
        return None
    xs, ys = zip(*pairs)
    return float(np.corrcoef(xs, ys)[0, 1]), len(pairs)


#Returning top n countries (in this case 5)
def top_n_by(rows, key, n=5, reverse=True):
    candidates = [r for r in rows if r[key] is not None]
    return sorted(candidates, key=lambda r: r[key], reverse=reverse)[:n]


# Creating the figure for net migration for both Eastern and Western European countries
def fig_timeline(chart_data, output_path):
    years = list(range(START_YEAR, END_YEAR + 1))

    def regional_annual(codes, year):
        return sum(chart_data.get(c, {}).get("netMigration", {}).get(str(year), 0) for c in codes)

    west = np.cumsum([regional_annual(WESTERN, y) for y in years])
    east = np.cumsum([regional_annual(EASTERN, y) for y in years])

    fig, ax = plt.subplots(figsize=(7, 4))
    ax.plot(years, west / 1e6, color=COLOR_WEST, linewidth=2,
            label=f"Western Europe ({len(WESTERN)} countries)")
    ax.plot(years, east / 1e6, color=COLOR_EAST, linewidth=2,
            label=f"Eastern Europe ({len(EASTERN)} countries)")
    ax.axhline(0, color=COLOR_AXIS, linewidth=0.5, alpha=0.5)

    for year, label in [(1989, "Fall of\ncommunism"), (2004, "EU\nenlargement")]:
        ax.axvline(year, color=COLOR_AXIS, linewidth=0.5, linestyle="--", alpha=0.5)
        ax.text(year, 28, label, fontsize=7, color=COLOR_AXIS, ha="center", va="top")

    ax.set_xlabel("Year")
    ax.set_ylabel("Cumulative net migration since 1960 (millions)")
    ax.legend(loc="upper left", frameon=False, fontsize=8)
    ax.grid(True, alpha=0.4)
    ax.set_xlim(START_YEAR, END_YEAR)

    plt.tight_layout()
    plt.savefig(output_path, bbox_inches="tight")
    plt.close()

# Creating the scatter plot
def fig_scatter(rows, x_key, y_key, x_label, y_label, output_path, x_scale=1.0):
    pairs = [(r[x_key] / x_scale, r[y_key], r["region"], r["code"])
             for r in rows
             if r[x_key] is not None and r[y_key] is not None]
    if len(pairs) < 3:
        print(f"  WARNING: only {len(pairs)} points for {x_key} vs {y_key}, skipping")
        return

    fig, ax = plt.subplots(figsize=(7, 5))

    for x, y, region, code in pairs:
        color = COLOR_WEST if region == "Western" else COLOR_EAST
        ax.scatter(x, y, s=35, color=color, alpha=0.75, edgecolor="white",
                   linewidth=0.5, zorder=3)
        ax.annotate(code, (x, y), xytext=(4, 4), textcoords="offset points",
                    fontsize=6, color=COLOR_TEXT, alpha=0.85)

    # Fit a single regression line across all 38 countries
    xs = np.array([p[0] for p in pairs])
    ys_arr = np.array([p[1] for p in pairs])
    if len(xs) >= 3 and np.std(xs) > 0:
        m, b = np.polyfit(xs, ys_arr, 1)
        x_line = np.linspace(xs.min(), xs.max(), 100)
        ax.plot(x_line, m * x_line + b, color=COLOR_AXIS, linewidth=1,
                linestyle="--", alpha=0.7, zorder=2)
        r = np.corrcoef(xs, ys_arr)[0, 1]
        ax.set_title(f"Pearson r = {r:.2f}   (n = {len(pairs)})",
                     fontsize=9, color=COLOR_TEXT, loc="left", pad=8)

    ax.axvline(0, color=COLOR_AXIS, linewidth=0.5, alpha=0.4, zorder=1)
    ax.axhline(0, color=COLOR_AXIS, linewidth=0.5, alpha=0.4, zorder=1)

    legend = [
        Line2D([0], [0], marker="o", color="w", markerfacecolor=COLOR_WEST,
               markersize=7, label="Western Europe"),
        Line2D([0], [0], marker="o", color="w", markerfacecolor=COLOR_EAST,
               markersize=7, label="Eastern Europe"),
    ]
    ax.legend(handles=legend, loc="lower right", frameon=False, fontsize=8)

    ax.set_xlabel(x_label)
    ax.set_ylabel(y_label)
    ax.grid(True, alpha=0.4)

    # Add a bit of vertical padding so points near the top don't touch the spine
    ys = [p[1] for p in pairs]
    margin = (max(ys) - min(ys)) * 0.08
    ax.set_ylim(min(ys) - margin, max(ys) + margin)

    plt.tight_layout()
    plt.savefig(output_path, bbox_inches="tight")
    plt.close()



def fmt_millions(n):
    return f"{n/1e6:+.1f} million" if n != 0 else "0"


# ---------- main ----------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default="chartData_annual.json")
    ap.add_argument("--out-dataset", default="country_dataset.csv")
    ap.add_argument("--out-figures", default="figures")
    args = ap.parse_args()

    chart_data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    rows = build_country_dataset(chart_data)
    write_csv(rows, Path(args.out_dataset))

    figures_dir = Path(args.out_figures)
    figures_dir.mkdir(exist_ok=True)

    fig_timeline(chart_data, figures_dir / "fig_4_1_timeline.pdf")

    fig_scatter(rows, "cumulative_net_migration", "urbanization_change",
                "Cumulative net migration, 1960–2010 (millions)",
                "Change in urbanization rate (percentage points)",
                figures_dir / "fig_4_2_urbanization.pdf",
                x_scale=1e6)

    fig_scatter(rows, "cumulative_net_migration", "median_age_change",
                "Cumulative net migration, 1960–2010 (millions)",
                "Change in median age (years)",
                figures_dir / "fig_4_3_median_age.pdf",
                x_scale=1e6)

    fig_scatter(rows, "cumulative_net_migration", "unemployment_change",
                "Cumulative net migration, 1960–2010 (millions)",
                f"Change in unemployment rate, {UNEMP_START}\u2013{UNEMP_END} (pp)",
                figures_dir / "fig_4_4_unemployment.pdf",
                x_scale=1e6)

    # ---------- headline numbers ----------
    print("\n" + "=" * 70)
    print("HEADLINE NUMBERS FOR CHAPTER 4")
    print("=" * 70)

    print("\n--- 4.1 Overview ---\n")
    west = regional_total(rows, "Western", "cumulative_net_migration")
    east = regional_total(rows, "Eastern", "cumulative_net_migration")
    print(f"Western Europe total net migration 1960-2010: {fmt_millions(west)}")
    print(f"Eastern Europe total net migration 1960-2010: {fmt_millions(east)}")
    print(f"Gap: {fmt_millions(west - east)}")

    print("\n  Timeline phases (Eastern Europe):")
    for label, a, b in [("1960-1989", 1960, 1989), ("1990-2003", 1990, 2003), ("2004-2010", 2004, 2010)]:
        print(f"    {label}: {fmt_millions(timeline_phase_total(chart_data, EASTERN, a, b))}")

    print("\n  Timeline phases (Western Europe):")
    for label, a, b in [("1960-1989", 1960, 1989), ("1990-2003", 1990, 2003), ("2004-2010", 2004, 2010)]:
        print(f"    {label}: {fmt_millions(timeline_phase_total(chart_data, WESTERN, a, b))}")

    print("\n  Top 5 receiving countries:")
    for r in top_n_by(rows, "cumulative_net_migration", n=5, reverse=True):
        print(f"    {r['name']:<25} {fmt_millions(r['cumulative_net_migration'])}")

    print("\n  Top 5 sending countries:")
    for r in top_n_by(rows, "cumulative_net_migration", n=5, reverse=False):
        print(f"    {r['name']:<25} {fmt_millions(r['cumulative_net_migration'])}")

    print("\n--- 4.2 Urbanization ---\n")
    for region in ("Western", "Eastern"):
        a = regional_mean(rows, region, "urbanization_1960")
        b = regional_mean(rows, region, "urbanization_2010")
        d = regional_mean(rows, region, "urbanization_change")
        print(f"{region} avg urbanization {a:.1f}% (1960) -> {b:.1f}% (2010)   change {d:+.1f} pp")
    cor = correlation(rows, "cumulative_net_migration", "urbanization_change")
    if cor:
        print(f"\nCorrelation (net migration vs urbanization change): r = {cor[0]:.3f}, n = {cor[1]}")

    print("\n--- 4.3 Median Age ---\n")
    for region in ("Western", "Eastern"):
        a = regional_mean(rows, region, "median_age_1960")
        b = regional_mean(rows, region, "median_age_2010")
        d = regional_mean(rows, region, "median_age_change")
        print(f"{region} avg median age {a:.1f} (1960) -> {b:.1f} (2010)   change {d:+.1f} yrs")
    cor = correlation(rows, "cumulative_net_migration", "median_age_change")
    if cor:
        print(f"\nCorrelation (net migration vs median age change): r = {cor[0]:.3f}, n = {cor[1]}")

    print(f"\n--- 4.4 Unemployment ({UNEMP_START}\u2013{UNEMP_END}) ---\n")
    n_with = sum(1 for r in rows if r["unemployment_change"] is not None)
    print(f"Countries with unemployment data: {n_with} of {len(rows)}")

    excluded = [r for r in rows if r["unemployment_change"] is None]
    if excluded:
        print(f"\n  Excluded (missing {UNEMP_START} or {UNEMP_END}):")
        for r in excluded:
            ue = chart_data.get(r["code"], {}).get("unemployment", {})
            a = ue.get(str(UNEMP_START))
            b = ue.get(str(UNEMP_END))
            print(f"    {r['name']:<25} 1991={a if a is None else f'{a:.1f}'}  2010={b if b is None else f'{b:.1f}'}")

    for region in ("Western", "Eastern"):
        a = regional_mean(rows, region, "unemployment_1991")
        b = regional_mean(rows, region, "unemployment_2010")
        d = regional_mean(rows, region, "unemployment_change")
        print(f"  {region} avg unemployment {a:.1f}% (1991) -> {b:.1f}% (2010)   change {d:+.1f} pp")

    cor = correlation(rows, "cumulative_net_migration", "unemployment_change")
    if cor:
        print(f"\n  Correlation (net migration vs unemployment change): r = {cor[0]:.3f}, n = {cor[1]}")

    print("\n  Top 5 unemployment decreases:")
    for r in top_n_by(rows, "unemployment_change", n=5, reverse=False):
        print(f"    {r['name']:<25} {r['unemployment_change']:+.1f} pp  "
              f"({r['unemployment_1991']:.1f}% -> {r['unemployment_2010']:.1f}%)")
    print("\n  Top 5 unemployment increases:")
    for r in top_n_by(rows, "unemployment_change", n=5, reverse=True):
        print(f"    {r['name']:<25} {r['unemployment_change']:+.1f} pp  "
              f"({r['unemployment_1991']:.1f}% -> {r['unemployment_2010']:.1f}%)")

    print("\n" + "=" * 70)
    print(f"\n[OK] wrote {args.out_dataset}")
    print(f"[OK] wrote 4 figures to {figures_dir}/")


if __name__ == "__main__":
    main()