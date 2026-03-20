export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;

  const reqUrl = new URL(_req.url);
  const route = reqUrl.searchParams.get("route");
  if (!route) {
    return Response.json(
      { ok: false, error: "Missing required query param: route" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://nyc-subway-status.com/api/trips/${tripId}?route=${encodeURIComponent(route)}`,
      {
        headers: { "User-Agent": "mta-data-viz/1.0" },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) {
      return Response.json(
        { ok: false, error: "Upstream error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json(
      { ok: false, error: `Failed to fetch trip ${tripId}` },
      { status: 500 }
    );
  }
}

