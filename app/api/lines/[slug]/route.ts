export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const res = await fetch(`https://nyc-subway-status.com/api/lines/${slug}`, {
      headers: { "User-Agent": "mta-data-viz/1.0" },
      next: { revalidate: 30 },
    });

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
      { ok: false, error: `Failed to fetch line ${slug}` },
      { status: 500 }
    );
  }
}
