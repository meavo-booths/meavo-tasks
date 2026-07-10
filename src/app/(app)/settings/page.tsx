import { redirect } from "next/navigation";
import { getSettingsData } from "@/app/actions/settings";
import { AddToHomescreenSection } from "@/components/settings/add-to-homescreen-section";
import { IntegrationsSection } from "@/components/settings/integrations-section";
import { SlackNotificationsSection } from "@/components/settings/slack-notifications-section";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const data = await getSettingsData();
  if (!data) redirect("/login");

  return (
    <>
      <PageHeader
        title="Settings"
        description="Notifications, external app connections, and install options."
      />

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Slack notifications</h2>
          <Card>
            <SlackNotificationsSection
              enabled={data.settings.slackNotificationsEnabled}
              webhookUrl={data.settings.slackWebhookUrl}
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">External task apps</h2>
          <IntegrationsSection integrations={data.integrations} />
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Add to home screen</h2>
          <Card>
            <AddToHomescreenSection />
          </Card>
        </section>
      </div>
    </>
  );
}
