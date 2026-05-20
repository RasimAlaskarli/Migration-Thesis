import { useState, useEffect, useLayoutEffect, useRef } from "react";

/*
  Guided tour component.

  Renders a full-screen dim overlay with "spotlight" cutouts around one or
  more target elements, plus a tooltip card that stays at a fixed position
  for the entire tour (so the user's eye only tracks the highlights).

  Props:
    open    - boolean
    steps   - array of { id?, targets?, title, body, badges?, before?, after? }
              `id` matches a `data-tour-id` attribute. Can be:
                 - a string for a single spotlight
                 - an array of strings for multiple simultaneous spotlights
                 - omitted for "no spotlight" (welcome / conceptual)
              `targets` optionally overrides `id` and supports fixed spotlight
                 rectangles for animated UI regions.
              `badges` is optional; when true on a multi-target step, each
                 highlighted element gets a numbered circle at its top-left.
              `before` runs when the step becomes active.
    onClose - called when the tour ends or is dismissed
*/

const CARD_W = 360;
const HIGHLIGHT_PAD = 8;

// Horizontal + vertical gap between the period selector and the card
const CARD_GAP = 16;

// Compute the card's position — anchored above the period selector,
// horizontally centered on it. Stays in the same spot for every step so the
// user's eye only tracks the spotlights, not the narrator.
function getCardPos(cardH, viewport) {
  const rect = getRect("period-selector");
  if (rect) {
    const x = clamp(rect.x + rect.w / 2 - CARD_W / 2, 12, viewport.w - CARD_W - 12);
    const y = Math.max(12, rect.y - (cardH || 260) - CARD_GAP);
    return { top: y, left: x };
  }
  // Fallback if the period selector isn't mounted yet
  return { top: 80, left: 20 };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function getRect(id) {
  if (!id) return null;
  const el = document.querySelector(`[data-tour-id="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

function getFixedRect(fixedRect, viewport) {
  if (!fixedRect) return null;

  const x = fixedRect.left != null
    ? fixedRect.left
    : fixedRect.right != null && fixedRect.width != null
      ? viewport.w - fixedRect.right - fixedRect.width
      : 0;

  const y = fixedRect.top != null
    ? fixedRect.top
    : fixedRect.bottom != null && fixedRect.height != null
      ? viewport.h - fixedRect.bottom - fixedRect.height
      : 0;

  const w = fixedRect.width != null
    ? fixedRect.width
    : Math.max(0, viewport.w - x - (fixedRect.right || 0));

  const h = fixedRect.height != null
    ? fixedRect.height
    : Math.max(0, viewport.h - y - (fixedRect.bottom || 0));

  return { x, y, w, h };
}

// Normalize step.id into an array of {id, rect} objects in the order
// they were declared. Missing targets are dropped silently.
function resolveTargets(stepTargets, viewport) {
  if (!stepTargets) return [];
  const defs = Array.isArray(stepTargets) ? stepTargets : [stepTargets];
  return defs
    .map(target => {
      if (typeof target === "string") {
        return { id: target, rect: getRect(target) };
      }

      if (!target || typeof target !== "object") return null;

      const rect = getFixedRect(target.fixedRect, viewport) || getRect(target.id);
      return rect ? { id: target.id, rect } : null;
    })
    .filter(Boolean);
}

export default function Tour({ open, steps, onClose }) {
  const [idx, setIdx] = useState(0);
  const [, forceRerender] = useState(0);
  const [cardH, setCardH] = useState(0);
  const frameRef = useRef(null);
  const cardRef = useRef(null);

  // reset to step 0 whenever the tour is reopened
  useLayoutEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  // Run `before` hooks before paint so target UI is in place when the
  // spotlight resolves, avoiding full-screen "blank" flashes between steps.
  useLayoutEffect(() => {
    if (!open) return;
    const step = steps[idx];
    if (typeof step?.before === "function") {
      step.before();
    }
  }, [open, idx, steps]);

  // keyboard — arrows to navigate, escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === "Escape") { onClose?.(); return; }
      if (e.key === "ArrowRight" || e.key === "Enter") {
        setIdx(i => {
          if (i < steps.length - 1) return i + 1;
          onClose?.();
          return i;
        });
      }
      if (e.key === "ArrowLeft") setIdx(i => Math.max(0, i - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, steps.length, onClose]);

  // re-measure targets on resize / scroll / animated panels
  useLayoutEffect(() => {
    if (!open) return;
    const tick = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => forceRerender(n => n + 1));
    };
    window.addEventListener("resize", tick);
    window.addEventListener("scroll", tick, true);
    const t = setInterval(tick, 200);
    return () => {
      window.removeEventListener("resize", tick);
      window.removeEventListener("scroll", tick, true);
      clearInterval(t);
      cancelAnimationFrame(frameRef.current);
    };
  }, [open]);

  // Measure the card's actual height so it can be positioned above the
  // period selector without overlapping it.
  useLayoutEffect(() => {
    if (!open) return;
    if (cardRef.current) {
      const h = cardRef.current.offsetHeight;
      if (h && h !== cardH) setCardH(h);
    }
  });

  if (!open || !steps?.length) return null;

  const step = steps[idx];
  const viewport = { w: window.innerWidth, h: window.innerHeight };
  const targets = resolveTargets(step.targets || step.id, viewport);
  const cardPos = getCardPos(cardH, viewport);

  const isFirst = idx === 0;
  const isLast = idx === steps.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        fontFamily: "'Source Sans 3', sans-serif"
      }}
      aria-modal="true"
      role="dialog"
    >
      {/* dim overlay with N spotlight cutouts */}
      <svg
        width={viewport.w}
        height={viewport.h}
        style={{ position: "absolute", inset: 0, pointerEvents: "all" }}
        onClick={e => e.stopPropagation()}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width={viewport.w} height={viewport.h} fill="white" />
            {targets.map((t, i) => (
              <rect
                key={i}
                x={t.rect.x - HIGHLIGHT_PAD}
                y={t.rect.y - HIGHLIGHT_PAD}
                width={t.rect.w + HIGHLIGHT_PAD * 2}
                height={t.rect.h + HIGHLIGHT_PAD * 2}
                rx="8"
                ry="8"
                fill="black"
              />
            ))}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width={viewport.w}
          height={viewport.h}
          fill="rgba(15, 17, 22, 0.6)"
          mask="url(#tour-spotlight-mask)"
          style={{ transition: "all 0.25s ease" }}
        />
        {/* bright outline around each highlighted target */}
        {targets.map((t, i) => (
          <rect
            key={i}
            x={t.rect.x - HIGHLIGHT_PAD}
            y={t.rect.y - HIGHLIGHT_PAD}
            width={t.rect.w + HIGHLIGHT_PAD * 2}
            height={t.rect.h + HIGHLIGHT_PAD * 2}
            rx="8"
            ry="8"
            fill="none"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="1.5"
            style={{ transition: "all 0.25s ease", pointerEvents: "none" }}
          />
        ))}
      </svg>

      {/* numbered badges for multi-target overview steps */}
      {step.badges && targets.length > 1 && targets.map((t, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: t.rect.y - HIGHLIGHT_PAD - 12,
            left: t.rect.x - HIGHLIGHT_PAD - 12,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "#1c1f25",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Source Sans 3', sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            border: "2px solid #fff",
            pointerEvents: "none",
            transition: "all 0.25s ease"
          }}
        >
          {i + 1}
        </div>
      ))}

      {/* tooltip card — anchored above the period selector */}
      <div
        ref={cardRef}
        style={{
          position: "absolute",
          top: cardPos.top,
          left: cardPos.left,
          width: CARD_W,
          background: "#fff",
          borderRadius: 4,
          boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
          border: "1px solid #d8dce2",
          padding: 18,
          color: "#1c1f25",
          transition: "top 0.2s ease, left 0.2s ease"
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "#737a85",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: 600,
            marginBottom: 6
          }}
        >
          Step {idx + 1} of {steps.length}
        </div>

        <div
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontSize: 17,
            fontWeight: 600,
            marginBottom: 6
          }}
        >
          {step.title}
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.5, color: "#414956", marginBottom: 14 }}>
          {step.body}
        </div>

        {/* progress dots */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === idx ? 14 : 6,
                height: 4,
                borderRadius: 2,
                background: i === idx ? "#1c1f25" : "#d8dce2",
                transition: "width 0.2s, background 0.2s"
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#737a85",
              fontSize: 12,
              fontFamily: "'Source Sans 3', sans-serif",
              cursor: "pointer",
              padding: "6px 0"
            }}
          >
            Skip tour
          </button>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setIdx(i => Math.max(0, i - 1))}
              disabled={isFirst}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 500,
                background: "#eff1f4",
                color: isFirst ? "#b6bbc4" : "#1c1f25",
                border: "1px solid #d8dce2",
                borderRadius: 3,
                cursor: isFirst ? "default" : "pointer",
                fontFamily: "'Source Sans 3', sans-serif"
              }}
            >
              Back
            </button>
            <button
              onClick={() => {
                if (isLast) onClose?.();
                else setIdx(i => i + 1);
              }}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                background: "#1c1f25",
                color: "#fff",
                border: "1px solid #1c1f25",
                borderRadius: 3,
                cursor: "pointer",
                fontFamily: "'Source Sans 3', sans-serif"
              }}
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}