import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { getAuthorizedProjectContext, logProjectActivity } from "@/lib/projects";

const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(3000),
  fileUrl: z.string().trim().optional().nullable(),
  fileName: z.string().trim().max(200).optional().nullable(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  const messages = await prisma.projectMessage.findMany({
    where: { projectId: authCtx.project.id },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
        },
      },
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const authCtx = await getAuthorizedProjectContext(id, request);
  if (!authCtx.ok) return authCtx.response;

  const { user, project, viewerRole } = authCtx;
  if (viewerRole === "ADMIN") {
    return NextResponse.json({ detail: "Admins cannot post messages in contract chat" }, { status: 403 });
  }

  const parsed = sendMessageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Message cannot be empty" }, { status: 400 });
  }

  const { body, fileUrl, fileName } = parsed.data;

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.projectMessage.create({
      data: {
        projectId: project.id,
        senderId: user.id,
        body,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });

    if (fileUrl) {
      await logProjectActivity(tx, {
        projectId: project.id,
        actorId: user.id,
        type: "FILE_SHARED",
        metadata: {
          fileName: fileName || "Attachment",
          fileUrl,
        },
      });
    }

    return created;
  });

  const recipient = viewerRole === "CLIENT" ? project.freelancer : project.client;
  await createNotification({
    userId: recipient.id,
    type: "PROJECT_MESSAGE",
    title: `New message in ${project.job.title}`,
    body: `${user.name || user.username || "Partner"}: ${body.slice(0, 120)}`,
    link: `/projects/${project.id}`,
    email: recipient.email,
  });

  return NextResponse.json({ message }, { status: 201 });
}
