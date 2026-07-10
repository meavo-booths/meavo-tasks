export type IntegrationProvider = "TODOIST" | "TICKTICK" | "GOOGLE_TASKS";

export type TaskUserSettingsRow = {
  userId: string;
  slackNotificationsEnabled: boolean;
  slackWebhookUrl: string | null;
};

export type TaskIntegrationRow = {
  id: string;
  userId: string;
  provider: IntegrationProvider;
  accessToken: string | null;
  metadata: Record<string, unknown>;
  enabled: boolean;
  syncDirection: string;
  lastSyncAt: Date | null;
};

export const INTEGRATION_PROVIDERS: {
  id: IntegrationProvider;
  name: string;
  description: string;
  available: boolean;
  tokenLabel: string;
  tokenHelpUrl: string;
}[] = [
  {
    id: "TODOIST",
    name: "Todoist",
    description: "Push open tasks from Meavo to your Todoist inbox.",
    available: true,
    tokenLabel: "Todoist API token",
    tokenHelpUrl: "https://todoist.com/app/settings/integrations/developer",
  },
  {
    id: "TICKTICK",
    name: "TickTick",
    description: "Sync tasks with TickTick (coming soon).",
    available: false,
    tokenLabel: "TickTick token",
    tokenHelpUrl: "https://ticktick.com",
  },
  {
    id: "GOOGLE_TASKS",
    name: "Google Tasks",
    description: "Sync with Google Tasks (coming soon).",
    available: false,
    tokenLabel: "Google account",
    tokenHelpUrl: "https://tasks.google.com",
  },
];
