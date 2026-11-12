import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";

export const PROJECT_STATUSES = ["ACTIVE", "IN_REVIEW", "COMPLETED", "DISPUTED", "CANCELLED"] as const;
export const MILESTONE_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "RELEASED"] as const;
export const DELIVERABLE_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "REVISION_REQUESTED",
  "RESUBMITTED",
  "APPROVED",
] as const;

export type ProjectViewerRole = "CLIENT" | "FREELANCER" | "ADMIN";

export function isDeadlineOverdue(dueDate: Date | string | null | undefined, completed: boolean) {
  if (!dueDate || completed) return false;
  const due = new Date(dueDate).getTime();
  return Number.isFinite(due) && due < Date.now();
}

export function getDeadlineTrafficLight(
  dueDate: Date | string | null | undefined,
  completed: boolean,
): "OVERDUE" | "DUE_SOON" | "ON_TRACK" | "NONE" {
  if (!dueDate || completed) return "NONE";
  const dueMs = new Date(dueDate).getTime();
  if (!Number.isFinite(dueMs)) return "NONE";
  const diffHours = (dueMs - Date.now()) / (1000 * 60 * 60);
  if (diffHours < 0) return "OVERDUE";
  if (diffHours <= 48) return "DUE_SOON";
  return "ON_TRACK";
}

export async function logProjectActivity(
  db: Prisma.TransactionClient | typeof prisma,
  params: {
    projectId: number;
    actorId: number;
    type: string;
    metadata?: Record<string, unknown>;
  },
) {
  return db.projectActivity.create({
    data: {
      projectId: params.projectId,
      actorId: params.actorId,
      type: params.type,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

/**
 * Backfills Project workspace rows for any ACCEPTED proposal that predated the Project model.
 * Keeps existing contracts seamlessly accessible at /projects/[projectId].
 */
export async function ensureAcceptedProposalsHaveProjects(userId: number) {
  const acceptedProposals = await prisma.proposal.findMany({
    where: {
      status: "ACCEPTED",
      project: null,
      OR: [
        { freelancerId: userId },
        { job: { clientId: userId } },
      ],
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          status: true,
          clientId: true,
          completedAt: true,
        },
      },
    },
  });

  for (const prop of acceptedProposals) {
    const projectStatus = prop.job.status === "COMPLETED" ? "COMPLETED" : "ACTIVE";
    const created = await prisma.project.upsert({
      where: { proposalId: prop.id },
      create: {
        jobId: prop.jobId,
        proposalId: prop.id,
        clientId: prop.job.clientId,
        freelancerId: prop.freelancerId,
        status: projectStatus,
        completedAt: prop.job.completedAt ?? null,
      },
      update: {},
    });

    await prisma.projectActivity.create({
      data: {
        projectId: created.id,
        actorId: prop.job.clientId,
        type: "PROJECT_STARTED",
        metadata: { jobTitle: prop.job.title },
      },
    });
  }
}

export async function getAuthorizedProjectContext(projectIdParam: string, request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ detail: "Unauthorized" }, { status: 401 }),
    };
  }

  const projectId = Number(projectIdParam);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return {
      ok: false as const,
      response: NextResponse.json({ detail: "Invalid project id" }, { status: 400 }),
    };
  }

  const [user, project] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        tokens: true,
      },
    }),
    prisma.project.findUnique({
      where: { id: projectId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            budget: true,
            status: true,
            completedAt: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            clientProfile: {
              select: {
                displayName: true,
                companyName: true,
                timezone: true,
              },
            },
          },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            freelancerProfile: {
              select: {
                professionalTitle: true,
                availability: true,
                responseTime: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ detail: "User not found" }, { status: 404 }),
    };
  }

  if (!project) {
    return {
      ok: false as const,
      response: NextResponse.json({ detail: "Project not found" }, { status: 404 }),
    };
  }

  const isClient = project.clientId === user.id;
  const isFreelancer = project.freelancerId === user.id;
  const isAdmin = String(user.role || "").toUpperCase() === "ADMIN";

  if (!isClient && !isFreelancer && !isAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json({ detail: "Not authorized for this project" }, { status: 403 }),
    };
  }

  const viewerRole: ProjectViewerRole = isClient ? "CLIENT" : isFreelancer ? "FREELANCER" : "ADMIN";

  return {
    ok: true as const,
    user,
    project,
    viewerRole,
  };
}
