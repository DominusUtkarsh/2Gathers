import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { getAuthorizedProjectContext, logProjectActivity, MILESTONE_STATUSES } from "@/lib/projects";
import { TOKEN_PRICE_INR, WEB3_NETWORK_NAME } from "@/lib/tokenomics";

const updateMilestoneSchema = z.object({
  title: z.string().trim().min(2).max(140).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  amount: z.coerce.number().int().min(0).max(1_000_000).optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(MILESTONE_STATUSES).optional(),
  action: z.enum(["FUND_ESCROW"]).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string; mid: string }> }) {
  const { id, mid } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  const { user, project, viewerRole } = authCtx;
  if (viewerRole !== "CLIENT") {
    return NextResponse.json({ detail: "Only the client can update milestones or fund escrow" }, { status: 403 });
  }

  const milestoneId = Number(mid);
  if (!Number.isInteger(milestoneId) || milestoneId <= 0) {
    return NextResponse.json({ detail: "Invalid milestone id" }, { status: 400 });
  }

  const existing = await prisma.milestone.findFirst({
    where: { id: milestoneId, projectId: project.id },
  });

  if (!existing) {
    return NextResponse.json({ detail: "Milestone not found" }, { status: 404 });
  }

  const parsed = updateMilestoneSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
  }

  const data = parsed.data;

  if (data.action === "FUND_ESCROW") {
    if (existing.escrowStatus !== "UNFUNDED") {
      return NextResponse.json({ detail: "Escrow is already funded or released for this milestone" }, { status: 409 });
    }
    if (existing.amount <= 0) {
      return NextResponse.json({ detail: "Milestone amount must be greater than 0 TOK to fund escrow" }, { status: 400 });
    }
    if (user.tokens < existing.amount) {
      return NextResponse.json(
        { detail: `Insufficient wallet balance (${existing.amount} TOK required, ${user.tokens} TOK available)` },
        { status: 402 },
      );
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const debit = await tx.user.updateMany({
          where: { id: user.id, tokens: { gte: existing.amount } },
          data: { tokens: { decrement: existing.amount } },
        });
        if (debit.count === 0) {
          throw new Error("INSUFFICIENT_TOKENS");
        }

        await tx.tokenTransaction.create({
          data: {
            txHash: `0x${crypto.randomBytes(12).toString("hex")}${Date.now().toString(16)}`,
            userId: user.id,
            jobId: project.jobId,
            proposalId: project.proposalId,
            type: "ESCROW_FUNDED",
            tokenAmount: existing.amount,
            tokenPriceInr: TOKEN_PRICE_INR,
            totalInr: existing.amount * TOKEN_PRICE_INR,
            status: "CONFIRMED",
            network: WEB3_NETWORK_NAME,
          },
        });

        const milestone = await tx.milestone.update({
          where: { id: existing.id },
          data: {
            escrowStatus: "FUNDED",
            status: existing.status === "PENDING" ? "IN_PROGRESS" : existing.status,
          },
          include: {
            deliverables: {
              select: { id: true, title: true, status: true, dueDate: true },
            },
          },
        });

        await logProjectActivity(tx, {
          projectId: project.id,
          actorId: user.id,
          type: "ESCROW_FUNDED",
          metadata: {
            milestoneId: milestone.id,
            title: milestone.title,
            amount: milestone.amount,
          },
        });

        return milestone;
      });

      await createNotification({
        userId: project.freelancerId,
        type: "ESCROW_FUNDED",
        title: "Milestone escrow funded",
        body: `${existing.amount} TOK locked in escrow for \"${existing.title}\".`,
        link: `/projects/${project.id}`,
        email: project.freelancer.email,
      });

      return NextResponse.json({ milestone: updated });
    } catch (error) {
      if (error instanceof Error && error.message === "INSUFFICIENT_TOKENS") {
        return NextResponse.json({ detail: "Insufficient wallet balance" }, { status: 402 });
      }
      throw error;
    }
  }

  if (data.amount !== undefined && existing.escrowStatus !== "UNFUNDED") {
    return NextResponse.json({ detail: "Cannot change milestone amount after escrow is funded" }, { status: 409 });
  }

  const nextDueDate =
    data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null;
  if (nextDueDate && Number.isNaN(nextDueDate.getTime())) {
    return NextResponse.json({ detail: "Invalid due date" }, { status: 400 });
  }

  const updated = await prisma.milestone.update({
    where: { id: existing.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(nextDueDate !== undefined ? { dueDate: nextDueDate } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
    include: {
      deliverables: {
        select: { id: true, title: true, status: true, dueDate: true },
      },
    },
  });

  return NextResponse.json({ milestone: updated });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string; mid: string }> }) {
  const { id, mid } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  if (authCtx.viewerRole !== "CLIENT") {
    return NextResponse.json({ detail: "Only the client can delete milestones" }, { status: 403 });
  }

  const milestoneId = Number(mid);
  const existing = await prisma.milestone.findFirst({
    where: { id: milestoneId, projectId: authCtx.project.id },
  });

  if (!existing) {
    return NextResponse.json({ detail: "Milestone not found" }, { status: 404 });
  }

  if (existing.escrowStatus !== "UNFUNDED") {
    return NextResponse.json({ detail: "Funded or released milestones cannot be deleted" }, { status: 409 });
  }

  await prisma.milestone.delete({ where: { id: existing.id } });
  return NextResponse.json({ deleted: true });
}
