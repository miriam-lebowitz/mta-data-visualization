"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as ui from "./styles/Nav.styles";

const LINKS = [
  { href: "/", label: "LIVE MAP" },
  { href: "/rankings", label: "LINE RANKINGS" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className={ui.header}>
      <div className={ui.inner}>
        {/* Wordmark */}
        <div className={ui.wordmarkRow}>
          <div
            className={ui.nyCircle}
            aria-hidden="true"
          >
            NY
          </div>
          <div className={ui.titlesCol}>
            <span className={ui.eyebrow}>
              NYC Transit
            </span>
            <span className={ui.title}>
              System Status
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className={ui.navRow}>
          {LINKS.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-active={active}
                className={ui.link}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      {/* thick bottom rule */}
      <div className={ui.bottomRule} />
    </header>
  );
}
