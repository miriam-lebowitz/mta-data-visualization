import csv
import io
import re
import sys
import zipfile
from dataclasses import dataclass
from typing import Dict, Set, Tuple
from urllib.request import urlopen


NYC_STOPS_URL = "https://nyc-subway-status.com/api/stops"
# Public GTFS for NYCT subway.
# Note: source is occasionally updated; if this URL fails, we can fall back to another provider.
GTFS_ZIP_URL = "https://web.mta.info/developers/data/nyct/subway/google_transit.zip"


def slugify_name(name: str) -> str:
    s = name.lower().strip()
    # Normalize common separators seen in stop names.
    s = s.replace("&", "and")
    s = s.replace("/", "-")
    # Remove punctuation that often appears around route/line metadata.
    s = re.sub(r"[()]", "", s)
    # Replace any non-alphanumeric with hyphen.
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s)
    return s.strip("-")


def fetch_json(url: str):
    with urlopen(url) as resp:
        raw = resp.read()
    import json

    return json.loads(raw.decode("utf-8"))


@dataclass(frozen=True)
class LatLon:
    lat: float
    lon: float


def main() -> None:
    needed = set()
    stops_json = fetch_json(NYC_STOPS_URL)
    for st in stops_json.get("data", {}).get("stops", []):
        slug = st.get("slug")
        if slug:
            needed.add(slug)

    # Download GTFS zip and read stops.txt from it.
    with urlopen(GTFS_ZIP_URL) as resp:
        gtfs_zip_bytes = resp.read()

    with zipfile.ZipFile(io.BytesIO(gtfs_zip_bytes)) as zf:
        with zf.open("stops.txt") as f:
            text = f.read().decode("utf-8", errors="replace")

    reader = csv.DictReader(io.StringIO(text))
    out: Dict[str, LatLon] = {}

    for row in reader:
        stop_name = row.get("stop_name") or ""
        sl = slugify_name(stop_name)
        if sl not in needed:
            continue
        lat_s = row.get("stop_lat")
        lon_s = row.get("stop_lon")
        if not lat_s or not lon_s:
            continue
        try:
            lat = float(lat_s)
            lon = float(lon_s)
        except ValueError:
            continue
        out[sl] = LatLon(lat=lat, lon=lon)

    # Emit TypeScript file (tree-shakeable).
    ts_lines = []
    ts_lines.append('export const STATION_COORDS = {')
    for sl in sorted(out.keys()):
        ll = out[sl]
        ts_lines.append(f'  "{sl}": {{ lat: {ll.lat:.6f}, lon: {ll.lon:.6f} }},')
    ts_lines.append("} as const;")
    ts_lines.append("")

    missing = len(needed) - len(out)
    if missing > 0:
        # Keep the build resilient; LiveMap will filter missing coords.
        ts_lines.append(f"// Note: {missing} station slugs from nyc-subway-status were missing in GTFS.")
        ts_lines.append("// LiveMap will simply omit those stations/route segments.")
    else:
        ts_lines.append("// All needed station slugs were matched from GTFS.")

    out_path = "components/StationCoords.ts"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(ts_lines))

    print(f"Matched {len(out)} / {len(needed)} station slugs.")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("Error:", e, file=sys.stderr)
        sys.exit(1)

