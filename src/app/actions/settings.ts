"use server";

import { revalidatePath } from "next/cache";
import { validateTodoistToken } from "@/lib/integrations/todoist";
import { getTasksUser } from "@/lib/access";
import {
  deleteTaskIntegration,
  getTaskIntegration,
  getTaskUserSettings,
  listTaskIntegrations,
  upsertTaskIntegration,
  upsertTaskUserSettings,
} from "@/lib/settings/task-user-settings";
import { exportTasksToTodoist } from "@/lib/settings/todoist-sync";
import type { IntegrationProvider } from "@/lib/settings/types";

type ActionResult = { error?: string; success?: string };

function isValidSlackWebhook(url: string) {
  return url.startsWith("https://hooks.slack.com/");
}

export async function getSettingsData() {
  const access = await getTasksUser();
  if (!access.ok) return null;

  const [settings, integrations] = await Promise.all([
    getTaskUserSettings(access.user.id),
    listTaskIntegrations(access.user.id),
  ]);

  return {
    settings,
    integrations: integrations.map((row) => ({
      provider: row.provider as IntegrationProvider,
      enabled: row.enabled,
      lastSyncAt: row.lastSyncAt ? new Date(row.lastSyncAt) : null,
      connected: !!row.accessToken,
    })),
  };
}

export async function saveSlackSettings(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const enabled = formData.get("slackNotificationsEnabled") === "on";
  const webhookUrl = String(formData.get("slackWebhookUrl") ?? "").trim();

  if (enabled && !webhookUrl) {
    return { error: "Add a Slack webhook URL to enable personal notifications." };
  }

  if (webhookUrl && !isValidSlackWebhook(webhookUrl)) {
    return { error: "Slack webhook URL must start with https://hooks.slack.com/" };
  }

  await upsertTaskUserSettings(access.user.id, {
    slackNotificationsEnabled: enabled,
    slackWebhookUrl: webhookUrl || null,
  });

  revalidatePath("/settings");
  return { success: "Slack notification settings saved." };
}

export async function connectIntegration(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const provider = String(formData.get("provider") ?? "") as IntegrationProvider;
  const token = String(formData.get("accessToken") ?? "").trim();

  if (provider !== "TODOIST") {
    return { error: "This integration is not available yet." };
  }

  if (!token) {
    return { error: "API token is required." };
  }

  const valid = await validateTodoistToken(token);
  if (!valid) {
    return { error: "Could not verify Todoist token. Check the token and try again." };
  }

  await upsertTaskIntegration(access.user.id, provider, {
    accessToken: token,
    metadata: { pushedTaskIds: [] },
  });

  revalidatePath("/settings");
  return { success: "Todoist connected." };
}

export async function disconnectIntegration(provider: IntegrationProvider): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const existing = await getTaskIntegration(access.user.id, provider);
  if (!existing) return { error: "Integration not found." };

  await deleteTaskIntegration(access.user.id, provider);
  revalidatePath("/settings");
  return { success: "Integration disconnected." };
}

export async function syncIntegration(provider: IntegrationProvider): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  if (provider === "TODOIST") {
    const result = await exportTasksToTodoist(access.user.id);
    if (result.error) return { error: result.error };
    revalidatePath("/settings");
    return {
      success:
        result.pushed === 0
          ? "No new tasks to push. Already-synced tasks are skipped."
          : `Pushed ${result.pushed} task${result.pushed === 1 ? "" : "s"} to Todoist.`,
    };
  }

  return { error: "This integration is not available yet." };
}
