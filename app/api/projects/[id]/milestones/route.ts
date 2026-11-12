import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { getAuthorizedProjectContext, logProjectActivity } from "@/lib/projects";
import { TOKEN_PRICE_INR, WEB3_NETWORK_NAME } from "@/lib/tokenomics";

const createMilestoneSchema = z.object({
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(1000).optional(),
  amount: z.coerce.number().int().min(0).max(1_000_000),
  dueDate: z.string().optional().nullable(),
  fundEscrow: z.boolean().optional(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  const milestones = await prisma.milestone.findMany({
    where: { projectId: authCtx.project.id },
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
  });

  return NextResponse.json({ milestones });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  const { user, project, viewerRole } = authCtx;
  if (viewerRole !== "CLIENT") {
    return NextResponse.json({ detail: "Only the client can create milestones" }, { status: 403 });
  }

  const parsed = createMilestoneSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid milestone payload" }, { status: 400 });
  }

  const { title, description, amount, dueDate, fundEscrow } = parsed.data;
  const parsedDueDate = dueDate ? new Date(dueDate) : null;
  if (parsedDueDate && Number.isNaN(parsedDueDate.getTime())) {
    return NextResponse.json({ detail: "Invalid due date" }, { status: 400 });
  }

  const shouldFund = Boolean(fundEscrow) && amount > 0;
  if (shouldFund && user.tokens < amount) {
    return NextResponse.json(
      { detail: `Insufficient wallet balance to fund escrow (${amount} TOK needed, ${user.tokens} TOK available)` },
      { status: 402 },
    );
  }

  try {
    const milestone = await prisma.$transaction(async (tx) => {
      let escrowStatus = "UNFUNDED";

      if (shouldFund) {
        const debit = await tx.user.updateMany({
          where: { id: user.id, tokens: { gte: amount } },
          data: { tokens: { decrement: amount } },
        });
        if (debit.count === 0) {
          throw new Error("INSUFFICIENT_TOKENS");
        }
        escrowStatus = "FUNDED";

        await tx.tokenTransaction.create({
          data: {
            txHash: `0x${crypto.randomBytes(12).toString("hex")}${Date.now().toString(16)}`,
            userId: user.id,
            jobId: project.jobId,
            proposalId: project.proposalId,
            type: "ESCROW_FUNDED",
            tokenAmount: amount,
            tokenPriceInr: TOKEN_PRICE_INR,
            totalInr: amount * TOKEN_PRICE_INR,
            status: "CONFIRMED",
            network: WEB3_NETWORK_NAME,
          },
        });
      }

      const created = await tx.milestone.create({
        data: {
          projectId: project.id,
          title,
          description: description || null,
          amount,
          dueDate: parsedDueDate,
          status: shouldFund ? "IN_PROGRESS" : "PENDING",
          escrowStatus,
        },
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
      });

      await logProjectActivity(tx, {
        projectId: project.id,
        actorId: user.id,
        type: shouldFund ? "MILESTONE_CREATED_AND_FUNDED" : "MILESTONE_CREATED",
        metadata: {
          milestoneId: created.id,
          title: created.title,
          amount: created.amount,
        },
      });

      return created;
    });

    await createNotification({
      userId: project.freelancerId,
      type: "MILESTONE_CREATED",
      title: shouldFund ? "New funded milestone added" : "New project milestone added",
      body: `${project.job.title}: \"${milestone.title}\" (${milestone.amount} TOK).`,
      link: `/projects/${project.id}`,
      email: project.freelancer.email,
    });

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json(
        { detail: "Insufficient wallet balance to fund this milestone" },
        { status: 402 },
      );
    }
    throw error;
  }
}
