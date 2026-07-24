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

  // An explicit templateCode (used by Construction, which has two templates —
  // Project Delivery and Schedule & Cost Control — sharing one project_id) wins
  // over the project's nominal sub_pillar.
  const explicitCode = String(form.get("templateCode") ?? "");
  const template =
    TEMPLATES[explicitCode] ??
    templateForSubPillar(project.pillar ?? "", project.sub_pillar ?? "");
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

  // Construction Management datasets live in the PM schemas (staging_pm/core_pm/
  // derived_pm/analytics_pm) instead of the generic public wa_* tables — everything
  // else keeps the original pipeline.
  const isPm = template.pillar === "construction";
  const promoteFn = isPm ? "promote_pm_dataset" : "promote_dataset";

  // create dataset record (PM path goes through an RPC — staging_pm isn't a
  // PostgREST-exposed schema, so supabase-js can't .from() it directly)
  let datasetId: string;
  if (isPm) {
    const { data, error } = await supabase.rpc("pm_create_dataset", {
      p_project_id: projectId,
      p_sub_pillar: template.subPillar,
      p_template_code: template.code,
      p_file_name: file.name,
      p_validation_report: { summary: result.summary, structural_errors: result.structuralErrors },
    });
    if (error || !data) {
      return NextResponse.json({ error: `Dataset insert failed: ${error?.message}` }, { status: 500 });
    }
    datasetId = data as string;
  } else {
    const { data, error } = await supabase
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
    if (error || !data) {
      return NextResponse.json({ error: `Dataset insert failed: ${error?.message}` }, { status: 500 });
    }
    datasetId = data.id;
  }

  const setStatus = (status: string) =>
    isPm
      ? supabase.rpc("pm_set_dataset_status", { p_dataset_id: datasetId, p_status: status })
      : supabase.from("wa_datasets").update({ status }).eq("id", datasetId);

  // structural failure → rejected outright
  if (result.structuralErrors.length > 0) {
    await setStatus("rejected");
    return NextResponse.json({
      datasetId,
      status: "rejected",
      structuralErrors: result.structuralErrors,
      summary: result.summary,
    });
  }

  // stage every record (raw preserved; clean only for valid rows)
  const stagingRows = result.records.map((r) => ({
    dataset_id: datasetId,
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
    const batch = stagingRows.slice(i, i + 500);
    const { error: sErr } = isPm
      ? await supabase.rpc("pm_insert_staging_rows", { p_rows: batch })
      : await supabase.from("wa_staging_rows").insert(batch);
    if (sErr) {
      await setStatus("rejected");
      return NextResponse.json({ error: `Staging failed: ${sErr.message}` }, { status: 500 });
    }
  }

  // auto-promote (transactional RPC; supersedes previous dataset for this project)
  const { data: promo, error: rpcErr } = await supabase.rpc(promoteFn, {
    p_dataset_id: datasetId,
  });
  if (rpcErr) {
    await setStatus("rejected");
    return NextResponse.json({ error: `Promotion failed: ${rpcErr.message}` }, { status: 500 });
  }

  const quarantined = result.records
    .filter((r) => r.needsReview)
    .map((r) => ({ sheet: r.sheet, rowNum: r.rowNum, errors: r.errors }));
  const repairsAudit = result.records
    .filter((r) => r.repairs.length > 0)
    .map((r) => ({ sheet: r.sheet, rowNum: r.rowNum, repairs: r.repairs }));

  return NextResponse.json({
    datasetId,
    status: (promo as { status?: string })?.status ?? "promoted",
    summary: result.summary,
    quarantined,
    repairsAudit,
  });
}
