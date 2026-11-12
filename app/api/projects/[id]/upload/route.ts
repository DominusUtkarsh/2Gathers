import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { getAuthorizedProjectContext } from "@/lib/projects";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function sanitizeFileName(rawName: string) {
  const base = path.basename(rawName || "file");
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "attachment";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  if (authCtx.viewerRole === "ADMIN") {
    return NextResponse.json({ detail: "Admins have read-only access" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ detail: "Expected multipart form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ detail: "Missing file field" }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ detail: "File cannot be empty" }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ detail: "File size must be 10 MB or less" }, { status: 413 });
  }

  const safeName = sanitizeFileName(file.name);
  const uniquePrefix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const objectPath = `projects/${authCtx.project.id}/${uniquePrefix}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Attempt Supabase Storage upload first when configured
  try {
    const supabase = getSupabaseServerClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "project-files";
    const { error } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (!error) {
      const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 60 * 24 * 30);
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      const url = signedData?.signedUrl || publicData?.publicUrl;
      if (url) {
        return NextResponse.json({
          url,
          fileName: safeName,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          storage: "supabase",
        });
      }
    }
  } catch {
    // Fall back to local project uploads directory if Supabase bucket isn't provisioned yet
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "projects", String(authCtx.project.id));
  await mkdir(uploadDir, { recursive: true });
  const diskFilename = `${uniquePrefix}-${safeName}`;
  await writeFile(path.join(uploadDir, diskFilename), buffer);

  return NextResponse.json({
    url: `/uploads/projects/${authCtx.project.id}/${diskFilename}`,
    fileName: safeName,
    size: file.size,
    contentType: file.type || "application/octet-stream",
    storage: "local",
  });
}
