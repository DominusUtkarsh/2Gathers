import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { getAuthorizedProjectContext, logProjectActivity } from "@/lib/projects";

const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function GET(request: Request, context: { params: Promise<{ id: string; did: string }> }) {
  try {
    const { id, did } = await context.params;
    const authCtx = await getAuthorizedProjectContext(id, request);
    if (!authCtx.ok) return authCtx.response;

    const deliverableId = Number(did);
    const deliverable = await prisma.deliverable.findFirst({
      where: { id: deliverableId, projectId: authCtx.project.id },
      select: { id: true },
    });

    if (!deliverable) {
      return NextResponse.json({ detail: "Deliverable not found" }, { status: 404 });
    }

    const comments = await prisma.deliverableComment.findMany({
      where: { deliverableId: deliverable.id },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/projects/[id]/deliverables/[did]/comments error:", error);
    return NextResponse.json({ comments: [] });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string; did: string }> }) {
  try {
    const { id, did } = await context.params;
    const authCtx = await getAuthorizedProjectContext(id, request);
    if (!authCtx.ok) return authCtx.response;

    const { user, project, viewerRole } = authCtx;
    const deliverableId = Number(did);
    const deliverable = await prisma.deliverable.findFirst({
      where: { id: deliverableId, projectId: project.id },
      select: { id: true, title: true },
    });

    if (!deliverable) {
      return NextResponse.json({ detail: "Deliverable not found" }, { status: 404 });
    }

    let jsonPayload: unknown;
    try {
      jsonPayload = await request.json();
    } catch {
      return NextResponse.json({ detail: "Invalid comment payload" }, { status: 400 });
    }

    const parsed = createCommentSchema.safeParse(jsonPayload);
    if (!parsed.success) {
      return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Comment cannot be empty" }, { status: 400 });
    }

    const created = await prisma.deliverableComment.create({
      data: {
        deliverableId: deliverable.id,
        authorId: user.id,
        body: parsed.data.body,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });

    try {
      await logProjectActivity(prisma, {
        projectId: project.id,
        actorId: user.id,
        type: "DELIVERABLE_COMMENTED",
        metadata: {
          deliverableId: deliverable.id,
          title: deliverable.title,
        },
      });
    } catch (actErr) {
      console.error("Failed to log deliverable comment activity:", actErr);
    }

    try {
      const targetUser = viewerRole === "CLIENT" ? project.freelancer : project.client;
      if (targetUser?.id && targetUser.id !== user.id) {
        await createNotification({
          userId: targetUser.id,
          type: "DELIVERABLE_COMMENT",
          title: "New feedback on deliverable",
          body: `${user.name || user.username || "Teammate"} commented on "${deliverable.title}".`,
          link: `/projects/${project.id}/deliverables/${deliverable.id}`,
          email: targetUser.email,
        });
      }
    } catch (notifErr) {
      console.error("Failed to deliver deliverable comment notification:", notifErr);
    }

    return NextResponse.json({ comment: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects/[id]/deliverables/[did]/comments error:", error);
    const detail = error instanceof Error ? error.message : "Failed to post comment";
    return NextResponse.json({ detail }, { status: 500 });
  }
}
