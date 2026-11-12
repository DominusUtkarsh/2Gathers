import crypto from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { getAuthorizedProjectContext, logProjectActivity } from "@/lib/projects";
import { TOKEN_PRICE_INR, WEB3_NETWORK_NAME } from "@/lib/tokenomics";

export async function POST(request: Request, context: { params: Promise<{ id: string; mid: string }> }) {
  const { id, mid } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  const { user, project, viewerRole } = authCtx;
  if (viewerRole !== "CLIENT") {
    return NextResponse.json({ detail: "Only the client can release milestone escrow" }, { status: 403 });
  }

  const milestoneId = Number(mid);
  if (!Number.isInteger(milestoneId) || milestoneId <= 0) {
    return NextResponse.json({ detail: "Invalid milestone id" }, { status: 400 });
  }

  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, projectId: project.id },
    include: {
      deliverables: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  if (!milestone) {
    return NextResponse.json({ detail: "Milestone not found" }, { status: 404 });
  }

  if (milestone.escrowStatus === "RELEASED" || milestone.status === "RELEASED") {
    return NextResponse.json({ detail: "Escrow has already been released for this milestone" }, { status: 409 });
  }

  const unapprovedDeliverables = milestone.deliverables.filter((d) => d.status !== "APPROVED");
  if (unapprovedDeliverables.length > 0) {
    return NextResponse.json(
      {
        detail: `Approve all deliverables in this milestone first (${unapprovedDeliverables.length} remaining).`,
      },
      { status: 409 },
    );
  }

  if (milestone.escrowStatus === "UNFUNDED" && milestone.amount > 0 && user.tokens < milestone.amount) {
    return NextResponse.json(
      {
        detail: `Insufficient wallet balance to fund and release ${milestone.amount} TOK (you have ${user.tokens} TOK).`,
      },
      { status: 402 },
    );
  }

  try {
    const released = await prisma.$transaction(async (tx) => {
      if (milestone.amount > 0) {
        if (milestone.escrowStatus === "UNFUNDED") {
          const debit = await tx.user.updateMany({
            where: { id: user.id, tokens: { gte: milestone.amount } },
            data: { tokens: { decrement: milestone.amount } },
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
              tokenAmount: milestone.amount,
              tokenPriceInr: TOKEN_PRICE_INR,
              totalInr: milestone.amount * TOKEN_PRICE_INR,
              status: "CONFIRMED",
              network: WEB3_NETWORK_NAME,
            },
          });
        }

        await tx.user.update({
          where: { id: project.freelancerId },
          data: { tokens: { increment: milestone.amount } },
        });

        await tx.tokenTransaction.create({
          data: {
            txHash: `0x${crypto.randomBytes(12).toString("hex")}${Date.now().toString(16)}`,
            userId: project.freelancerId,
            jobId: project.jobId,
            proposalId: project.proposalId,
            type: "ESCROW_RELEASE",
            tokenAmount: milestone.amount,
            tokenPriceInr: TOKEN_PRICE_INR,
            totalInr: milestone.amount * TOKEN_PRICE_INR,
            status: "CONFIRMED",
            network: WEB3_NETWORK_NAME,
          },
        });
      }

      const updatedMilestone = await tx.milestone.update({
        where: { id: milestone.id },
        data: {
          status: "RELEASED",
          escrowStatus: "RELEASED",
          releasedAt: new Date(),
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
        type: "ESCROW_RELEASED",
        metadata: {
          milestoneId: milestone.id,
          title: milestone.title,
          amount: milestone.amount,
        },
      });

      return updatedMilestone;
    });

    await createNotification({
      userId: project.freelancerId,
      type: "ESCROW_RELEASED",
      title: "Milestone escrow released",
      body: `${milestone.amount} TOK was released to your wallet for \"${milestone.title}\".`,
      link: `/projects/${project.id}`,
      email: project.freelancer.email,
    });

    return NextResponse.json({ milestone: released });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json({ detail: "Insufficient wallet balance to release milestone" }, { status: 402 });
    }
    throw error;
  }
}
