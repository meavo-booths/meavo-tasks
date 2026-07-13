import { TaskLinkedApp } from "@prisma/client";

const CREATE_LINKED_APPS = new Set<TaskLinkedApp>([
  TaskLinkedApp.SALES,
  TaskLinkedApp.ASSEMBLY,
]);

export type CreateTaskUrlParams = {
  linkedApp: "SALES" | "ASSEMBLY";
  entityId: string;
  title?: string;
};

export function buildCreateTaskUrl(
  baseUrl: string,
  params: CreateTaskUrlParams
): string {
  const url = new URL("/create", baseUrl);
  url.searchParams.set("linkedApp", params.linkedApp);
  url.searchParams.set("entityId", params.entityId);
  if (params.title) {
    url.searchParams.set("title", params.title);
  }
  return url.toString();
}

export function parseCreateTaskParams(
  searchParams: Record<string, string | string[] | undefined>
): CreateTaskUrlParams | null {
  const linkedAppRaw = pickString(searchParams.linkedApp);
  const entityId = pickString(searchParams.entityId)?.trim();
  if (!linkedAppRaw || !entityId) return null;

  if (!CREATE_LINKED_APPS.has(linkedAppRaw as TaskLinkedApp)) {
    return null;
  }

  const title = pickString(searchParams.title)?.trim();
  return {
    linkedApp: linkedAppRaw as CreateTaskUrlParams["linkedApp"],
    entityId,
    title: title || undefined,
  };
}

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
