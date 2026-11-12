import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { ensureAcceptedProposalsHaveProjects } from "@/lib/projects";

export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ detail: "User not found" }, { status: 404 });
  }

  const normalizedRole = String(user.role || "").toUpperCase();
  await ensureAcceptedProposalsHaveProjects(user.id);

  const whereClause =
    normalizedRole === "ADMIN"
      ? {}
      : normalizedRole === "CLIENT"
        ? { clientId: user.id }
        : { freelancerId: user.id };

  const projects = await prisma.project.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          budget: true,
          status: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          username: true,
          clientProfile: {
            select: {
              displayName: true,
              companyName: true,
            },
          },
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          username: true,
          freelancerProfile: {
            select: {
              professionalTitle: true,
            },
          },
        },
      },
      milestones: {
        select: {
          id: true,
          status: true,
          escrowStatus: true,
          amount: true,
          dueDate: true,
        },
      },
      deliverables: {
        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          type: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          deliverables: true,
          milestones: true,
          projectMessages: true,
        },
      },
    },
  });

  return NextResponse.json({
    projects,
    role: normalizedRole,
  });
}
