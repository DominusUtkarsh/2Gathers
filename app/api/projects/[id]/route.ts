import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { getAuthorizedProjectContext, logProjectActivity, PROJECT_STATUSES } from "@/lib/projects";

const updateProjectSchema = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  maxRevisions: z.number().int().min(1).max(20).nullable().optional(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const authCtx = await getAuthorizedProjectContext(id, request);
    if (!authCtx.ok) return authCtx.response;

    const { project, viewerRole } = authCtx;

    const [milestones, deliverables, activityLogs, reviews, escrowTransactions] = await Promise.all([
      prisma.milestone.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "asc" },
        include: {
          deliverables: {
            select: {
              id: true,
              title: true,
              status: true,
              dueDate: true,
            },
          },
        },
      }),
      prisma.deliverable.findMany({
        where: { projectId: project.id },
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
      }),
      prisma.projectActivity.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "desc" },
        take: 60,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
            },
          },
        },
      }),
      prisma.review.findMany({
        where: { jobId: project.jobId },
        orderBy: { createdAt: "desc" },
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
      }),
      prisma.tokenTransaction.findMany({
        where: {
          jobId: project.jobId,
          type: { in: ["ESCROW_FUNDED", "ESCROW_RELEASE"] },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          txHash: true,
          type: true,
          tokenAmount: true,
          totalInr: true,
          status: true,
          network: true,
          createdAt: true,
          userId: true,
        },
      }),
    ]);

    const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
    const fundedTokens = milestones
      .filter((m) => m.escrowStatus === "FUNDED")
      .reduce((sum, m) => sum + m.amount, 0);
    const releasedTokens = milestones
      .filter((m) => m.escrowStatus === "RELEASED")
      .reduce((sum, m) => sum + m.amount, 0);

    return NextResponse.json({
      project: {
        ...project,
        milestones,
        deliverables,
        activityLogs,
        reviews,
        escrowTransactions,
        escrowSummary: {
          totalMilestoneAmount,
          fundedTokens,
          releasedTokens,
        },
      },
      viewerRole,
    });
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    const detail = error instanceof Error ? error.message : "Failed to load project";
    return NextResponse.json({ detail }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const authCtx = await getAuthorizedProjectContext(id, request);
    if (!authCtx.ok) return authCtx.response;

    const { user, project, viewerRole } = authCtx;
    if (viewerRole !== "CLIENT") {
      return NextResponse.json({ detail: "Only the project client can update project settings or close the project" }, { status: 403 });
    }

    let jsonPayload: unknown;
    try {
      jsonPayload = await request.json();
    } catch {
      return NextResponse.json({ detail: "Invalid payload" }, { status: 400 });
    }

    const parsed = updateProjectSchema.safeParse(jsonPayload);
    if (!parsed.success) {
      return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const { status, maxRevisions } = parsed.data;

    if (status === "COMPLETED") {
      const unreleasedFunded = await prisma.milestone.count({
        where: {
          projectId: project.id,
          escrowStatus: "FUNDED",
        },
      });
      if (unreleasedFunded > 0) {
        return NextResponse.json(
          { detail: "Release all funded milestone escrow balances before marking the project complete" },
          { status: 409 },
        );
      }
    }

    const nextCompletedAt = status === "COMPLETED" ? new Date() : project.completedAt;
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(status === "COMPLETED" ? { completedAt: nextCompletedAt } : {}),
        ...(maxRevisions !== undefined ? { maxRevisions } : {}),
      },
    });

    if (status === "COMPLETED") {
      try {
        await prisma.job.update({
          where: { id: project.jobId },
          data: {
            status: "COMPLETED",
            completedAt: nextCompletedAt ?? new Date(),
          },
        });
      } catch (jobErr) {
        console.error("Failed to update job status on project completion:", jobErr);
      }
    }

    if (status && status !== project.status) {
      try {
        await logProjectActivity(prisma, {
          projectId: project.id,
          actorId: user.id,
          type: status === "COMPLETED" ? "PROJECT_COMPLETED" : "PROJECT_STATUS_CHANGED",
          metadata: { from: project.status, to: status },
        });
      } catch (actErr) {
        console.error("Failed to log activity:", actErr);
      }
    }

    if (maxRevisions !== undefined && maxRevisions !== project.maxRevisions) {
      try {
        await logProjectActivity(prisma, {
          projectId: project.id,
          actorId: user.id,
          type: "PROJECT_SETTINGS_UPDATED",
          metadata: { maxRevisions },
        });
      } catch (actErr) {
        console.error("Failed to log settings activity:", actErr);
      }
    }

    if (status === "COMPLETED") {
      try {
        await createNotification({
          userId: project.freelancerId,
          type: "PROJECT_COMPLETED",
          title: "Project marked completed",
          body: `The client marked "${project.job?.title || "Contract"}" as completed. You can now submit your review.`,
          link: `/projects/${project.id}`,
          email: project.freelancer.email,
        });
      } catch (notifErr) {
        console.error("Failed to deliver project completion notification:", notifErr);
      }
    }

    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("PATCH /api/projects/[id] error:", error);
    const detail = error instanceof Error ? error.message : "Failed to update project";
    return NextResponse.json({ detail }, { status: 500 });
  }
}
