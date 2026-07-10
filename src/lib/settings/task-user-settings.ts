import { prisma } from "@/lib/prisma";
import type { IntegrationProvider, TaskIntegrationRow, TaskUserSettingsRow } from "./types";

export async function getTaskUserSettings(userId: string): Promise<TaskUserSettingsRow> {
  try {
    const rows = await prisma.$queryRaw<TaskUserSettingsRow[]>`
      SELECT "userId", "slackNotificationsEnabled", "slackWebhookUrl"
      FROM "TaskUserSettings"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    if (rows[0]) return rows[0];
  } catch (error) {
    console.error("getTaskUserSettings failed:", error);
  }

  return {
    userId,
    slackNotificationsEnabled: false,
    slackWebhookUrl: null,
  };
}

export async function upsertTaskUserSettings(
  userId: string,
  data: {
    slackNotificationsEnabled: boolean;
    slackWebhookUrl: string | null;
  }
) {
  await prisma.$executeRaw`
    INSERT INTO "TaskUserSettings" ("userId", "slackNotificationsEnabled", "slackWebhookUrl", "updatedAt")
    VALUES (${userId}, ${data.slackNotificationsEnabled}, ${data.slackWebhookUrl}, CURRENT_TIMESTAMP)
    ON CONFLICT ("userId") DO UPDATE SET
      "slackNotificationsEnabled" = EXCLUDED."slackNotificationsEnabled",
      "slackWebhookUrl" = EXCLUDED."slackWebhookUrl",
      "updatedAt" = CURRENT_TIMESTAMP
  `;
}

export async function listUsersWithSlackNotifications() {
  return prisma.$queryRaw<
    { userId: string; slackWebhookUrl: string }[]
  >`
    SELECT "userId", "slackWebhookUrl"
    FROM "TaskUserSettings"
    WHERE "slackNotificationsEnabled" = true
      AND "slackWebhookUrl" IS NOT NULL
      AND trim("slackWebhookUrl") <> ''
  `;
}

export async function getTaskIntegration(
  userId: string,
  provider: IntegrationProvider
): Promise<TaskIntegrationRow | null> {
  const rows = await prisma.$queryRaw<TaskIntegrationRow[]>`
    SELECT
      "id",
      "userId",
      "provider",
      "accessToken",
      "metadata",
      "enabled",
      "syncDirection",
      "lastSyncAt"
    FROM "TaskIntegration"
    WHERE "userId" = ${userId} AND "provider" = ${provider}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function listTaskIntegrations(userId: string): Promise<TaskIntegrationRow[]> {
  try {
    return await prisma.$queryRaw<TaskIntegrationRow[]>`
      SELECT
        "id",
        "userId",
        "provider",
        "accessToken",
        "metadata",
        "enabled",
        "syncDirection",
        "lastSyncAt"
      FROM "TaskIntegration"
      WHERE "userId" = ${userId}
      ORDER BY "provider" ASC
    `;
  } catch (error) {
    console.error("listTaskIntegrations failed:", error);
    return [];
  }
}

export async function upsertTaskIntegration(
  userId: string,
  provider: IntegrationProvider,
  data: {
    accessToken: string;
    enabled?: boolean;
    syncDirection?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const id = `${userId}-${provider}`;
  await prisma.$executeRaw`
    INSERT INTO "TaskIntegration" (
      "id", "userId", "provider", "accessToken", "enabled", "syncDirection", "metadata", "updatedAt"
    )
    VALUES (
      ${id},
      ${userId},
      ${provider},
      ${data.accessToken},
      ${data.enabled ?? true},
      ${data.syncDirection ?? "export"},
      ${JSON.stringify(data.metadata ?? {})}::jsonb,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("userId", "provider") DO UPDATE SET
      "accessToken" = EXCLUDED."accessToken",
      "enabled" = EXCLUDED."enabled",
      "syncDirection" = EXCLUDED."syncDirection",
      "metadata" = EXCLUDED."metadata",
      "updatedAt" = CURRENT_TIMESTAMP
  `;
}

export async function deleteTaskIntegration(userId: string, provider: IntegrationProvider) {
  await prisma.$executeRaw`
    DELETE FROM "TaskIntegration"
    WHERE "userId" = ${userId} AND "provider" = ${provider}
  `;
}

export async function markIntegrationSynced(userId: string, provider: IntegrationProvider) {
  await prisma.$executeRaw`
    UPDATE "TaskIntegration"
    SET "lastSyncAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "userId" = ${userId} AND "provider" = ${provider}
  `;
}
