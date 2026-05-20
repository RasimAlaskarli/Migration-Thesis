import { formatNum, getName } from "../utils/formatters";

const CONFIDENCE_STYLES = {
  high_confidence: null, // no badge — clean display
  moderate_confidence: {
    color: "#e0a020",
    label: "Moderate confidence — some disagreement among retained estimates",
    icon: "●"
  },
  low_confidence: {
    color: "#c44e52",
    label: "Low confidence — broad disagreement among retained estimates",
    icon: "●"
  },
  insufficient_evidence: {
    color: "#737a85",
    label: "Insufficient evidence — too few retained values above threshold",
    icon: "?"
  },
};

function buildConfidenceKey(direction, selected, code) {
  return direction === "in"
    ? `${code}-${selected}`
    : `${selected}-${code}`;
}

function getWorstConfidence(levels) {
  if (!levels.length) return null;

  const rank = {
    high_confidence: 1,
    moderate_confidence: 2,
    low_confidence: 3,
    insufficient_evidence: 4,
  };

  return [...levels].sort((a, b) => (rank[b] || 0) - (rank[a] || 0))[0];
}

// Short, one-word names matching the badge labels.
// Used in the tooltip's "Also:" breakdown so it stays compact.
const SHORT_LABEL = {
  high_confidence: "high confidence",
  moderate_confidence: "moderate confidence",
  low_confidence: "low confidence",
  insufficient_evidence: "insufficient evidence",
};

// Build the hover tooltip for a confidence badge.
//
// `fallbackLabel` is the long description of the worst label across
// the selected periods (e.g. "Insufficient evidence — too few retained
// values above threshold"). The function returns this label, followed
// by the list of periods that produced it, plus a breakdown of any
// other labels in the selection so the user knows the worst label
// only applies to those specific periods.
//
// Example outputs:
//   "Insufficient evidence ... — 1985"
//      (when only one period is selected, or all selected periods share this label)
//   "Insufficient evidence ... — 1985. Other periods: high confidence (1990),
//    moderate confidence (1995)"
//      (when the worst label only applies to a subset)
function buildConfidenceTitle(confidence, key, worstLabelLong, worstLabelKey, selectedPeriods) {
  const periods = selectedPeriods ? [...selectedPeriods].sort((a, b) => +a - +b) : [];

  // Group selected periods by their actual confidence label for this flow.
  const byLabel = {};
  for (const p of periods) {
    const lvl = confidence?.[p]?.[key];
    if (!lvl) continue;
    if (!byLabel[lvl]) byLabel[lvl] = [];
    byLabel[lvl].push(p);
  }

  const worstYears = byLabel[worstLabelKey] || [];
  if (!worstYears.length) return worstLabelLong;

  let out = `${worstLabelLong} — ${worstYears.join(", ")}`;

  // List the other labels' periods, in order of severity (best first
  // looks more natural here since the worst case has already been
  // stated and the rest is supplementary).
  const order = ["high_confidence", "moderate_confidence", "low_confidence", "insufficient_evidence"];
  const otherParts = [];
  for (const lvl of order) {
    if (lvl === worstLabelKey) continue;
    const ys = byLabel[lvl];
    if (!ys || !ys.length) continue;
    otherParts.push(`${SHORT_LABEL[lvl]} in ${ys.join(", ")}`);
  }
  if (otherParts.length) {
    out += `. Other periods: ${otherParts.join("; ")}`;
  }

  return out;
}

export default function MigrationList({
  items,
  color,
  total,
  confidence,
  direction,
  selected,
  selectedPeriods
}) {
  if (!items?.length) {
    return <div style={{ color: "#737a85", fontSize: 13, fontStyle: "italic", padding: "8px 0" }}>No data</div>;
  }

  const peak = items[0][1] || 1;

  function getConfidence(code) {
    if (!confidence) return null;
    const key = buildConfidenceKey(direction, selected, code);

    const levels = [];
    for (const period of selectedPeriods || []) {
      const level = confidence?.[period]?.[key];
      if (level) levels.push(level);
    }

    return getWorstConfidence(levels);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map(([code, val], i) => {
        const pct = total ? ((val / total) * 100).toFixed(1) : null;
        const key = buildConfidenceKey(direction, selected, code);
        const conf = getConfidence(code);
        const style = conf ? CONFIDENCE_STYLES[conf] : null;
        const title = style ? buildConfidenceTitle(confidence, key, style.label, conf, selectedPeriods) : "";

        return (
          <div key={code} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 20, textAlign: "right", color: "#737a85", fontSize: 11 }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <span style={{ color: "#1c1f25", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                  {getName(code)}
                  {style && (
                    <span
                      title={title}
                      style={{
                        fontSize: 11,
                        color: style.color,
                        cursor: "help",
                        lineHeight: 1
                      }}
                    >
                      {style.icon}
                    </span>
                  )}
                </span>
                <span style={{ color: "#414956", fontSize: 12, fontWeight: 600 }}>
                  {formatNum(val)}
                  {pct && <span style={{ color: "#9aa0aa", fontWeight: 400, marginLeft: 4, fontSize: 11 }}>{pct}%</span>}
                </span>
              </div>
              <div style={{ height: 3, background: "#e2e5ea", borderRadius: 2 }}>
                <div style={{
                  height: 3,
                  background: color,
                  borderRadius: 2,
                  width: `${(val / peak) * 100}%`,
                  opacity: 1
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}