import { NextRequest, NextResponse } from "next/server";
import { format, startOfDay } from "date-fns";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { postSlackWebhook } from "@/lib/integrations/slack";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

function getDigestTimeZone() {
  return process.env.TASK_DIGEST_TIMEZONE?.trim() || "Europe/Sofia";
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookUrl = process.env.SLACK_TASK_DIGEST_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "SLACK_TASK_DIGEST_WEBHOOK_URL not configured",
    });
  }

  try {
    const today = startOfDay(new Date());
    const [overdue, dueToday] = await Promise.all([
      prisma.task.findMany({
        where: {
          status: TaskStatus.OPEN,
          dueDate: { lt: today },
        },
        include: {
          workspace: { select: { name: true } },
          assignees: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),
      prisma.task.findMany({
        where: {
          status: TaskStatus.OPEN,
          dueDate: today,
        },
        include: {
          workspace: { select: { name: true } },
          assignees: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
        orderBy: { title: "asc" },
        take: 20,
      }),
    ]);

    const lines: string[] = [
      `*Task digest* — ${format(today, "EEEE, MMM d")} (${getDigestTimeZone()})`,
      `<https://tasks.meavo.app|Open Tasks>`,
    ];

    if (overdue.length > 0) {
      lines.push("", `*Overdue (${overdue.length})*`);
      for (const task of overdue) {
        const assignees = task.assignees
          .map((a) => a.user.name ?? a.user.email)
          .join(", ");
        lines.push(
          `• ${task.title} — _${task.workspace.name}_${assignees ? ` (${assignees})` : ""}`
        );
      }
    }

    if (dueToday.length > 0) {
      lines.push("", `*Due today (${dueToday.length})*`);
      for (const task of dueToday) {
        const assignees = task.assignees
          .map((a) => a.user.name ?? a.user.email)
          .join(", ");
        lines.push(
          `• ${task.title} — _${task.workspace.name}_${assignees ? ` (${assignees})` : ""}`
        );
      }
    }

    if (overdue.length === 0 && dueToday.length === 0) {
      lines.push("", "No overdue or due-today tasks. 🎉");
    }

    await postSlackWebhook(webhookUrl, { text: lines.join("\n") });

    return NextResponse.json({
      ok: true,
      sent: true,
      overdue: overdue.length,
      dueToday: dueToday.length,
    });
  } catch (error) {
    console.error("Task digest cron failed:", error);
    return NextResponse.json({ error: "Task digest failed" }, { status: 500 });
  }
}
