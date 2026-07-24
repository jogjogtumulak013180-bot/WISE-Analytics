import { NextRequest, NextResponse } from "next/server";
import { computeWaterOps } from "../../lib/analytics/waterOps";
import { computeConstruction } from "../../lib/analytics/construction";

export const dynamic = "force-dynamic";

/** GET /api/analytics?pillar=water-systems&group=operations-monitoring&item=<slug>&project=<uuid> */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const pillar = q.get("pillar") ?? "";
  const group = q.get("group") ?? "";
  const item = q.get("item") ?? "";
  const project = q.get("project") ?? "";

  if (!project || !item) {
    return NextResponse.json({ error: "project and item are required" }, { status: 400 });
  }

  if (pillar === "water-systems" && group === "operations-monitoring") {
    const payload = await computeWaterOps(item, project);
    return NextResponse.json(payload);
  }

  if (pillar === "construction") {
    const payload = await computeConstruction(item, project);
    return NextResponse.json(payload);
  }

  return NextResponse.json({
    kpis: [],
    note: "Analytics for this sub-pillar arrive in a later phase.",
  });
}
