"use client";

import { useActionState } from "react";
import { saveSlackSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui";

export function SlackNotificationsSection({
  enabled,
  webhookUrl,
}: {
  enabled: boolean;
  webhookUrl: string | null;
}) {
  const [state, action, pending] = useActionState(saveSlackSettings, {});

  return (
    <form action={action} className="space-y-4">
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <input
          type="checkbox"
          name="slackNotificationsEnabled"
          defaultChecked={enabled}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
        />
        <span>
          <span className="block text-sm font-medium text-slate-900">
            Personal Slack reminders
          </span>
          <span className="mt-1 block text-sm text-slate-500">
            Get a daily message for tasks assigned to you that are overdue or due today.
          </span>
        </span>
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-slate-700">Slack incoming webhook URL</span>
        <input
          name="slackWebhookUrl"
          type="url"
          defaultValue={webhookUrl ?? ""}
          placeholder="https://hooks.slack.com/services/..."
          className="input-field"
        />
        <span className="block text-xs text-slate-500">
          Create a webhook in your Slack workspace (Apps → Incoming Webhooks), then paste the URL
          here. Messages go only to you — not the team channel digest.
        </span>
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save notifications"}
      </Button>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{state.success}</p>}
    </form>
  );
}
