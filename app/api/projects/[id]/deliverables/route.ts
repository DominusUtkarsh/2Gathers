import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { getAuthorizedProjectContext, logProjectActivity } from "@/lib/projects";

const createDeliverableSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(3000).optional(),
  milestoneId: z.coerce.number().int().positive().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  fileUrls: z.array(z.string().trim().min(1)).max(15).optional(),
  submitNow: z.boolean().optional(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  const deliverables = await prisma.deliverable.findMany({
    where: { projectId: authCtx.project.id },
    orderBy: { updatedAt: "desc" },
    include: {
      milestone: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  return NextResponse.json({ deliverables });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  const { user, project, viewerRole } = authCtx;
  if (viewerRole !== "FREELANCER") {
    return NextResponse.json({ detail: "Only the assigned freelancer can create or submit deliverables" }, { status: 403 });
  }

  if (["COMPLETED", "CANCELLED"].includes(project.status)) {
    return NextResponse.json({ detail: "Cannot add deliverables to a closed project" }, { status: 409 });
  }

  const parsed = createDeliverableSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid deliverable payload" }, { status: 400 });
  }

  const { title, description, milestoneId, dueDate, fileUrls, submitNow } = parsed.data;

  if (milestoneId) {
    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, projectId: project.id },
      select: { id: true },
    });
    if (!milestone) {
      return NextResponse.json({ detail: "Milestone does not belong to this project" }, { status: 400 });
    }
  }

  const parsedDueDate = dueDate ? new Date(dueDate) : null;
  if (parsedDueDate && Number.isNaN(parsedDueDate.getTime())) {
    return NextResponse.json({ detail: "Invalid due date" }, { status: 400 });
  }

  const isSubmit = Boolean(submitNow);

  const deliverable = await prisma.$transaction(async (tx) => {
    const created = await tx.deliverable.create({
      data: {
        projectId: project.id,
        milestoneId: milestoneId ?? null,
        title,
        description: description || null,
        status: isSubmit ? "SUBMITTED" : "DRAFT",
        fileUrls: fileUrls ?? [],
        submittedAt: isSubmit ? new Date() : null,
        dueDate: parsedDueDate,
      },
      include: {
        milestone: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (isSubmit && project.status === "ACTIVE") {
      await tx.project.update({
        where: { id: project.id },
        data: { status: "IN_REVIEW" },
      });
    }

    await logProjectActivity(tx, {
      projectId: project.id,
      actorId: user.id,
      type: isSubmit ? "DELIVERABLE_SUBMITTED" : "DELIVERABLE_DRAFT_CREATED",
      metadata: {
        deliverableId: created.id,
        title: created.title,
        milestoneId: created.milestoneId,
      },
    });

    return created;
  });

  if (isSubmit) {
    await createNotification({
      userId: project.clientId,
      type: "DELIVERABLE_SUBMITTED",
      title: "New deliverable submitted",
      body: `${user.name || user.username || "Freelancer"} submitted \"${deliverable.title}\" for review.`,
      link: `/projects/${project.id}/deliverables/${deliverable.id}`,
      email: project.client.email,
    });
  }

  return NextResponse.json({ deliverable }, { status: 201 });
}
