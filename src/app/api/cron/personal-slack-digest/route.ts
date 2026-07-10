import { NextRequest, NextResponse } from "next/server";
import { format, isBefore, startOfDay } from "date-fns";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { postSlackWebhook } from "@/lib/integrations/slack";
import { getUserDigestTasks } from "@/lib/settings/personal-digest";
import { listUsersWithSlackNotifications } from "@/lib/settings/task-user-settings";

function getDigestTimeZone() {
  return process.env.TASK_DIGEST_TIMEZONE?.trim() || "Europe/Sofia";
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await listUsersWithSlackNotifications();
    if (users.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: "No users with Slack enabled" });
    }

    const today = startOfDay(new Date());
    let sent = 0;

    for (const user of users) {
      const tasks = await getUserDigestTasks(user.userId);
      const overdue = tasks.filter((t) => t.dueDate && isBefore(startOfDay(t.dueDate), today));
      const dueToday = tasks.filter(
        (t) => t.dueDate && startOfDay(t.dueDate).getTime() === today.getTime()
      );

      if (overdue.length === 0 && dueToday.length === 0) continue;

      const lines: string[] = [
        `*Your task reminder* — ${format(today, "EEEE, MMM d")} (${getDigestTimeZone()})`,
        `<https://tasks.meavo.app|Open Tasks>`,
      ];

      if (overdue.length > 0) {
        lines.push("", `*Overdue (${overdue.length})*`);
        for (const task of overdue) {
          lines.push(`• ${task.title} — _${task.workspace.name}_`);
        }
      }

      if (dueToday.length > 0) {
        lines.push("", `*Due today (${dueToday.length})*`);
        for (const task of dueToday) {
          lines.push(`• ${task.title} — _${task.workspace.name}_`);
        }
      }

      await postSlackWebhook(user.slackWebhookUrl, { text: lines.join("\n") });
      sent += 1;
    }

    return NextResponse.json({ ok: true, sent, users: users.length });
  } catch (error) {
    console.error("Personal Slack digest cron failed:", error);
    return NextResponse.json({ error: "Personal digest failed" }, { status: 500 });
  }
}
