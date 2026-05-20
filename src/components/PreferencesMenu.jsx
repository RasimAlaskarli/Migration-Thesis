import { useState, useRef, useEffect } from "react";

/*
  Preferences popover — a chevron button that opens a small menu of
  display toggles. Designed to grow: add new entries to the `items`
  config in WorldMap and they render automatically.

  Props:
    preferences - { [key]: boolean }
    onChange    - (key, nextValue) => void
    items       - [{ key, label, description? }]
*/

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        width: "100%",
        padding: "8px 10px",
        background: "transparent",
        border: "none",
        borderRadius: 3,
        cursor: "pointer",
        fontFamily: "'Source Sans 3', sans-serif",
        textAlign: "left"
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#eff1f4")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "#1c1f25", fontWeight: 500 }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: "#737a85", marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>

      <div
        style={{
          width: 32,
          height: 18,
          borderRadius: 9,
          background: checked ? "#1c1f25" : "#c8ccd3",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.15s"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 16 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.15s",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
          }}
        />
      </div>
    </button>
  );
}

export default function PreferencesMenu({ preferences, onChange, items, open: openProp, onOpenChange }) {
  const [openInternal, setOpenInternal] = useState(false);
  const rootRef = useRef(null);

  // Allow WorldMap to control the open state (so the tour can force-open
  // the popover while that step is active). Falls back to internal state
  // when uncontrolled.
  const open = openProp !== undefined ? openProp : openInternal;
  const setOpen = onOpenChange || setOpenInternal;

  useEffect(() => {
    if (!open) return;
    const fn = e => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = e => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "absolute", bottom: 128, left: 20, zIndex: 5 }}>
      <button
        data-tour-id="preferences"
        onClick={() => setOpen(!open)}
        aria-label="Display preferences"
        aria-expanded={open}
        title="Display preferences"
        style={{
          background: open ? "#1c1f25" : "#fff",
          color: open ? "#fff" : "#1c1f25",
          border: "1px solid #b6bbc4",
          borderRadius: 3,
          width: 32,
          height: 32,
          padding: 0,
          cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s"
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s"
          }}
          aria-hidden="true"
        >
          <polyline points="18,15 12,9 6,15" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            minWidth: 240,
            background: "#fff",
            border: "1px solid #d8dce2",
            borderRadius: 4,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            padding: 6,
            fontFamily: "'Source Sans 3', sans-serif"
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#737a85",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "6px 10px 4px",
              fontWeight: 600
            }}
          >
            Display
          </div>
          {items.map(item => (
            <ToggleRow
              key={item.key}
              label={item.label}
              description={item.description}
              checked={!!preferences[item.key]}
              onChange={next => onChange(item.key, next)}
            />
          ))}
        </div>
      )}
    </div>
  );
}