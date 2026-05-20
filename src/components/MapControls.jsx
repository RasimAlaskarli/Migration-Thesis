// zoom, period selector, choropleth dropdown, hover tooltip, click hint

export function ZoomControls({ onZoomIn, onZoomOut, onReset }) {
  const btn = {
    width: 32, height: 32, border: "1px solid #b6bbc4", borderRadius: 3,
    background: "#fff", color: "#1c1f25", fontSize: 16, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
  };
  return (
    <div style={{ position: "absolute", bottom: 20, left: 20, display: "flex", flexDirection: "column", gap: 4 }}>
      <button onClick={onZoomIn} style={btn}>+</button>
      <button onClick={onZoomOut} style={btn}>−</button>
      <button onClick={onReset} style={btn}>⟲</button>
    </div>
  );
}

export function PeriodSelector({
  selectedPeriods,
  onTogglePeriod,
  onToggleAll,
  intervalMode,
  onIntervalChange,
  periods
}) {
  const allOn = selectedPeriods.size === periods.length;

  const toggle = active => ({
    padding: "4px 8px", fontSize: 10, fontWeight: 600,
    background: active ? "#1c1f25" : "#e8ebef",
    color: active ? "#fff" : "#737a85",
    border: "none", borderRadius: 2, cursor: "pointer",
    fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.15s"
  });

  return (
    <div data-tour-id="period-selector" style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 2, background: "#fff", padding: 4, borderRadius: 4, boxShadow: "0 1px 6px rgba(0,0,0,0.1)", border: "1px solid #d8dce2", alignItems: "center" }}>
        <button onClick={onToggleAll} style={{
          padding: "5px 8px", fontSize: 10, fontWeight: 600,
          background: allOn ? "#1c1f25" : "#e8ebef",
          color: allOn ? "#fff" : "#737a85",
          border: "none", borderRadius: 3, cursor: "pointer",
          fontFamily: "'Source Sans 3', sans-serif",
          textTransform: "uppercase", letterSpacing: "0.03em", marginRight: 4
        }}>{allOn ? "Clear" : "All"}</button>

        <div style={{ width: 1, height: 16, background: "#d8dce2", marginRight: 2 }} />

        {periods.map(p => (
          <button key={p} onClick={() => onTogglePeriod(p)} style={{
            padding: "5px 8px", fontSize: 11,
            fontWeight: selectedPeriods.has(p) ? 600 : 400,
            background: selectedPeriods.has(p) ? "#1c1f25" : "transparent",
            color: selectedPeriods.has(p) ? "#fff" : "#737a85",
            border: "none", borderRadius: 3, cursor: "pointer",
            fontFamily: "'Source Sans 3', sans-serif", transition: "all 0.15s"
          }}>{p}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 2, background: "#fff", padding: 3, borderRadius: 3, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #d8dce2" }}>
        <button onClick={() => onIntervalChange("5yr")} style={toggle(intervalMode === "5yr")}>5-year</button>
        <button onClick={() => onIntervalChange("10yr")} style={toggle(intervalMode === "10yr")}>10-year</button>
      </div>
    </div>
  );
}

export function ChoroplethSelector({ value, onChange, panelOpen }) {
  const stops = {
    netMigration:     ["#c44e52", "#e8a8a9", "#eff1f4", "#8fb3cf", "#4878a8"],
    population:       ["#f4efe7", "#c6a06d", "#7e5b3d"],
    unemployment:     ["#fef0e4", "#daa070", "#c2703e"],
    urbanization:     ["#eef4ef", "#6aad7a", "#2d6a3f"],
    medianAge:        ["#eef1f4", "#7a9ab0", "#3d5a72"]
  };
  const labels = {
    netMigration: ["Emigration", "Immigration"],
    population: ["Low", "High"],
    unemployment: ["Low", "High"], urbanization: ["Low", "High"],
    medianAge: ["Young", "Old"]
  };
  const showLegend = value !== "none" && value !== "countryColors";

  return (
    <div data-tour-id="choropleth-selector" style={{
      position: "absolute", top: 16, right: panelOpen ? 450 : 20,
      transition: "right 0.35s cubic-bezier(0.4,0,0.2,1)",
      background: "#fff", padding: "8px 12px", borderRadius: 4,
      boxShadow: "0 1px 6px rgba(0,0,0,0.1)", border: "1px solid #d8dce2"
    }}>
      <div style={{ fontSize: 10, color: "#737a85", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Map shading</div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        fontSize: 12, fontFamily: "'Source Sans 3', sans-serif", padding: "4px 8px",
        borderRadius: 2, border: "1px solid #c8ccd3", background: "#fafbfc",
        color: "#1c1f25", cursor: "pointer", outline: "none"
      }}>
        <option value="none">None</option>
        <option value="countryColors">Political map</option>
        <option value="netMigration">Net migration</option>
        <option value="population">Population</option>
        <option value="unemployment">Unemployment</option>
        <option value="urbanization">Urbanization</option>
        <option value="medianAge">Median age</option>
      </select>

      {showLegend && (
        <div style={{ marginTop: 8 }}>
          <div style={{ height: 8, borderRadius: 2, width: "100%", minWidth: 120, background: `linear-gradient(to right, ${stops[value].join(", ")})` }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
            <span style={{ fontSize: 9, color: "#737a85" }}>{labels[value][0]}</span>
            <span style={{ fontSize: 9, color: "#737a85" }}>{labels[value][1]}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function HoverTooltip({ countryName }) {
  if (!countryName) return null;
  return (
    <div style={{
      position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)",
      background: "#fff", padding: "6px 14px", borderRadius: 3,
      boxShadow: "0 1px 6px rgba(0,0,0,0.1)", border: "1px solid #d8dce2",
      fontSize: 13, color: "#1c1f25", fontWeight: 600, pointerEvents: "none"
    }}>{countryName}</div>
  );
}

export function ClickHint({ visible }) {
  if (!visible) return null;
  return (
    <>
      <style>{`
        @keyframes tourHintPulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
      `}</style>
      <svg
        width="350"
        height="300"
        viewBox="7 0 350 300"
        style={{
          position: "absolute",
          top: "31%",
          left: "22%",
          transform: "translate(-50%, -50%)",
          overflow: "visible",
          pointerEvents: "none",
          animation: "tourHintPulse 2s ease-in-out infinite"
        }}
      >
        <path
          d="M322 220 L118 220 L118 26"
          fill="none"
          stroke="#737a85"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M108 40 L118 26 L128 40"
          fill="none"
          stroke="#737a85"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{
        position: "absolute", top: "38%", left: "50%", transform: "translate(-50%, -50%)",
        color: "#1c1f25", fontSize: 20, fontStyle: "italic",
        pointerEvents: "none", fontFamily: "'Source Serif 4', serif",
        textAlign: "center", lineHeight: 1.5, maxWidth: 540,
        animation: "tourHintPulse 2s ease-in-out infinite"
      }}>
        New here? Click the{" "}
        <span style={{
          display: "inline-flex",
          width: 22,
          height: 22,
          borderRadius: "50%",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          color: "#1c1f25",
          border: "1px solid #b6bbc4",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          fontStyle: "normal",
          fontSize: 13,
          fontWeight: 600,
          verticalAlign: "middle",
          margin: "0 4px"
        }}>i</span>
        on the top left — otherwise, select a country.
      </div>
    </>
  );
}