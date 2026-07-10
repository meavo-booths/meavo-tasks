"use server";

import { revalidatePath } from "next/cache";
import { validateTodoistToken } from "@/lib/integrations/todoist";
import { getTasksUser } from "@/lib/access";
import {
  deleteTaskIntegration,
  getTaskIntegration,
  listTaskIntegrations,
  upsertTaskIntegration,
} from "@/lib/settings/task-user-settings";
import { exportTasksToTodoist } from "@/lib/settings/todoist-sync";
import type { IntegrationProvider } from "@/lib/settings/types";

type ActionResult = { error?: string; success?: string };

export async function getSettingsData() {
  const access = await getTasksUser();
  if (!access.ok) return null;

  const integrations = await listTaskIntegrations(access.user.id);

  return {
    integrations: integrations.map((row) => ({
      provider: row.provider as IntegrationProvider,
      enabled: row.enabled,
      lastSyncAt: row.lastSyncAt ? new Date(row.lastSyncAt) : null,
      connected: !!row.accessToken,
    })),
  };
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
