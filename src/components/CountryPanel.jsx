import { useState, useMemo } from "react";
import { CONTINENTS, CODE_TO_CONTINENT } from "../dataset/constants.js";
import { formatNum, getFlagEmoji, getName } from "../utils/formatters.js";
import LineChart from "./LineChart";
import MigrationList from "./MigrationList";
import CountrySearch from "./CountrySearch";

// Formating a stat-card value. Pre-existing formatNum is used for unitless counts (population, migration). Percentages and years get their own
// short formatting here so the cards are rendered consistently.
function formatStatValue(value, unit) {
  if (value == null) return null;
  if (unit === "%") return value.toFixed(1) + "%";
  if (unit === "years" || unit === "yrs") return value.toFixed(1) + " yrs";
  return formatNum(value);
}

function StatCard({ label, value, change, unit, color, prefix }) {
  let display = "—";
  if (value != null) {
    const formatted = formatStatValue(value, unit);
    display = (prefix || "") + (formatted || "");
  }

  let changeEl = null;
  if (change != null && isFinite(change) && change !== 0) {
    const up = change > 0;
    const arrow = up ? "↑" : "↓";
    const pct = Math.abs(change).toFixed(0);
    changeEl = (
      <span style={{ fontSize: 12, fontWeight: 500, color: "#737a85", marginLeft: 4, fontFamily: "'Source Sans 3', sans-serif" }}>
        {arrow}{pct}%
      </span>
    );
  }

  return (
    <div style={{ padding: "10px 12px", borderRadius: 4, border: "1px solid #e2e5ea", background: "#fafbfc" }}>
      <div style={{ fontSize: 10, color: "#737a85", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color, fontFamily: "'Source Serif 4', serif", marginTop: 2 }}>
        {display}{changeEl}
      </div>
    </div>
  );
}

function ConfidenceLegend({ hasConfidence }) {
  if (!hasConfidence) return null;

  return (
    <div style={{
      padding: "8px 12px",
      borderRadius: 3,
      marginBottom: 14,
      background: "#fafbfc",
      border: "1px solid #e2e5ea",
      fontSize: 11,
      lineHeight: 1.6,
      color: "#525965"
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4, color: "#737a85" }}>
        Data quality flags
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span><b style={{ color: "#1c1f25" }}>No marker</b> — high confidence (tight agreement among retained estimates)</span>
        <span><span style={{ color: "#e0a020" }}>●</span> <b style={{ color: "#e0a020" }}>Moderate confidence</b> — some disagreement among retained estimates</span>
        <span><span style={{ color: "#c44e52" }}>●</span> <b style={{ color: "#c44e52" }}>Low confidence</b> — broad disagreement among retained estimates</span>
        <span><span style={{ color: "#737a85" }}>?</span> <b style={{ color: "#737a85" }}>Insufficient evidence</b> — too few retained values above threshold</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 10, color: "#737a85", fontStyle: "italic" }}>
        When several periods are selected, the badge shows the worst-case
        flag across them. Hover for the per-period breakdown.
      </div>
    </div>
  );
}

export default function CountryPanel({
  selected, panelOpen, onClose, periodLabel, sortedPeriods,
  selectedPeriods, mData, chartInfo, intervalMode, confidence,
  tab: tabProp, onTabChange, direction: directionProp, onDirectionChange,
  bilateralDemoPick
}) {
  const [tabInternal, setTabInternal] = useState("stats");
  const [directionInternal, setDirectionInternal] = useState("in");

  const tab = tabProp !== undefined ? tabProp : tabInternal;
  const setTab = onTabChange || setTabInternal;
  const direction = directionProp !== undefined ? directionProp : directionInternal;
  const setDirection = onDirectionChange || setDirectionInternal;

  const [continent, setContinent] = useState("All");

  const showConfidence = useMemo(() => {
    if (!confidence) return false;
    for (const p of selectedPeriods) {
      const block = confidence[p];
      if (block && Object.keys(block).length) return true;
    }
    return false;
  }, [confidence, selectedPeriods]);

  //Compute a stat-card value/change pair from chartInfo.
  //
  //Behaviour by indicator type:
  //   1) Stock indicators like urbanization, median age, population, unemployment have their values shown in the most recent year inside
  //     the selected periods. These represent a state at a point in time, so summing them would be meaningless.
  //   2) Flow indicator (netMigration): the value shown is the sum of  all annual values across all selected periods, since net
  //     migration is a quantity that accumulates year over year.
  //     The change arrow is suppressed (a sum can be negative or cross zero, so a percent change isn't well-defined).
  //
  //For both, the change percentage compares the earliest in-period value with the latest, expressed relative to the earliest value.
  function metricInfo(metric) {
    if (!chartInfo?.[metric]) return { value: null, change: null };
    const step = intervalMode === "10yr" ? 10 : 5;

    // All years inside any selected period (annual resolution).
    const years = new Set();
    for (const p of selectedPeriods) {
      const start = +p;
      for (let y = start; y <= start + step; y++) {
        years.add(String(y));
      }
    }
    const sorted = [...years].sort((a, b) => +a - +b);
    const withData = sorted.filter(y => chartInfo[metric][y] != null);
    if (!withData.length) return { value: null, change: null };

    if (metric === "netMigration") {
      // Sum across all years that fall inside any selected period.
      // When adjacent periods share an endpoint like 2000 + 2005 both
      // touch 2005. The shared year would be counted once because the
      // "years" Set deduplicates it. That's the right behaviour: the
      // year 2005 only happened once.
      const total = withData.reduce((acc, y) => acc + chartInfo[metric][y], 0);
      return { value: total, change: null };
    }

    const latest = chartInfo[metric][withData[withData.length - 1]];
    const earliest = chartInfo[metric][withData[0]];

    let change = null;
    if (withData.length > 1 && earliest !== 0) {
      change = ((latest - earliest) / Math.abs(earliest)) * 100;
    }

    return { value: latest, change };
  }

  const metrics = useMemo(() => ({
    unemployment: metricInfo("unemployment"),
    urbanization: metricInfo("urbanization"),
    medianAge: metricInfo("medianAge"),
    population: metricInfo("population"),
    netMigration: metricInfo("netMigration"),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [chartInfo, selectedPeriods, intervalMode]);

  // (The previous "Net" stat card computed mData.ti - mData.to here. That
  // card was removed because Abel's bilateral 5-year transition counts
  // are not directly comparable to the World Bank annual net migration
  // values shown on the Statistics tab; see chapter 5 methodology.)

  const topIn = useMemo(() => {
    if (!mData?.ai) return [];
    let entries = Object.entries(mData.ai);
    if (continent !== "All") entries = entries.filter(([c]) => CODE_TO_CONTINENT[c] === continent);
    return entries.sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [mData, continent]);

  const topOut = useMemo(() => {
    if (!mData?.ao) return [];
    let entries = Object.entries(mData.ao);
    if (continent !== "All") entries = entries.filter(([c]) => CODE_TO_CONTINENT[c] === continent);
    return entries.sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [mData, continent]);

  const contTotals = useMemo(() => {
    if (!mData) return {};
    const out = {};
    for (const c of CONTINENTS.filter(c => c !== "All")) {
      let i = 0, o = 0;
      for (const [code, val] of Object.entries(mData.ai || {})) if (CODE_TO_CONTINENT[code] === c) i += val;
      for (const [code, val] of Object.entries(mData.ao || {})) if (CODE_TO_CONTINENT[code] === c) o += val;
      if (i || o) out[c] = { in: i, out: o };
    }
    return out;
  }, [mData]);

  const stopProp = {
    onMouseDown: e => e.stopPropagation(),
    onWheel: e => e.stopPropagation(),
    onTouchStart: e => e.stopPropagation()
  };

  // Net migration card prefix: explicit "+" sign when positive.
  const netMigPrefix = metrics.netMigration.value != null && metrics.netMigration.value > 0 ? "+" : "";

  return (
    <div {...stopProp} data-tour-id="country-panel" style={{
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      width: 430,
      transform: panelOpen ? "translateX(0)" : "translateX(100%)",
      background: "#fff",
      borderLeft: "1px solid #d8dce2",
      transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: panelOpen ? "-4px 0 20px rgba(0,0,0,0.08)" : "none",
      zIndex: 10,
      color: "#1c1f25"
    }}>
      {selected && (
        <>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #e2e5ea", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 600 }}>
                {getFlagEmoji(selected) && <span style={{ fontSize: 22, lineHeight: 1 }}>{getFlagEmoji(selected)}</span>}
                <span>{getName(selected)}</span>
              </div>
              <div style={{ fontSize: 12, color: "#737a85", marginTop: 2 }}>
                {periodLabel} · {sortedPeriods.length > 1 ? `${sortedPeriods.length} periods combined` : `${intervalMode === "10yr" ? "10" : "5"}-year period`}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: "#737a85", cursor: "pointer", padding: 4 }}>✕</button>
          </div>

          <div style={{ display: "flex", borderBottom: "1px solid #e2e5ea" }}>
            {["stats", "migration"].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  fontSize: 13,
                  fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? "#1c1f25" : "#737a85",
                  background: "none",
                  border: "none",
                  borderBottom: tab === t ? "2px solid #1c1f25" : "2px solid transparent",
                  cursor: "pointer",
                  fontFamily: "'Source Sans 3', sans-serif",
                  textTransform: "capitalize"
                }}
              >
                {t === "stats" ? "Statistics" : "Migration"}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {tab === "stats" && (
              <>
                {/* Stat cards: keep the four most-asked-for at the top.
                    Net migration gets its own card since it's now annual
                    and can be compared directly with Chapter 4 numbers. */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <StatCard label="Unemployment" value={metrics.unemployment.value} change={metrics.unemployment.change} unit="%" color="#c2703e" />
                  <StatCard label="Urbanization" value={metrics.urbanization.value} change={metrics.urbanization.change} unit="%" color="#5a8a6a" />
                  <StatCard label="Median Age" value={metrics.medianAge.value} change={metrics.medianAge.change} unit="yrs" color="#6a7b8a" />
                  <StatCard label="Population" value={metrics.population.value} change={metrics.population.change} unit="" color="#8a6a7b" />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <StatCard
                    label="Net Migration (sum over selected periods)"
                    value={metrics.netMigration.value}
                    unit=""
                    color="#4878a8"
                    prefix={netMigPrefix}
                  />
                </div>

                <LineChart data={chartInfo?.netMigration} label="Net Migration" unit="" color="#4878a8" selectedPeriods={selectedPeriods} intervalMode={intervalMode} />
                <LineChart data={chartInfo?.unemployment} label="Unemployment" unit="%" color="#c2703e" selectedPeriods={selectedPeriods} intervalMode={intervalMode} />
                <LineChart data={chartInfo?.urbanization} label="Urbanization" unit="%" color="#5a8a6a" selectedPeriods={selectedPeriods} intervalMode={intervalMode} />
                <LineChart data={chartInfo?.medianAge} label="Median Age" unit="years" color="#6a7b8a" selectedPeriods={selectedPeriods} intervalMode={intervalMode} />
                <LineChart data={chartInfo?.population} label="Population" unit="" color="#8a6a7b" selectedPeriods={selectedPeriods} intervalMode={intervalMode} />
              </>
            )}

            {tab === "migration" && (
              <>
                {/* The migration tab previously showed three stat cards
                    (Arrived, Departed, Net) computed from Abel's bilateral
                    estimates. Those cards have been removed because
                    Abel's data measures migration transitions over
                    5-year periods rather than annual flows, so totalling
                    them and comparing the result to the Statistics tab's
                    World Bank net migration value is methodologically
                    unsound. Net migration as a country-level summary now
                    lives only on the Statistics tab. */}

                <ConfidenceLegend hasConfidence={showConfidence} />

                <CountrySearch
                  selected={selected}
                  mData={mData}
                  confidence={showConfidence ? confidence : null}
                  selectedPeriods={selectedPeriods}
                  demoPick={bilateralDemoPick}
                />

                <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                  {[["in", "Immigration"], ["out", "Emigration"]].map(([k, lbl]) => (
                    <button
                      key={k}
                      onClick={() => setDirection(k)}
                      style={{
                        flex: 1,
                        padding: "7px 0",
                        fontSize: 12,
                        fontWeight: direction === k ? 600 : 400,
                        background: direction === k ? "#1c1f25" : "#eff1f4",
                        color: direction === k ? "#fff" : "#737a85",
                        border: "1px solid #d8dce2",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontFamily: "'Source Sans 3', sans-serif"
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "#737a85", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                    Filter by continent
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {CONTINENTS.map(c => (
                      <button
                        key={c}
                        onClick={() => setContinent(c)}
                        style={{
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: continent === c ? 600 : 400,
                          background: continent === c ? "#1c1f25" : "#eff1f4",
                          color: continent === c ? "#fff" : "#737a85",
                          border: "1px solid #d8dce2",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontFamily: "'Source Sans 3', sans-serif",
                          transition: "all 0.15s"
                        }}
                      >
                        {c}{c !== "All" && contTotals[c] ? ` (${formatNum(direction === "in" ? contTotals[c].in : contTotals[c].out)})` : ""}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "#737a85", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Top 10 {direction === "in" ? "sources" : "destinations"}{continent !== "All" ? ` — ${continent}` : ""}
                </div>

                <MigrationList
                  items={direction === "in" ? topIn : topOut}
                  color={direction === "in" ? "#5a8a6a" : "#c2703e"}
                  total={direction === "in" ? mData?.ti : mData?.to}
                  confidence={showConfidence ? confidence : null}
                  direction={direction}
                  selected={selected}
                  selectedPeriods={selectedPeriods}
                />
              </>
            )}
          </div>

          <div style={{ padding: "8px 20px", borderTop: "1px solid #e2e5ea", fontSize: 10, color: "#9aa0aa", fontStyle: "italic" }}>
            Statistics tab: World Bank, UN WPP (annual) · Migration tab: Abel &amp; Sander (bilateral, 5-year)
            {mData?.usesHistoricalData && (
              <div style={{ marginTop: 4, color: "#c2703e" }}>
                ⚠ Pre-2010 data includes {selected === "SRB" ? "Montenegro" : selected === "SDN" ? "South Sudan" : "predecessor state"}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}