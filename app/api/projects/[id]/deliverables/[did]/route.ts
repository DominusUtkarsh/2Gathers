import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { DELIVERABLE_STATUSES, getAuthorizedProjectContext, logProjectActivity } from "@/lib/projects";

const updateDeliverableSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(3000).nullable().optional(),
  milestoneId: z.coerce.number().int().positive().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  fileUrls: z.array(z.string().trim().min(1)).max(15).optional(),
  status: z.enum(DELIVERABLE_STATUSES).optional(),
  feedback: z.string().trim().max(1500).optional(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string; did: string }> }) {
  const { id, did } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  const deliverableId = Number(did);
  if (!Number.isInteger(deliverableId) || deliverableId <= 0) {
    return NextResponse.json({ detail: "Invalid deliverable id" }, { status: 400 });
  }

  const deliverable = await prisma.deliverable.findFirst({
    where: { id: deliverableId, projectId: authCtx.project.id },
    include: {
      milestone: {
        select: {
          id: true,
          title: true,
          amount: true,
          status: true,
          escrowStatus: true,
          dueDate: true,
        },
      },
      comments: {
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
      },
    },
  });

  if (!deliverable) {
    return NextResponse.json({ detail: "Deliverable not found" }, { status: 404 });
  }

  return NextResponse.json({
    deliverable,
    project: authCtx.project,
    viewerRole: authCtx.viewerRole,
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; did: string }> }) {
  const { id, did } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  const { user, project, viewerRole } = authCtx;
  if (viewerRole === "ADMIN") {
    return NextResponse.json({ detail: "Admins have read-only audit access" }, { status: 403 });
  }

  const deliverableId = Number(did);
  if (!Number.isInteger(deliverableId) || deliverableId <= 0) {
    return NextResponse.json({ detail: "Invalid deliverable id" }, { status: 400 });
  }

  const existing = await prisma.deliverable.findFirst({
    where: { id: deliverableId, projectId: project.id },
  });

  if (!existing) {
    return NextResponse.json({ detail: "Deliverable not found" }, { status: 404 });
  }

  const parsed = updateDeliverableSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
  }

  const data = parsed.data;

  // Enforce role-based permissions
  if (data.status && data.status !== existing.status) {
    if (viewerRole === "FREELANCER") {
      const allowedFromDraft = existing.status === "DRAFT" && data.status === "SUBMITTED";
      const allowedResubmit = existing.status === "REVISION_REQUESTED" && data.status === "RESUBMITTED";
      if (!allowedFromDraft && !allowedResubmit) {
        return NextResponse.json(
          { detail: "Freelancers can only submit drafts or resubmit after revision requests" },
          { status: 403 },
        );
      }
    } else if (viewerRole === "CLIENT") {
      const reviewable = ["SUBMITTED", "IN_REVIEW", "RESUBMITTED"].includes(existing.status);
      const clientAllowedTargets = ["IN_REVIEW", "REVISION_REQUESTED", "APPROVED"].includes(data.status);
      if (!reviewable || !clientAllowedTargets) {
        return NextResponse.json(
          { detail: "This deliverable is not currently awaiting client review" },
          { status: 409 },
        );
      }

      if (
        data.status === "REVISION_REQUESTED" &&
        typeof project.maxRevisions === "number" &&
        existing.revisionCount >= project.maxRevisions
      ) {
        return NextResponse.json(
          {
            detail: `Revision limit (${project.maxRevisions}) reached. Approve the deliverable or escalate via project status.`,
          },
          { status: 409 },
        );
      }
    }
  }

  const isEditingContent =
    data.title !== undefined ||
    data.description !== undefined ||
    data.fileUrls !== undefined ||
    data.milestoneId !== undefined ||
    data.dueDate !== undefined;

  if (isEditingContent && viewerRole !== "FREELANCER") {
    return NextResponse.json({ detail: "Only the freelancer can edit deliverable files and content" }, { status: 403 });
  }

  if (isEditingContent && !["DRAFT", "REVISION_REQUESTED"].includes(existing.status)) {
    return NextResponse.json(
      { detail: "Deliverable content can only be edited in Draft or Revision Requested states" },
      { status: 409 },
    );
  }

  if (data.milestoneId) {
    const milestone = await prisma.milestone.findFirst({
      where: { id: data.milestoneId, projectId: project.id },
      select: { id: true },
    });
    if (!milestone) {
      return NextResponse.json({ detail: "Milestone does not belong to this project" }, { status: 400 });
    }
  }

  const parsedDueDate =
    data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null;
  if (parsedDueDate && Number.isNaN(parsedDueDate.getTime())) {
    return NextResponse.json({ detail: "Invalid due date" }, { status: 400 });
  }

  const nextStatus = data.status ?? existing.status;
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.deliverable.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.milestoneId !== undefined ? { milestoneId: data.milestoneId } : {}),
        ...(parsedDueDate !== undefined ? { dueDate: parsedDueDate } : {}),
        ...(data.fileUrls !== undefined ? { fileUrls: data.fileUrls } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(nextStatus === "SUBMITTED" || nextStatus === "RESUBMITTED" ? { submittedAt: now } : {}),
        ...(nextStatus === "APPROVED" ? { approvedAt: now } : {}),
        ...(nextStatus === "REVISION_REQUESTED" ? { revisionCount: { increment: 1 } } : {}),
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

    if (data.feedback && data.feedback.trim().length > 0) {
      await tx.deliverableComment.create({
        data: {
          deliverableId: existing.id,
          authorId: user.id,
          body: data.feedback.trim(),
        },
      });
    }

    // Keep project status and milestone completion synchronized
    if (nextStatus === "SUBMITTED" || nextStatus === "RESUBMITTED" || nextStatus === "IN_REVIEW") {
      if (project.status === "ACTIVE") {
        await tx.project.update({
          where: { id: project.id },
          data: { status: "IN_REVIEW" },
        });
      }
    } else if (nextStatus === "APPROVED") {
      const targetMilestoneId = saved.milestoneId;
      if (targetMilestoneId) {
        const remainingUnapproved = await tx.deliverable.count({
          where: {
            milestoneId: targetMilestoneId,
            status: { not: "APPROVED" },
          },
        });
        if (remainingUnapproved === 0) {
          await tx.milestone.updateMany({
            where: {
              id: targetMilestoneId,
              status: { not: "RELEASED" },
            },
            data: { status: "COMPLETED" },
          });
        }
      }

      const anyInReview = await tx.deliverable.count({
        where: {
          projectId: project.id,
          status: { in: ["SUBMITTED", "IN_REVIEW", "RESUBMITTED"] },
        },
      });
      if (anyInReview === 0 && project.status === "IN_REVIEW") {
        await tx.project.update({
          where: { id: project.id },
          data: { status: "ACTIVE" },
        });
      }
    }

    if (data.status && data.status !== existing.status) {
      const activityType =
        data.status === "SUBMITTED"
          ? "DELIVERABLE_SUBMITTED"
          : data.status === "RESUBMITTED"
            ? "DELIVERABLE_RESUBMITTED"
            : data.status === "REVISION_REQUESTED"
              ? "REVISION_REQUESTED"
              : data.status === "APPROVED"
                ? "DELIVERABLE_APPROVED"
                : "DELIVERABLE_IN_REVIEW";

      await logProjectActivity(tx, {
        projectId: project.id,
        actorId: user.id,
        type: activityType,
        metadata: {
          deliverableId: saved.id,
          title: saved.title,
          feedback: data.feedback?.trim() || undefined,
        },
      });
    }

    return saved;
  });

  if (data.status && data.status !== existing.status) {
    const notifyClient = viewerRole === "FREELANCER";
    const recipientId = notifyClient ? project.clientId : project.freelancerId;
    const recipientEmail = notifyClient ? project.client.email : project.freelancer.email;
    const titleByStatus: Record<string, string> = {
      SUBMITTED: "Deliverable submitted for review",
      RESUBMITTED: "Revised deliverable submitted",
      IN_REVIEW: "Deliverable is in review",
      REVISION_REQUESTED: "Revision requested on deliverable",
      APPROVED: "Deliverable approved",
    };
    await createNotification({
      userId: recipientId,
      type: "DELIVERABLE_STATUS",
      title: titleByStatus[data.status] || "Deliverable updated",
      body: `\"${updated.title}\" moved to ${data.status.replaceAll("_", " ").toLowerCase()}.${data.feedback ? ` Note: ${data.feedback.trim()}` : ""}`,
      link: `/projects/${project.id}/deliverables/${updated.id}`,
      email: recipientEmail,
    });
  }

  return NextResponse.json({ deliverable: updated });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string; did: string }> }) {
  const { id, did } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  if (authCtx.viewerRole !== "FREELANCER") {
    return NextResponse.json({ detail: "Only the freelancer can delete a draft deliverable" }, { status: 403 });
  }

  const deliverableId = Number(did);
  const existing = await prisma.deliverable.findFirst({
    where: { id: deliverableId, projectId: authCtx.project.id },
  });

  if (!existing) {
    return NextResponse.json({ detail: "Deliverable not found" }, { status: 404 });
  }

  if (existing.status !== "DRAFT") {
    return NextResponse.json({ detail: "Only draft deliverables can be deleted" }, { status: 409 });
  }

  await prisma.deliverable.delete({ where: { id: existing.id } });
  return NextResponse.json({ deleted: true });
}
