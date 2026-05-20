import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";

import { PERIODS_5YR, PERIODS_10YR, NUM_TO_ISO3, TOPO_URL } from "../data/constants";
import { getName } from "../utils/formatters";

import useMapData from "../hooks/useMapData";
import useMapColors from "../hooks/useMapColors";

import CountryPanel from "./CountryPanel";
import CountrySearchBar from "./CountrySearchBar";
import GraphBuilder from "./GraphBuilder";
import FlowArcs from "./FlowArcs";
import PreferencesMenu from "./PreferencesMenu";
import Tour from "./Tour";
import { ZoomControls, PeriodSelector, ChoroplethSelector, HoverTooltip, ClickHint } from "./MapControls";

// Config for the Display preferences popover. Add an entry here to
// expose a new toggle; the menu renders from this list.
const PREF_ITEMS = [
  {
    key: "showArrows",
    label: "Migration flow arrows",
    description: "Draw arrows on the map for the top-5 corridors of the selected country."
  },
  {
    key: "showFlowLabels",
    label: "Always show flow labels",
    description: "Show the country name and flow count on every arrow. Off by default — labels appear on hover."
  }
];

// Demo country for tour steps that need a selected country — Germany has
// rich migration data across all periods and sits centered on the map.
const TOUR_DEMO_COUNTRY = "DEU";

export default function WorldMap() {
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const choroplethRef = useRef({});
  const selectedRef = useRef(null);
  const projectionRef = useRef(null);
  const centroidsRef = useRef({});

  const [world, setWorld] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [intervalMode, setIntervalMode] = useState("5yr");
  const [selectedPeriods, setSelectedPeriods] = useState(new Set(["2005"]));
  const [panelOpen, setPanelOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [choroplethMetric, setChoroplethMetric] = useState("none");
  const [mapSize, setMapSize] = useState({ width: innerWidth, height: innerHeight });

  // Lifted from CountryPanel so FlowArcs can render in sync with the panel
  const [panelTab, setPanelTab] = useState("stats");
  const [panelDirection, setPanelDirection] = useState("in");

  // User-togglable display preferences. Adding a new toggle means
  // adding a default here, an entry to PREF_ITEMS above, and wiring
  // the prop through to whichever component reads it.
  const [preferences, setPreferences] = useState({
    showArrows: true,
    showFlowLabels: false
  });
  const updatePreference = useCallback(
    (key, value) => setPreferences(p => ({ ...p, [key]: value })),
    []
  );

  const [tourOpen, setTourOpen] = useState(false);

  // Preferences popover open/close, lifted so the tour can force it open
  // during the "Display preferences" step.
  const [prefsOpen, setPrefsOpen] = useState(false);

  // Tour-driven pre-selection for the bilateral-flow demo step.
  const [bilateralDemoPick, setBilateralDemoPick] = useState(null);

  // First-visit hint — hides as soon as the user opens the tour or
  // interacts with a country. Stays hidden for the rest of the session.
  const [hintDismissed, setHintDismissed] = useState(false);

  // Tracks the current d3 zoom transform so React-rendered overlays (FlowArcs)
  // pan/zoom in lockstep with the d3-rendered map.
  const [zoomTransform, setZoomTransform] = useState("translate(0,0) scale(1)");

  const PERIODS = intervalMode === "10yr" ? PERIODS_10YR : PERIODS_5YR;
  const { migrationData, chartData, mData, chartInfo, confidence } = useMapData(intervalMode, selectedPeriods, selected);
  const choroplethColors = useMapColors(choroplethMetric, migrationData, chartData, selectedPeriods);

  // period helpers
  const togglePeriod = useCallback(p => {
    setSelectedPeriods(prev => {
      const next = new Set(prev);
      next.has(p) ? (next.size > 1 && next.delete(p)) : next.add(p);
      return next;
    });
  }, []);

  const toggleAllPeriods = useCallback(() => {
    if (selectedPeriods.size === PERIODS.length) {
      setSelectedPeriods(new Set([intervalMode === "10yr" ? "2000" : "2005"]));
    } else {
      setSelectedPeriods(new Set(PERIODS));
    }
  }, [selectedPeriods.size, PERIODS, intervalMode]);

  const switchInterval = useCallback(mode => {
    setIntervalMode(mode);
    setSelectedPeriods(new Set([mode === "10yr" ? "2000" : "2005"]));
  }, []);

  const sortedPeriods = useMemo(() => PERIODS.filter(p => selectedPeriods.has(p)), [selectedPeriods, PERIODS]);

  const periodLabel = useMemo(() => {
    const s = sortedPeriods;
    const step = intervalMode === "10yr" ? 10 : 5;
    if (!s.length) return "";
    if (s.length === 1) return s[0] + "–" + (+s[0] + step);
    return s[0] + "–" + (+s[s.length - 1] + step);
  }, [sortedPeriods, intervalMode]);

  // Guided tour steps. Defined inside the component so `before` hooks can
  // close over state setters and prepare the app state each step needs.
  // The tour card sits at a fixed position — only the spotlights move.
  const tourSteps = useMemo(() => [
    {
      title: "Welcome to the World Migration Atlas",
      body: "A quick walkthrough of what's here and how to use it. Use the Next button or the arrow keys to move through the tour.",
      before: () => {
        // Reset the app to a neutral starting state so later steps are predictable.
        setPanelOpen(false);
        setGraphOpen(false);
        setPanelTab("stats");
        setPanelDirection("in");
        setPrefsOpen(false);
        setBilateralDemoPick(null);
      }
    },
    {
      id: "map",
      title: "The map",
      body: "This is the world, 1960–2010. Click any country to open its panel — you'll see migration flows and demographic statistics for the periods you've selected.",
      before: () => {
        setPanelOpen(false);
        setGraphOpen(false);
        setPrefsOpen(false);
      }
    },
    {
      id: ["period-selector", "choropleth-selector", "preferences", "graph-builder"],
      badges: true,
      title: "The controls, at a glance",
      body: "Before we dive in, here's what each control does — we'll cover them one by one next. (1) Time periods. (2) Map shading. (3) Display preferences. (4) Graph Builder.",
      before: () => {
        setPanelOpen(false);
        setGraphOpen(false);
        setPrefsOpen(false);
      }
    },
    {
      id: "period-selector",
      title: "1. Time periods",
      body: "Each period represents a 5-year (or 10-year) window of migration. Select one or several to combine their flows. The All button toggles every period at once.",
      before: () => setPrefsOpen(false)
    },
    {
      id: "choropleth-selector",
      title: "2. Map shading",
      body: "Colour the whole map by a metric — net migration, total inflows, unemployment, and so on. Useful for spotting patterns across countries at a glance.",
      before: () => setPrefsOpen(false)
    },
    {
      id: "preferences",
      title: "3. Display preferences",
      body: "Toggle optional map features here — whether to draw flow arrows when a country is selected, and whether to always show their labels. The popover is open now so you can see the options.",
      before: () => setPrefsOpen(true)
    },
    {
      targets: [{ id: "country-panel", fixedRect: { top: 0, right: 0, bottom: 0, width: 430 } }],
      title: "Country panel — Statistics tab",
      body: "Click a country and a panel opens on the right. The Statistics tab shows unemployment, urbanization, median age, and net migration — with a time series for each. Here we've pre-selected Germany as an example.",
      before: () => {
        setPrefsOpen(false);
        setSelected(TOUR_DEMO_COUNTRY);
        setPanelOpen(true);
        setPanelTab("stats");
        setGraphOpen(false);
        setBilateralDemoPick(null);
      }
    },
    {
      targets: [{ id: "country-panel", fixedRect: { top: 0, right: 0, bottom: 0, width: 430 } }],
      title: "Country panel — Migration tab",
      body: "Switch to Migration and the panel lists the top 10 sources (immigration) or destinations (emigration) for the selected country. You can filter by continent and flip direction with the buttons at the top.",
      before: () => {
        setSelected(TOUR_DEMO_COUNTRY);
        setPanelOpen(true);
        setPanelTab("migration");
        setPanelDirection("in");
        setGraphOpen(false);
        setBilateralDemoPick(null);
      }
    },
    {
      targets: [{ id: "country-panel", fixedRect: { top: 0, right: 0, bottom: 0, width: 430 } }],
      title: "Searching a specific corridor",
      body: "You can also look at the flow between two specific countries. (1) Type a country into the search box — we've picked China as a demo. (2) The panel then shows the flow in both directions, along with a data-quality marker if applicable.",
      before: () => {
        setSelected(TOUR_DEMO_COUNTRY);
        setPanelOpen(true);
        setPanelTab("migration");
        setBilateralDemoPick("CHN");
      }
    },
    {
      targets: [{ id: "country-panel", fixedRect: { top: 0, right: 0, bottom: 0, width: 430 } }],
      title: "Reliability indicators",
      body: "Migration estimates come from several methods that don't always agree. Corridors with broad disagreement get a red dot, moderate disagreement a yellow dot, and tight agreement no dot at all — so you know which flows to trust.",
      before: () => {
        setSelected(TOUR_DEMO_COUNTRY);
        setPanelOpen(true);
        setPanelTab("migration");
        setBilateralDemoPick(null);
      }
    },
    {
      id: "map",
      title: "Flow arrows on the map",
      body: "On the Migration tab, the top corridors also render as curved arrows on the map. Hover an arrow to see its count; toggle permanent labels in the Display preferences menu.",
      before: () => {
        setSelected(TOUR_DEMO_COUNTRY);
        setPanelOpen(true);
        setPanelTab("migration");
        setBilateralDemoPick(null);
      }
    },
    {
      targets: [{ id: "graph-builder-panel", fixedRect: { top: 0, left: 0, bottom: 0, width: 500 } }],
      title: "4. Graph Builder",
      body: "Open the Graph Builder to plot any two variables against each other over time — immigration vs unemployment, net migration vs urbanization, etc. The right-hand country panel closes while Graph Builder is the focus.",
      before: () => {
        setSelected(TOUR_DEMO_COUNTRY);
        setGraphOpen(true);
        // Clear the right panel so the Graph Builder has full stage.
        setPanelOpen(false);
      }
    },
    {
      title: "That's the tour",
      body: "Click a country to start exploring. You can reopen this guide any time from the info button.",
      before: () => {
        setPanelOpen(false);
        setGraphOpen(false);
        setPrefsOpen(false);
        setBilateralDemoPick(null);
        setSelected(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  // window resize
  useEffect(() => {
    const fn = () => setMapSize({ width: innerWidth, height: innerHeight });
    addEventListener("resize", fn);
    return () => removeEventListener("resize", fn);
  }, []);

  // load topojson
  useEffect(() => {
    fetch(TOPO_URL).then(r => r.json()).then(setWorld).catch(console.error);
  }, []);

  // d3 map rendering
  useEffect(() => {
    if (!world || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("class", "map-group");
    const proj = d3.geoNaturalEarth1().fitSize([mapSize.width, mapSize.height * 0.95], { type: "Sphere" });
    const pathGen = d3.geoPath(proj);
    projectionRef.current = proj;

    // inline topojson decode (avoids pulling in the whole topojson library)
    const decode = (topo, obj) => {
      const { arcs, transform: tx } = topo;
      const decodeArc = idx => {
        const rev = idx < 0;
        const arc = arcs[rev ? ~idx : idx];
        if (!arc) return [];
        let x = 0, y = 0;
        const pts = arc.map(([dx, dy]) => {
          x += dx; y += dy;
          return tx ? [x * tx.scale[0] + tx.translate[0], y * tx.scale[1] + tx.translate[1]] : [x, y];
        });
        return rev ? pts.reverse() : pts;
      };
      return {
        type: "FeatureCollection",
        features: obj.geometries.map(geo => ({
          type: "Feature", id: geo.id, properties: geo.properties || {},
          geometry: geo.type === "Polygon"
            ? { type: "Polygon", coordinates: geo.arcs.map(ring => ring.flatMap(decodeArc)) }
            : geo.type === "MultiPolygon"
            ? { type: "MultiPolygon", coordinates: geo.arcs.map(poly => poly.map(ring => ring.flatMap(decodeArc))) }
            : null
        }))
      };
    };

    const geo = decode(world, world.objects.countries);

    // Compute a centroid (lng, lat) for every country. For MultiPolygon
    // geometries we use the centroid of the *largest* polygon by area,
    // not the mean of all polygons — that way France's centroid lands in
    // metropolitan France, not drifted toward French Guiana / Réunion.
    // Same for the US (Alaska/Hawaii), UK (overseas territories), etc.
    const centroidFromLargestPoly = (feature) => {
      if (!feature.geometry) return null;
      if (feature.geometry.type === "Polygon") {
        return d3.geoCentroid(feature);
      }
      if (feature.geometry.type === "MultiPolygon") {
        let best = null;
        let bestArea = -1;
        for (const poly of feature.geometry.coordinates) {
          const single = { type: "Feature", geometry: { type: "Polygon", coordinates: poly } };
          const area = d3.geoArea(single);
          if (area > bestArea) {
            bestArea = area;
            best = single;
          }
        }
        return best ? d3.geoCentroid(best) : d3.geoCentroid(feature);
      }
      return d3.geoCentroid(feature);
    };

    const centroids = {};
    for (const f of geo.features) {
      if (!f.geometry) continue;
      const iso = NUM_TO_ISO3[String(+f.id)];
      if (!iso) continue;
      try {
        const c = centroidFromLargestPoly(f);
        if (c && isFinite(c[0]) && isFinite(c[1])) centroids[iso] = c;
      } catch {
        // ignore bad geometries
      }
    }
    centroidsRef.current = centroids;

    // background layers
    g.append("path").datum({ type: "Sphere" })
      .attr("d", pathGen).attr("fill", "#eef3f8").attr("stroke", "#bccbd8").attr("stroke-width", 0.5);
    g.append("path").datum(d3.geoGraticule()())
      .attr("d", pathGen).attr("fill", "none").attr("stroke", "#cad9e4").attr("stroke-width", 0.3);

    // countries
    g.selectAll("path.country")
      .data(geo.features.filter(f => f.geometry))
      .join("path")
      .attr("class", "country")
      .attr("d", pathGen)
      .attr("fill", d => choroplethRef.current[NUM_TO_ISO3[String(+d.id)]] || "#faf6ee")
      .attr("stroke", "#a8a59c").attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        const iso = NUM_TO_ISO3[String(+d.id)];
        if (iso) { setSelected(iso); setPanelOpen(true); setHintDismissed(true); }
      })
      .on("mouseenter", (ev, d) => {
        setHovered(NUM_TO_ISO3[String(+d.id)]);
        d3.select(ev.target).attr("stroke-width", 1.5);
      })
      .on("mouseleave", (ev, d) => {
        setHovered(null);
        const iso = NUM_TO_ISO3[String(+d.id)];
        d3.select(ev.target).attr("stroke-width", iso === selectedRef.current ? 1.5 : 0.5);
      });

    // scaleExtent caps the zoom range; translateExtent caps how far the
    // map can be panned. Without translateExtent, the user can drag the
    // entire globe off-screen — d3 by default allows infinite panning.
    // The extent is the world rectangle [0, 0] to [mapSize.width, mapSize.height]
    // matching the SVG canvas; d3 scales this by the current zoom level
    // automatically so the boundary holds at every zoom level.
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [mapSize.width, mapSize.height]])
      .on("zoom", e => {
        g.attr("transform", e.transform);
        // Keep React-rendered overlays in sync with d3's pan/zoom.
        setZoomTransform(e.transform.toString());
      });
    svg.call(zoom);
    zoomRef.current = zoom;
    setZoomTransform("translate(0,0) scale(1)");
  }, [world, mapSize]);

  // repaint on selection / choropleth change
  useEffect(() => {
    choroplethRef.current = choroplethColors;
    selectedRef.current = selected;
    if (!svgRef.current) return;
    d3.select(svgRef.current).selectAll("path.country")
      .attr("fill", function (d) {
        const iso = NUM_TO_ISO3[String(+d.id)];
        if (iso === selected) return "#e8e0cf";
        return choroplethColors[iso] || "#faf6ee";
      })
      .attr("stroke", "#a8a59c")
      .attr("stroke-width", function (d) {
        return NUM_TO_ISO3[String(+d.id)] === selected ? 1.5 : 0.5;
      });
  }, [selected, choroplethColors]);

  // zoom buttons
  const zoomIn = () => svgRef.current && zoomRef.current &&
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.5);
  const zoomOut = () => svgRef.current && zoomRef.current &&
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.67);
  const zoomReset = () => svgRef.current && zoomRef.current &&
    d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);

  // Search bar callback: select the country and open the panel.
  // Earlier versions also panned/zoomed the map to the country, but that
  // was disorienting — losing your current view to chase a small country
  // is rarely what the user wants. The choropleth shading + panel open
  // is enough to communicate "here it is."
  const onSearchSelect = useCallback(iso => {
    setSelected(iso);
    setPanelOpen(true);
    setHintDismissed(true);
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100vh", position: "fixed", top: 0, left: 0,
      fontFamily: "'Source Sans 3', sans-serif", background: "#eef3f8", overflow: "hidden"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&family=Source+Serif+4:wght@400;600&display=swap" rel="stylesheet" />

      <div style={{ position: "absolute", inset: 0 }}>
        <svg ref={svgRef} data-tour-id="map" width={mapSize.width} height={mapSize.height} style={{ display: "block" }} />

        {/* React-controlled overlay for migration flow arcs. Mirrors the d3
            zoom transform so arcs pan/zoom with the map. Pointer events off
            so country clicks still land on the d3 layer below. */}
        <svg
          width={mapSize.width}
          height={mapSize.height}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          <g transform={zoomTransform}>
            <FlowArcs
              selected={selected}
              direction={panelDirection}
              mData={mData}
              projection={projectionRef.current}
              centroids={centroidsRef.current}
              visible={preferences.showArrows && panelOpen && panelTab === "migration"}
              showLabels={preferences.showFlowLabels}
            />
          </g>
        </svg>

        {/* title with info/tour button */}
        <div style={{ position: "absolute", top: 16, left: 20, fontFamily: "'Source Serif 4', serif", fontSize: 22, fontWeight: 600, color: "#1c1f25", letterSpacing: "-0.02em" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>World Migration Atlas</span>
            <button
              onClick={() => { setHintDismissed(true); setTourOpen(true); }}
              aria-label="Open guided tour"
              title="Guided tour"
              style={{
                width: 24,
                height: 24,
                padding: 0,
                background: "#fff",
                color: "#1c1f25",
                border: "1px solid #b6bbc4",
                borderRadius: "50%",
                fontFamily: "'Source Serif 4', serif",
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              i
            </button>
          </div>
          <div style={{ fontSize: 12, fontWeight: 400, color: "#737a85", fontFamily: "'Source Sans 3', sans-serif", marginTop: 2 }}>
            Bilateral flows &amp; demographics · 1960–2010
          </div>
        </div>

        <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={zoomReset} />
        <ChoroplethSelector value={choroplethMetric} onChange={setChoroplethMetric} panelOpen={panelOpen} />
        <CountrySearchBar onSelect={onSearchSelect} panelOpen={panelOpen} />

        <button data-tour-id="graph-builder" onClick={() => setGraphOpen(o => !o)} style={{
          position: "absolute", top: 70, left: 20, background: graphOpen ? "#1c1f25" : "#fff",
          color: graphOpen ? "#fff" : "#1c1f25", border: "1px solid #b6bbc4", borderRadius: 4,
          padding: "8px 12px", fontSize: 11, fontWeight: 600, fontFamily: "'Source Sans 3', sans-serif",
          cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
        }}>
          <span style={{ fontSize: 14 }}>📊</span> Graph Builder
        </button>

        <PreferencesMenu
          preferences={preferences}
          onChange={updatePreference}
          items={PREF_ITEMS}
          open={prefsOpen}
          onOpenChange={setPrefsOpen}
        />

        <button onClick={() => selected && setPanelOpen(o => !o)} style={{
          position: "absolute", top: 110, right: panelOpen ? 450 : 20,
          background: panelOpen ? "#1c1f25" : "#fff",
          color: panelOpen ? "#fff" : (selected ? "#1c1f25" : "#9aa0aa"),
          border: "1px solid #b6bbc4", borderRadius: 4, padding: "8px 12px",
          fontSize: 11, fontWeight: 600, fontFamily: "'Source Sans 3', sans-serif",
          cursor: selected ? "pointer" : "default", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          display: "flex", alignItems: "center", gap: 6,
          transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)", opacity: selected ? 1 : 0.7
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
            {!panelOpen && <line x1="12" y1="8" x2="12" y2="16" />}
          </svg>
          {selected ? getName(selected) : "Click on any country"}
        </button>

        <PeriodSelector selectedPeriods={selectedPeriods} onTogglePeriod={togglePeriod}
          onToggleAll={toggleAllPeriods} intervalMode={intervalMode}
          onIntervalChange={switchInterval} periods={PERIODS} />
        <HoverTooltip countryName={hovered ? getName(hovered) : null} />
        <ClickHint visible={!hintDismissed && !selected && !tourOpen} />
      </div>

      <CountryPanel selected={selected} panelOpen={panelOpen} onClose={() => setPanelOpen(false)}
        periodLabel={periodLabel} sortedPeriods={sortedPeriods} selectedPeriods={selectedPeriods}
        mData={mData} chartInfo={chartInfo} intervalMode={intervalMode}
        confidence={confidence}
        tab={panelTab} onTabChange={setPanelTab}
        direction={panelDirection} onDirectionChange={setPanelDirection}
        bilateralDemoPick={bilateralDemoPick} />

      <GraphBuilder open={graphOpen} onClose={() => setGraphOpen(false)} selected={selected}
        chartInfo={chartInfo} migrationData={migrationData} intervalMode={intervalMode}
        selectedPeriods={selectedPeriods} />

      <Tour open={tourOpen} steps={tourSteps} onClose={() => setTourOpen(false)} />
    </div>
  );
}