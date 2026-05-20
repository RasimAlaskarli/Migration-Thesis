import { useMemo } from "react";
import * as d3 from "d3";
import { HISTORICAL_TO_MODERN } from "../data/constants";

/*
  Computes a { [iso3]: colorString } map for every country based on the
  currently selected choropleth metric, migration data, and chart data.
  Returns an empty object when metric is "none".
*/

export default function useMapColors(metric, migrationData, chartData, selectedPeriods) {
  return useMemo(() => {
    if (metric === "none") return {};
    if (metric === "countryColors") {
      const palette = [
        "#d9c27a", "#91b7a7", "#d78f6a", "#889fbd", "#b79ac8",
        "#7fb0c9", "#c9a66b", "#9eb77c", "#d7a7b8", "#8fa68a",
        "#c58d86", "#9a95c7", "#7fb7a1", "#d5b982", "#a7a2d6"
      ];
      const colors = {};
      const codeHash = code => [...code].reduce((acc, ch) => acc * 33 + ch.charCodeAt(0), 7);

      // Use the country codes present in the loaded datasets so this mode
      // covers the same map population as the data-backed choropleths.
      const codes = new Set([
        ...Object.keys(chartData || {}),
        ...Object.values(migrationData || {}).flatMap(period => Object.keys(period || {}))
      ]);

      for (const rawCode of codes) {
        const code = HISTORICAL_TO_MODERN[rawCode] || rawCode;
        colors[code] = palette[codeHash(code) % palette.length];
      }
      return colors;
    }

    const values = {};

    // migration-based metrics
    if (metric === "netMigration" && migrationData) {
      for (const p of selectedPeriods) {
        const pd = migrationData[p];
        if (!pd) continue;
        for (const [code, d] of Object.entries(pd)) {
          const mapped = HISTORICAL_TO_MODERN[code] || code;
          values[mapped] = (values[mapped] || 0) + (d.ti || 0) - (d.to || 0);
        }
      }
    // demographic metrics from chartData
    } else if (chartData) {
      const key = { unemployment: "unemployment", urbanization: "urbanization", medianAge: "medianAge", population: "population" }[metric];
      if (key) {
        for (const [code, d] of Object.entries(chartData)) {
          if (!d[key]) continue;
          const periodVals = Array.from(selectedPeriods)
            .map(p => d[key][p])
            .filter(v => v != null);
          if (periodVals.length) {
            values[code] = periodVals.reduce((a, b) => a + b, 0) / periodVals.length;
          }
        }
      }
    }

    // build color scale
    const numericVals = Object.values(values).filter(v => v !== 0 && isFinite(v));
    if (!numericVals.length) return {};
    numericVals.sort(d3.ascending);

    const colors = {};

    if (metric === "netMigration") {
      const absMax = Math.max(
        Math.abs(d3.quantile(numericVals, 0.05)),
        Math.abs(d3.quantile(numericVals, 0.95))
      );
      const scale = d3.scaleLinear()
        .domain([-absMax, 0, absMax])
        .range(["#c44e52", "#f5f2ed", "#4878a8"])
        .clamp(true);
      for (const [code, val] of Object.entries(values)) colors[code] = scale(val);
    } else {
      const lo = d3.quantile(numericVals, 0.05);
      const hi = d3.quantile(numericVals, 0.95);
      const palette =
        metric === "unemployment" ? ["#fef0e4", "#c2703e"] :
        metric === "urbanization" ? ["#eef4ef", "#2d6a3f"] :
        metric === "population" ? ["#f4efe7", "#7e5b3d"] :
        ["#eef1f4", "#3d5a72"];
      const scale = d3.scaleLinear().domain([lo, hi]).range(palette).clamp(true);
      for (const [code, val] of Object.entries(values)) colors[code] = scale(val);
    }

    return colors;
  }, [metric, migrationData, chartData, selectedPeriods]);
}
