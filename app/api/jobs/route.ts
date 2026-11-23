import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { calculateApplicationTokenCost } from "@/lib/tokenomics";
import { mockJobs } from "@/lib/db";


const createJobSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(10),
  budget: z.coerce.number().int().positive(),
});

export async function GET() {
  let jobs: any[] = [];
  try {
    jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: {
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
    console.error("Database query failed for jobs, using mock fallback", err);
  }

  if (!jobs || jobs.length === 0) {
    jobs = mockJobs.map((j, idx) => ({
      id: idx + 1,
      title: j.title,
      description: j.description,
      budget: j.budgetNumber || 1500,
      status: "OPEN",
      applicationTokenCost: j.tokenCost,
      clientId: j.clientId || 2,
      createdAt: j.createdAt || new Date(Date.now() - idx * 86400000).toISOString(),
      client: {
        id: j.clientId || 2,
        username: j.client.toLowerCase().replace(/\s+/g, "_"),
        name: j.client,
        email: `${j.client.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      },
      _count: {
        proposals: Math.max(2, Math.floor(j.tokenCost / 3)),
      },
    }));
  }

  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
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

  if (String(user.role || "").trim().toUpperCase() !== "CLIENT") {
    return NextResponse.json({ detail: "Only clients can post jobs" }, { status: 403 });
  }

  const rawPayload = await request.json();
  const parsed = createJobSchema.safeParse(rawPayload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json({ detail: firstIssue?.message || "Invalid job payload" }, { status: 400 });
  }

  const payload = parsed.data;
  const tokenQuote = calculateApplicationTokenCost({
    budgetInr: payload.budget,
    title: payload.title,
    description: payload.description,
    proposalCount: 0,
  });

  const job = await prisma.job.create({
    data: {
      title: payload.title,
      description: payload.description,
      budget: payload.budget,
      applicationTokenCost: tokenQuote.tokenCost,
      clientId: user.id,
    },
    include: {
      client: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      job,
      tokenQuote: {
        tokenCost: tokenQuote.tokenCost,
        priceInr: tokenQuote.priceInr,
      },
    },
    { status: 201 },
  );
}
