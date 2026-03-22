"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LineBadge from "./LineBadge";
import ShareCardPreview from "./ShareCardPreview";
import * as ui from "./styles/ShareModal.styles";

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

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={ui.toast}
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
      className={ui.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        className={ui.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Share your favorite line"
      >
        {/* Modal header */}
        <div className={ui.modalHeader}>
          <div>
            <h2 className={ui.modalTitle}>
              Share Your Line
            </h2>
            <p className={ui.modalSubtitle}>
              Pick your favorite subway line to generate a share card
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={ui.closeButton}
            aria-label="Close share modal"
          >
            ×
          </button>
        </div>

        {/* Three-column body — line picker | card preview | share buttons */}
        <div className={ui.bodyColumns}>
          {/* Col 1: line picker */}
          <div className={ui.pickerColumn}>
            <p className={ui.pickerTitle}>
              Select a line
            </p>
            <div className={ui.pickerGrid}>
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
                    className={`${ui.linePickerButtonBase} ${
                      isSelected ? ui.linePickerButtonSelected : ui.linePickerButtonUnselected
                    }`}
                    style={
                      isSelected ? { outlineColor: ls.line.color } : undefined
                    }
                  >
                    <LineBadge
                      label={ls.line.short_name}
                      color={ls.line.color}
                      textColor={ls.line.text_color}
                      size="md"
                    />
                    <span className={ui.linePickerRank}>#{lineRank}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Col 2: card preview — vertically centered, tighter padding */}
          <div className={ui.previewColumn}>
            {selected ? (
              <ShareCardPreview
                ls={selected}
                rank={rank}
                total={total}
                customTagline={customTagline}
                snapshotTime={snapshotTime}
              />
            ) : (
              <div className={ui.previewPlaceholder}>
                <div
                  className={ui.previewPlaceholderIcon}
                  aria-hidden="true"
                >
                  🚇
                </div>
                <p className={ui.previewPlaceholderText}>
                  Pick a line to preview your card
                </p>
              </div>
            )}
            {toast && <Toast message={toast} />}
          </div>

          {/* Col 3: tagline + share (always mounted on mobile so scroll reveals it; locked until line picked) */}
          <div className={ui.actionsColumn}>
            {selected ? (
              <>
                <div className={ui.taglineSection}>
                  <div className={ui.taglineLabelRow}>
                    <label
                      htmlFor="tagline-input"
                      className={ui.taglineLabel}
                    >
                      Tagline
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomTagline(tagline(selected.line.short_name, rank, total))}
                      className={ui.taglineReset}
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
                    className={ui.taglineTextarea}
                  />
                  <span className={ui.taglineCountClassName(customTagline.length)}>
                    {customTagline.length}/150
                  </span>
                </div>

                <p className={ui.shareSectionTitle}>
                  Share
                </p>
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  disabled={isDownloading}
                  className={ui.shareActionButtonDisabled}
                >
                  <IconDownload />
                  {isDownloading ? "Generating…" : "Download PNG"}
                </button>

                <button
                  type="button"
                  onClick={handleShareX}
                  className={ui.shareActionButton}
                >
                  <IconX />
                  X / Twitter
                </button>

                <button
                  type="button"
                  onClick={() => void handleShareInstagram()}
                  className={ui.shareInstagramButton}
                >
                  <IconInstagram />
                  Instagram
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={ui.shareActionButton}
                >
                  <IconCopy />
                  Copy link
                </button>
              </>
            ) : (
              <p className={ui.actionsLockedHint}>
                Select a line above to unlock the card preview and sharing options. On a phone, scroll the modal to see each section.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
