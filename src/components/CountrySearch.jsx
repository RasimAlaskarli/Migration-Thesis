import { useState, useMemo, useLayoutEffect } from "react";
import { CODE_TO_NAME } from "../dataset/constants.js";
import { formatNum, getName } from "../utils/formatters.js";

const CONF_INFO = {
  high_confidence: null, // no mark for high confidence
  moderate_confidence: { color: "#e0a020", label: "Moderate confidence — some disagreement among retained estimates", icon: "●" },
  low_confidence: { color: "#c44e52", label: "Low confidence — broad disagreement among retained estimates", icon: "●" },
  insufficient_evidence: { color: "#737a85", label: "Insufficient evidence — too few retained values above threshold", icon: "?" }};

function getWorstConfidence(levels) {
  if (!levels.length) return null;

  const rank = {
    high_confidence: 1,
    moderate_confidence: 2,
    low_confidence: 3,
    insufficient_evidence: 4,};

  return [...levels].sort((a, b) => (rank[b] || 0) - (rank[a] || 0))[0];
}

const SHORT_LABEL = {
  high_confidence: "high confidence",
  moderate_confidence: "moderate confidence",
  low_confidence: "low confidence",
  insufficient_evidence: "insufficient evidence",
};

// Building the hover tooltip for a confidence badge. Mirrors the logic in MigrationList.jsx
// Basically, when multiple periods are selected and they don't all share the same label, the tooltip leads with the worst-case label and the periods that produced it.
// Then it is listing the other labels for the remaining periods so the user knows the worst label only applies to a subset.
function buildConfidenceTitle(confidence, origin, destination, worstLabelLong, worstLabelKey, selectedPeriods) {
  const key = `${origin}-${destination}`;
  const periods = selectedPeriods ? [...selectedPeriods].sort((a, b) => +a - +b) : [];

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

export default function CountrySearch({
  selected,
  mData,
  confidence,
  selectedPeriods,
  demoPick
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);

  // Tour-driven demonstration: when "demoPick" is set, pre-select that
  // country so the tour can spotlight the resulting bilateral flow card.
  useLayoutEffect(() => {
    if (demoPick) {
      setPicked(demoPick);
      setQuery(getName(demoPick));
    } else {
      // Cleared after the tour moves past the bilateral demo step.
      setPicked(null);
      setQuery("");
    }
  }, [demoPick]);

  const codes = useMemo(() =>
    Object.keys(CODE_TO_NAME)
      .filter(c => c !== selected && c.length === 3)
      .sort((a, b) => getName(a).localeCompare(getName(b))),
    [selected]
  );

  const matches = useMemo(() => {
    if (!query) return codes.slice(0, 20);
    const q = query.toLowerCase();
    return codes.filter(c => getName(c).toLowerCase().includes(q)).slice(0, 20);
  }, [query, codes]);

  const flow = useMemo(() => {
    if (!mData || !picked) return null;
    return { from: mData.ai?.[picked] || 0, to: mData.ao?.[picked] || 0 };
  }, [mData, picked]);

  function getConf(origin, destination) {
    if (!confidence) return null;
    const key = `${origin}-${destination}`;

    const levels = [];
    for (const period of selectedPeriods || []) {
      const level = confidence?.[period]?.[key];
      if (level) levels.push(level);
    }

    return getWorstConfidence(levels);
  }

  function ConfBadge({ level, origin, destination }) {
    const info = CONF_INFO[level];
    if (!info) return null;
    const title = buildConfidenceTitle(confidence, origin, destination, info.label, level, selectedPeriods);

    return (
      <div
        title={title}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontSize: 9,
          color: info.color,
          marginTop: 4,
          fontFamily: "'Source Sans 3', sans-serif",
          cursor: "help"
        }}
      >
        {info.icon} {info.label}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: "#737a85", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        Bilateral Flow
      </div>

      <div data-tour-id="bilateral-search" style={{ position: "relative" }}>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#737a85"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none"
          }}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setPicked(null);
          }}
          placeholder="Search country..."
          style={{
            width: "100%",
            padding: "8px 12px 8px 30px",
            borderRadius: 3,
            border: "1px solid #c8ccd3",
            fontSize: 13,
            fontFamily: "'Source Sans 3', sans-serif",
            background: "#fafbfc",
            outline: "none",
            boxSizing: "border-box",
            color: "#1c1f25"
          }}
        />
      </div>

      {query && !picked && (
        <div
          style={{
            border: "1px solid #d8dce2",
            borderRadius: 3,
            maxHeight: 160,
            overflowY: "auto",
            marginTop: 4,
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}
        >
          {matches.map(c => (
            <div
              key={c}
              onClick={() => {
                setPicked(c);
                setQuery(getName(c));
              }}
              style={{
                padding: "6px 12px",
                fontSize: 13,
                cursor: "pointer",
                borderBottom: "1px solid #e8ebef",
                color: "#1c1f25"
              }}
              onMouseEnter={e => { e.target.style.background = "#eff1f4"; }}
              onMouseLeave={e => { e.target.style.background = "#fff"; }}
            >
              {getName(c)}
            </div>
          ))}
        </div>
      )}

      {flow && picked && (
        <div data-tour-id="bilateral-result" style={{ marginTop: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ padding: "8px 12px", borderRadius: 3, border: "1px solid #e2e5ea", background: "#fafbfc" }}>
              <div style={{ fontSize: 10, color: "#737a85", textTransform: "uppercase" }}>
                {getName(picked)} → {getName(selected)}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#5a8a6a", fontFamily: "'Source Serif 4', serif" }}>
                {formatNum(flow.from)}
                {mData?.ti > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 400, color: "#9aa0aa", marginLeft: 4 }}>
                    {((flow.from / mData.ti) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <ConfBadge level={getConf(picked, selected)} origin={picked} destination={selected} />
            </div>

            <div style={{ padding: "8px 12px", borderRadius: 3, border: "1px solid #e2e5ea", background: "#fafbfc" }}>
              <div style={{ fontSize: 10, color: "#737a85", textTransform: "uppercase" }}>
                {getName(selected)} → {getName(picked)}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#c2703e", fontFamily: "'Source Serif 4', serif" }}>
                {formatNum(flow.to)}
                {mData?.to > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 400, color: "#9aa0aa", marginLeft: 4 }}>
                    {((flow.to / mData.to) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <ConfBadge level={getConf(selected, picked)} origin={selected} destination={picked} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}