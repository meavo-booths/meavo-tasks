import { prisma } from "@/lib/prisma";
import type { IntegrationProvider, TaskIntegrationRow } from "./types";

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
