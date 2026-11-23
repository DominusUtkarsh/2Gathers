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
  try {
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
  } catch (error) {
    console.error("GET /api/projects/[id]/messages error:", error);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const authCtx = await getAuthorizedProjectContext(id, request);
    if (!authCtx.ok) return authCtx.response;

    const { user, project, viewerRole } = authCtx;
    if (viewerRole === "ADMIN") {
      return NextResponse.json({ detail: "Admins cannot post messages in contract chat" }, { status: 403 });
    }

    let jsonPayload: unknown;
    try {
      jsonPayload = await request.json();
    } catch {
      return NextResponse.json({ detail: "Invalid message payload" }, { status: 400 });
    }

    const parsed = sendMessageSchema.safeParse(jsonPayload);
    if (!parsed.success) {
      return NextResponse.json({ detail: parsed.error.issues[0]?.message || "Message cannot be empty" }, { status: 400 });
    }

    const { body, fileUrl, fileName } = parsed.data;

    // Use direct insert to avoid connection holding in PgBouncer pool mode
    const message = await prisma.projectMessage.create({
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
      try {
        await logProjectActivity(prisma, {
          projectId: project.id,
          actorId: user.id,
          type: "FILE_SHARED",
          metadata: {
            fileName: fileName || "Attachment",
            fileUrl,
          },
        });
      } catch (actErr) {
        console.error("Failed to log project file activity:", actErr);
      }
    }

    try {
      const recipient = viewerRole === "CLIENT" ? project.freelancer : project.client;
      if (recipient?.id) {
        await createNotification({
          userId: recipient.id,
          type: "PROJECT_MESSAGE",
          title: `New message in ${project.job?.title || "Contract"}`,
          body: `${user.name || user.username || "Partner"}: ${body.slice(0, 120)}`,
          link: `/projects/${project.id}`,
          email: recipient.email,
        });
      }
    } catch (notifErr) {
      console.error("Failed to deliver project message notification:", notifErr);
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects/[id]/messages error:", error);
    const detail = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ detail }, { status: 500 });
  }
}
