import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { mockJobs } from "@/lib/db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const jobId = Number(id);

  if (!Number.isInteger(jobId) || jobId <= 0) {
    return NextResponse.json({ detail: "Invalid job id" }, { status: 400 });
  }

  let job: any = null;
  try {
    job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        hiredFreelancer: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            proposals: true,
          },
        },
      },
    });
  } catch (err) {
    console.error("Database query failed for job by id, checking mock fallback", err);
  }

  if (!job) {
    const mock = mockJobs[jobId - 1];
    if (!mock) {
      return NextResponse.json({ detail: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      job: {
        id: jobId,
        title: mock.title,
        description: mock.description,
        budget: mock.budgetNumber || 1500,
        applicationTokenCost: mock.tokenCost,
        status: "OPEN",
        clientId: mock.clientId || 2,
        hiredFreelancerId: null,
        createdAt: mock.createdAt || new Date().toISOString(),
        client: {
          id: mock.clientId || 2,
          username: mock.client.toLowerCase().replace(/\s+/g, "_"),
          name: mock.client,
          email: `${mock.client.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        },
        _count: {
          proposals: Math.max(2, Math.floor(mock.tokenCost / 3)),
        },
      },
    });
  }

  return NextResponse.json({ job });
}
