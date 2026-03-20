"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LineBadge from "./LineBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawLine {
  id: string;
  short_name: string;
  long_name: string;
  color: string;
  text_color: string;
}

interface LineScore {
  line: RawLine;
  delayScore: number;
  incidentScore: number;
  accessScore: number;
  composite: number;
}

interface ShareModalProps {
  scores: LineScore[];   // already sorted best → worst
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return "var(--signal-green)";
  if (score >= 40) return "var(--signal-yellow)";
  return "var(--signal-red)";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "GOOD";
  if (score >= 40) return "FAIR";
  return "POOR";
}

function tagline(lineName: string, rank: number, total: number): string {
  if (rank === 1) return `#1? That's basically a Swiss train. Cherish it.`;
  if (rank <= 5) return `Top 5. The ${lineName} is out here setting standards.`;
  if (rank <= 10) return `Solid. The ${lineName} is doing the work and asking nothing in return.`;
  if (rank <= Math.ceil(total / 2)) return `Middle of the pack. Could be worse. Often is.`;
  if (rank <= total - 4) return `The ${lineName}: arrival times are more of a vibe than a schedule.`;
  return `The ${lineName} said not today. Or yesterday. Or tomorrow.`;
}

function formatSnapshotTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "America/New_York",
  }) + " ET";
}

function buildCardUrl(ls: LineScore, rank: number, total: number, customTagline?: string, snapshotTime?: string): string {
  const p = new URLSearchParams({
    line: ls.line.short_name,
    rank: String(rank),
    total: String(total),
    delay: String(ls.delayScore),
    incident: String(ls.incidentScore),
    access: String(ls.accessScore),
    composite: String(ls.composite),
    color: ls.line.color,
    textColor: ls.line.text_color,
  });
  if (customTagline) p.set("tagline", customTagline);
  if (snapshotTime) p.set("snapshotTime", snapshotTime);
  return `/api/share-card?${p.toString()}`;
}

// ─── Segmented meter (DOM preview version) ───────────────────────────────────



// ─── Social icons (inline SVG, no dependency) ────────────────────────────────

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.261 5.636L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ─── Share Card Preview (DOM version) ────────────────────────────────────────
// Mirrors the 1080×1080 square layout from the API route.
// Authored at CARD_W × CARD_W px, then zoomed down to PREVIEW_W.

const CARD_W = 360;
const PREVIEW_W = 300;
const SCALE = PREVIEW_W / CARD_W;

function CardPreview({ ls, rank, total, customTagline, snapshotTime }: { ls: LineScore; rank: number; total: number; customTagline: string; snapshotTime: string }) {
  const compositeColor = scoreColor(ls.composite);

  return (
    <div className="mx-auto shrink-0 overflow-hidden" style={{ width: PREVIEW_W, maxWidth: "100%" }}>
      <div style={{ width: CARD_W, height: CARD_W, zoom: SCALE, background: "#f5f0e8", border: "4px solid #1a1a1a", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderBottom: "3px solid #1a1a1a", background: "#ebe6dc", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 999, border: "2px solid #1a1a1a", background: "#D82233", color: "#fff", fontSize: 8, fontWeight: 900, flexShrink: 0 }}>NY</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(26,26,26,0.55)", textTransform: "uppercase" }}>NYC Transit</span>
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.06em", color: "#1a1a1a", textTransform: "uppercase" }}>Line Performance</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "18px 26px 14px", justifyContent: "space-between" }}>

          {/* Top: badge + rank + tagline */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 90, height: 90, borderRadius: 999, border: "4px solid #1a1a1a", background: ls.line.color, color: ls.line.text_color, fontSize: 44, fontWeight: 900, lineHeight: 1, boxShadow: "3px 3px 0 rgba(0,0,0,0.2)", marginBottom: 12, flexShrink: 0 }}>
              {ls.line.short_name}
            </div>
            {/* Rank */}
            <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", color: "#1a1a1a", textAlign: "center", margin: 0, lineHeight: 1.1, marginBottom: 4 }}>
              Ranked #{rank} of {total}
            </p>
            <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,26,26,0.45)", margin: 0, marginBottom: 12 }}>
              {snapshotTime}
            </p>
            {/* Tagline */}
            <p style={{ fontSize: 11, color: "rgba(26,26,26,0.75)", textAlign: "center", lineHeight: 1.45, fontStyle: "italic", margin: 0, maxWidth: 260, wordBreak: "break-word" }}>
              &ldquo;{customTagline}&rdquo;
            </p>
          </div>

          {/* Bottom: 4-up score grid — no box, no label */}
          <div style={{ display: "flex", flexDirection: "row", width: "100%", borderTop: "2px solid rgba(26,26,26,0.12)", paddingTop: 12 }}>
            {([["Delay", ls.delayScore], ["Incident", ls.incidentScore], ["Accessibility", ls.accessScore], ["Composite", ls.composite]] as [string, number][]).map(([label, val], i, arr) => {
              const col = scoreColor(val);
              return (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, borderRight: i < arr.length - 1 ? "1px solid rgba(26,26,26,0.12)" : "none", padding: "0 4px" }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: col, lineHeight: 1, marginBottom: 3 }}>{val}</span>
                  <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: col, marginBottom: 4 }}>{scoreLabel(val)}</span>
                  <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(26,26,26,0.4)" }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 16px", borderTop: "3px solid #1a1a1a", background: "#ebe6dc", flexShrink: 0 }}>
          <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(26,26,26,0.4)" }}>nyctransit.app</span>
          <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(26,26,26,0.3)" }}>NYC Transit</span>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute bottom-16 left-1/2 -translate-x-1/2 retro-panel px-4 py-2 text-[11px] font-black tracking-widest uppercase text-ink whitespace-nowrap z-10"
    >
      {message}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ShareModal({ scores, onClose }: ShareModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [customTagline, setCustomTagline] = useState("");
  // Captured once when the modal opens — represents when the ranking was taken
  const [snapshotTime] = useState(() => formatSnapshotTime(new Date()));

  const total = scores.length;
  const selectedIndex = selectedId ? scores.findIndex((s) => s.line.id === selectedId) : -1;
  const selected = selectedIndex >= 0 ? scores[selectedIndex] : null;
  const rank = selectedIndex + 1;

  // Reset tagline to the auto-generated one whenever the selected line changes
  useEffect(() => {
    setCustomTagline(selected ? tagline(selected.line.short_name, rank, total) : "");
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Picker order: grouped by color family, then alphabetically/numerically within each group.
  // Group order mirrors the NYC subway map convention: red → green → purple → blue →
  // orange → yellow → brown → lime → grey shuttles → SIR.
  const pickerScores = useMemo(() => {
    const COLOR_GROUP: Record<string, number> = {
      "#d82233": 0, // Red    — 1 2 3
      "#009952": 1, // Green  — 4 5 6 6X
      "#9a38a1": 2, // Purple — 7 7X
      "#0062cf": 3, // Blue   — A C E
      "#eb6800": 4, // Orange — B D F FX M
      "#f6bc26": 5, // Yellow — N Q R W
      "#8e5c33": 6, // Brown  — J Z
      "#799534": 7, // Lime   — G
      "#7c858c": 8, // Grey   — L S (shuttles)
      "#08179c": 9, // Navy   — SIR
    };
    return [...scores].sort((a, b) => {
      const ga = COLOR_GROUP[a.line.color.toLowerCase()] ?? 99;
      const gb = COLOR_GROUP[b.line.color.toLowerCase()] ?? 99;
      if (ga !== gb) return ga - gb;
      return a.line.short_name.localeCompare(b.line.short_name, undefined, { numeric: true });
    });
  }, [scores]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }

  const handleDownload = useCallback(async () => {
    if (!selected) return;
    setIsDownloading(true);
    try {
      const url = buildCardUrl(selected, rank, total, customTagline, snapshotTime);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Card generation failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `nyc-transit-${selected.line.short_name.toLowerCase()}-card.png`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      showToast("Download failed — try again");
    } finally {
      setIsDownloading(false);
    }
  }, [selected, rank, total, customTagline, snapshotTime]);

  const handleShareX = useCallback(() => {
    if (!selected) return;
    const text = encodeURIComponent(
      `My favorite NYC subway line is the ${selected.line.short_name} — ranked #${rank} of ${total}. "${customTagline}" 🚇`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener");
  }, [selected, rank, total, customTagline]);

  const handleShareInstagram = useCallback(async () => {
    if (!selected) return;

    const cardUrl = buildCardUrl(selected, rank, total, customTagline, snapshotTime);
    const filename = `nyc-transit-${selected.line.short_name.toLowerCase()}-card.png`;

    let blob: Blob;
    try {
      const res = await fetch(cardUrl);
      if (!res.ok) throw new Error();
      blob = await res.blob();
    } catch {
      showToast("Download failed — try again");
      return;
    }

    // Use the Web Share API if available (mobile browsers + Safari on macOS).
    // This opens the native OS share sheet, letting users pick Instagram directly.
    if (typeof navigator.share === "function" && navigator.canShare?.({ files: [new File([blob], filename, { type: "image/png" })] })) {
      try {
        await navigator.share({
          files: [new File([blob], filename, { type: "image/png" })],
          title: `My favorite NYC subway line — the ${selected.line.short_name}`,
        });
        return;
      } catch (err) {
        // User cancelled the share sheet — don't show an error
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    // Fallback for desktop: download the image and open instagram.com
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
    showToast("Image saved — upload it to Instagram!");
  }, [selected, rank, total, customTagline, snapshotTime]);

  const handleCopyLink = useCallback(() => {
    if (!selected) return;
    const url = `${window.location.origin}${buildCardUrl(selected, rank, total, customTagline, snapshotTime)}`;
    void navigator.clipboard.writeText(url).then(() => {
      showToast("Card link copied!");
    });
  }, [selected, rank, total, customTagline, snapshotTime]);

  return (
    /* Backdrop — role="presentation" lets the dialog inside own the a11y semantics */
    <div
      role="presentation"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        className="retro-panel w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Share your favorite line"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-4 border-ink shrink-0">
          <div>
            <h2 className="text-base font-black tracking-[0.08em] uppercase text-ink">
              Share Your Line
            </h2>
            <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-ink/50 mt-0.5">
              Pick your favorite subway line to generate a share card
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink/50 hover:text-ink text-2xl font-black leading-none w-8 h-8 flex items-center justify-center"
            aria-label="Close share modal"
          >
            ×
          </button>
        </div>

        {/* Three-column body — line picker | card preview | share buttons */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Col 1: line picker */}
          <div className="sm:w-52 shrink-0 border-b-4 sm:border-b-0 sm:border-r-4 border-ink p-4 overflow-y-auto scrollbar-thin">
            <p className="text-[9px] font-black tracking-[0.16em] uppercase text-ink/50 mb-3">
              Select a line
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-3 gap-2">
              {pickerScores.map((ls) => {
                const isSelected = ls.line.id === selectedId;
                const lineRank = scores.findIndex((s) => s.line.id === ls.line.id) + 1;
                return (
                  <button
                    key={ls.line.id}
                    type="button"
                    onClick={() => setSelectedId(ls.line.id)}
                    aria-pressed={isSelected}
                    aria-label={`Select ${ls.line.short_name} line, ranked ${lineRank}`}
                    className="flex flex-col items-center gap-1 p-1.5 rounded transition-colors hover:bg-ink/5"
                    style={{
                      outline: isSelected ? `3px solid ${ls.line.color}` : "none",
                      outlineOffset: 2,
                    }}
                  >
                    <LineBadge
                      label={ls.line.short_name}
                      color={ls.line.color}
                      textColor={ls.line.text_color}
                      size="md"
                    />
                    <span className="text-[8px] font-bold text-ink/40 tabular-nums">#{lineRank}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Col 2: card preview — vertically centered, tighter padding */}
          <div className="flex-1 px-4 py-4 flex items-center justify-center overflow-y-auto scrollbar-thin border-b-4 sm:border-b-0 sm:border-r-4 border-ink relative">
            {selected ? (
              <CardPreview ls={selected} rank={rank} total={total} customTagline={customTagline} snapshotTime={snapshotTime} />
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-3">
                <div
                  className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-ink/20 text-4xl"
                  aria-hidden="true"
                >
                  🚇
                </div>
                <p className="text-[11px] font-black tracking-widest uppercase text-ink/40">
                  Pick a line to preview your card
                </p>
              </div>
            )}
            {toast && <Toast message={toast} />}
          </div>

          {/* Col 3: only shown once a line is selected */}
          {selected && (
            <div className="sm:w-44 shrink-0 p-4 flex flex-col gap-2 justify-start overflow-y-auto scrollbar-thin">
              {/* Tagline editor */}
              <div className="flex flex-col gap-1 mb-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="tagline-input"
                    className="text-[9px] font-black tracking-[0.16em] uppercase text-ink/50"
                  >
                    Tagline
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomTagline(tagline(selected.line.short_name, rank, total))}
                    className="text-[8px] font-bold tracking-[0.1em] uppercase text-ink/40 hover:text-ink/70 transition-colors"
                    aria-label="Reset tagline to auto-generated"
                  >
                    Reset
                  </button>
                </div>
                <textarea
                  id="tagline-input"
                  value={customTagline}
                  onChange={(e) => setCustomTagline(e.target.value)}
                  rows={3}
                  maxLength={150}
                  placeholder="Enter a custom tagline…"
                  className="w-full resize-none border-2 border-ink bg-[#ebe6dc] px-2 py-1.5 text-[10px] font-bold text-ink leading-relaxed focus:outline-none focus:border-ink scrollbar-thin"
                />
                <span className={`text-[8px] text-right tabular-nums ${customTagline.length >= 130 ? "text-amber-600" : "text-ink/30"}`}>
                  {customTagline.length}/150
                </span>
              </div>

              <p className="text-[9px] font-black tracking-[0.16em] uppercase text-ink/50 mb-1">
                Share
              </p>
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={isDownloading}
                className="flex items-center gap-2 retro-panel px-3 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase text-ink hover:opacity-80 disabled:opacity-40 transition-opacity w-full"
              >
                <IconDownload />
                {isDownloading ? "Generating…" : "Download PNG"}
              </button>

              <button
                type="button"
                onClick={handleShareX}
                className="flex items-center gap-2 retro-panel px-3 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase text-ink hover:opacity-80 transition-opacity w-full"
              >
                <IconX />
                X / Twitter
              </button>

              <button
                type="button"
                onClick={() => void handleShareInstagram()}
                className="flex items-center gap-2 retro-panel px-3 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase text-ink hover:opacity-80 transition-opacity w-full whitespace-nowrap"
              >
                <IconInstagram />
                Instagram
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-2 retro-panel px-3 py-2.5 text-[10px] font-black tracking-[0.1em] uppercase text-ink hover:opacity-80 transition-opacity w-full"
              >
                <IconCopy />
                Copy link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
