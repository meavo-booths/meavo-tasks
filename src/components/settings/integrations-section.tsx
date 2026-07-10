"use client";

import { useActionState, useState, useTransition } from "react";
import {
  connectIntegration,
  disconnectIntegration,
  syncIntegration,
} from "@/app/actions/settings";
import { Button } from "@/components/ui";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProvider,
} from "@/lib/settings/types";

type IntegrationState = {
  provider: IntegrationProvider;
  enabled: boolean;
  lastSyncAt: Date | null;
  connected: boolean;
};

export function IntegrationsSection({
  integrations,
}: {
  integrations: IntegrationState[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Connect external task apps to push open Meavo tasks. We start with one-way export (Meavo →
        app). Two-way sync and more providers are planned next.
      </p>

      {INTEGRATION_PROVIDERS.map((provider) => {
        const state = integrations.find((row) => row.provider === provider.id);
        return (
          <IntegrationCard
            key={provider.id}
            provider={provider}
            connected={state?.connected ?? false}
            lastSyncAt={state?.lastSyncAt ?? null}
          />
        );
      })}
    </div>
  );
}

function IntegrationCard({
  provider,
  connected,
  lastSyncAt,
}: {
  provider: (typeof INTEGRATION_PROVIDERS)[number];
  connected: boolean;
  lastSyncAt: Date | null;
}) {
  const [open, setOpen] = useState(false);
  const [syncState, setSyncState] = useState<{ error?: string; success?: string }>({});
  const [pending, startTransition] = useTransition();
  const [connectState, connectAction, connectPending] = useActionState(connectIntegration, {});

  function handleSync() {
    startTransition(async () => {
      const result = await syncIntegration(provider.id);
      setSyncState(result);
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectIntegration(provider.id);
      setSyncState(result);
      if (!result.error) setOpen(false);
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{provider.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{provider.description}</p>
          {connected && lastSyncAt && (
            <p className="mt-2 text-xs text-slate-500">
              Last pushed {new Date(lastSyncAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {connected ? (
            <>
              <Button
                type="button"
                size="sm"
                disabled={pending || !provider.available}
                onClick={handleSync}
              >
                Push tasks
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!provider.available}
              onClick={() => setOpen((value) => !value)}
            >
              {provider.available ? "Connect" : "Coming soon"}
            </Button>
          )}
        </div>
      </div>

      {open && provider.available && !connected && (
        <form action={connectAction} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <input type="hidden" name="provider" value={provider.id} />
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">{provider.tokenLabel}</span>
            <input
              name="accessToken"
              type="password"
              required
              autoComplete="off"
              className="input-field"
              placeholder="Paste your API token"
            />
            <a
              href={provider.tokenHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-brand-700 hover:text-brand-800"
            >
              Where do I find this token?
            </a>
          </label>
          <Button type="submit" disabled={connectPending}>
            {connectPending ? "Connecting…" : `Connect ${provider.name}`}
          </Button>
          {connectState.error && <p className="text-sm text-red-600">{connectState.error}</p>}
          {connectState.success && <p className="text-sm text-emerald-700">{connectState.success}</p>}
        </form>
      )}

      {syncState.error && <p className="mt-3 text-sm text-red-600">{syncState.error}</p>}
      {syncState.success && <p className="mt-3 text-sm text-emerald-700">{syncState.success}</p>}
    </div>
  );
}
