// @ts-nocheck

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { mockFreelancersList, mockJobs } from "../lib/db";

const prisma = new PrismaClient();

async function main() {
  const demoPasswordHash = await bcrypt.hash("Password123!", 10);

  // 1. Core Users
  const clientUser = await prisma.user.upsert({
    where: { email: "aarav@2gathers.dev" },
    update: { name: "Aarav Mehta", username: "aarav_client", role: "CLIENT", tokens: 800, passwordHash: demoPasswordHash, emailVerified: true },
    create: {
      name: "Aarav Mehta",
      username: "aarav_client",
      email: "aarav@2gathers.dev",
      role: "CLIENT",
      tokens: 800,
      passwordHash: demoPasswordHash,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "script4@2gathers.dev" },
    update: { name: "Script Four", username: "admin", role: "ADMIN", tokens: 1200, passwordHash: demoPasswordHash, emailVerified: true },
    create: {
      name: "Script Four",
      username: "admin",
      email: "script4@2gathers.dev",
      role: "ADMIN",
      tokens: 1200,
      passwordHash: demoPasswordHash,
      emailVerified: true,
    },
  });

  // 2. Freelancers from mockFreelancersList
  for (const f of mockFreelancersList) {
    const email = `${f.username}@example.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: f.name,
        username: f.username,
        role: "FREELANCER",
        tokens: f.tokens,
        passwordHash: demoPasswordHash,
        emailVerified: true,
      },
      create: {
        name: f.name,
        username: f.username,
        email,
        role: "FREELANCER",
        tokens: f.tokens,
        passwordHash: demoPasswordHash,
        emailVerified: true,
      },
    });

    await prisma.freelancerProfile.upsert({
      where: { userId: user.id },
      update: {
        professionalTitle: f.freelancerProfile.professionalTitle,
        bio: f.freelancerProfile.bio,
        skills: f.freelancerProfile.skills,
        experienceLevel: f.freelancerProfile.experienceLevel,
        hourlyRateUsd: f.freelancerProfile.hourlyRateUsd,
        country: f.freelancerProfile.country,
        city: f.freelancerProfile.city,
        languages: f.freelancerProfile.languages,
        portfolioUrl: f.freelancerProfile.portfolioUrl,
        githubUrl: f.freelancerProfile.githubUrl,
        linkedinUrl: f.freelancerProfile.linkedinUrl,
        education: f.freelancerProfile.education,
        certifications: f.freelancerProfile.certifications,
        availability: f.freelancerProfile.availability,
        responseTime: f.freelancerProfile.responseTime,
      },
      create: {
        userId: user.id,
        professionalTitle: f.freelancerProfile.professionalTitle,
        bio: f.freelancerProfile.bio,
        skills: f.freelancerProfile.skills,
        experienceLevel: f.freelancerProfile.experienceLevel,
        hourlyRateUsd: f.freelancerProfile.hourlyRateUsd,
        country: f.freelancerProfile.country,
        city: f.freelancerProfile.city,
        languages: f.freelancerProfile.languages,
        portfolioUrl: f.freelancerProfile.portfolioUrl,
        githubUrl: f.freelancerProfile.githubUrl,
        linkedinUrl: f.freelancerProfile.linkedinUrl,
        education: f.freelancerProfile.education,
        certifications: f.freelancerProfile.certifications,
        availability: f.freelancerProfile.availability,
        responseTime: f.freelancerProfile.responseTime,
      },
    });
  }

  // 3. Jobs from mockJobs
  const existingJobsCount = await prisma.job.count();
  if (existingJobsCount === 0) {
    for (const job of mockJobs) {
      await prisma.job.create({
        data: {
          title: job.title,
          description: job.description,
          budget: job.budgetNumber || 1500,
          applicationTokenCost: job.tokenCost,
          status: "OPEN",
          clientId: clientUser.id,
        },
      });
    }
  }

  console.log("Database seeded successfully with users, freelancer profiles, and jobs.");
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
