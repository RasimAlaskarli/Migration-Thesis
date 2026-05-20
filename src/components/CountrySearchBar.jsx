import { useState, useMemo, useRef, useEffect } from "react";
import { CODE_TO_NAME } from "../dataset/constants.js";
import { getFlagEmoji, getName } from "../utils/formatters.js";

/*
  Top-level country search.

  Rendering an input and a dropdown overlay. When the user picks a country,
  onSelect(iso3) fires and WorldMap handles the actual selection, panel-open, and pan/zoom-to-country side effects

  Keyboard:
    - ArrowDown / ArrowUp move the highlighted match
    - Enter selects the highlighted match
    - Escape clears the query and closes the dropdown
*/
export default function CountrySearchBar({ onSelect, panelOpen }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  // Sorted list of all (ISO3, name) pairs. Excludes non-3-letter codes and any ISO codes that have no display name resolved through getName
  const allCountries = useMemo(() => {
    return Object.keys(CODE_TO_NAME)
      .filter(c => c.length === 3)
      .map(c => ({ code: c, name: getName(c) }))
      .filter(x => x.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filter to top 8 matches by case-insensitive substring on either the name or the country code itself
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const starts = [];
    const contains = [];
    for (const c of allCountries) {
      const nameLower = c.name.toLowerCase();
      if (nameLower.startsWith(q) || c.code.toLowerCase() === q) {
        starts.push(c);
      } else if (nameLower.includes(q)) {
        contains.push(c);
      }
    }
    // Prefers name-start matches over substring matches
    return [...starts, ...contains].slice(0, 8);
  }, [query, allCountries]);

  // Reset the highlighted row whenever the match list changes
  useEffect(() => { setActiveIdx(0); }, [query]);

  // Click outside the search to close the dropdown
  useEffect(() => {
    if (!open) return;
    const onDoc = e => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function pick(code) {
    onSelect(code);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e) {
    if (!matches.length) {
      if (e.key === "Escape") {
        setQuery("");
        setOpen(false);
        inputRef.current?.blur();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(matches[activeIdx].code);
    } else if (e.key === "Escape") {
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  // Position the bar at top-center of the map. When the right-side panel
  // is open, shift the box leftward by half the panel width so the search
  // stays centered on the visible map area rather than the full viewport
  const horizontalShift = panelOpen ? -215 : 0;

  return (
    <div
      ref={rootRef}
      data-tour-id="country-search"
      onMouseDown={e => e.stopPropagation()}
      onWheel={e => e.stopPropagation()}
      style={{
        position: "absolute",
        top: 16,
        left: "50%",
        transform: `translateX(calc(-50% + ${horizontalShift}px))`,
        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        width: 280,
        zIndex: 6
      }}
    >
      {/* Magnifying glass icon */}
      <div style={{ position: "relative" }}>
        <svg
          width="14"
          height="14"
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
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search for a country..."
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          style={{
            width: "100%",
            padding: "8px 12px 8px 32px",
            fontSize: 13,
            fontFamily: "'Source Sans 3', sans-serif",
            background: "#fafbfc",
            border: "1px solid #c8ccd3",
            borderRadius: 3,
            color: "#1c1f25",
            outline: "none",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            boxSizing: "border-box"
          }}
        />

        {/* Clear button — only when there's a query */}
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            aria-label="Clear search"
            style={{
              position: "absolute",
              right: 6,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              padding: 4,
              cursor: "pointer",
              color: "#737a85",
              fontSize: 14,
              lineHeight: 1
            }}
          >
            ✕
          </button>
        )}
      </div>

      {open && matches.length > 0 && (
        <div
          style={{
            marginTop: 4,
            background: "#fff",
            border: "1px solid #d8dce2",
            borderRadius: 3,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            overflow: "hidden",
            maxHeight: 280,
            overflowY: "auto"
          }}
        >
          {matches.map((c, i) => {
            const flag = getFlagEmoji(c.code);
            const isActive = i === activeIdx;
            return (
              <div
                key={c.code}
                onClick={() => pick(c.code)}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px",
                  fontSize: 13,
                  cursor: "pointer",
                  background: isActive ? "#eff1f4" : "transparent",
                  color: "#1c1f25",
                  fontFamily: "'Source Sans 3', sans-serif"
                }}
              >
                {flag && <span style={{ fontSize: 14, lineHeight: 1 }}>{flag}</span>}
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: 10, color: "#9aa0aa", letterSpacing: "0.04em" }}>{c.code}</span>
              </div>
            );
          })}
        </div>
      )}

      {open && query.trim() && matches.length === 0 && (
        <div
          style={{
            marginTop: 4,
            background: "#fff",
            border: "1px solid #d8dce2",
            borderRadius: 3,
            padding: "10px 12px",
            fontSize: 12,
            color: "#737a85",
            fontFamily: "'Source Sans 3', sans-serif",
            fontStyle: "italic",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)"
          }}
        >
          No countries match "{query}"
        </div>
      )}
    </div>
  );
}
