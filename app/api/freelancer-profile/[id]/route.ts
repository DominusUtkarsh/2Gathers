import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { mockFreelancersList } from "@/lib/db";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const viewerId = getAuthenticatedUserId(request);
  if (!viewerId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const freelancerId = Number(id);

  if (!Number.isInteger(freelancerId) || freelancerId <= 0) {
    return NextResponse.json({ detail: "Invalid freelancer id" }, { status: 400 });
  }

  let freelancer: any = null;
  try {
    freelancer = await prisma.user.findFirst({
      where: {
        id: freelancerId,
        role: "FREELANCER",
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        tokens: true,
        freelancerProfile: true,
        _count: {
          select: {
            proposals: true,
            receivedReviews: true,
          },
        },
      },
    });
  } catch (err) {
    console.error("Database query error for freelancer profile, checking mock fallback", err);
  }

  if (!freelancer) {
    const mock = mockFreelancersList.find((f) => f.id === freelancerId);
    if (!mock) {
      return NextResponse.json({ detail: "Freelancer not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: mock.id,
        username: mock.username,
        name: mock.name,
        role: mock.role,
        tokens: mock.tokens,
        freelancerProfile: mock.freelancerProfile,
        _count: mock._count,
        stats: mock.stats,
      },
    });
  }

  const [acceptedProposals, completedProjects, ratingAggregate] = await Promise.all([
    prisma.proposal.count({
      where: {
        freelancerId,
        status: "ACCEPTED",
      },
    }),
    prisma.job.count({
      where: {
        hiredFreelancerId: freelancerId,
        status: "COMPLETED",
      },
    }),
    prisma.review.aggregate({
      where: { targetUserId: freelancerId },
      _avg: { rating: true },
    }),
  ]);

  return NextResponse.json({
    profile: {
      ...freelancer,
      stats: {
        acceptedProposals,
        completedProjects,
        averageRating: ratingAggregate._avg.rating ?? 0,
      },
    },
  });
}
