// Line metadata changes rarely — cache the response for 5 minutes.
export const revalidate = 300;

export async function GET() {
  try {
    const res = await fetch("https://nyc-subway-status.com/api/lines", {
      headers: { "User-Agent": "mta-data-viz/1.0" },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return Response.json(
        { ok: false, error: "Upstream error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch {
    return Response.json({ ok: false, error: "Failed to fetch lines" }, { status: 500 });
  }
}
