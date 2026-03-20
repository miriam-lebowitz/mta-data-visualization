"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "LIVE MAP" },
  { href: "/rankings", label: "LINE RANKINGS" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="retro-panel border-b-0 border-x-0 border-t-0 sticky top-0 z-50">
      <div className="flex items-stretch justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <div className="flex items-center gap-3 py-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full border-4 border-ink text-white font-black text-sm leading-none"
            style={{ background: "#D82233" }}
            aria-hidden="true"
          >
            NY
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-bold tracking-[0.18em] text-ink/60 uppercase">
              NYC Transit
            </span>
            <span className="text-base font-black tracking-[0.06em] text-ink uppercase">
              System Status
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex items-end gap-1">
          {LINKS.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-active={active}
                className="nav-station-link px-4 py-3 text-sm font-bold tracking-widest uppercase text-ink/70 hover:text-ink"
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      {/* thick bottom rule */}
      <div className="h-1 bg-ink" />
    </header>
  );
}
