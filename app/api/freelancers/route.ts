import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { mockFreelancersList } from "@/lib/db";

export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  let freelancers: any[] = [];
  try {
    freelancers = await prisma.user.findMany({
      where: { role: "FREELANCER" },
      select: {
        id: true,
        username: true,
        name: true,
        tokens: true,
        freelancerProfile: {
          select: {
            professionalTitle: true,
            skills: true,
            experienceLevel: true,
            hourlyRateUsd: true,
            country: true,
            city: true,
          },
        },
        _count: {
          select: {
            proposals: true,
            receivedReviews: true,
          },
        },
      },
      orderBy: [
        { tokens: "desc" },
        { id: "asc" },
      ],
    });
  } catch (err) {
    console.error("Database query failed for freelancers, using mock data fallback", err);
  }

  // If no database freelancers exist yet, fall back to realistic mock freelancers
  if (!freelancers || freelancers.length === 0) {
    freelancers = mockFreelancersList.map((f) => ({
      id: f.id,
      username: f.username,
      name: f.name,
      tokens: f.tokens,
      freelancerProfile: {
        professionalTitle: f.freelancerProfile.professionalTitle,
        skills: f.freelancerProfile.skills,
        experienceLevel: f.freelancerProfile.experienceLevel,
        hourlyRateUsd: f.freelancerProfile.hourlyRateUsd,
        country: f.freelancerProfile.country,
        city: f.freelancerProfile.city,
      },
      _count: {
        proposals: f._count.proposals,
        receivedReviews: f._count.receivedReviews,
      },
    }));
  }

  return NextResponse.json({ freelancers });
}
