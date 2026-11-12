import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { getAuthorizedProjectContext, logProjectActivity } from "@/lib/projects";

const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function GET(request: Request, context: { params: Promise<{ id: string; did: string }> }) {
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
}

export async function POST(request: Request, context: { params: Promise<{ id: string; did: string }> }) {
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

  const parsed = createCommentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Comment cannot be empty" }, { status: 400 });
  }

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.deliverableComment.create({
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

    await logProjectActivity(tx, {
      projectId: project.id,
      actorId: user.id,
      type: "DELIVERABLE_COMMENTED",
      metadata: {
        deliverableId: deliverable.id,
        title: deliverable.title,
      },
    });

    return created;
  });

  const targetUser = viewerRole === "CLIENT" ? project.freelancer : project.client;
  if (targetUser.id !== user.id) {
    await createNotification({
      userId: targetUser.id,
      type: "DELIVERABLE_COMMENT",
      title: "New feedback on deliverable",
      body: `${user.name || user.username || "Teammate"} commented on \"${deliverable.title}\".`,
      link: `/projects/${project.id}/deliverables/${deliverable.id}`,
      email: targetUser.email,
    });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
