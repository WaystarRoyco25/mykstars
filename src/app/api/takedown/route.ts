// Takedown intake. In production this would notify the registered DMCA agent
// and open a tracked ticket (with repeat-infringer accounting). For now it
// validates and records the request so the flow is real end-to-end.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const required = ["name", "email", "rightsHolder", "url", "details"];
  const missing = required.filter((k) => !body[k]);
  if (missing.length) {
    return Response.json(
      { ok: false, error: `Missing fields: ${missing.join(", ")}` },
      { status: 422 },
    );
  }

  // TODO: dispatch to DMCA agent + ticketing system.
  console.info("[takedown] received", {
    rightsHolder: body.rightsHolder,
    url: body.url,
  });

  return Response.json({ ok: true });
}
