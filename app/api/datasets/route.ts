import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";
import { TEMPLATES, templateForSubPillar } from "../../lib/templates";
import { runImport } from "../../lib/importer";

export const dynamic = "force-dynamic";

/**
 * POST /api/datasets  (multipart: projectId, file)
 * Full pipeline in one call: parse → stage → clean/repair → auto-promote.
 * Statuses: rejected (structural) | promoted | promoted_with_warnings.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const projectId = String(form.get("projectId") ?? "");
  const file = form.get("file");
  if (!projectId || !(file instanceof File)) {
    return NextResponse.json({ error: "projectId and file are required" }, { status: 400 });
  }

  const { data: project, error: pErr } = await supabase
    .from("wa_projects")
    .select("id, pillar, sub_pillar, general_info")
    .eq("id", projectId)
    .single();
  if (pErr || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const template =
    templateForSubPillar(project.pillar ?? "", project.sub_pillar ?? "") ??
    TEMPLATES[String(form.get("templateCode") ?? "")];
  if (!template) {
    return NextResponse.json(
      { error: `No template available for sub-pillar "${project.sub_pillar}"` },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const result = runImport(buf, template, {
    generalInfo: (project.general_info as Record<string, unknown>) ?? {},
  });

  // create dataset record
  const { data: dataset, error: dErr } = await supabase
    .from("wa_datasets")
    .insert({
      project_id: projectId,
      sub_pillar: project.sub_pillar,
      template_code: template.code,
      file_name: file.name,
      status: "validating",
      validation_report: { summary: result.summary, structural_errors: result.structuralErrors },
    })
    .select("id")
    .single();
  if (dErr || !dataset) {
    return NextResponse.json({ error: `Dataset insert failed: ${dErr?.message}` }, { status: 500 });
  }

  // structural failure → rejected outright
  if (result.structuralErrors.length > 0) {
    await supabase
      .from("wa_datasets")
      .update({ status: "rejected" })
      .eq("id", dataset.id);
    return NextResponse.json({
      datasetId: dataset.id,
      status: "rejected",
      structuralErrors: result.structuralErrors,
      summary: result.summary,
    });
  }

  // stage every record (raw preserved; clean only for valid rows)
  const stagingRows = result.records.map((r) => ({
    dataset_id: dataset.id,
    sheet: r.sheet,
    row_num: r.rowNum,
    raw: r.raw,
    clean: r.clean,
    errors: r.errors.length ? r.errors : null,
    repairs: r.repairs.length ? r.repairs : null,
    is_valid: r.isValid,
    needs_review: r.needsReview,
  }));
  for (let i = 0; i < stagingRows.length; i += 500) {
    const { error: sErr } = await supabase
      .from("wa_staging_rows")
      .insert(stagingRows.slice(i, i + 500));
    if (sErr) {
      await supabase.from("wa_datasets").update({ status: "rejected" }).eq("id", dataset.id);
      return NextResponse.json({ error: `Staging failed: ${sErr.message}` }, { status: 500 });
    }
  }

  // auto-promote (transactional RPC; supersedes previous dataset for this project)
  const { data: promo, error: rpcErr } = await supabase.rpc("promote_dataset", {
    p_dataset_id: dataset.id,
  });
  if (rpcErr) {
    await supabase.from("wa_datasets").update({ status: "rejected" }).eq("id", dataset.id);
    return NextResponse.json({ error: `Promotion failed: ${rpcErr.message}` }, { status: 500 });
  }

  const quarantined = result.records
    .filter((r) => r.needsReview)
    .map((r) => ({ sheet: r.sheet, rowNum: r.rowNum, errors: r.errors }));
  const repairsAudit = result.records
    .filter((r) => r.repairs.length > 0)
    .map((r) => ({ sheet: r.sheet, rowNum: r.rowNum, repairs: r.repairs }));

  return NextResponse.json({
    datasetId: dataset.id,
    status: (promo as { status?: string })?.status ?? "promoted",
    summary: result.summary,
    quarantined,
    repairsAudit,
  });
}
