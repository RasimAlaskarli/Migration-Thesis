// Line chart for demographic / migration time series in the right sidebar.
//
// Behavior:
//   - Each selected period is rendered as a contiguous segment showing
//     all annual values within the period (5 years for "5yr" mode, 10
//     for "10yr"). E.g. period "1960" in 5-year mode shows 1960–1964.
//   - When multiple disjoint periods are selected, segments are drawn
//     as separate lines with gaps in the x-axis between them.
//   - Hover snaps to the nearest data point and reveals an exact-value
//     tooltip plus a vertical crosshair.
//
// Number formatting:
//   - %, years: 1 decimal place + unit suffix (e.g. "8.4%", "37.9 yrs")
//   - K under 1M, M at 1M and above (e.g. "213K", "8.6M")

import { useState } from "react";

function fmtVal(v, unit) {
  if (v == null) return "—";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";

  if (unit === "%") return v.toFixed(1) + "%";
  if (unit === "years" || unit === "yrs") return v.toFixed(1) + " yrs";

  // Plain numeric formatting for migration / population:
  //   < 1k  -> raw integer
  //   1k–1M -> K with one decimal
  //   >= 1M -> M with one decimal
  if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + "K";
  return v.toLocaleString();
}

// Y-axis tick labels — slightly more compact than the hover tooltip.
function fmtTick(v, unit) {
  if (unit === "%") return v.toFixed(0) + "%";
  if (unit === "years" || unit === "yrs") return v.toFixed(0);

  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return sign + (abs / 1e3).toFixed(0) + "K";
  if (abs < 10 && abs > 0) return v.toFixed(1);
  return Math.round(v).toString();
}

export default function LineChart({ data, label, unit, color, selectedPeriods, intervalMode }) {
  const [hover, setHover] = useState(null);

  if (!data || !Object.keys(data).length) {
    return <div style={{ padding: "12px 0", color: "#737a85", fontSize: 13, fontStyle: "italic" }}>No {label.toLowerCase()} data available</div>;
  }

  // Build segments — one per selected period, each containing the annual
  // values inside that period that have data.
  const step = intervalMode === "10yr" ? 10 : 5;
  const periodsSorted = [...selectedPeriods].sort((a, b) => +a - +b);

  const segments = periodsSorted
    .map(p => {
      const start = +p;
      // 5-year period "1960" covers 1960..1965 inclusive — the period
      // endpoint is shared with the next period's start, so adjacent
      // selected periods connect into a continuous line.
      const years = [];
      for (let y = start; y <= start + step; y++) {
        const ystr = String(y);
        if (data[ystr] != null) years.push({ year: ystr, v: data[ystr] });
      }
      return years;
    })
    .filter(seg => seg.length > 0);

  if (!segments.length) {
    return <div style={{ padding: "12px 0", color: "#737a85", fontSize: 13, fontStyle: "italic" }}>No {label.toLowerCase()} data for selected periods</div>;
  }

  // Flatten for scale computation.
  const allPts = segments.flat();
  const W = 370, H = 160;
  const pad = { t: 22, r: 16, b: 30, l: 42 };
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;

  const vals = allPts.map(p => p.v);
  const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
  // Allow negative range for net migration; otherwise floor at 0 so the
  // chart doesn't show silly negative axis values for percentages.
  const allowsNegative = lo < 0;
  const yLo = allowsNegative ? lo - span * 0.1 : Math.max(0, lo - span * 0.1);
  const yHi = hi + span * 0.1;

  const allYearsNum = allPts.map(p => +p.year);
  const xLo = Math.min(...allYearsNum);
  const xHi = Math.max(...allYearsNum);
  const xSpan = xHi - xLo || 1;
  const xOf = n => allPts.length === 1
    ? pad.l + pw / 2
    : pad.l + ((n - xLo) / xSpan) * pw;
  const yOf = v => pad.t + ph - ((v - yLo) / (yHi - yLo)) * ph;

  // Project each segment for drawing.
  const projectedSegments = segments.map(seg =>
    seg.map(({ year, v }) => ({ x: xOf(+year), y: yOf(v), v, year }))
  );

  const linePath = pts => pts.map((p, i) => (i ? "L" : "M") + p.x + "," + p.y).join(" ");
  const areaPath = pts => linePath(pts) + `L${pts[pts.length - 1].x},${pad.t + ph}L${pts[0].x},${pad.t + ph}Z`;

  const ticks = Array.from({ length: 5 }, (_, i) => {
    const v = yLo + (i / 4) * (yHi - yLo);
    return { v, y: yOf(v) };
  });

  // Hover handling — snap to the nearest data point across all segments.
  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let best = null, bestD = 30;
    for (const seg of projectedSegments) {
      for (const p of seg) {
        const d = Math.abs(mx - p.x);
        if (d < bestD) { bestD = d; best = p; }
      }
    }
    setHover(best);
  }

  // Decide whether the hover tooltip should appear left or right of the
  // crosshair so it stays within the SVG bounds.
  const tipW = 110, tipH = 36;
  const tipLeft = hover && hover.x > W / 2;
  const tipX = hover ? hover.x + (tipLeft ? -tipW - 8 : 8) : 0;
  const tipY = hover ? Math.max(pad.t, Math.min(pad.t + ph - tipH, hover.y - tipH / 2)) : 0;

  // For dense series (many selected periods) showing every year label
  // overlaps. Pick a stride that yields ~5 labels.
  const allUniqueYears = [...new Set(allPts.map(p => p.year))].sort((a, b) => +a - +b);
  // Pick a stride that yields ~6 visible labels. Always include the
  // last year, but drop the previously-strided label if it would sit
  // right next to the final one (avoids overlapping text at the
  // right edge of the chart).
  const labelStride = Math.max(1, Math.ceil(allUniqueYears.length / 6));
  const labelYears = new Set();
  for (let i = 0; i < allUniqueYears.length; i += labelStride) {
    if (i < allUniqueYears.length - 1 && allUniqueYears.length - 1 - i < labelStride) continue;
    labelYears.add(allUniqueYears[i]);
  }
  labelYears.add(allUniqueYears[allUniqueYears.length - 1]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: "#737a85", marginBottom: 6, fontFamily: "'Source Sans 3', sans-serif", letterSpacing: "0.03em", textTransform: "uppercase" }}>
        {label}{unit ? ` (${unit})` : ""}
      </div>
      <svg
        width={W}
        height={H}
        style={{ display: "block", cursor: "crosshair" }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Grid lines */}
        {ticks.map((t, i) => (
          <line key={i} x1={pad.l} x2={W - pad.r} y1={t.y} y2={t.y} stroke="#e2e5ea" strokeWidth={0.5} />
        ))}
        {/* Y-axis labels */}
        {ticks.map((t, i) => (
          <text
            key={"t" + i}
            x={pad.l - 6}
            y={t.y + 3}
            textAnchor="end"
            fontSize={9}
            fill="#9aa0aa"
            fontFamily="'Source Sans 3'"
          >
            {fmtTick(t.v, unit)}
          </text>
        ))}

        {/* Zero line, when relevant */}
        {allowsNegative && (
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={yOf(0)}
            y2={yOf(0)}
            stroke="#9aa0aa"
            strokeWidth={0.7}
            strokeDasharray="3,2"
          />
        )}

        {/* Each segment renders independently — produces a visible gap
            between disjoint periods rather than a misleading line. The
            line itself carries the data; individual dots only appear on
            hover so the chart stays uncluttered for long time series. */}
        {projectedSegments.map((seg, i) => (
          <g key={"seg" + i}>
            {seg.length > 1 && (
              <>
                <path d={areaPath(seg)} fill={color} opacity={0.08} />
                <path d={linePath(seg)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              </>
            )}
            {/* When a segment has only one data point we still need a
                visible marker — there's no line to carry it. */}
            {seg.length === 1 && (
              <circle
                cx={seg[0].x}
                cy={seg[0].y}
                r={3}
                fill="#fff"
                stroke={color}
                strokeWidth={2}
              />
            )}
          </g>
        ))}

        {/* Hover dot — only the year currently under the cursor gets a
            circle. Sits above the line so it's always visible. */}
        {hover && (
          <circle
            cx={hover.x}
            cy={hover.y}
            r={4.5}
            fill="#fff"
            stroke={color}
            strokeWidth={2}
            pointerEvents="none"
          />
        )}

        {/* X-axis year labels (subset to avoid overlap) */}
        {allUniqueYears.filter(y => labelYears.has(y)).map(y => (
          <text
            key={"x" + y}
            x={xOf(+y)}
            y={H - 8}
            textAnchor="middle"
            fontSize={8}
            fill={hover && hover.year === y ? "#1c1f25" : "#737a85"}
            fontWeight={hover && hover.year === y ? 600 : 400}
            fontFamily="'Source Sans 3'"
          >
            {y}
          </text>
        ))}

        {/* Hover crosshair + tooltip */}
        {hover && (
          <>
            <line
              x1={hover.x}
              x2={hover.x}
              y1={pad.t}
              y2={pad.t + ph}
              stroke="#1c1f25"
              strokeWidth={0.5}
              strokeDasharray="3,3"
              opacity={0.4}
              pointerEvents="none"
            />
            <rect
              x={tipX}
              y={tipY}
              width={tipW}
              height={tipH}
              rx={5}
              fill="#fff"
              stroke="#d8dce2"
              strokeWidth={1}
              style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.08))" }}
              pointerEvents="none"
            />
            <text
              x={tipX + 8}
              y={tipY + 14}
              fontSize={10}
              fontWeight={600}
              fill="#1c1f25"
              fontFamily="'Source Sans 3'"
              pointerEvents="none"
            >
              {hover.year}
            </text>
            <text
              x={tipX + 8}
              y={tipY + 28}
              fontSize={11}
              fontWeight={600}
              fill={color}
              fontFamily="'Source Sans 3'"
              pointerEvents="none"
            >
              {fmtVal(hover.v, unit)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}