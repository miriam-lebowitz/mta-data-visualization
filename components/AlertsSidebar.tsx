"use client";

import { useCallback, useEffect, useState } from "react";

interface Alert {
  id: string;
  line: string;
  header: string;
  description: string;
  severity: "normal" | "minor" | "major";
  updatedAt: string;
}

type LineOption = {
  id: string;
  short_name: string;
  slug: string;
  color: string;
  text_color: string;
};

const SEVERITY_COLOR: Record<Alert["severity"], string> = {
  major: "var(--signal-red)",
  minor: "var(--signal-yellow)",
  normal: "var(--signal-green)",
};

const SEVERITY_LABEL: Record<Alert["severity"], string> = {
  major: "SERVICE CHANGE",
  minor: "DELAYS",
  normal: "ADVISORY",
};

function AlertCard({ alert }: { alert: Alert }) {
  const [expanded, setExpanded] = useState(false);
  const color = SEVERITY_COLOR[alert.severity];

  return (
    <button
      type="button"
      className="w-full text-left retro-panel mb-2 p-0 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
      onClick={() => setExpanded((e) => !e)}
      aria-expanded={expanded}
    >
      {/* Color stripe + header row */}
      <div className="flex items-stretch gap-0">
        <span
          className="w-2 shrink-0"
          style={{ background: color }}
          aria-hidden="true"
        />
        <div className="flex-1 px-2 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[9px] font-black tracking-[0.12em] uppercase"
              style={{ color }}
            >
              {SEVERITY_LABEL[alert.severity]}
            </span>
            <span className="text-[9px] font-bold text-ink/40 shrink-0">
              {alert.line}
            </span>
          </div>
          <p className="text-[11px] font-bold text-ink leading-tight mt-0.5 line-clamp-2">
            {alert.header}
          </p>
        </div>
      </div>

      {/* Expanded description */}
      {expanded && alert.description && (
        <div className="px-3 pb-2 pt-1 border-t-2 border-ink/20">
          <p className="text-[10px] text-ink/70 leading-relaxed">{alert.description}</p>
          {alert.updatedAt && (
            <p className="text-[9px] text-ink/40 mt-1 font-mono">{alert.updatedAt}</p>
          )}
        </div>
      )}
    </button>
  );
}

export default function AlertsSidebar({
  lineOptions = [],
  visibleLineSlugs = null,
  onToggleLine,
  onShowAllLines,
  onHideAllLines,
}: {
  lineOptions?: LineOption[];
  visibleLineSlugs?: string[] | null;
  onToggleLine?: (slug: string) => void;
  onShowAllLines?: () => void;
  onHideAllLines?: () => void;
}) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      const json = await res.json();
      if (json.ok) {
        setAlerts(json.data.alerts);
        setError(false);
      }
      setLastFetched(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  return (
    <aside className="flex flex-col h-full retro-panel border-y-0 border-r-0 w-72 shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b-4 border-ink">
        <h2 className="text-xs font-black tracking-[0.18em] uppercase text-ink">
          System Alerts
        </h2>
        {lastFetched && (
          <p className="text-[9px] text-ink/50 font-mono mt-0.5">
            {lastFetched.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {lineOptions.length > 0 && onToggleLine && (
          <div className="retro-panel p-2 mb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[9px] font-black tracking-[0.14em] uppercase text-ink/60">
                Visible Lines
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-[9px] font-bold text-ink/60 hover:text-ink"
                  onClick={onShowAllLines}
                >
                  All
                </button>
                <button
                  type="button"
                  className="text-[9px] font-bold text-ink/60 hover:text-ink"
                  onClick={onHideAllLines}
                >
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {lineOptions.map((line) => {
                const isOn = visibleLineSlugs === null || visibleLineSlugs.includes(line.slug);
                return (
                  <button
                    key={line.slug}
                    type="button"
                    onClick={() => onToggleLine(line.slug)}
                    className="h-6 rounded border text-[10px] font-black"
                    style={{
                      background: isOn ? line.color : "rgba(0,0,0,0.04)",
                      color: isOn ? line.text_color || "#fff" : "var(--ink)",
                      borderColor: isOn ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.18)",
                      opacity: isOn ? 1 : 0.7,
                    }}
                    aria-pressed={isOn}
                    title={line.short_name}
                  >
                    {line.short_name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-12 rounded" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-8">
            <p className="text-[11px] font-bold status-bad">FEED UNAVAILABLE</p>
            <p className="text-[10px] text-ink/50 mt-1">Could not reach MTA servers</p>
          </div>
        )}

        {!loading && !error && alerts.length === 0 && (
          <div className="text-center py-8">
            <div
              className="text-3xl mb-2"
              style={{ color: "var(--signal-green)" }}
              aria-hidden="true"
            >
              ◉
            </div>
            <p className="text-[11px] font-black tracking-widest uppercase status-ok">
              Good Service
            </p>
            <p className="text-[10px] text-ink/50 mt-1">All lines operating normally</p>
          </div>
        )}

        {!loading && alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t-4 border-ink">
        <p className="text-[8px] text-ink/40 font-mono leading-tight">
          SOURCE: MTA SERVICE STATUS
          <br />
          AUTO-REFRESH 60s
        </p>
      </div>
    </aside>
  );
}
