import { NextRequest, NextResponse } from "next/server";
import { TEMPLATES } from "../../../lib/templates";
import { generateTemplateWorkbook } from "../../../lib/importer";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const template = TEMPLATES[params.code];
  if (!template) {
    return NextResponse.json({ error: "Unknown template" }, { status: 404 });
  }
  const buf = generateTemplateWorkbook(template);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${template.fileName}"`,
    },
  });
}
