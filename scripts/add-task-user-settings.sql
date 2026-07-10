CREATE TABLE IF NOT EXISTS "TaskUserSettings" (
  "userId" TEXT NOT NULL,
  "slackNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "slackWebhookUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskUserSettings_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "TaskIntegration" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "accessToken" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "syncDirection" TEXT NOT NULL DEFAULT 'export',
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskIntegration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TaskIntegration_userId_provider_key"
  ON "TaskIntegration" ("userId", "provider");

CREATE INDEX IF NOT EXISTS "TaskIntegration_userId_idx"
  ON "TaskIntegration" ("userId");
