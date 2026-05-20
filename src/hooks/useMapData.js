import { useState, useEffect, useMemo } from "react";
import { HISTORICAL_TO_MODERN, MODERN_TO_HISTORICAL } from "../data/constants";

/*
  Migration JSON shape (post-cleanup):
    {
      "1990": { "USA": {ti, ai, to, ao}, ... },
      "1995": { ... },
      ...
      "_confidence": { "1990": { "USA-MEX": "moderate_confidence", ... }, ... },
      "_meta": { dataset_kind: "definitive_median_iqr" }
    }

  Values are medians across all source methods. Confidence is per-period and
  only carried for corridors with non-zero flow.
*/

export default function useMapData(intervalMode, selectedPeriods, selected) {
  const [mig5, setMig5] = useState(null);
  const [mig10, setMig10] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    import("../data/migrationData_5yr.json")
      .then(m => setMig5(m.default || m))
      .catch(() => {});

    import("../data/migrationData_10yr.json")
      .then(m => setMig10(m.default || m))
      .catch(() => {});

    import("../data/chartData.json")
      .then(c => setChartData(c.default || c))
      .catch(() => {});
  }, []);

  const rawMig = intervalMode === "10yr" ? mig10 : mig5;

  const confidence = useMemo(() => rawMig?._confidence || null, [rawMig]);

  // Strip meta keys out — each remaining key is a period with a
  // { country: {ti, ai, to, ao} } map.
  const migrationData = useMemo(() => {
    if (!rawMig) return null;
    const resolved = {};
    for (const [period, data] of Object.entries(rawMig)) {
      if (period.startsWith("_")) continue;
      resolved[period] = data || {};
    }
    return resolved;
  }, [rawMig]);

  const mData = useMemo(() => {
    if (!migrationData || !selected) return null;

    const fallback = MODERN_TO_HISTORICAL[selected];
    let ti = 0, to = 0;
    const ai = {}, ao = {};
    let usedFallback = false;

    for (const period of selectedPeriods) {
      let pd = migrationData[period]?.[selected];
      if (!pd && fallback) {
        pd = migrationData[period]?.[fallback];
        if (pd) usedFallback = true;
      }
      if (!pd) continue;

      ti += pd.ti || 0;
      to += pd.to || 0;

      for (const [k, v] of Object.entries(pd.ai || {})) {
        const mapped = HISTORICAL_TO_MODERN[k] || k;
        ai[mapped] = (ai[mapped] || 0) + v;
      }
      for (const [k, v] of Object.entries(pd.ao || {})) {
        const mapped = HISTORICAL_TO_MODERN[k] || k;
        ao[mapped] = (ao[mapped] || 0) + v;
      }
    }

    if (ti === 0 && to === 0) return null;
    return { ti, to, ai, ao, usesHistoricalData: usedFallback };
  }, [migrationData, selected, selectedPeriods]);

  const chartInfo = useMemo(() => {
    if (!chartData || !selected) return null;
    return chartData[selected] || null;
  }, [chartData, selected]);

  return {
    migrationData,
    chartData,
    mData,
    chartInfo,
    confidence,
  };
}