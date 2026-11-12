import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthorizedProjectContext } from "@/lib/projects";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  const activityLogs = await prisma.projectActivity.findMany({
    where: { projectId: authCtx.project.id },
    orderBy: { createdAt: "desc" },
    take: 80,
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
  });

  return NextResponse.json({ activityLogs });
}
