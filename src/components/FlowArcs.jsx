import { useMemo, useState } from "react";
import { formatNum, getName } from "../utils/formatters";

/*
  Renders the top-5 immigration or emigration flows for the selected country
  as curved arrows on the map. Sits inside a React overlay <svg> that mirrors
  the d3 zoom transform.

  Props:
    selected     - ISO3 of the focused country
    direction    - "in" | "out"
    mData        - aggregated migration data: {ti, to, ai: {code:v}, ao: {code:v}}
    projection   - d3 geo projection currently in use
    centroids    - { iso3: [lng, lat] } precomputed in WorldMap
    visible      - hide arcs when panel is closed or not on the migration tab
    showLabels   - when true, show every label permanently (full country name + count);
                   when false, labels appear on hover only (count only)
*/

const ARC_COLOR = { in: "#5a8a6a", out: "#c2703e" };
const LABEL_BG = "#fff";

function project(proj, lnglat) {
  if (!proj || !lnglat) return null;
  const p = proj(lnglat);
  if (!p || !isFinite(p[0]) || !isFinite(p[1])) return null;
  return p;
}

function buildArc(a, b, curvature = 0.22) {
  const [ax, ay] = a;
  const [bx, by] = b;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  // sign of curvature is preserved so arcs can bend either way
  const px = -dy / len;
  const py = dx / len;
  const offset = len * curvature;
  const cx = mx + px * offset;
  const cy = my + py * offset;
  return { d: `M${ax},${ay} Q${cx},${cy} ${bx},${by}`, cx, cy, len };
}

// Signed curvatures for the top-5 arcs — fans them into a visible spread
// instead of stacking them on top of each other when multiple corridors
// share similar origin–destination geometry.
const CURVATURES = [-0.35, -0.15, 0.1, 0.3, 0.5];

function shortenEnd(a, b, shrink = 4) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  if (len <= shrink) return b;
  const f = (len - shrink) / len;
  return [a[0] + dx * f, a[1] + dy * f];
}

// Approximate rendered width of a text string at ~10px bold Source Sans 3.
// A couple pixels of slack is fine — the rect just hosts the text.
function estimateTextWidth(text) {
  return text.length * 6.3;
}

export default function FlowArcs({
  selected, direction, mData, projection, centroids, visible, showLabels
}) {
  const [hovered, setHovered] = useState(null);

  const arcs = useMemo(() => {
    if (!visible || !selected || !mData || !projection || !centroids) return [];

    const source = direction === "in" ? mData.ai : mData.ao;
    if (!source) return [];

    const top = Object.entries(source)
      .filter(([code, v]) => v > 0 && code !== selected)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const selCentroid = centroids[selected];
    if (!selCentroid) return [];
    const selPt = project(projection, selCentroid);
    if (!selPt) return [];

    return top
      .map(([code, value], idx) => {
        const other = centroids[code];
        if (!other) return null;
        const otherPt = project(projection, other);
        if (!otherPt) return null;

        const from = direction === "in" ? otherPt : selPt;
        const to   = direction === "in" ? selPt   : otherPt;
        const shortened = shortenEnd(from, to, 4);
        const curvature = CURVATURES[idx] ?? 0.22;
        const arc = buildArc(from, shortened, curvature);
        return { code, value, rank: idx, from, to: shortened, ...arc };
      })
      .filter(Boolean);
  }, [visible, selected, direction, mData, projection, centroids]);

  if (!arcs.length) return null;

  const color = ARC_COLOR[direction];
  const markerId = `flow-arrow-${direction}`;
  const maxV = Math.max(...arcs.map(a => a.value));
  const widthFor = v => 1.5 + (v / maxV) * 2.0;

  // Sort so the hovered arc renders last (on top). SVG respects document order.
  const drawOrder = hovered
    ? [...arcs.filter(a => a.code !== hovered), ...arcs.filter(a => a.code === hovered)]
    : arcs;

  const labelShownFor = code => showLabels || hovered === code;

  return (
    <g className="flow-arcs">
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4.5"
          markerHeight="4.5"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 L3,5 Z" fill={color} />
        </marker>
      </defs>

      {/* halo under arcs for legibility — fades with the arc on hover */}
      {drawOrder.map(a => (
        <path
          key={`halo-${a.code}`}
          d={a.d}
          fill="none"
          stroke="#fff"
          strokeWidth={widthFor(a.value) + 2.5}
          strokeOpacity={hovered && hovered !== a.code ? 0.2 : 0.75}
          strokeLinecap="round"
          style={{ pointerEvents: "none", transition: "stroke-opacity 0.15s" }}
        />
      ))}

      {/* visible arcs — hovered one renders last so it sits on top.
          Emphasis comes from dimming non-hovered arcs, not thickening the
          hovered one. */}
      {drawOrder.map(a => (
        <path
          key={`arc-${a.code}`}
          d={a.d}
          fill="none"
          stroke={color}
          strokeWidth={widthFor(a.value)}
          strokeOpacity={hovered && hovered !== a.code ? 0.18 : 0.88}
          strokeLinecap="round"
          markerEnd={`url(#${markerId})`}
          style={{ pointerEvents: "none", transition: "stroke-opacity 0.15s" }}
        />
      ))}

      {/* origin dots */}
      {arcs.map(a => (
        <circle
          key={`dot-${a.code}`}
          cx={a.from[0]}
          cy={a.from[1]}
          r={2.5}
          fill={color}
          stroke="#fff"
          strokeWidth={1}
          opacity={hovered && hovered !== a.code ? 0.25 : 1}
          style={{ pointerEvents: "none", transition: "opacity 0.15s" }}
        />
      ))}

      {/* invisible fat hover targets — let people aim at the arc comfortably */}
      {arcs.map(a => (
        <path
          key={`hit-${a.code}`}
          d={a.d}
          fill="none"
          stroke="transparent"
          strokeWidth={18}
          strokeLinecap="round"
          style={{ pointerEvents: "stroke", cursor: "help" }}
          onMouseEnter={() => setHovered(a.code)}
          onMouseLeave={() => setHovered(prev => (prev === a.code ? null : prev))}
        />
      ))}

      {/* labels — hover-only by default, or always when showLabels is on.
          Hovered arc renders last so its label can't be hidden behind others. */}
      {drawOrder.map(a => {
        if (!labelShownFor(a.code)) return null;

        const numStr = formatNum(a.value);
        const text = showLabels ? `${getName(a.code)}  ${numStr}` : numStr;
        const padX = 6;
        const w = estimateTextWidth(text) + padX * 2;
        const h = 16;

        const hoverRaise = hovered === a.code && !showLabels ? -1 : 0;
        // In always-show mode, dim non-hovered labels so the hovered one
        // visually dominates without needing to compete on size/weight.
        const dimmed = hovered && hovered !== a.code;
        const labelOpacity = dimmed ? 0.35 : 0.97;

        return (
          <g
            key={`label-${a.code}`}
            transform={`translate(${a.cx},${a.cy + hoverRaise})`}
            style={{ pointerEvents: "none", transition: "opacity 0.15s" }}
            opacity={labelOpacity}
          >
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx={3}
              fill={LABEL_BG}
              stroke={color}
              strokeWidth={hovered === a.code ? 1.2 : 0.8}
              style={{
                filter: hovered === a.code ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "none"
              }}
            />
            <text
              x={0}
              y={0.5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fontFamily="'Source Sans 3', sans-serif"
              fontWeight={600}
              fill="#1c1f25"
              style={{ letterSpacing: "0.01em" }}
            >
              {text}
            </text>
          </g>
        );
      })}
    </g>
  );
}